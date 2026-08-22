import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { patientAssistantService } from '../../../lib/ai/patientAssistantService';
import { geminiService } from '../../../lib/ai/geminiClient';
import { enforceWordLimit, countWords } from '../../../lib/ai/wordLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const rateLimit = checkRateLimit(request, '/api/chat', { maxRequests: 30, windowMs: 60000 });
    if (!rateLimit.allowed) {
      const rateLimitMsg = enforceWordLimit('Rate limit exceeded. Please wait a moment before sending more messages.', 25);
      return NextResponse.json(
        {
          response: rateLimitMsg,
          wordCount: countWords(rateLimitMsg),
          intent: 'UNSUPPORTED',
          action_taken: 'RATE_LIMITED'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0'
          }
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { message, hospital_id, session_id, history } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      const emptyMsg = enforceWordLimit('Please provide a valid question.', 25);
      return NextResponse.json(
        { response: emptyMsg, wordCount: countWords(emptyMsg), intent: 'UNSUPPORTED' },
        { status: 400 }
      );
    }

    // 2. Resolve Authenticated Tenant & User Context
    const reqHospitalId = request.headers.get('x-hospital-id') || hospital_id || 'hospital_001';
    const reqUserId = request.headers.get('x-user-id') || 'USR_CURRENT';
    const reqUserRole = request.headers.get('x-user-role') || 'patient';
    const reqPatientId = request.headers.get('x-patient-id') || 'PAT-001';

    const hospitalName = reqHospitalId === 'hospital_002' ? 'St. Jude Medical Center' : 'City Memorial Hospital';

    const context = {
      uid: reqUserId,
      role: reqUserRole,
      hospitalId: reqHospitalId,
      patientId: reqPatientId
    };

    // 3. Check for Patient-Specific Appointment Data
    let patientAppointment: { doctorName: string; date: string; time: string } | null = null;
    const cleanMsg = message.toLowerCase();
    if (cleanMsg.includes('my appointment') || cleanMsg.includes('when is my') || cleanMsg.includes('my visit')) {
      if (reqHospitalId === 'hospital_001') {
        patientAppointment = {
          doctorName: 'Dr. Priya Sharma',
          date: 'Tomorrow',
          time: '10:30 AM'
        };
      } else {
        patientAppointment = {
          doctorName: 'Dr. David Vance',
          date: 'Friday',
          time: '2:00 PM'
        };
      }
    }

    // 4. Intent Classification and Deterministic Safety Checks
    const detectedIntent = patientAssistantService.detectIntent(message);

    // If deterministic safety intent (Prompt injection, Emergency, Medical Advice Refusal, Human Escalation, Actions)
    let generatedData = null;
    if (
      detectedIntent === 'PROMPT_INJECTION' ||
      detectedIntent === 'EMERGENCY' ||
      detectedIntent === 'MEDICAL_ADVICE' ||
      detectedIntent === 'HUMAN_ESCALATION' ||
      detectedIntent === 'APPOINTMENT_ACTION' ||
      detectedIntent === 'PATIENT_DATA'
    ) {
      generatedData = patientAssistantService.generateResponse(message, context, patientAppointment);
    } else {
      // 5. Use Gemini AI for General Medical Q&A, Medical Education, and Hospital Info
      try {
        const geminiRes = await geminiService.generateChatResponse(
          message,
          history || [],
          {
            hospitalName,
            patientName: reqUserRole === 'patient' ? 'Patient' : undefined,
            upcomingAppointment: patientAppointment ? `${patientAppointment.doctorName} on ${patientAppointment.date} at ${patientAppointment.time}` : undefined
          }
        );

        if (geminiRes && geminiRes.response) {
          const processedResponse = enforceWordLimit(geminiRes.response, 25);
          generatedData = {
            response: processedResponse,
            intent: detectedIntent,
            wordCount: countWords(processedResponse),
            hospitalId: reqHospitalId,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Gemini inference note:', err);
      }

      if (!generatedData) {
        generatedData = patientAssistantService.generateResponse(message, context, patientAppointment);
      }
    }

    // 6. Strict 25-Word Server-Side Pipeline Enforcement
    const finalCleanResponse = enforceWordLimit(generatedData.response, 25);
    const finalWordCount = countWords(finalCleanResponse);

    return NextResponse.json(
      {
        response: finalCleanResponse,
        intent: generatedData.intent || detectedIntent,
        wordCount: finalWordCount,
        action_required: (generatedData as any).action_required,
        action_label: (generatedData as any).action_label,
        hospitalId: reqHospitalId,
        timestamp: new Date().toISOString(),
        model_used: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining)
        }
      }
    );
  } catch (error: any) {
    console.error('Chat API error:', error);
    const fallbackMsg = enforceWordLimit('Sorry, the assistant is temporarily unavailable. Please contact hospital reception.', 25);
    return NextResponse.json(
      {
        response: fallbackMsg,
        wordCount: countWords(fallbackMsg),
        intent: 'UNSUPPORTED',
        action_taken: 'SERVICE_ERROR'
      },
      { status: 500 }
    );
  }
}