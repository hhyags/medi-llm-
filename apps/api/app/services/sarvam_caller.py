"""
MedVoice AI — Sarvam AI Calling Agent Client (Python)
Provides server-to-server integration with Sarvam AI Voice Agent Outbounds & Inbound Deployments API.
"""

import os
import httpx
from typing import Dict, Any, Optional, List

DEFAULT_SARVAM_OUTBOUND_BASE_URL = "https://apps.sarvam.ai/api/outbounds/v1"
DEFAULT_SARVAM_AUTHORING_BASE_URL = "https://apps.sarvam.ai/api/app-authoring/v1"
DEFAULT_ORG_ID = "019f7ba2-e0db-7958-90f3-5fb0e88e242c"
DEFAULT_WORKSPACE_ID = "019f7ba2-e0e6-7e90-9d38-59d0d0914051"
DEFAULT_APP_ID = "Conversatio-33fcb3f7-d1ed"
DEFAULT_APP_VERSION = 2
DEFAULT_APP_TYPE = "agent"
DEFAULT_CONNECTION_ID = "Twilio-Gout-3b994781-e20a"
DEFAULT_AGENT_PHONE_NUMBER = "+14632620069"


class SarvamCallingClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        org_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        app_id: Optional[str] = None,
        connection_id: Optional[str] = None,
        agent_phone_number: Optional[str] = None,
    ):
        self.api_key = api_key or os.getenv("SARVAM_API_KEY", "")
        self.org_id = org_id or os.getenv("SARVAM_ORG_ID", DEFAULT_ORG_ID)
        self.workspace_id = workspace_id or os.getenv("SARVAM_WORKSPACE_ID", DEFAULT_WORKSPACE_ID)
        self.app_id = app_id or os.getenv("SARVAM_APP_ID", DEFAULT_APP_ID)
        self.app_version = DEFAULT_APP_VERSION
        self.app_type = DEFAULT_APP_TYPE
        self.connection_id = connection_id or os.getenv("SARVAM_CONNECTION_ID", DEFAULT_CONNECTION_ID)
        self.agent_phone_number = agent_phone_number or os.getenv("SARVAM_AGENT_PHONE_NUMBER", DEFAULT_AGENT_PHONE_NUMBER)
        self.outbound_url = f"{DEFAULT_SARVAM_OUTBOUND_BASE_URL}/orgs/{self.org_id}/workspaces/{self.workspace_id}/outbounds"
        self.deployment_url = f"{DEFAULT_SARVAM_AUTHORING_BASE_URL}/orgs/{self.org_id}/workspaces/{self.workspace_id}/deployments"

    def build_payload(
        self,
        user_phone_number: str,
        user_name: str = "Patient",
        service_provider_name: str = "Dr. Meera Patel",
        service_type: str = "Cardiology Consultation",
        existing_appointment_date_time: str = "Tomorrow at 10:30 AM",
        service_location: str = "City Memorial Hospital",
        service_location_address: str = "100 Medical Center Way, Suite 400",
        customer_care_number: str = "+1 (555) 019-2834",
        webhook_url: Optional[str] = None,
        lead_id: Optional[str] = None,
        initial_bot_message: Optional[str] = None,
        extra_variables: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Construct the 26-variable Sarvam Outbound payload."""
        opening_line = (
            initial_bot_message
            or f"Hello {user_name.split()[0]}, I'm Maya calling from {service_location} regarding your appointment with {service_provider_name} scheduled for {existing_appointment_date_time}. Would you like to confirm your appointment?"
        )

        agent_vars = {
            "appointmentDurationMinutes": "30",
            "appointment_intent": "appointment_confirmation",
            "bookingReminderChannel": "SMS & Voice",
            "businessHours": "Mon - Fri: 8:00 AM - 8:00 PM",
            "call_disposition": "pending_call",
            "call_summary": f"Outbound confirmation for {user_name} with {service_provider_name}",
            "callbackNumberForReschedule": customer_care_number,
            "callback_requested_time": "",
            "cancellationWindowHours": "24",
            "cancellation_reason": "",
            "confirmed_slot": existing_appointment_date_time,
            "customerCareNumber": customer_care_number,
            "escalation_reason": "",
            "existingAppointmentDateTime": existing_appointment_date_time,
            "indicativeConsultationFee": "$150.00",
            "noShowCharge": "$0.00 (Please notify 24h prior)",
            "paymentModes": "Credit Card, Debit Card, Insurance, UPI / Online",
            "preferredCallbackWindow": "Within 2 hours during clinic hours",
            "preparationInstructions": "Please arrive 10 minutes early at reception with your photo ID.",
            "providerContactPhone": customer_care_number,
            "reminder_channel_selected": "Voice Call",
            "serviceLocation": service_location,
            "serviceLocationAddress": service_location_address,
            "serviceProviderName": service_provider_name,
            "serviceType": service_type,
            "userName": user_name,
        }

        if extra_variables:
            agent_vars.update(extra_variables)

        # Standardize phone format
        clean_phone = user_phone_number.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not clean_phone.startswith("+"):
            clean_phone = f"+{clean_phone}"

        payload: Dict[str, Any] = {
            "app_config": {
                "app_id": self.app_id,
                "app_version": self.app_version,
                "app_type": self.app_type,
                "connection_config": {
                    "connection_id": self.connection_id,
                    "agent_phone_number": self.agent_phone_number,
                },
                "agent_variables": agent_vars,
                "app_overrides": {
                    "initial_bot_message": opening_line,
                    "initial_state_name": "entry",
                },
            },
            "user_config": {
                "user_phone_number": clean_phone,
            },
        }

        if webhook_url:
            payload["webhook_config"] = {
                "url": webhook_url,
                "metadata": {
                    "lead_id": lead_id or f"LEAD-{user_name.replace(' ', '_')}",
                },
            }

        return payload

    def build_inbound_deployment_payload(
        self,
        name: str = "My inbound line",
        description: str = "Inbound support line",
        phone_numbers: Optional[List[str]] = None,
        start_time: str = "08:00",
        end_time: str = "20:00",
        allowed_days: Optional[List[str]] = None,
        timezone: str = "Asia/Kolkata",
    ) -> Dict[str, Any]:
        """Construct the Sarvam App Authoring Inbound Line Deployment payload."""
        return {
            "name": name,
            "description": description,
            "app_id": self.app_id,
            "app_version": self.app_version,
            "connection_configs": [
                {
                    "connection_id": self.connection_id,
                    "phone_numbers": phone_numbers or [self.agent_phone_number],
                }
            ],
            "inbound_config": {
                "start_time": start_time,
                "end_time": end_time,
                "allowed_days": allowed_days or ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "timezone": timezone,
            },
        }

    async def trigger_outbound_call(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger an outbound call using Sarvam AI API."""
        if not self.api_key or self.api_key == "<your-api-key>":
            return {
                "success": True,
                "mode": "simulation",
                "outbound_id": f"sim_outbound_{os.urandom(4).hex()}",
                "message": "Sarvam API Key not set; simulated outbound call dispatched successfully.",
                "payload_sent": payload,
            }

        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.outbound_url, headers=headers, json=payload)
                data = response.json()
                if response.status_code in (200, 201):
                    return {
                        "success": True,
                        "outbound_id": data.get("outbound_id", data.get("id")),
                        "status": data.get("status", "queued"),
                        "raw": data,
                        "payload_sent": payload,
                    }
                else:
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": data.get("message", response.text),
                        "payload_sent": payload,
                    }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "payload_sent": payload,
                }

    async def deploy_inbound_line(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy an inbound line via Sarvam AI App Authoring API."""
        if not self.api_key or self.api_key == "<your-api-key>":
            return {
                "success": True,
                "mode": "simulation",
                "deployment_id": f"sim_dep_{os.urandom(4).hex()}",
                "status": "deployed_simulation",
                "message": "Sarvam API Key not set; simulated inbound deployment created successfully.",
                "payload_sent": payload,
            }

        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(self.deployment_url, headers=headers, json=payload)
                data = response.json()
                if response.status_code in (200, 201):
                    return {
                        "success": True,
                        "deployment_id": data.get("deployment_id", data.get("id")),
                        "status": data.get("status", "deployed"),
                        "raw": data,
                        "payload_sent": payload,
                    }
                else:
                    return {
                        "success": False,
                        "status_code": response.status_code,
                        "error": data.get("message", response.text),
                        "payload_sent": payload,
                    }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e),
                    "payload_sent": payload,
                }


sarvam_caller = SarvamCallingClient()
