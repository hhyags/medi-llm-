import { NextResponse } from 'next/server';
import { sarvamCallingService, SarvamWebhookPayload } from '../../../../lib/services/sarvamCallingService';

/**
 * POST /api/calling/webhook
 * Receives real-time call lifecycle events, dispositions, transcripts, and summaries from Sarvam AI
 */
export async function POST(request: Request) {
  try {
    const payload: SarvamWebhookPayload = await request.json();

    console.log('[Sarvam AI Webhook Received]:', JSON.stringify(payload, null, 2));

    const hospitalId = payload.metadata?.hospital_id || 'HOSP_001';

    // Transform payload into MedFlow CallRecord structure
    const transformed = sarvamCallingService.transformWebhookToCallRecord(payload, hospitalId);

    return NextResponse.json({
      success: true,
      message: 'Sarvam AI Webhook processed successfully.',
      call_disposition: payload.call_disposition || 'completed',
      call_summary: payload.call_summary,
      processed_record: transformed
    });
  } catch (error: any) {
    console.error('[API /api/calling/webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing webhook payload.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calling/webhook
 * Webhook health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: '/api/calling/webhook',
    service: 'MedFlow AI CRM — Sarvam Webhook Ingestion Engine',
    timestamp: new Date().toISOString()
  });
}
