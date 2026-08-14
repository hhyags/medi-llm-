from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import HospitalInfo, Department, Doctor, DoctorSchedule

class HospitalService:

    @staticmethod
    def get_hospital_info(db: Session) -> Dict[str, Any]:
        """Fetch general hospital details."""
        info = db.query(HospitalInfo).first()
        if not info:
            return {
                "name": "MedVoice City Hospital",
                "address": "123 Healthcare Boulevard, Medical District",
                "phone": "+1 (800) 555-MEDS",
                "emergency_contact": "911 / +1 (800) 555-9111",
                "operating_hours": "24/7 Emergency | OPD Mon-Sat 08:00 AM - 08:00 PM",
                "description": "Multi-specialty tertiary care hospital."
            }
        return {
            "name": info.name,
            "address": info.address,
            "phone": info.phone,
            "emergency_contact": info.emergency_contact,
            "operating_hours": info.operating_hours,
            "description": info.description
        }

    @staticmethod
    def get_departments(db: Session) -> List[Dict[str, Any]]:
        """List all hospital departments."""
        depts = db.query(Department).all()
        return [
            {
                "id": d.id,
                "name": d.name,
                "code": d.code,
                "description": d.description,
                "location": d.location
            }
            for d in depts
        ]

    @staticmethod
    def get_doctors(
        db: Session,
        department_name: Optional[str] = None,
        specialization: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List doctors with optional filtering."""
        query = db.query(Doctor)
        if department_name:
            # Match department name or alias (e.g. heart -> Cardiology, skin -> Dermatology)
            dept_term = department_name.strip().lower()
            alias_map = {
                "heart": "Cardiology",
                "cardio": "Cardiology",
                "skin": "Dermatology",
                "derma": "Dermatology",
                "bone": "Orthopedics",
                "ortho": "Orthopedics",
                "joint": "Orthopedics",
                "child": "Pediatrics",
                "kids": "Pediatrics",
                "peds": "Pediatrics",
                "brain": "Neurology",
                "nerve": "Neurology",
                "neuro": "Neurology",
                "general": "General Medicine",
                "physician": "General Medicine"
            }
            target_dept = alias_map.get(dept_term, department_name)
            query = query.join(Department).filter(
                (Department.name.ilike(f"%{target_dept}%")) |
                (Department.code.ilike(f"%{target_dept}%"))
            )
        if specialization:
            query = query.filter(Doctor.specialization.ilike(f"%{specialization}%"))

        doctors = query.all()
        result = []
        for doc in doctors:
            dept_name = doc.department.name if doc.department else "General"
            result.append({
                "id": doc.id,
                "name": doc.name,
                "department": dept_name,
                "specialization": doc.specialization,
                "consultation_fee": doc.consultation_fee,
                "experience_years": doc.experience_years,
                "bio": doc.bio,
                "working_days": doc.working_days,
                "working_hours": doc.working_hours
            })
        return result

    @staticmethod
    def get_doctor_by_id_or_name(db: Session, doctor_id_or_name: Any) -> Optional[Doctor]:
        """Find doctor by ID or partial name."""
        if str(doctor_id_or_name).isdigit():
            doc = db.query(Doctor).filter(Doctor.id == int(doctor_id_or_name)).first()
            if doc:
                return doc

        clean_name = str(doctor_id_or_name).strip()
        doc = db.query(Doctor).filter(Doctor.name.ilike(f"%{clean_name}%")).first()
        return doc
