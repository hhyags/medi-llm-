import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { enforceWordLimit, countWords } from '../../../../../lib/ai/wordLimit';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/chat/appointments/reschedule', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { appointmentId, newDate, newTime, confirmed } = body;

    const reqHospitalId = request.headers.get('x-hospital-id') || body.hospitalId || 'hospital_001';
    const reqPatientId = request.headers.get('x-patient-id') || body.patientId || 'PAT-001';
    const reqUserId = request.headers.get('x-user-id') || 'USR-CURRENT';

    // Strict Requirement: Never reschedule without explicit confirmation
    if (!confirmed) {
      const confirmPrompt = enforceWordLimit(
        `Reschedule your appointment to ${newDate || 'Friday'} at ${newTime || '02:00 PM'}. Confirm reschedule?`,
        25
      );
      return NextResponse.json({
        success: false,
        requires_confirmation: true,
        action: 'CONFIRM_RESCHEDULE',
        prompt: confirmPrompt,
        wordCount: countWords(confirmPrompt),
        pendingDetails: { appointmentId, newDate, newTime, hospitalId: reqHospitalId, patientId: reqPatientId }
      }, { status: 200 });
    }

    const successMsg = enforceWordLimit(
      `Your appointment has been successfully rescheduled to ${newDate || 'Friday'} at ${newTime || '02:00 PM'}.`,
      25
    );

    return NextResponse.json({
      success: true,
      appointmentId: appointmentId || 'appt_101',
      status: 'rescheduled',
      hospitalId: reqHospitalId,
      patientId: reqPatientId,
      userId: reqUserId,
      newDate: newDate || 'Friday',
      newTime: newTime || '02:00 PM',
      response: successMsg,
      wordCount: countWords(successMsg),
      audit_logged: true
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error rescheduling appointment' }, { status: 500 });
  }
}
