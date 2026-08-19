from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any, Optional
from app.services.sarvam_caller import sarvam_caller

router = APIRouter(prefix="/calling", tags=["Sarvam Calling Agent"])


@router.get("/status")
async def get_calling_agent_status():
    """Returns Sarvam AI Calling Agent metadata & connection status."""
    has_key = bool(sarvam_caller.api_key and sarvam_caller.api_key != "<your-api-key>")
    return {
        "service": "Sarvam AI Voice Agent (Outbound & Inbound)",
        "configured": has_key,
        "mode": "live" if has_key else "simulation",
        "org_id": sarvam_caller.org_id,
        "workspace_id": sarvam_caller.workspace_id,
        "app_id": sarvam_caller.app_id,
        "connection_id": sarvam_caller.connection_id,
        "agent_phone_number": sarvam_caller.agent_phone_number,
    }


@router.post("/outbound")
async def trigger_outbound_call(payload: Dict[str, Any]):
    """Triggers an outbound voice call via Sarvam AI Voice Agent."""
    phone = payload.get("user_phone_number") or payload.get("targetPhone")
    if not phone:
        raise HTTPException(status_code=400, detail="Missing 'user_phone_number' or 'targetPhone'")

    built_payload = sarvam_caller.build_payload(
        user_phone_number=phone,
        user_name=payload.get("userName", payload.get("patientName", "Patient")),
        service_provider_name=payload.get("serviceProviderName", payload.get("doctorName", "Dr. Meera Patel")),
        service_type=payload.get("serviceType", "Consultation"),
        existing_appointment_date_time=payload.get("existingAppointmentDateTime", "Tomorrow at 10:30 AM"),
        service_location=payload.get("serviceLocation", "City Memorial Hospital"),
        service_location_address=payload.get("serviceLocationAddress", "100 Medical Center Way"),
        customer_care_number=payload.get("customerCareNumber", "+1 (555) 019-2834"),
        webhook_url=payload.get("webhook_url"),
        lead_id=payload.get("lead_id"),
        initial_bot_message=payload.get("initial_bot_message"),
        extra_variables=payload.get("extra_variables"),
    )

    result = await sarvam_caller.trigger_outbound_call(built_payload)
    return result


@router.post("/deploy-inbound")
async def deploy_inbound_line(payload: Dict[str, Any] = None):
    """Deploys an inbound phone line via Sarvam AI App Authoring API."""
    data = payload or {}
    built_payload = sarvam_caller.build_inbound_deployment_payload(
        name=data.get("name", "My inbound line"),
        description=data.get("description", "Inbound support line"),
        phone_numbers=data.get("phone_numbers"),
        start_time=data.get("start_time", "08:00"),
        end_time=data.get("end_time", "20:00"),
        allowed_days=data.get("allowed_days"),
        timezone=data.get("timezone", "Asia/Kolkata"),
    )
    result = await sarvam_caller.deploy_inbound_line(built_payload)
    return result


@router.post("/webhook")
async def sarvam_webhook(payload: Dict[str, Any]):
    """Receives webhook notifications and disposition updates from Sarvam AI."""
    print(f"[Python API Webhook Received]: {payload}")
    return {
        "success": True,
        "message": "Sarvam AI Webhook processed by MedVoice API",
        "call_disposition": payload.get("call_disposition", "unknown"),
        "received_payload": payload,
    }
