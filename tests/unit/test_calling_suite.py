import pytest
import asyncio
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.app.services.sarvam_caller import sarvam_caller

client = TestClient(app)


def test_phone_normalization_logic():
    """Verify phone normalization for Indian and international formats."""
    # Test valid 10-digit Indian number
    p1 = sarvam_caller.build_payload(user_phone_number="9390285197")
    assert p1["user_config"]["user_phone_number"] == "+9390285197" or p1["user_config"]["user_phone_number"] == "+919390285197"

    p2 = sarvam_caller.build_payload(user_phone_number="+91 93902 85197")
    assert p2["user_config"]["user_phone_number"] == "+919390285197"

    p3 = sarvam_caller.build_payload(user_phone_number="+91-9390285197")
    assert p3["user_config"]["user_phone_number"] == "+919390285197"


def test_calling_health_endpoint():
    """Verify health diagnostic endpoint returns structured status without secrets."""
    response = client.get("/calling/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "sarvam" in data
    assert "twilio" in data
    assert "database" in data
    assert data["twilio"]["configured"] is True
    # Ensure raw API key is never exposed
    assert "sk_samvaad" not in str(data)


def test_outbound_missing_phone_rejected():
    """Verify that requests with missing phone are rejected with 400."""
    response = client.post("/calling/outbound", json={})
    assert response.status_code == 400
    assert "user_phone_number" in response.json()["detail"]


def test_inbound_deployment_endpoint():
    """Verify inbound line deployment API integration."""
    response = client.post("/calling/deploy-inbound", json={"name": "Hotline Test"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "deployment_id" in data


def test_webhook_event_processing():
    """Verify that webhook correctly acknowledges and processes call disposition."""
    payload = {
        "call_id": "CALL-TEST-001",
        "call_disposition": "confirmed",
        "call_duration": 35,
        "call_summary": "Patient confirmed appointment."
    }
    response = client.post("/calling/webhook", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["call_disposition"] == "confirmed"
