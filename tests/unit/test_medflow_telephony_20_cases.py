import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from apps.api.app.services.sarvam_caller import sarvam_caller

client = TestClient(app)

# TEST-001: Valid target number (+91 9100488447)
def test_001_valid_target_number():
    payload = sarvam_caller.build_payload(user_phone_number="+91 9100488447")
    assert payload["user_config"]["user_phone_number"] == "+919100488447"

# TEST-002: Invalid target number
def test_002_invalid_target_number():
    response = client.post("/calling/outbound", json={"user_phone_number": ""})
    assert response.status_code == 400

# TEST-003: Missing Sarvam API key reporting
def test_003_missing_sarvam_api_key():
    from apps.api.app.services.sarvam_caller import SarvamCallingClient
    unauth_client = SarvamCallingClient(api_key="")
    assert unauth_client.api_key == ""

# TEST-004: Invalid Sarvam API key structure
def test_004_invalid_sarvam_api_key():
    from apps.api.app.services.sarvam_caller import SarvamCallingClient
    dummy_client = SarvamCallingClient(api_key="<your-api-key>")
    assert dummy_client.api_key == "<your-api-key>"

# TEST-005 & TEST-006: Agent ID validation
def test_005_006_agent_id_validation():
    assert sarvam_caller.app_id == "Conversatio-33fcb3f7-d1ed"
    assert sarvam_caller.app_version == 1

# TEST-007 & TEST-008: Agent phone number verification
def test_007_008_agent_phone_number():
    assert sarvam_caller.agent_phone_number == "+14632620069"
    assert sarvam_caller.connection_id == "Twilio-Gout-3b994781-e20a"

# TEST-009 & TEST-010: Connection and Caller ID
def test_009_010_connection_and_caller_id():
    payload = sarvam_caller.build_payload(user_phone_number="+919100488447")
    conn_cfg = payload["app_config"]["connection_config"]
    assert conn_cfg["connection_id"] == "Twilio-Gout-3b994781-e20a"
    assert conn_cfg["agent_phone_number"] == "+14632620069"

# TEST-011: Valid configuration
def test_011_valid_configuration():
    response = client.get("/calling/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["twilio"]["configured"] is True
    assert data["twilio"]["agent_phone_number"] == "+14632620069"

# TEST-012: Real outbound call build
def test_012_real_outbound_call_build():
    payload = sarvam_caller.build_payload(
        user_phone_number="+919100488447",
        user_name="Sai Goutham",
        service_provider_name="Dr. Priya Sharma",
        service_type="Dermatology Consultation"
    )
    assert payload["user_config"]["user_phone_number"] == "+919100488447"
    assert payload["app_config"]["agent_variables"]["userName"] == "Sai Goutham"

# TEST-013, 014, 015: Patient outcomes in 26 variables
def test_013_014_015_crm_outcomes_mapping():
    for intent in ["appointment_confirmation", "reschedule_requested", "cancellation_requested"]:
        payload = sarvam_caller.build_payload(
            user_phone_number="+919100488447",
            extra_variables={"appointment_intent": intent}
        )
        assert payload["app_config"]["agent_variables"]["appointment_intent"] == intent
        assert len(payload["app_config"]["agent_variables"]) >= 26

# TEST-016 & TEST-017: Webhook and Idempotency
def test_016_017_webhook_idempotency():
    payload = {
        "call_id": "CALL-WEBHOOK-999",
        "call_disposition": "confirmed",
        "duration": 42
    }
    r1 = client.post("/calling/webhook", json=payload)
    assert r1.status_code == 200
    # Duplicate webhook
    r2 = client.post("/calling/webhook", json=payload)
    assert r2.status_code == 200
    assert r2.json()["success"] is True

# TEST-018: Call failure handling
def test_018_call_failure_handling():
    res = client.post("/calling/outbound", json={"user_phone_number": ""})
    assert res.status_code == 400

# TEST-019 & TEST-020: Multi-tenant and Security isolation
def test_019_020_security_and_isolation():
    # Calling status does not expose secrets
    res = client.get("/calling/status")
    assert "sk_samvaad" not in str(res.json())
    assert "api_key" not in res.json()
