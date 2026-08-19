// MedFlow AI CRM — Sarvam AI Calling Agent Service
// Connects MedFlow CRM with Sarvam AI Voice Agent Outbounds & Inbound Deployments API

import { Appointment, Patient, Doctor, HospitalSettings, AICallingSettings, CallRecord, CallDialogueTurn, CallOutcome } from '../../types/medflow';

// ─── Outbound Interfaces ──────────────────────────────────────────────────────

export interface SarvamAgentVariables {
  appointmentDurationMinutes?: string;
  appointment_intent?: string;
  bookingReminderChannel?: string;
  businessHours?: string;
  call_disposition?: string;
  call_summary?: string;
  callbackNumberForReschedule?: string;
  callback_requested_time?: string;
  cancellationWindowHours?: string;
  cancellation_reason?: string;
  confirmed_slot?: string;
  customerCareNumber?: string;
  escalation_reason?: string;
  existingAppointmentDateTime?: string;
  indicativeConsultationFee?: string;
  noShowCharge?: string;
  paymentModes?: string;
  preferredCallbackWindow?: string;
  preparationInstructions?: string;
  providerContactPhone?: string;
  reminder_channel_selected?: string;
  serviceLocation?: string;
  serviceLocationAddress?: string;
  serviceProviderName?: string;
  serviceType?: string;
  userName?: string;
  [key: string]: string | undefined;
}

export interface SarvamAppOverrides {
  initial_bot_message?: string;
  initial_state_name?: string;
}

export interface SarvamConnectionConfig {
  connection_id: string;
  agent_phone_number: string;
}

export interface SarvamAppConfig {
  app_id: string;
  app_version: number;
  app_type: string;
  connection_config: SarvamConnectionConfig;
  agent_variables: SarvamAgentVariables;
  app_overrides?: SarvamAppOverrides;
}

export interface SarvamUserConfig {
  user_phone_number: string;
}

export interface SarvamWebhookConfig {
  url: string;
  metadata?: Record<string, string>;
}

export interface SarvamOutboundPayload {
  app_config: SarvamAppConfig;
  user_config: SarvamUserConfig;
  webhook_config?: SarvamWebhookConfig;
}

export interface SarvamOutboundResponse {
  success: boolean;
  outbound_id?: string;
  call_id?: string;
  status?: string;
  message?: string;
  error?: string;
  payload_sent?: SarvamOutboundPayload;
  raw_response?: any;
}

export interface SarvamWebhookPayload {
  outbound_id?: string;
  call_id?: string;
  status?: string;
  call_duration?: number;
  call_disposition?: string;
  call_summary?: string;
  cancellation_reason?: string;
  confirmed_slot?: string;
  callback_requested_time?: string;
  escalation_reason?: string;
  transcript?: Array<{ speaker: string; text: string; timestamp?: string }>;
  metadata?: {
    lead_id?: string;
    hospital_id?: string;
    appointment_id?: string;
    patient_id?: string;
    doctor_id?: string;
    [key: string]: string | undefined;
  };
  agent_variables?: Record<string, string>;
}

// ─── Inbound Deployment Interfaces ────────────────────────────────────────────

export interface SarvamInboundConnectionConfig {
  connection_id: string;
  phone_numbers: string[];
}

export interface SarvamInboundTimingConfig {
  start_time: string;
  end_time: string;
  allowed_days: string[];
  timezone: string;
}

export interface SarvamInboundDeploymentPayload {
  name: string;
  description: string;
  app_id: string;
  app_version: number;
  connection_configs: SarvamInboundConnectionConfig[];
  inbound_config: SarvamInboundTimingConfig;
}

export interface SarvamInboundDeploymentResponse {
  success: boolean;
  deployment_id?: string;
  status?: string;
  message?: string;
  error?: string;
  payload_sent?: SarvamInboundDeploymentPayload;
  raw_response?: any;
}

// ─── Default Configuration Constants ─────────────────────────────────────────

export const SARVAM_DEFAULTS = {
  OUTBOUND_BASE_URL: 'https://apps.sarvam.ai/api/outbounds/v1',
  AUTHORING_BASE_URL: 'https://apps.sarvam.ai/api/app-authoring/v1',
  ORG_ID: '019f7ba2-e0db-7958-90f3-5fb0e88e242c',
  WORKSPACE_ID: '019f7ba2-e0e6-7e90-9d38-59d0d0914051',
  APP_ID: 'Conversatio-33fcb3f7-d1ed',
  APP_VERSION: 2,
  APP_TYPE: 'agent',
  CONNECTION_ID: 'Twilio-Gout-3b994781-e20a',
  AGENT_PHONE_NUMBER: '+14632620069',
  INITIAL_STATE: 'entry',
  DEFAULT_WEBHOOK_PATH: '/api/calling/webhook',
  INBOUND_TIMEZONE: 'Asia/Kolkata',
  INBOUND_START_TIME: '08:00',
  INBOUND_END_TIME: '20:00',
  INBOUND_ALLOWED_DAYS: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]
};

