from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.appointment_service import AppointmentService

router = APIRouter(prefix="/api/appointments", tags=["Appointment Management"])

class BookAppointmentRequest(BaseModel):
    patient_name: str = Field(..., example="Goutham")
    patient_phone: str = Field(..., example="9876543210")
    doctor_id_or_name: str = Field(..., example="Dr. Priya Sharma")
    date: str = Field("tomorrow", example="tomorrow")
    time_slot: str = Field("10:30 AM", example="10:30 AM")

class RescheduleAppointmentRequest(BaseModel):
    query_param: str = Field(..., example="APT-1001 or 9876543210")
    new_date: str = Field("tomorrow", example="tomorrow")
    new_time_slot: str = Field("02:00 PM", example="02:00 PM")

class CancelAppointmentRequest(BaseModel):
    query_param: str = Field(..., example="APT-1001 or 9876543210")

@router.post("/book")
def book_appointment(req: BookAppointmentRequest, db: Session = Depends(get_db)):
    """Book a new appointment."""
    try:
        res = AppointmentService.book_appointment(
            db=db,
            patient_name=req.patient_name,
            patient_phone=req.patient_phone,
            doctor_id_or_name=req.doctor_id_or_name,
            date_str=req.date,
            time_slot=req.time_slot
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lookup")
def lookup_appointment(query_param: str = Query(..., description="Appointment ID or Patient Phone"), db: Session = Depends(get_db)):
    """Lookup appointment by ID or patient phone."""
    res = AppointmentService.get_appointment(db, query_param)
    return {"appointments": res}

@router.post("/cancel")
def cancel_appointment(req: CancelAppointmentRequest, db: Session = Depends(get_db)):
    """Cancel an existing appointment."""
    res = AppointmentService.cancel_appointment(db, req.query_param)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/reschedule")
def reschedule_appointment(req: RescheduleAppointmentRequest, db: Session = Depends(get_db)):
    """Reschedule an existing appointment."""
    res = AppointmentService.reschedule_appointment(
        db=db,
        query_param=req.query_param,
        new_date_str=req.new_date,
        new_time_slot=req.new_time_slot
    )
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res
