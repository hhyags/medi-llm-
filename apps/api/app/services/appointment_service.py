import datetime
import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import Doctor, DoctorSchedule, Patient, Appointment
from app.services.hospital_service import HospitalService

DEFAULT_SLOTS = ["09:00 AM", "10:30 AM", "11:30 AM", "02:00 PM", "03:30 PM", "04:30 PM"]

def parse_date(date_input: Optional[str]) -> str:
    """Helper to parse relative date terms like 'today', 'tomorrow' to YYYY-MM-DD."""
    today = datetime.date.today()
    if not date_input or date_input.strip().lower() in ["today", "now"]:
        return today.isoformat()
    if date_input.strip().lower() == "tomorrow":
        return (today + datetime.timedelta(days=1)).isoformat()
    if date_input.strip().lower() == "day after tomorrow":
        return (today + datetime.timedelta(days=2)).isoformat()
    
    try:
        dt = datetime.datetime.strptime(date_input.strip(), "%Y-%m-%d")
        return dt.date().isoformat()
    except ValueError:
        pass
    
    return (today + datetime.timedelta(days=1)).isoformat()

def ensure_list_slots(raw_slots: Any) -> List[str]:
    """Safely convert database slots field to a Python list of strings."""
    if not raw_slots:
        return list(DEFAULT_SLOTS)
    if isinstance(raw_slots, list):
        return list(raw_slots)
    if isinstance(raw_slots, str):
        try:
            parsed = json.loads(raw_slots)
            if isinstance(parsed, list):
                return list(parsed)
        except Exception:
            pass
    return list(DEFAULT_SLOTS)

