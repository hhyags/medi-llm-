import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rateLimit';
import { patientAssistantService } from '../../../lib/ai/patientAssistantService';
import { enforceWordLimit, countWords } from '../../../lib/ai/wordLimit';

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
          intent: 'UNKNOWN',
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
    const { message, hospital_id, session_id } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      const emptyMsg = enforceWordLimit('Please provide a valid question.', 25);
      return NextResponse.json(
        { response: emptyMsg, wordCount: countWords(emptyMsg), intent: 'UNKNOWN' },
        { status: 400 }
      );
    }

    // 2. Resolve Authenticated Tenant & User Context
    // Extract headers (e.g. from session or auth middleware)
    const reqHospitalId = request.headers.get('x-hospital-id') || hospital_id || 'hospital_001';
    const reqUserId = request.headers.get('x-user-id') || 'USR_CURRENT';
    const reqUserRole = request.headers.get('x-user-role') || 'patient';
    const reqPatientId = request.headers.get('x-patient-id') || 'PAT-001';

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

    // 4. Try AI/FastAPI Backend if reachable, otherwise use server-side Patient Assistant Engine
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
    let generatedData = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const apiRes = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: session_id || 'web_session',
          hospital_id: reqHospitalId
        }),
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const rawJson = await apiRes.json();
        if (rawJson && rawJson.response) {
          const processedResponse = enforceWordLimit(rawJson.response, 25);
          generatedData = {
            response: processedResponse,
            intent: rawJson.action_taken || patientAssistantService.detectIntent(message),
            wordCount: countWords(processedResponse),
            hospitalId: reqHospitalId,
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch {
      // Backend not running or timeout; seamlessly use server-side Patient Assistant Service
    }

    if (!generatedData) {
      generatedData = patientAssistantService.generateResponse(message, context, patientAppointment);
    }

    // 5. Final Strict 25-Word Verification
    const finalCleanResponse = enforceWordLimit(generatedData.response, 25);
    const finalWordCount = countWords(finalCleanResponse);

    return NextResponse.json(
      {
        response: finalCleanResponse,
        intent: generatedData.intent,
        wordCount: finalWordCount,
        action_required: (generatedData as any).action_required,
        action_label: (generatedData as any).action_label,
        hospitalId: reqHospitalId,
        timestamp: new Date().toISOString()
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
        intent: 'UNKNOWN',
        action_taken: 'SERVICE_ERROR'
      },
      { status: 500 }
    );
  }
}