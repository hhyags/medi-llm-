import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_appointment_id():
    return f"APT-{uuid.uuid4().hex[:6].upper()}"

class HospitalInfo(Base):
    __tablename__ = "hospital_info"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    emergency_contact = Column(String(50), nullable=False)
    operating_hours = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    location = Column(String(100), nullable=True)

    doctors = relationship("Doctor", back_populates="department")

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    specialization = Column(String(100), nullable=False)
    consultation_fee = Column(Float, nullable=False, default=500.0)
    experience_years = Column(Integer, default=5)
    bio = Column(Text, nullable=True)
    working_days = Column(String(100), default="Monday to Saturday")
    working_hours = Column(String(100), default="09:00 AM - 05:00 PM")

    department = relationship("Department", back_populates="doctors")
    schedules = relationship("DoctorSchedule", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    available_slots = Column(JSON, nullable=False) # list of strings like ["09:00 AM", "10:30 AM", "02:00 PM"]

    doctor = relationship("Doctor", back_populates="schedules")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)

    appointments = relationship("Appointment", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(20), primary_key=True, default=generate_appointment_id)
    patient_name = Column(String(100), nullable=False)
    patient_phone = Column(String(20), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    appointment_date = Column(String(20), nullable=False) # YYYY-MM-DD
    appointment_time = Column(String(20), nullable=False) # e.g. "10:30 AM"
    status = Column(String(20), default="BOOKED") # BOOKED, CANCELLED, RESCHEDULED
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
