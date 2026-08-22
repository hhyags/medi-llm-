import { NextResponse } from 'next/server';
import { sarvamCallingService, normalizePhoneToE164, maskPhoneNumber } from '../../../../lib/services/sarvamCallingService';
import { checkRateLimit } from '../../../../lib/rateLimit';

// Active in-flight call tracking to prevent accidental duplicate simultaneous dials
const activeInFlightCalls = new Map<string, number>();

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
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Outbound calling rate limit exceeded. Please wait a moment before initiating more automated calls.'
          }
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

    const body = await request.json().catch(() => ({}));
    const {
      targetPhone,
      phoneNumber,
      phone,
      patientId,
      patient,
      appointmentId,
      appointment,
      doctor,
      hospitalSettings,
      aiSettings,
      customVariables,
      customInitialMessage,
      leadId
    } = body;

    const rawPhone = targetPhone || phoneNumber || phone || patient?.phone || appointment?.patientPhone;

    if (!rawPhone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PHONE_NUMBER',
            message: 'A valid patient phone number is required to initiate an outbound call.'
          }
        },
        { status: 400 }
      );
    }

    // Server-side strict E.164 normalization & validation
    const phoneValidation = normalizePhoneToE164(rawPhone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PHONE_NUMBER',
            message: phoneValidation.error || 'Please enter a valid phone number with country code.'
          }
        },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneValidation.formatted;
    const maskedPhone = maskPhoneNumber(normalizedPhone);

    // Check duplicate in-flight calls (within 30 seconds)
    const now = Date.now();
    const lastCalled = activeInFlightCalls.get(normalizedPhone);
    if (lastCalled && now - lastCalled < 30000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CALL_IN_FLIGHT',
            message: `A call to ${maskedPhone} is already being processed. Please wait before dialing again.`
          }
        },
        { status: 409 }
      );
    }

    activeInFlightCalls.set(normalizedPhone, now);

    // Clean up stale in-flight records
    activeInFlightCalls.forEach((timestamp, p) => {
      if (now - timestamp > 60000) {
        activeInFlightCalls.delete(p);
      }
    });

    // Determine host base URL for webhook callbacks
    const origin = request.headers.get('origin') || request.headers.get('host') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const appBaseUrl = origin.startsWith('http') ? origin : `https://${origin}`;

    console.log(`[CALLING] Dispatching outbound call to ${maskedPhone}`);

    // Build the 26-variable Sarvam Outbound payload
    const payload = sarvamCallingService.buildPayload({
      targetPhone: normalizedPhone,
      patient: patient || { id: patientId, phone: normalizedPhone },
      appointment: appointment || { id: appointmentId, patientPhone: normalizedPhone },
      doctor,
      hospitalSettings,
      aiSettings,
      appBaseUrl,
      leadId,
      customVariables,
      customInitialMessage
    });

    // Initiate the call via Sarvam AI with retry handling
    const result = await sarvamCallingService.initiateOutboundCall(payload);

    if (!result.success) {
      activeInFlightCalls.delete(normalizedPhone);
      return NextResponse.json(
        {
          success: false,
          status: result.status || 'failed',
          error: result.error || {
            code: 'SARVAM_CALL_FAILED',
            message: 'Unable to start the outbound call.'
          },
          retryCount: result.retryCount || 0
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: 'queued',
        attemptId: result.attempt_id || result.outbound_id,
        outbound_id: result.outbound_id || result.attempt_id,
        call_id: result.call_id,
        message: 'AI call queued successfully.',
        recipient: maskedPhone,
        retryCount: result.retryCount || 0
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /api/calling/outbound] Server error:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to connect to the calling service. Please check the server configuration.',
          details: error?.message || String(error)
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calling/outbound
 * Returns metadata & configuration info
 */
export async function GET() {
  const health = await sarvamCallingService.checkHealth();

  return NextResponse.json({
    agent_name: 'Sarvam AI Outbound Voice Agent',
    provider: 'Sarvam AI (apps.sarvam.ai)',
    is_configured: health.sarvam.configured,
    mode: health.sarvam.configured ? 'live_telephony' : 'simulation_and_diagnostics',
    app_id: process.env.SARVAM_APP_ID || 'Conversatio-33fcb3f7-d1ed',
    connection_id: health.twilio.connectionId,
    agent_phone_number: health.twilio.callerId,
    sarvam_reachable: health.sarvam.reachable
  });
}
