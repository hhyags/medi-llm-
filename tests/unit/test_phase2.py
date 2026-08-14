import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db
from app.db.seed import seed_database
from app.services.hospital_service import HospitalService
from app.services.appointment_service import AppointmentService
from app.orchestrator.intent import IntentDetector
from app.orchestrator.safety import SafetyChecker
from app.tools.tools import TOOL_REGISTRY
from main import app

# Create isolated test database engine
TEST_DATABASE_URL = "sqlite:///./test_phase2.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def setup_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    seed_database(db=TestingSessionLocal())
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()

# 1. Database & Seed Tests
def test_database_seed():
    db = TestingSessionLocal()
    info = HospitalService.get_hospital_info(db)
    assert info["name"] == "MedVoice City Hospital"
    departments = HospitalService.get_departments(db)
    assert len(departments) >= 5
    doctors = HospitalService.get_doctors(db)
    assert len(doctors) >= 6
    db.close()

# 2. Hospital & Doctor API Tests
def test_hospital_info_api():
    response = client.get("/api/hospital/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "MedVoice City Hospital"

def test_departments_api():
    response = client.get("/api/hospital/departments")
    assert response.status_code == 200
    depts = response.json()["departments"]
    assert any(d["name"] == "Cardiology" for d in depts)
    assert any(d["name"] == "Dermatology" for d in depts)

def test_doctors_api():
    response = client.get("/api/hospital/doctors?department=Dermatology")
    assert response.status_code == 200
    docs = response.json()["doctors"]
    assert len(docs) >= 1
    assert "Dr. Priya Sharma" in docs[0]["name"]

# 3. Availability API Test
def test_availability_api():
    response = client.get("/api/hospital/doctors/availability?department=Cardiology&date=tomorrow")
    assert response.status_code == 200
    avail = response.json()["availability"]
    assert len(avail) >= 1
    assert len(avail[0]["available_slots"]) > 0

# 4. Appointment Booking, Lookup, Cancel & Reschedule Tests
def test_appointment_lifecycle():
    db = TestingSessionLocal()
    # A. Book
    book_res = AppointmentService.book_appointment(
        db=db,
        patient_name="Test Patient",
        patient_phone="9998887770",
        doctor_id_or_name="Dr. Priya Sharma",
        date_str="tomorrow",
        time_slot="10:30 AM"
    )
    assert book_res["success"] is True
    appt_id = book_res["appointment_id"]
    assert appt_id.startswith("APT-")

    # B. Lookup
    lookup_res = AppointmentService.get_appointment(db, appt_id)
    assert len(lookup_res) == 1
    assert lookup_res[0]["status"] == "BOOKED"

    # C. Reschedule
    resched_res = AppointmentService.reschedule_appointment(
        db=db,
        query_param=appt_id,
        new_date_str="day after tomorrow",
        new_time_slot="02:00 PM"
    )
    assert resched_res["success"] is True
    assert resched_res["status"] == "RESCHEDULED"

    # D. Cancel
    cancel_res = AppointmentService.cancel_appointment(db, appt_id)
    assert cancel_res["success"] is True
    assert cancel_res["status"] == "CANCELLED"
    db.close()

# 5. Intent Detection & Tool Calling Tests
def test_intent_detection():
    d1 = IntentDetector.detect("I want to see a heart doctor tomorrow.")
    assert d1["intent"] == "BOOK_APPOINTMENT"
    assert d1["entities"]["department"] == "Cardiology"
    assert d1["entities"]["date"] == "tomorrow"

    d2 = IntentDetector.detect("Cancel my appointment APT-1001")
    assert d2["intent"] == "CANCEL_APPOINTMENT"
    assert d2["entities"]["appointment_id"] == "APT-1001"

    d3 = IntentDetector.detect("What are your hospital working hours?")
    assert d3["intent"] == "HOSPITAL_INFO"

def test_tool_registry():
    db = TestingSessionLocal()
    info = TOOL_REGISTRY["get_hospital_info"](db)
    assert info["name"] == "MedVoice City Hospital"
    db.close()

# 6. Medical Safety & Emergency Tests
def test_safety_emergency():
    is_emerg, msg = SafetyChecker.check_emergency("I am having severe chest pain and cannot breathe!")
    assert is_emerg is True
    assert "MEDICAL EMERGENCY ALERT" in msg

def test_safety_diagnosis():
    is_diag, msg = SafetyChecker.check_diagnosis_request("Can you diagnose my skin rash and prescribe antibiotics?")
    assert is_diag is True
    assert "not qualified or permitted to diagnose" in msg
