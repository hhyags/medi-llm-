from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.hospital_service import HospitalService
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/api/hospital", tags=["Hospital & Doctors"])

@router.get("/info")
def get_hospital_info(db: Session = Depends(get_db)):
    """Get hospital profile, address, operating hours, and contact details."""
    return HospitalService.get_hospital_info(db)

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    """Get all departments."""
    return {"departments": HospitalService.get_departments(db)}

@router.get("/doctors")
def get_doctors(
    department: Optional[str] = Query(None, description="Department name filter"),
    specialization: Optional[str] = Query(None, description="Specialization filter"),
    db: Session = Depends(get_db)
):
    """Get doctors list with optional department/specialization filter."""
    return {"doctors": HospitalService.get_doctors(db, department_name=department, specialization=specialization)}

@router.get("/doctors/availability")
def get_availability(
    doctor_id: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    date: Optional[str] = Query(None, description="YYYY-MM-DD or 'tomorrow'"),
    db: Session = Depends(get_db)
):
    """Check doctor availability slots."""
    results = AppointmentService.check_availability(
        db=db,
        doctor_id_or_name=doctor_id,
        department_name=department,
        date_str=date
    )
    return {"availability": results}
