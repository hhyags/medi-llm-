import { NextResponse } from 'next/server';
import { sarvamCallingService, SARVAM_DEFAULTS } from '../../../../lib/services/sarvamCallingService';
import { checkRateLimit } from '../../../../lib/rateLimit';

/**
 * POST /api/calling/outbound
 * Secure server-side trigger for Sarvam AI Outbound Phone Calling
 */
export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/calling/outbound', { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Outbound calling rate limit exceeded. Please wait before initiating more automated calls.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    const body = await request.json();
    const {
      targetPhone,
      patient,
      appointment,
      doctor,
      hospitalSettings,
      aiSettings,
      customVariables,
      customInitialMessage,
      leadId
    } = body;

    const phoneToDial = targetPhone || patient?.phone || appointment?.patientPhone;

    if (!phoneToDial) {
      return NextResponse.json(
        { success: false, error: 'A valid patient phone number (targetPhone) is required to initiate an outbound call.' },
        { status: 400 }
      );
    }

    // Determine host base URL for webhook callbacks
    const origin = request.headers.get('origin') || request.headers.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appBaseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    // Build the 26-variable Sarvam Outbound payload
    const payload = sarvamCallingService.buildPayload({
      targetPhone: phoneToDial,
      patient,
      appointment,
      doctor,
      hospitalSettings,
      aiSettings,
      appBaseUrl,
      leadId,
      customVariables,
      customInitialMessage
    });

    // Initiate the call via Sarvam AI
    const result = await sarvamCallingService.initiateOutboundCall(payload);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[API /api/calling/outbound] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while processing outbound call request.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calling/outbound
 * Returns metadata & status of the Sarvam Calling Agent configuration
 */
export async function GET() {
  const isConfigured = Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY !== '<your-api-key>');

  return NextResponse.json({
    agent_name: 'Sarvam AI Outbound Voice Agent',
    provider: 'Sarvam AI (apps.sarvam.ai)',
    is_configured: isConfigured,
    mode: isConfigured ? 'live_telephony' : 'simulation_and_diagnostics',
    org_id: process.env.SARVAM_ORG_ID || SARVAM_DEFAULTS.ORG_ID,
    workspace_id: process.env.SARVAM_WORKSPACE_ID || SARVAM_DEFAULTS.WORKSPACE_ID,
    app_id: process.env.SARVAM_APP_ID || SARVAM_DEFAULTS.APP_ID,
    connection_id: process.env.SARVAM_CONNECTION_ID || SARVAM_DEFAULTS.CONNECTION_ID,
    agent_phone_number: process.env.SARVAM_AGENT_PHONE_NUMBER || SARVAM_DEFAULTS.AGENT_PHONE_NUMBER,
    supported_intents: [
      'appointment_confirmation',
      'appointment_rescheduling',
      'appointment_cancellation',
      'human_receptionist_callback',
      'clinical_safety_guardrails'
    ]
  });
}
