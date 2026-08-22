import { NextResponse } from 'next/server';

/**
 * POST /api/calling/webhook/twilio
 * Ingests Twilio Call Status events (initiated, ringing, in-progress, completed, failed, busy, no-answer)
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await request.json().catch(() => ({}));
    }

    const callSid = body.CallSid || body.call_sid;
    const callStatus = body.CallStatus || body.call_status || 'unknown';
    const errorCode = body.ErrorCode || body.error_code;
    const errorMessage = body.ErrorMessage || body.error_message;

    console.log(`[Twilio Webhook Received] CallSid: ${callSid}, Status: ${callStatus}, ErrorCode: ${errorCode}`);

    return NextResponse.json({
      success: true,
      message: 'Twilio call status callback acknowledged.',
      call_sid: callSid,
      call_status: callStatus,
      error_code: errorCode,
      error_message: errorMessage
    });
  } catch (error: any) {
    console.error('[API /api/calling/webhook/twilio] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error processing Twilio webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/calling/webhook/twilio',
    service: 'MedVoice AI — Twilio Status Callback Endpoint'
  });
}
