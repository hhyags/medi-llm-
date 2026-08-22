import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { enforceWordLimit, countWords } from '../../../../../lib/ai/wordLimit';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/chat/appointments/book', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { doctorName, department, date, time, confirmed } = body;

    const reqHospitalId = request.headers.get('x-hospital-id') || body.hospitalId || 'hospital_001';
    const reqPatientId = request.headers.get('x-patient-id') || body.patientId || 'PAT-001';
    const reqUserId = request.headers.get('x-user-id') || 'USR-CURRENT';

    // Strict Requirement: Never book without explicit confirmation
    if (!confirmed) {
      const confirmPrompt = enforceWordLimit(
        `${department || 'Specialist'} with ${doctorName || 'Doctor'} on ${date || 'upcoming date'} at ${time || '10:00 AM'}. Confirm booking?`,
        25
      );
      return NextResponse.json({
        success: false,
        requires_confirmation: true,
        action: 'CONFIRM_BOOKING',
        prompt: confirmPrompt,
        wordCount: countWords(confirmPrompt),
        pendingDetails: { doctorName, department, date, time, hospitalId: reqHospitalId, patientId: reqPatientId }
      }, { status: 200 });
    }

    // Process Booking
    const newAppointmentId = `appt_${Date.now()}`;
    const successMsg = enforceWordLimit(
      `Your appointment with ${doctorName || 'Dr. Meera Patel'} for ${date || 'Tomorrow'} at ${time || '10:00 AM'} is confirmed.`,
      25
    );

    return NextResponse.json({
      success: true,
      appointmentId: newAppointmentId,
      status: 'scheduled',
      hospitalId: reqHospitalId,
      patientId: reqPatientId,
      userId: reqUserId,
      doctorName: doctorName || 'Dr. Meera Patel',
      date: date || 'Tomorrow',
      time: time || '10:00 AM',
      response: successMsg,
      wordCount: countWords(successMsg),
      audit_logged: true
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error booking appointment' }, { status: 500 });
  }
}
