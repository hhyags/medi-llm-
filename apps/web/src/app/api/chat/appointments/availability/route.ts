import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../../lib/rateLimit';
import { enforceWordLimit, countWords } from '../../../../../lib/ai/wordLimit';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/chat/appointments/availability', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { department, doctor_id, date } = body;
    const reqHospitalId = request.headers.get('x-hospital-id') || body.hospital_id || 'hospital_001';

    const doctors = reqHospitalId === 'hospital_001'
      ? [
          { id: 'doc_001', name: 'Dr. Meera Patel', department: 'Cardiology', slots: ['09:30 AM', '11:00 AM', '02:30 PM'] },
          { id: 'doc_002', name: 'Dr. Arjun Verma', department: 'Dermatology', slots: ['10:00 AM', '01:30 PM', '04:00 PM'] },
          { id: 'doc_003', name: 'Dr. Priya Sharma', department: 'General Medicine', slots: ['09:00 AM', '10:30 AM', '03:00 PM'] }
        ]
      : [
          { id: 'doc_004', name: 'Dr. David Vance', department: 'Cardiology', slots: ['10:00 AM', '02:00 PM', '04:30 PM'] },
          { id: 'doc_005', name: 'Dr. Sarah Connor', department: 'Orthopedics', slots: ['11:30 AM', '03:00 PM'] }
        ];

    let filtered = doctors;
    if (department) {
      filtered = filtered.filter(d => d.department.toLowerCase().includes(department.toLowerCase()));
      if (filtered.length === 0) filtered = doctors;
    }
    if (doctor_id) {
      filtered = filtered.filter(d => d.id === doctor_id);
    }

    const doctor = filtered[0] || doctors[0];
    const availableSlots = doctor.slots;
    const targetDate = date || 'Tomorrow';

    const message = enforceWordLimit(
      `Available with ${doctor.name} on ${targetDate}: ${availableSlots.join(', ')}. Please select a slot to confirm.`,
      25
    );

    return NextResponse.json({
      success: true,
      hospitalId: reqHospitalId,
      doctor: { id: doctor.id, name: doctor.name, department: doctor.department },
      date: targetDate,
      availableSlots,
      message,
      wordCount: countWords(message)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error fetching availability' }, { status: 500 });
  }
}
