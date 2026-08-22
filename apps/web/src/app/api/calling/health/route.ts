import { NextResponse } from 'next/server';
import { sarvamCallingService } from '../../../../lib/services/sarvamCallingService';

/**
 * GET /api/calling/health
 * Server-side diagnostic health check for calling services (Sarvam, Twilio, DB)
 */
export async function GET() {
  try {
    const health = await sarvamCallingService.checkHealth();

    return NextResponse.json({
      success: health.success,
      timestamp: new Date().toISOString(),
      sarvam: health.sarvam.reachable ? 'connected' : (health.sarvam.configured ? 'configured' : 'unconfigured'),
      agent: 'configured',
      agentVersion: 1,
      connection: health.twilio.configured ? 'configured' : 'missing',
      agentPhoneNumber: 'configured',
      callerId: 'configured',
      outboundReady: Boolean(health.sarvam.configured && health.twilio.configured),
      details: {
        sarvam_status: health.sarvam.details,
        connection_id: health.twilio.connectionId,
        agent_phone_number: health.twilio.callerId,
        caller_id: health.twilio.callerId,
        database: health.database.connected ? 'connected' : 'disconnected',
        sarvam_webhook: '/api/calling/webhook/sarvam',
        twilio_webhook: '/api/calling/webhook/twilio'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DIAGNOSTIC_FAILURE',
          message: error?.message || 'Failed to complete calling health diagnostics.'
        }
      },
      { status: 500 }
    );
  }
}
