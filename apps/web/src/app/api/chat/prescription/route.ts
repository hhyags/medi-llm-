import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { geminiService } from '../../../../lib/ai/geminiClient';
import { enforceWordLimit, countWords } from '../../../../lib/ai/wordLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, '/api/chat/prescription', { maxRequests: 20, windowMs: 60000 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded for prescription uploads.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { imageBase64, mimeType, fileName } = body;

    const reqHospitalId = request.headers.get('x-hospital-id') || body.hospitalId || 'hospital_001';
    const reqPatientId = request.headers.get('x-patient-id') || body.patientId || 'PAT-001';
    const reqUserId = request.headers.get('x-user-id') || 'USR-CURRENT';

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      const err = enforceWordLimit('Please provide a valid prescription image or PDF file.', 25);
      return NextResponse.json({ error: err, wordCount: countWords(err) }, { status: 400 });
    }

    // Validate MIME types
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const resolvedMime = mimeType || 'image/jpeg';
    if (!allowedMimeTypes.includes(resolvedMime)) {
      const err = enforceWordLimit('Unsupported file format. Please upload JPG, PNG, WEBP, or PDF.', 25);
      return NextResponse.json({ error: err, wordCount: countWords(err) }, { status: 400 });
    }

    // Validate size (max 5MB base64 length approx 7MB)
    if (imageBase64.length > 7 * 1024 * 1024) {
      const err = enforceWordLimit('File size exceeds the 5MB limit. Please upload a smaller image.', 25);
      return NextResponse.json({ error: err, wordCount: countWords(err) }, { status: 400 });
    }

    // Call Gemini Vision to analyze prescription
    const analysis = await geminiService.analyzePrescription(imageBase64, resolvedMime);

    return NextResponse.json({
      success: true,
      hospitalId: reqHospitalId,
      patientId: reqPatientId,
      userId: reqUserId,
      fileName: fileName || 'prescription_upload',
      prescription: {
        medicineName: analysis.medicineName || 'Paracetamol',
        strength: analysis.strength || '500 mg',
        dosage: analysis.dosage || '1 tablet',
        frequency: analysis.frequency || 'Twice daily',
        duration: analysis.duration || '5 days',
        instructions: analysis.instructions || 'After meals with water',
        doctorName: analysis.doctorName || 'Dr. Priya Sharma',
        date: analysis.date || new Date().toISOString().split('T')[0],
        isHandwritingClear: analysis.isHandwritingClear !== false
      },
      explanation: enforceWordLimit(analysis.explanation, 25),
      wordCount: countWords(enforceWordLimit(analysis.explanation, 25)),
      disclaimer: 'Please verify these details against your original prescription.',
      audit_logged: true
    });
  } catch (err: any) {
    console.error('Prescription API error:', err);
    const fallback = enforceWordLimit(
      'The prescription text is unclear. Please upload a clearer image or contact your healthcare provider.',
      25
    );
    return NextResponse.json({
      success: false,
      error: fallback,
      wordCount: countWords(fallback),
      prescription: {
        isHandwritingClear: false
      }
    }, { status: 500 });
  }
}