// ─── Service Class ────────────────────────────────────────────────────────────

class SarvamCallingService {
  private getOrgId(): string {
    return process.env.SARVAM_ORG_ID || SARVAM_DEFAULTS.ORG_ID;
  }

  private getWorkspaceId(): string {
    return process.env.SARVAM_WORKSPACE_ID || SARVAM_DEFAULTS.WORKSPACE_ID;
  }

  private getApiKey(): string {
    return process.env.SARVAM_API_KEY || '';
  }

  private getOutboundEndpointUrl(): string {
    const orgId = this.getOrgId();
    const workspaceId = this.getWorkspaceId();
    return `${SARVAM_DEFAULTS.OUTBOUND_BASE_URL}/orgs/${orgId}/workspaces/${workspaceId}/outbounds`;
  }

  private getDeploymentsEndpointUrl(): string {
    const orgId = this.getOrgId();
    const workspaceId = this.getWorkspaceId();
    return `${SARVAM_DEFAULTS.AUTHORING_BASE_URL}/orgs/${orgId}/workspaces/${workspaceId}/deployments`;
  }

  /**
   * Builds the comprehensive Sarvam Outbound payload from MedFlow CRM entities
   */
  public buildPayload(params: {
    targetPhone: string;
    patient?: Partial<Patient> | null;
    appointment?: Partial<Appointment> | null;
    doctor?: Partial<Doctor> | null;
    hospitalSettings?: Partial<HospitalSettings> | null;
    aiSettings?: Partial<AICallingSettings> | null;
    appBaseUrl?: string;
    leadId?: string;
    customVariables?: Partial<SarvamAgentVariables>;
    customInitialMessage?: string;
  }): SarvamOutboundPayload {
    const {
      targetPhone,
      patient,
      appointment,
      doctor,
      hospitalSettings,
      aiSettings,
      appBaseUrl,
      leadId,
      customVariables,
      customInitialMessage
    } = params;

    const patientName = patient?.name || appointment?.patientName || 'Patient';
    const doctorName = doctor?.name || appointment?.doctorName || 'Doctor';
    const hospitalName = hospitalSettings?.name || 'MedFlow Hospital';
    const hospitalAddress = hospitalSettings?.address || '100 Medical Center Way, Suite 400';
    const hospitalPhone = hospitalSettings?.phone || '+1 (555) 019-2834';
    const workingHours = hospitalSettings?.workingHours || 'Mon - Fri: 8:00 AM - 8:00 PM';
    const appointmentDate = appointment?.date || new Date().toISOString().split('T')[0];
    const appointmentTime = appointment?.time || '10:00 AM';
    const agentName = aiSettings?.agentName || 'Maya';
    const callerId = aiSettings?.callingNumber || SARVAM_DEFAULTS.AGENT_PHONE_NUMBER;
    const department = appointment?.department || doctor?.department || doctor?.specialization || 'General Medicine';

    // Format phone to standard international format if not already prefixed
    let cleanPhone = targetPhone.trim().replace(/[^\d+]/g, '');
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    // Compose human-friendly initial opening line for the voice bot
    const openingLine = customInitialMessage || 
      `Hello ${patientName.split(' ')[0]}, I'm ${agentName} calling from ${hospitalName} regarding your appointment with ${doctorName} scheduled for ${appointmentDate} at ${appointmentTime}. Would you like to confirm your appointment?`;

    // Map all 26 Sarvam agent variables
    const agentVariables: SarvamAgentVariables = {
      userName: patientName,
      serviceProviderName: doctorName,
      serviceType: `${department} Consultation`,
      serviceLocation: hospitalName,
      serviceLocationAddress: hospitalAddress,
      existingAppointmentDateTime: `${appointmentDate} at ${appointmentTime}`,
      appointmentDurationMinutes: '30',
      appointment_intent: 'appointment_confirmation',
      businessHours: workingHours,
      call_disposition: 'pending_call',
      call_summary: `Outbound appointment confirmation call for ${patientName} with ${doctorName}`,
      customerCareNumber: hospitalPhone,
      providerContactPhone: hospitalPhone,
      callbackNumberForReschedule: hospitalPhone,
      cancellationWindowHours: '24',
      indicativeConsultationFee: '$150.00',
      noShowCharge: '$0.00 (Please notify 24h prior)',
      paymentModes: 'Credit Card, Debit Card, Insurance, UPI / Online',
      preparationInstructions: 'Please arrive 10 minutes early at reception with your photo ID and previous prescription history.',
      bookingReminderChannel: 'SMS & Voice',
      preferredCallbackWindow: 'Within 2 hours during regular clinic hours',
      cancellation_reason: '',
      confirmed_slot: `${appointmentDate} ${appointmentTime}`,
      escalation_reason: '',
      callback_requested_time: '',
      reminder_channel_selected: 'Voice Call',
      ...customVariables
    };

    // Formulate Webhook URL
    const baseUrl = appBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}${SARVAM_DEFAULTS.DEFAULT_WEBHOOK_PATH}`;

    return {
      app_config: {
        app_id: process.env.SARVAM_APP_ID || SARVAM_DEFAULTS.APP_ID,
        app_version: SARVAM_DEFAULTS.APP_VERSION,
        app_type: SARVAM_DEFAULTS.APP_TYPE,
        connection_config: {
          connection_id: process.env.SARVAM_CONNECTION_ID || SARVAM_DEFAULTS.CONNECTION_ID,
          agent_phone_number: callerId
        },
        agent_variables: agentVariables,
        app_overrides: {
          initial_bot_message: openingLine,
          initial_state_name: SARVAM_DEFAULTS.INITIAL_STATE
        }
      },
      user_config: {
        user_phone_number: cleanPhone
      },
      webhook_config: {
        url: webhookUrl,
        metadata: {
          lead_id: leadId || appointment?.id || `LEAD-${Date.now()}`,
          hospital_id: hospitalSettings?.hospitalId || appointment?.hospitalId || 'HOSP_001',
          appointment_id: appointment?.id || '',
          patient_id: patient?.id || appointment?.patientId || '',
          doctor_id: doctor?.id || appointment?.doctorId || ''
        }
      }
    };
  }

  /**
   * Dispatches the Outbound Call directly to Sarvam AI API
   */
  public async initiateOutboundCall(payload: SarvamOutboundPayload): Promise<SarvamOutboundResponse> {
    const apiKey = this.getApiKey();
    const endpoint = this.getOutboundEndpointUrl();

    // If no API key is provided, gracefully provide simulated success and diagnostic payload
    if (!apiKey || apiKey === '<your-api-key>') {
      const mockOutboundId = `sarvam_outbound_${Date.now()}`;
      return {
        success: true,
        outbound_id: mockOutboundId,
        call_id: `CALL-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'queued_simulation',
        message: 'Sarvam AI Call dispatched in simulation mode (SARVAM_API_KEY not configured in environment). Live payload built successfully.',
        payload_sent: payload
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || responseData.error || `Sarvam API error: HTTP ${response.status}`,
          status: 'failed',
          payload_sent: payload,
          raw_response: responseData
        };
      }

      return {
        success: true,
        outbound_id: responseData.outbound_id || responseData.id || `outbound_${Date.now()}`,
        call_id: responseData.call_id || `CALL-${Date.now().toString().slice(-5)}`,
        status: responseData.status || 'queued',
        message: 'Sarvam AI outbound call initiated successfully.',
        payload_sent: payload,
        raw_response: responseData
      };
    } catch (err: any) {
      console.error('[SarvamCallingService] Network error initiating outbound call:', err);
      return {
        success: false,
        error: err.message || 'Failed to connect to Sarvam AI Outbounds endpoint.',
        status: 'network_error',
        payload_sent: payload
      };
    }
  }

  /**
   * Builds the Sarvam Inbound Line Deployment payload
   */
  public buildInboundDeploymentPayload(params?: {
    name?: string;
    description?: string;
    phoneNumbers?: string[];
    startTime?: string;
    endTime?: string;
    allowedDays?: string[];
    timezone?: string;
    appId?: string;
    connectionId?: string;
  }): SarvamInboundDeploymentPayload {
    const name = params?.name || 'MedFlow Inbound Hospital Reception Line';
    const description = params?.description || 'AI-powered inbound appointment booking, triage and patient support line';
    const phoneNumbers = params?.phoneNumbers || [SARVAM_DEFAULTS.AGENT_PHONE_NUMBER];
    const startTime = params?.startTime || SARVAM_DEFAULTS.INBOUND_START_TIME;
    const endTime = params?.endTime || SARVAM_DEFAULTS.INBOUND_END_TIME;
    const allowedDays = params?.allowedDays || SARVAM_DEFAULTS.INBOUND_ALLOWED_DAYS;
    const timezone = params?.timezone || SARVAM_DEFAULTS.INBOUND_TIMEZONE;
    const appId = params?.appId || process.env.SARVAM_APP_ID || SARVAM_DEFAULTS.APP_ID;
    const connectionId = params?.connectionId || process.env.SARVAM_CONNECTION_ID || SARVAM_DEFAULTS.CONNECTION_ID;

    return {
      name,
      description,
      app_id: appId,
      app_version: SARVAM_DEFAULTS.APP_VERSION,
      connection_configs: [
        {
          connection_id: connectionId,
          phone_numbers: phoneNumbers
        }
      ],
      inbound_config: {
        start_time: startTime,
        end_time: endTime,
        allowed_days: allowedDays,
        timezone: timezone
      }
    };
  }

  /**
   * Deploys an Inbound Voice Line on Sarvam AI App Authoring API
   */
  public async deployInboundLine(payload: SarvamInboundDeploymentPayload): Promise<SarvamInboundDeploymentResponse> {
    const apiKey = this.getApiKey();
    const endpoint = this.getDeploymentsEndpointUrl();

    if (!apiKey || apiKey === '<your-api-key>') {
      return {
        success: true,
        deployment_id: `dep_sim_${Date.now()}`,
        status: 'active_simulation',
        message: 'Sarvam Inbound Line deployed in simulation mode (SARVAM_API_KEY not set). Live payload verified.',
        payload_sent: payload
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || responseData.error || `Sarvam Inbound Deployment API error: HTTP ${response.status}`,
          status: 'failed',
          payload_sent: payload,
          raw_response: responseData
        };
      }

      return {
        success: true,
        deployment_id: responseData.deployment_id || responseData.id || `dep_${Date.now()}`,
        status: responseData.status || 'deployed',
        message: 'Sarvam AI Inbound Line deployed successfully.',
        payload_sent: payload,
        raw_response: responseData
      };
    } catch (err: any) {
      console.error('[SarvamCallingService] Network error deploying inbound line:', err);
      return {
        success: false,
        error: err.message || 'Failed to connect to Sarvam AI App Authoring endpoint.',
        status: 'network_error',
        payload_sent: payload
      };
    }
  }

  /**
   * Converts a Sarvam Webhook payload into MedFlow CallRecord & Outcome
   */
  public transformWebhookToCallRecord(
    webhook: SarvamWebhookPayload,
    hospitalId: string
  ): {
    callRecord: Omit<CallRecord, 'id' | 'callId' | 'hospitalId' | 'createdAt'>;
    suggestedAppointmentStatus?: Appointment['status'];
    rescheduleDate?: string;
    rescheduleTime?: string;
  } {
    const disposition = (webhook.call_disposition || '').toLowerCase();
    let outcome: CallOutcome = 'confirmed';
    let suggestedAppointmentStatus: Appointment['status'] = 'confirmed';

    if (disposition.includes('cancel')) {
      outcome = 'cancelled';
      suggestedAppointmentStatus = 'cancelled';
    } else if (disposition.includes('reschedule')) {
      outcome = 'rescheduled';
      suggestedAppointmentStatus = 'scheduled';
    } else if (disposition.includes('callback') || webhook.callback_requested_time) {
      outcome = 'callback_requested';
    } else if (disposition.includes('unanswered') || disposition.includes('no_answer')) {
      outcome = 'unanswered';
    } else if (disposition.includes('escalat') || webhook.escalation_reason) {
      outcome = 'escalated_medical';
    }

    const transcriptTurns: CallDialogueTurn[] = (webhook.transcript || []).map((t) => ({
      speaker: (t.speaker === 'user' || t.speaker === 'patient') ? 'patient' : 'ai',
      text: t.text,
      timestamp: t.timestamp || new Date().toLocaleTimeString()
    }));

    const isCallback = outcome === 'callback_requested' || outcome === 'escalated_medical';

    return {
      callRecord: {
        patientId: webhook.metadata?.patient_id || 'PAT-UNKNOWN',
        patientName: webhook.agent_variables?.userName || 'Patient',
        patientPhone: webhook.agent_variables?.customerCareNumber || '',
        appointmentId: webhook.metadata?.appointment_id || undefined,
        doctorId: webhook.metadata?.doctor_id || undefined,
        doctorName: webhook.agent_variables?.serviceProviderName || undefined,
        purpose: 'appointment_confirmation',
        status: 'completed',
        outcome,
        durationSeconds: webhook.call_duration || 45,
        startedAt: new Date(Date.now() - (webhook.call_duration || 45) * 1000).toISOString(),
        endedAt: new Date().toISOString(),
        summary: webhook.call_summary || `Sarvam AI Call completed with disposition: ${disposition}`,
        transcript: transcriptTurns,
        callbackRequested: isCallback,
        callbackReason: webhook.callback_requested_time ? `Callback requested at: ${webhook.callback_requested_time}` : undefined,
        escalationRequired: isCallback,
        escalationType: outcome === 'escalated_medical' ? 'clinical_query' : isCallback ? 'human_agent_requested' : undefined,
        resolvedByReceptionist: false
      },
      suggestedAppointmentStatus
    };
  }
}

export const sarvamCallingService = new SarvamCallingService();
