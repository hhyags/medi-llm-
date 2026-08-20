import { NextResponse } from 'next/server';
import { sarvamCallingService, SarvamWebhookPayload } from '../../../../lib/services/sarvamCallingService';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { storageService } from '../../../../lib/services/storage';

// In-memory deduplication cache for idempotent webhook handling
const processedWebhooks = new Set<string>();

/**
 * POST /api/calling/webhook
 * Receives real-time call lifecycle events, dispositions, transcripts, and summaries from Sarvam AI
 */
export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/calling/webhook', { maxRequests: 120, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Webhook ingestion rate limit exceeded.' },
        { status: 429 }
      );
    }

    const payload: SarvamWebhookPayload = await request.json();

    console.log('[Sarvam AI Webhook Received]:', JSON.stringify(payload, null, 2));

    const callId = payload.call_id || payload.outbound_id || `CALL-${Date.now()}`;
    const disposition = payload.call_disposition || 'completed';
    const dedupeKey = `${callId}:${disposition}:${payload.status || ''}`;

    // Idempotency Protection: If duplicate webhook arrives, skip CRM duplicate update
    if (processedWebhooks.has(dedupeKey)) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        message: 'Duplicate webhook event received and processed idempotently.',
        call_disposition: disposition,
        call_summary: payload.call_summary
      });
    }

    processedWebhooks.add(dedupeKey);
    if (processedWebhooks.size > 1000) {
      const first = processedWebhooks.values().next().value;
      if (first) processedWebhooks.delete(first);
    }

    const hospitalId = payload.metadata?.hospital_id || 'hospital_001';

    // Transform payload into MedFlow CallRecord structure
    const transformed = sarvamCallingService.transformWebhookToCallRecord(payload, hospitalId);

    // Apply CRM updates if appointmentId is present
    const appointmentId = payload.metadata?.appointment_id;
    if (appointmentId) {
      const apt = storageService.getAppointmentById(hospitalId, appointmentId);
      if (apt) {
        if (transformed.suggestedAppointmentStatus === 'confirmed') {
          storageService.updateAppointmentStatus(hospitalId, apt.id, 'confirmed');
          storageService.updateAppointmentAICallStatus(hospitalId, apt.id, 'completed', callId);
        } else if (transformed.suggestedAppointmentStatus === 'cancelled') {
          storageService.updateAppointmentStatus(
            hospitalId,
            apt.id,
            'cancelled',
            payload.cancellation_reason || payload.call_summary || 'Cancelled via AI Voice Calling Agent'
          );
          storageService.updateAppointmentAICallStatus(hospitalId, apt.id, 'completed', callId);
        } else if (transformed.callRecord.outcome === 'rescheduled') {
          const newSlot = payload.confirmed_slot || payload.agent_variables?.confirmed_slot;
          if (newSlot) {
            const parts = newSlot.trim().split(/\s+/);
            const datePart = parts[0] || apt.date;
            const timePart = parts.slice(1).join(' ') || apt.time;
            storageService.rescheduleAppointment(hospitalId, apt.id, datePart, timePart);
          }
          storageService.updateAppointmentAICallStatus(hospitalId, apt.id, 'completed', callId);
        } else if (transformed.callRecord.outcome === 'unanswered' || transformed.callRecord.outcome === 'no_answer') {
          storageService.updateAppointmentAICallStatus(hospitalId, apt.id, 'no_answer', callId);
        }
      }
    }

    // Record Call in Storage
    storageService.recordAICall(hospitalId, transformed.callRecord);

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
