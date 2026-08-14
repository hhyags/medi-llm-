import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base, get_db
from app.db.seed import seed_database
from app.orchestrator.safety import SafetyChecker
from main import app

TEST_DATABASE_URL = "sqlite:///./test_phase3a.db"
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

def test_emergency_priority_override():
    is_emerg, msg = SafetyChecker.check_emergency("I have crushing chest pain and difficulty breathing!")
    assert is_emerg is True
    assert "MEDICAL EMERGENCY ALERT" in msg

def test_diagnosis_refusal():
    is_diag, msg = SafetyChecker.check_diagnosis_request("Can you diagnose if I have pneumonia?")
    assert is_diag is True
    assert "diagnose medical conditions" in msg

def test_phase1_regression_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "healthy" in resp.json()["status"]

def test_phase2_regression_hospital_operations():
    # Hospital info tool
    resp_info = client.get("/api/hospital/info")
    assert resp_info.status_code == 200
    assert "MedVoice City Hospital" in resp_info.json()["name"]

    # Doctor directory
    resp_docs = client.get("/api/hospital/doctors")
    assert resp_docs.status_code == 200
    assert len(resp_docs.json()["doctors"]) >= 6

    # Appointment booking tool
    resp_book = client.post("/api/appointments/book", json={
        "patient_name": "Phase 3A Regression Patient",
        "patient_phone": "9888777666",
        "doctor_id_or_name": "Dr. Priya Sharma",
        "date": "tomorrow",
        "time_slot": "11:30 AM"
    })
    assert resp_book.status_code == 200
    assert resp_book.json()["success"] is True
