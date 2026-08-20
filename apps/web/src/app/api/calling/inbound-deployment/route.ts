import { NextResponse } from 'next/server';
import { sarvamCallingService, SARVAM_DEFAULTS } from '../../../../lib/services/sarvamCallingService';
import { checkRateLimit } from '../../../../lib/rateLimit';

/**
 * POST /api/calling/inbound-deployment
 * Deploys an Inbound Phone Line via Sarvam AI App Authoring API
 */
export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/calling/inbound-deployment', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Inbound deployment rate limit exceeded.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      description,
      phoneNumbers,
      startTime,
      endTime,
      allowedDays,
      timezone,
      appId,
      connectionId
    } = body;

    // Build the inbound deployment payload matching Sarvam App Authoring API spec
    const payload = sarvamCallingService.buildInboundDeploymentPayload({
      name: name || 'My inbound line',
      description: description || 'Inbound support line',
      phoneNumbers: phoneNumbers || [SARVAM_DEFAULTS.AGENT_PHONE_NUMBER],
      startTime: startTime || SARVAM_DEFAULTS.INBOUND_START_TIME,
      endTime: endTime || SARVAM_DEFAULTS.INBOUND_END_TIME,
      allowedDays: allowedDays || SARVAM_DEFAULTS.INBOUND_ALLOWED_DAYS,
      timezone: timezone || SARVAM_DEFAULTS.INBOUND_TIMEZONE,
      appId: appId || SARVAM_DEFAULTS.APP_ID,
      connectionId: connectionId || SARVAM_DEFAULTS.CONNECTION_ID
    });

    // Send deployment request to Sarvam API
    const result = await sarvamCallingService.deployInboundLine(payload);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('[API /api/calling/inbound-deployment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while deploying Sarvam inbound line.'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calling/inbound-deployment
 * Returns current Inbound configuration and active schedule
 */
export async function GET() {
  const isConfigured = Boolean(process.env.SARVAM_API_KEY && process.env.SARVAM_API_KEY !== '<your-api-key>');

  return NextResponse.json({
    service: 'Sarvam AI Inbound Line Deployment',
    is_configured: isConfigured,
    deployment_spec: {
      name: 'My inbound line',
      description: 'Inbound support line',
      app_id: process.env.SARVAM_APP_ID || SARVAM_DEFAULTS.APP_ID,
      app_version: SARVAM_DEFAULTS.APP_VERSION,
      connection_configs: [
        {
          connection_id: process.env.SARVAM_CONNECTION_ID || SARVAM_DEFAULTS.CONNECTION_ID,
          phone_numbers: [process.env.SARVAM_AGENT_PHONE_NUMBER || SARVAM_DEFAULTS.AGENT_PHONE_NUMBER]
        }
      ],
      inbound_config: {
        start_time: SARVAM_DEFAULTS.INBOUND_START_TIME,
        end_time: SARVAM_DEFAULTS.INBOUND_END_TIME,
        allowed_days: SARVAM_DEFAULTS.INBOUND_ALLOWED_DAYS,
        timezone: SARVAM_DEFAULTS.INBOUND_TIMEZONE
      }
    }
  });
}
