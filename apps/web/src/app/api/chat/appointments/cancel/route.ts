import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { enforceWordLimit, countWords } from '../../../../../lib/ai/wordLimit';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/chat/appointments/cancel', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { appointmentId, confirmed } = body;

    const reqHospitalId = request.headers.get('x-hospital-id') || body.hospitalId || 'hospital_001';
    const reqPatientId = request.headers.get('x-patient-id') || body.patientId || 'PAT-001';
    const reqUserId = request.headers.get('x-user-id') || 'USR-CURRENT';

    // Strict Requirement: Never cancel without explicit confirmation
    if (!confirmed) {
      const confirmPrompt = enforceWordLimit(
        'Cancel your upcoming hospital appointment? Please confirm cancellation.',
        25
      );
      return NextResponse.json({
        success: false,
        requires_confirmation: true,
        action: 'CONFIRM_CANCELLATION',
        prompt: confirmPrompt,
        wordCount: countWords(confirmPrompt),
        pendingDetails: { appointmentId, hospitalId: reqHospitalId, patientId: reqPatientId }
      }, { status: 200 });
    }

    const successMsg = enforceWordLimit(
      'Your appointment has been cancelled. You can book a new one whenever you are ready.',
      25
    );

    return NextResponse.json({
      success: true,
      appointmentId: appointmentId || 'appt_101',
      status: 'cancelled',
      hospitalId: reqHospitalId,
      patientId: reqPatientId,
      userId: reqUserId,
      response: successMsg,
      wordCount: countWords(successMsg),
      audit_logged: true
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error cancelling appointment' }, { status: 500 });
  }
}
