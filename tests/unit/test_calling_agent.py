import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.app.services.sarvam_caller import sarvam_caller

client = TestClient(app)


def test_calling_status_endpoint():
    """Verify calling agent status endpoint returns expected structure."""
    response = client.get("/calling/status")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "configured" in data
    assert "mode" in data
    assert data["app_id"] == "Conversatio-33fcb3f7-d1ed"


def test_build_outbound_payload():
    """Ensure outbound payload is built with all required variables without invalid initial_state_name."""
    payload = sarvam_caller.build_payload(
        user_phone_number="+919876543210",
        user_name="Rahul Sharma",
        service_provider_name="Dr. Meera Patel",
        service_type="Cardiology Consultation",
        existing_appointment_date_time="Tomorrow at 10:30 AM",
        service_location="City Memorial Hospital",
    )

    assert payload["user_config"]["user_phone_number"] == "+919876543210"
    app_config = payload["app_config"]
    assert app_config["app_id"] == "Conversatio-33fcb3f7-d1ed"
    assert app_config["app_version"] == 1
    assert "initial_state_name" not in app_config["app_overrides"]
    assert "Rahul" in app_config["app_overrides"]["initial_bot_message"]
    assert app_config["agent_variables"]["userName"] == "Rahul Sharma"


def test_build_inbound_deployment_payload():
    """Ensure inbound deployment payload is built properly."""
    payload = sarvam_caller.build_inbound_deployment_payload()
    assert payload["app_id"] == "Conversatio-33fcb3f7-d1ed"
    assert payload["connection_configs"][0]["phone_numbers"] == [sarvam_caller.agent_phone_number]
    assert payload["inbound_config"]["timezone"] == "Asia/Kolkata"


def test_trigger_outbound_call_simulation():
    """Verify simulation mode when API key is missing or placeholder."""
    import asyncio
    original_key = sarvam_caller.api_key
    sarvam_caller.api_key = "<your-api-key>"
    try:
        payload = sarvam_caller.build_payload(user_phone_number="+919876543210")
        result = asyncio.run(sarvam_caller.trigger_outbound_call(payload))
        assert result["success"] is True
        assert result["mode"] == "simulation"
    finally:
        sarvam_caller.api_key = original_key


def test_calling_webhook_endpoint():
    """Verify webhook accepts incoming Sarvam updates."""
    payload = {
        "call_id": "call_12345",
        "call_disposition": "appointment_confirmed",
        "call_duration": 42
    }
    response = client.post("/calling/webhook", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["call_disposition"] == "appointment_confirmed"
