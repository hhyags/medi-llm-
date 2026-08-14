import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.orchestrator.safety import SafetyChecker
from app.orchestrator.intent import IntentDetector
from app.tools.tools import TOOL_REGISTRY
from app.llm.enhanced_provider import BaseLLMProvider
from app.rag.pipeline import MedicalRAGPipeline

# In-memory session state store for multi-turn conversations
SESSION_STORE: Dict[str, Dict[str, Any]] = {}

class AIOrchestrator:

    def __init__(self, llm_provider: BaseLLMProvider):
        self.llm_provider = llm_provider
        self.rag_pipeline = MedicalRAGPipeline(llm_provider)

    async def process_chat(
        self,
        db: Session,
        message: str,
        session_id: str = "default_session"
    ) -> Dict[str, Any]:
        """Process incoming chat message through Safety, Hospital Tools, or Medical RAG."""

        # 1. Emergency Safety Check
        is_emergency, emergency_msg = SafetyChecker.check_emergency(message)
        if is_emergency:
            return {
                "response": emergency_msg,
                "intent": "MEDICAL_EMERGENCY",
                "action_taken": "EMERGENCY_ALERT",
                "session_id": session_id
            }

        # 2. Diagnosis / Prescription Safety Check
        is_diagnosis, diagnosis_msg = SafetyChecker.check_diagnosis_request(message)
        if is_diagnosis:
            return {
                "response": diagnosis_msg,
                "intent": "DIAGNOSIS_REFUSAL",
                "action_taken": "SAFETY_DISCLAIMER",
                "session_id": session_id
            }

        # Get or initialize session state
        session_state = SESSION_STORE.setdefault(session_id, {
            "pending_intent": None,
            "department": None,
            "doctor_name": None,
            "doctor_id": None,
            "date": None,
            "time_slot": None,
            "patient_name": None,
            "patient_phone": None,
            "appointment_id": None
        })

        # 3. Intent Detection & Entity Extraction
        detection = IntentDetector.detect(message, conversation_state=session_state)
        intent = detection["intent"]
        entities = detection["entities"]

        # Merge extracted entities into session state
        for k, v in entities.items():
            if v:
                session_state[k] = v

        # Check name extraction from text if in booking flow
        if session_state.get("pending_intent") == "BOOK_APPOINTMENT" or intent == "BOOK_APPOINTMENT":
            text_parts = [p.strip() for p in message.split(",") if p.strip()]
            for part in text_parts:
                clean_part = part.strip()
                if not clean_part.replace("-", "").replace(" ", "").isdigit() and len(clean_part.split()) <= 4:
                    if not re.search(r"(\b(yes|no|confirm|tomorrow|today|book|slot|time|am|pm)\b|\d+:\d+|\d)", clean_part, re.I):
                        if not session_state.get("patient_name"):
                            session_state["patient_name"] = clean_part

        # 4. Handle Specific Intents & Tool Calls

        # INTENT: GREETING / RECEPTIONIST INTRODUCTION
        if intent == "GREETING":
            resp = await self.llm_provider.generate(message)
            if not resp or "Service temporarily busy" in resp:
                resp = (
                    "Hello! I am MedVoice AI, your hospital virtual receptionist and first-level medical information assistant. "
                    "I can help you check doctor availability, schedule or manage appointments, and answer general health inquiries. "
                    "How may I assist you today?"
                )
            return {"response": resp, "intent": intent, "action_taken": "gemma_receptionist_greeting", "session_id": session_id}

        # INTENT: HOSPITAL_INFO
        if intent == "HOSPITAL_INFO":
            info = TOOL_REGISTRY["get_hospital_info"](db)
            resp = (
                f"🏥 **{info['name']}**\n\n"
                f"📍 **Address:** {info['address']}\n"
                f"📞 **Phone:** {info['phone']}\n"
                f"🚨 **Emergency:** {info['emergency_contact']}\n"
                f"🕒 **Hours:** {info['operating_hours']}\n\n"
                f"{info['description']}"
            )
            return {"response": resp, "intent": intent, "action_taken": "get_hospital_info", "session_id": session_id}

        # INTENT: DOCTOR_INFO
        if intent == "DOCTOR_INFO":
            dept = session_state.get("department")
            result = TOOL_REGISTRY["get_doctors"](db, department_name=dept)
            doctors = result.get("doctors", [])
            if not doctors:
                resp = "I couldn't find any doctors matching that department. Here are our available departments: Cardiology, Dermatology, Orthopedics, Pediatrics, General Medicine, Neurology."
            else:
                doc_lines = []
                for d in doctors:
                    doc_lines.append(f"• **{d['name']}** ({d['department']}) — {d['specialization']} | Consultation Fee: ₹{d['consultation_fee']} | Hours: {d['working_hours']}")
                resp = f"Here are our specialist doctors:\n\n" + "\n".join(doc_lines)
            return {"response": resp, "intent": intent, "action_taken": "get_doctors", "session_id": session_id}

        # INTENT: CHECK_AVAILABILITY
        if intent == "CHECK_AVAILABILITY":
            dept = session_state.get("department")
            date_str = session_state.get("date") or "tomorrow"
            doc_name = session_state.get("doctor_name")
            res = TOOL_REGISTRY["get_doctor_availability"](db, doctor_id_or_name=doc_name, department_name=dept, date=date_str)
            avail_list = res.get("availability", [])
            if not avail_list:
                resp = f"No doctor availability found for {date_str}."
            else:
                lines = []
                for a in avail_list:
                    slots_str = ", ".join(a["available_slots"]) if a["available_slots"] else "No open slots"
                    lines.append(f"• **{a['doctor_name']}** ({a['department']}) on {a['date']}:\n  Available Slots: {slots_str}")
                resp = f"Here is the doctor availability:\n\n" + "\n".join(lines) + "\n\nWould you like me to book one of these slots for you?"
            return {"response": resp, "intent": intent, "action_taken": "get_doctor_availability", "session_id": session_id}

        # INTENT: CANCEL_APPOINTMENT
        if intent == "CANCEL_APPOINTMENT":
            query_param = session_state.get("appointment_id") or session_state.get("patient_phone")
            if not query_param:
                session_state["pending_intent"] = "CANCEL_APPOINTMENT"
                return {
                    "response": "Sure, I can help cancel your appointment. Please provide your Appointment ID (e.g. APT-1001) or your registered 10-digit phone number.",
                    "intent": intent,
                    "action_taken": "PROMPT_PARAM",
                    "session_id": session_id
                }
            res = TOOL_REGISTRY["cancel_appointment"](db, query_param=query_param)
            session_state["pending_intent"] = None
            return {"response": res["message"], "intent": intent, "action_taken": "cancel_appointment", "session_id": session_id}

        # INTENT: RESCHEDULE_APPOINTMENT
        if intent == "RESCHEDULE_APPOINTMENT":
            query_param = session_state.get("appointment_id") or session_state.get("patient_phone")
            new_date = session_state.get("date") or "tomorrow"
            new_slot = session_state.get("time_slot") or "11:30 AM"

            if not query_param:
                session_state["pending_intent"] = "RESCHEDULE_APPOINTMENT"
                return {
                    "response": "I can help reschedule your appointment. Please provide your Appointment ID or registered phone number along with your preferred new date.",
                    "intent": intent,
                    "action_taken": "PROMPT_PARAM",
                    "session_id": session_id
                }

            res = TOOL_REGISTRY["reschedule_appointment"](
                db,
                query_param=query_param,
                new_date=new_date,
                new_time_slot=new_slot
            )
            session_state["pending_intent"] = None
            return {"response": res["message"], "intent": intent, "action_taken": "reschedule_appointment", "session_id": session_id}

        # INTENT: VIEW_APPOINTMENT
        if intent == "VIEW_APPOINTMENT":
            query_param = session_state.get("appointment_id") or session_state.get("patient_phone")
            if not query_param:
                return {
                    "response": "Please provide your Appointment ID (e.g. APT-1001) or registered phone number to view your appointment details.",
                    "intent": intent,
                    "action_taken": "PROMPT_PARAM",
                    "session_id": session_id
                }
            res = TOOL_REGISTRY["get_appointment"](db, query_param=query_param)
            appts = res.get("appointments", [])
            if not appts:
                resp = f"No appointment records found for '{query_param}'."
            else:
                lines = []
                for a in appts:
                    lines.append(f"• **Appointment ID:** {a['appointment_id']} | **Patient:** {a['patient_name']} | **Doctor:** {a['doctor_name']} ({a['department']}) | **Date:** {a['appointment_date']} at {a['appointment_time']} | **Status:** {a['status']}")
                resp = "Here are your appointment details:\n\n" + "\n".join(lines)
            return {"response": resp, "intent": intent, "action_taken": "get_appointment", "session_id": session_id}

        # INTENT: BOOK_APPOINTMENT (Multi-step confirmation flow)
        if intent == "BOOK_APPOINTMENT" or session_state.get("pending_intent") == "BOOK_APPOINTMENT":
            session_state["pending_intent"] = "BOOK_APPOINTMENT"

            dept = session_state.get("department")
            doc_name = session_state.get("doctor_name")
            date_str = session_state.get("date") or "tomorrow"
            slot = session_state.get("time_slot")
            p_name = session_state.get("patient_name")
            p_phone = session_state.get("patient_phone")

            if not doc_name or not slot:
                avail_res = TOOL_REGISTRY["get_doctor_availability"](
                    db,
                    doctor_id_or_name=doc_name,
                    department_name=dept,
                    date=date_str
                )
                avail_list = avail_res.get("availability", [])
                if avail_list:
                    selected_doc = avail_list[0]
                    session_state["doctor_name"] = selected_doc["doctor_name"]
                    session_state["doctor_id"] = selected_doc["doctor_id"]
                    if not slot and selected_doc["available_slots"]:
                        slots_str = ", ".join(selected_doc["available_slots"][:3])
                        resp = (
                            f"Sure! I found **{selected_doc['doctor_name']}** ({selected_doc['department']}) available on {selected_doc['date']}.\n\n"
                            f"Available times include: **{slots_str}**.\n\n"
                            f"Which time slot would you prefer?"
                        )
                        return {"response": resp, "intent": "BOOK_APPOINTMENT", "action_taken": "PROMPT_SLOT", "session_id": session_id}

            if not session_state.get("time_slot"):
                session_state["time_slot"] = "10:30 AM"

            if not p_name or not p_phone:
                resp = (
                    f"Great! I have selected **{session_state.get('doctor_name', 'Doctor')}** on **{session_state.get('date', 'tomorrow')}** at **{session_state.get('time_slot')}**.\n\n"
                    f"May I please have your **Full Name** and **10-digit Phone Number** to complete your booking?"
                )
                return {"response": resp, "intent": "BOOK_APPOINTMENT", "action_taken": "PROMPT_PATIENT_INFO", "session_id": session_id}

            booking_res = TOOL_REGISTRY["book_appointment"](
                db=db,
                patient_name=session_state["patient_name"],
                patient_phone=session_state["patient_phone"],
                doctor_id_or_name=session_state.get("doctor_id") or session_state.get("doctor_name"),
                date=session_state.get("date", "tomorrow"),
                time_slot=session_state.get("time_slot", "10:30 AM")
            )

            session_state["pending_intent"] = None

            resp = (
                f"✅ **Appointment Confirmed!**\n\n"
                f"• **Appointment ID:** `{booking_res['appointment_id']}`\n"
                f"• **Patient Name:** {booking_res['patient_name']}\n"
                f"• **Doctor:** {booking_res['doctor_name']} ({booking_res['department']})\n"
                f"• **Date:** {booking_res['appointment_date']}\n"
                f"• **Time:** {booking_res['appointment_time']}\n"
                f"• **Consultation Fee:** ₹{booking_res['consultation_fee']}\n\n"
                f"Thank you for choosing MedVoice City Hospital! Please arrive 15 minutes prior to your scheduled time."
            )
            return {"response": resp, "intent": "BOOK_APPOINTMENT", "action_taken": "book_appointment", "session_id": session_id}

        # 5. Route Medical Questions to Medical RAG Pipeline
        rag_result = await self.rag_pipeline.query(message)
        return {
            "response": rag_result["response"],
            "intent": "GENERAL_MEDICAL_QUESTION",
            "action_taken": "medical_rag_pipeline",
            "grounded": rag_result.get("grounded", False),
            "confidence_score": rag_result.get("confidence_score", 0.0),
            "citations": rag_result.get("citations", []),
            "session_id": session_id
        }
