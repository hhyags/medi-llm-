import re
from typing import Dict, Any, Optional

class IntentDetector:

    @staticmethod
    def detect(user_text: str, conversation_state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Classify user intent and extract key entities."""
        text = user_text.lower().strip()
        entities = {}

        # Extract department entity
        dept_match = None
        if any(k in text for k in ["heart", "cardio", "cardiologist", "cardiology"]):
            dept_match = "Cardiology"
        elif any(k in text for k in ["skin", "derma", "dermatology", "dermatologist"]):
            dept_match = "Dermatology"
        elif any(k in text for k in ["bone", "joint", "ortho", "orthopedic"]):
            dept_match = "Orthopedics"
        elif any(k in text for k in ["child", "kids", "pediatric", "pediatrician", "pediatrics"]):
            dept_match = "Pediatrics"
        elif any(k in text for k in ["brain", "nerve", "neuro", "neurology", "neurologist"]):
            dept_match = "Neurology"
        elif any(k in text for k in ["general", "fever", "physician", "medicine"]):
            dept_match = "General Medicine"

        if dept_match:
            entities["department"] = dept_match

        # Extract doctor name entity
        doc_match = re.search(r"(dr\.?\s+[a-z]+(\s+[a-z]+)?)", text, re.I)
        if doc_match:
            entities["doctor_name"] = doc_match.group(1).title()

        # Extract date entity
        if "tomorrow" in text:
            entities["date"] = "tomorrow"
        elif "today" in text:
            entities["date"] = "today"
        elif "day after tomorrow" in text:
            entities["date"] = "day after tomorrow"

        # Extract phone number entity (10-digit or standard format)
        phone_match = re.search(r"(\b\d{10}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b)", text)
        if phone_match:
            entities["patient_phone"] = phone_match.group(1)

        # Extract appointment ID entity (e.g. APT-123456)
        apt_id_match = re.search(r"(apt-[a-f0-9]{6}|apt-[a-z0-9]+)", text, re.I)
        if apt_id_match:
            entities["appointment_id"] = apt_id_match.group(1).upper()

        # Extract time slot entity (e.g. 10:30 AM, 3:00 PM, 10:30)
        time_match = re.search(r"(\b\d{1,2}:\d{2}\s*(?:am|pm)?\b|\b\d{1,2}\s*(?:am|pm)\b)", text, re.I)
        if time_match:
            time_str = time_match.group(1).upper()
            if "AM" not in time_str and "PM" not in time_str:
                time_str = time_str + " AM"
            entities["time_slot"] = time_str

        # Intent Classification rules
        if any(k in text for k in ["cancel", "cancellation", "drop appointment"]):
            intent = "CANCEL_APPOINTMENT"
        elif any(k in text for k in ["reschedule", "change date", "move appointment", "postpone"]):
            intent = "RESCHEDULE_APPOINTMENT"
        elif any(k in text for k in ["view appointment", "my appointment", "check booking", "appointment status"]):
            intent = "VIEW_APPOINTMENT"
        elif any(k in text for k in ["available", "availability", "free slots", "timing", "when can"]):
            intent = "CHECK_AVAILABILITY"
        elif any(k in text for k in ["who are the doctors", "doctor fee", "specialist list", "doctor info"]):
            intent = "DOCTOR_INFO"
        elif any(k in text for k in ["hospital address", "location", "working hours", "phone number", "hospital info", "contact"]):
            intent = "HOSPITAL_INFO"
        elif any(k in text for k in ["book", "see a", "want to visit", "schedule", "appointment", "consult", "need a", "want a", "looking for", "find a"]):
            intent = "BOOK_APPOINTMENT"
        elif any(k in text for k in ["hello", "hi", "hey", "who are you", "what can you do", "good morning", "good evening", "good afternoon", "namaste", "namaskaram", "help me"]):
            intent = "GREETING"
        elif dept_match or entities.get("doctor_name"):
            # If department or doctor mentioned, default to booking flow
            intent = "BOOK_APPOINTMENT"
        else:
            # Fallback based on session state if user is replying in a booking flow
            if conversation_state and conversation_state.get("pending_intent"):
                intent = conversation_state.get("pending_intent")
            else:
                intent = "GENERAL_MEDICAL_QUESTION"

        return {
            "intent": intent,
            "entities": entities
        }
