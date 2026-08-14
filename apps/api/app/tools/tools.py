from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.hospital_service import HospitalService
from app.services.appointment_service import AppointmentService

def get_hospital_info(db: Session, **kwargs) -> Dict[str, Any]:
    """Retrieve hospital general information, address, and hours."""
    return HospitalService.get_hospital_info(db)

def get_departments(db: Session, **kwargs) -> Dict[str, Any]:
    """Retrieve list of hospital departments."""
    depts = HospitalService.get_departments(db)
    return {"departments": depts}

def get_doctors(db: Session, department_name: Optional[str] = None, specialization: Optional[str] = None, **kwargs) -> Dict[str, Any]:
    """Retrieve doctor details, fees, and specializations."""
    doctors = HospitalService.get_doctors(db, department_name=department_name, specialization=specialization)
    return {"doctors": doctors}

def get_doctor_availability(
    db: Session,
    doctor_id_or_name: Optional[Any] = None,
    department_name: Optional[str] = None,
    date: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """Check doctor slot availability for a specified date."""
    results = AppointmentService.check_availability(
        db=db,
        doctor_id_or_name=doctor_id_or_name,
        department_name=department_name,
        date_str=date
    )
    return {"availability": results}

def book_appointment(
    db: Session,
    patient_name: str,
    patient_phone: str,
    doctor_id_or_name: Any,
    date: str,
    time_slot: str,
    **kwargs
) -> Dict[str, Any]:
    """Book a new doctor appointment."""
    return AppointmentService.book_appointment(
        db=db,
        patient_name=patient_name,
        patient_phone=patient_phone,
        doctor_id_or_name=doctor_id_or_name,
        date_str=date,
        time_slot=time_slot
    )

def get_appointment(db: Session, query_param: str, **kwargs) -> Dict[str, Any]:
    """Retrieve appointment details by appointment ID or phone number."""
    appts = AppointmentService.get_appointment(db, query_param)
    return {"appointments": appts}

def cancel_appointment(db: Session, query_param: str, **kwargs) -> Dict[str, Any]:
    """Cancel an appointment by ID or phone number."""
    return AppointmentService.cancel_appointment(db, query_param)

def reschedule_appointment(
    db: Session,
    query_param: str,
    new_date: str,
    new_time_slot: str,
    **kwargs
) -> Dict[str, Any]:
    """Reschedule an existing appointment."""
    return AppointmentService.reschedule_appointment(
        db=db,
        query_param=query_param,
        new_date_str=new_date,
        new_time_slot=new_time_slot
    )

TOOL_REGISTRY = {
    "get_hospital_info": get_hospital_info,
    "get_departments": get_departments,
    "get_doctors": get_doctors,
    "get_doctor_availability": get_doctor_availability,
    "book_appointment": book_appointment,
    "get_appointment": get_appointment,
    "cancel_appointment": cancel_appointment,
    "reschedule_appointment": reschedule_appointment
}