class AppointmentService:

    @staticmethod
    def check_availability(
        db: Session,
        doctor_id_or_name: Optional[Any] = None,
        department_name: Optional[str] = None,
        date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Check available doctor slots for a given date."""
        target_date = parse_date(date_str)
        doctors = []

        if doctor_id_or_name:
            doc = HospitalService.get_doctor_by_id_or_name(db, doctor_id_or_name)
            if doc:
                doctors = [doc]
        elif department_name:
            doctors = [
                db.get(Doctor, d["id"])
                for d in HospitalService.get_doctors(db, department_name=department_name)
            ]
        else:
            doctors = db.query(Doctor).all()

        results = []
        for doc in doctors:
            if not doc:
                continue
            schedule = db.query(DoctorSchedule).filter(
                DoctorSchedule.doctor_id == doc.id,
                DoctorSchedule.date == target_date
            ).first()

            available_slots = ensure_list_slots(schedule.available_slots) if schedule else list(DEFAULT_SLOTS)
            dept_name = doc.department.name if doc.department else "General"

            results.append({
                "doctor_id": doc.id,
                "doctor_name": doc.name,
                "department": dept_name,
                "specialization": doc.specialization,
                "consultation_fee": doc.consultation_fee,
                "date": target_date,
                "available_slots": available_slots
            })
        return results

    @staticmethod
    def book_appointment(
        db: Session,
        patient_name: str,
        patient_phone: str,
        doctor_id_or_name: Any,
        date_str: str,
        time_slot: str
    ) -> Dict[str, Any]:
        """Book a new appointment."""
        target_date = parse_date(date_str)
        doc = HospitalService.get_doctor_by_id_or_name(db, doctor_id_or_name)
        
        if not doc:
            doc = db.query(Doctor).first()
            if not doc:
                raise ValueError("No doctor available in system.")

        patient = db.query(Patient).filter(Patient.phone == patient_phone.strip()).first()
        if not patient:
            patient = Patient(name=patient_name.strip(), phone=patient_phone.strip())
            db.add(patient)
            db.flush()

        schedule = db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == doc.id,
            DoctorSchedule.date == target_date
        ).first()

        current_slots = ensure_list_slots(schedule.available_slots) if schedule else list(DEFAULT_SLOTS)
        clean_time = time_slot.strip()

        if clean_time in current_slots:
            current_slots.remove(clean_time)

        if schedule:
            schedule.available_slots = current_slots
        else:
            schedule = DoctorSchedule(
                doctor_id=doc.id,
                date=target_date,
                available_slots=current_slots
            )
            db.add(schedule)

        dept_id = doc.department_id
        appt = Appointment(
            patient_name=patient_name.strip(),
            patient_phone=patient_phone.strip(),
            patient_id=patient.id,
            doctor_id=doc.id,
            department_id=dept_id,
            appointment_date=target_date,
            appointment_time=clean_time,
            status="BOOKED"
        )
        db.add(appt)
        db.commit()
        db.refresh(appt)

        dept_name = doc.department.name if doc.department else "General"
        return {
            "success": True,
            "appointment_id": appt.id,
            "patient_name": appt.patient_name,
            "patient_phone": appt.patient_phone,
            "doctor_id": doc.id,
            "doctor_name": doc.name,
            "department": dept_name,
            "appointment_date": appt.appointment_date,
            "appointment_time": appt.appointment_time,
            "status": appt.status,
            "consultation_fee": doc.consultation_fee,
            "message": f"Appointment confirmed with {doc.name} on {appt.appointment_date} at {appt.appointment_time}."
        }

    @staticmethod
    def get_appointment(db: Session, query_param: str) -> List[Dict[str, Any]]:
        """Find appointment by ID or patient phone number."""
        param = query_param.strip()
        appts = db.query(Appointment).filter(
            (Appointment.id == param) | (Appointment.patient_phone == param)
        ).all()

        results = []
        for a in appts:
            doc_name = a.doctor.name if a.doctor else "Unknown Doctor"
            dept_name = a.doctor.department.name if a.doctor and a.doctor.department else "General"
            results.append({
                "appointment_id": a.id,
                "patient_name": a.patient_name,
                "patient_phone": a.patient_phone,
                "doctor_name": doc_name,
                "department": dept_name,
                "appointment_date": a.appointment_date,
                "appointment_time": a.appointment_time,
                "status": a.status,
                "created_at": a.created_at.isoformat() if a.created_at else None
            })
        return results

    @staticmethod
    def cancel_appointment(db: Session, query_param: str) -> Dict[str, Any]:
        """Cancel appointment by ID or phone number."""
        param = query_param.strip()
        appt = db.query(Appointment).filter(
            (Appointment.id == param) | (Appointment.patient_phone == param)
        ).order_by(Appointment.created_at.desc()).first()

        if not appt:
            return {
                "success": False,
                "message": f"No active appointment found for '{query_param}'."
            }

        appt.status = "CANCELLED"

        schedule = db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == appt.doctor_id,
            DoctorSchedule.date == appt.appointment_date
        ).first()

        if schedule:
            slots = ensure_list_slots(schedule.available_slots)
            if appt.appointment_time not in slots:
                slots.append(appt.appointment_time)
                slots.sort()
                schedule.available_slots = slots

        db.commit()
        return {
            "success": True,
            "appointment_id": appt.id,
            "patient_name": appt.patient_name,
            "status": "CANCELLED",
            "message": f"Appointment {appt.id} for {appt.patient_name} has been cancelled successfully."
        }

    @staticmethod
    def reschedule_appointment(
        db: Session,
        query_param: str,
        new_date_str: str,
        new_time_slot: str
    ) -> Dict[str, Any]:
        """Reschedule appointment to a new date and time slot."""
        param = query_param.strip()
        appt = db.query(Appointment).filter(
            (Appointment.id == param) | (Appointment.patient_phone == param)
        ).order_by(Appointment.created_at.desc()).first()

        if not appt:
            return {
                "success": False,
                "message": f"No active appointment found for '{query_param}'."
            }

        target_date = parse_date(new_date_str)
        clean_time = new_time_slot.strip()

        old_schedule = db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == appt.doctor_id,
            DoctorSchedule.date == appt.appointment_date
        ).first()
        if old_schedule:
            old_slots = ensure_list_slots(old_schedule.available_slots)
            if appt.appointment_time not in old_slots:
                old_slots.append(appt.appointment_time)
                old_slots.sort()
                old_schedule.available_slots = old_slots

        appt.appointment_date = target_date
        appt.appointment_time = clean_time
        appt.status = "RESCHEDULED"

        new_schedule = db.query(DoctorSchedule).filter(
            DoctorSchedule.doctor_id == appt.doctor_id,
            DoctorSchedule.date == target_date
        ).first()

        new_slots = ensure_list_slots(new_schedule.available_slots) if new_schedule else list(DEFAULT_SLOTS)

        if clean_time in new_slots:
            new_slots.remove(clean_time)

        if new_schedule:
            new_schedule.available_slots = new_slots
        else:
            new_schedule = DoctorSchedule(
                doctor_id=appt.doctor_id,
                date=target_date,
                available_slots=new_slots
            )
            db.add(new_schedule)

        db.commit()
        doc_name = appt.doctor.name if appt.doctor else "Doctor"

        return {
            "success": True,
            "appointment_id": appt.id,
            "patient_name": appt.patient_name,
            "doctor_name": doc_name,
            "new_date": target_date,
            "new_time": clean_time,
            "status": "RESCHEDULED",
            "message": f"Appointment {appt.id} successfully rescheduled to {target_date} at {clean_time}."
        }
