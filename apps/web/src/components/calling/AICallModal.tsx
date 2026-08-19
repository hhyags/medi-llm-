'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import { CallDialogueTurn, CallOutcome, CallPurpose } from '../../types/medflow';
import {
  X,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  Bot,
  Activity
} from 'lucide-react';

export default function AICallModal() {
  const {
    isCallModalOpen,
    closeCallModal,
    activeCallAppointment,
    activeCallPatient,
    recordAICall,
    rescheduleAppointment,
    doctors,
    aiCallingSettings
  } = useMedFlow();

  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<CallDialogueTurn[]>([]);
  const [patientInput, setPatientInput] = useState('');
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [callOutcome, setCallOutcome] = useState<CallOutcome | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [callbackReason, setCallbackReason] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const patientName = activeCallPatient?.name || activeCallAppointment?.patientName || 'Rahul Sharma';
  const patientPhone = activeCallPatient?.phone || activeCallAppointment?.patientPhone || '+1 (555) 234-5678';
  const doctorName = activeCallAppointment?.doctorName || 'Dr. Meera Patel, MD';
  const appointmentDate = activeCallAppointment?.date || '2026-08-20';
  const appointmentTime = activeCallAppointment?.time || '10:30 AM';
  const department = activeCallAppointment?.department || 'Cardiology';

  // Speech synthesis helper
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !isVoiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeakingAI(true);
      utterance.onend = () => setIsSpeakingAI(false);
      utterance.onerror = () => setIsSpeakingAI(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeakingAI(false);
    }
  };

  // Start Call lifecycle
  const handleStartCall = () => {
    setCallState('dialing');
    setDuration(0);
    setTranscript([]);
    setCallOutcome(null);
    setAiSummary('');
    setCallbackRequested(false);
    setCallbackReason('');

    // Simulate phone pickup after 2 seconds
    setTimeout(() => {
      setCallState('connected');
      
      const greeting = `Hello ${patientName.split(' ')[0]}, I'm ${aiCallingSettings.agentName.split(' ')[0]} calling from MedFlow Hospital regarding your appointment with ${doctorName} scheduled for ${appointmentDate} at ${appointmentTime}. Would you like to confirm your appointment?`;
      
      const initialTurn: CallDialogueTurn = {
        speaker: 'ai',
        text: greeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        intentDetected: 'greeting_and_confirmation_prompt'
      };

      setTranscript([initialTurn]);
      speakText(greeting);

      // Start call timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }, 2000);
  };

  useEffect(() => {
    if (isCallModalOpen && callState === 'idle') {
      handleStartCall();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isCallModalOpen]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // AI Response Processing Logic
  const processPatientMessage = (userInput: string) => {
    const text = userInput.trim();
    if (!text || callState !== 'connected') return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userTurn: CallDialogueTurn = {
      speaker: 'patient',
      text,
      timestamp: timeStr
    };

    setTranscript((prev) => [...prev, userTurn]);
    setPatientInput('');

    const lower = text.toLowerCase();

    // Intent 1: Medical advice or medication query -> Safety Guardrail
    if (
      lower.includes('medicine') ||
      lower.includes('dosage') ||
      lower.includes('tablet') ||
      lower.includes('pain') ||
      lower.includes('symptom') ||
      lower.includes('dose') ||
      lower.includes('diagnos') ||
      lower.includes('sugar') ||
      lower.includes('bp') ||
      lower.includes('blood pressure')
    ) {
      setTimeout(() => {
        const aiReply = "I am unable to provide clinical advice or adjust medications as I am an automated hospital voice assistant. I have placed an urgent callback request so our clinical care team will call you directly. Your appointment remains confirmed.";
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'safety_guardrail_triggered'
        };
        setTranscript((prev) => [...prev, turn]);
        setCallOutcome('callback_requested');
        setCallbackRequested(true);
        setCallbackReason(`Patient inquired about medical/clinical dosage: "${text}"`);
        setAiSummary(`Patient inquired about medical query/dosage during call. Safety guardrail applied and receptionist callback alert triggered.`);
        speakText(aiReply);
      }, 700);
      return;
    }

    // Intent 2: Human Receptionist Callback Request
    if (
      lower.includes('human') ||
      lower.includes('reception') ||
      lower.includes('speak to someone') ||
      lower.includes('callback') ||
      lower.includes('nurse') ||
      lower.includes('person')
    ) {
      setTimeout(() => {
        const aiReply = "Certainly! I have routed your request to our front-desk reception queue. A hospital representative will call you back shortly. Have a great day!";
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'callback_request'
        };
        setTranscript((prev) => [...prev, turn]);
        setCallOutcome('callback_requested');
        setCallbackRequested(true);
        setCallbackReason('Patient requested to speak directly with a hospital receptionist.');
        setAiSummary('Patient requested a human callback. Receptionist alert queued.');
        speakText(aiReply);
      }, 700);
      return;
    }

    // Intent 3: Rescheduling Request
    if (
      lower.includes('reschedule') ||
      lower.includes('another time') ||
      lower.includes('different day') ||
      lower.includes('cannot make it') ||
      lower.includes('can i come') ||
      lower.includes('change time') ||
      lower.includes('later')
    ) {
      setTimeout(() => {
        const aiReply = `I can help with that. ${doctorName} has an open slot tomorrow at 2:00 PM or Friday at 11:30 AM. Would either of those times work for you?`;
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'suggest_reschedule_slots'
        };
        setTranscript((prev) => [...prev, turn]);
        speakText(aiReply);
      }, 700);
      return;
    }

    // Intent 3b: Accept Reschedule Slot
    if (
      lower.includes('2') ||
      lower.includes('2:00') ||
      lower.includes('friday') ||
      lower.includes('11:30') ||
      lower.includes('works') ||
      lower.includes('book that')
    ) {
      setTimeout(() => {
        const aiReply = `Perfect! I have updated your appointment to tomorrow at 2:00 PM with ${doctorName}. You will receive an SMS confirmation with clinic instructions. Thank you and take care!`;
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'reschedule_success'
        };
        setTranscript((prev) => [...prev, turn]);
        setCallOutcome('rescheduled');
        setAiSummary(`Patient rescheduled appointment with ${doctorName} to 2:00 PM.`);
        
        if (activeCallAppointment) {
          rescheduleAppointment(activeCallAppointment.id, activeCallAppointment.date, '14:00');
        }

        speakText(aiReply);
      }, 700);
      return;
    }

    // Intent 4: Cancellation Request
    if (
      lower.includes('cancel') ||
      lower.includes('no') ||
      lower.includes("can't come") ||
      lower.includes("cannot come") ||
      lower.includes("not coming")
    ) {
      setTimeout(() => {
        const aiReply = `I understand. I have cancelled your appointment for ${appointmentDate} with ${doctorName}. Please call us whenever you would like to reschedule. Wishing you good health!`;
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'cancellation_confirmed'
        };
        setTranscript((prev) => [...prev, turn]);
        setCallOutcome('cancelled');
        setAiSummary(`Patient cancelled the appointment for ${appointmentDate} at ${appointmentTime}.`);
        speakText(aiReply);
      }, 700);
      return;
    }

    // Intent 5: Standard Confirmation
    if (
      lower.includes('yes') ||
      lower.includes('confirm') ||
      lower.includes('sure') ||
      lower.includes('will be there') ||
      lower.includes('ok') ||
      lower.includes('fine')
    ) {
      setTimeout(() => {
        const aiReply = `Wonderful! Your appointment is confirmed for ${appointmentDate} at ${appointmentTime} with ${doctorName}. Please arrive 10 minutes early at reception. Have a great day!`;
        const turn: CallDialogueTurn = {
          speaker: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          intentDetected: 'confirmation_success'
        };
        setTranscript((prev) => [...prev, turn]);
        setCallOutcome('confirmed');
        setAiSummary(`Patient confirmed attendance for appointment on ${appointmentDate} at ${appointmentTime}.`);
        speakText(aiReply);
      }, 700);
      return;
    }

    // Default polite acknowledgement
    setTimeout(() => {
      const aiReply = `Thank you for the update. Is there anything else regarding your appointment with ${doctorName} I can help you with?`;
      const turn: CallDialogueTurn = {
        speaker: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        intentDetected: 'general_acknowledgement'
      };
      setTranscript((prev) => [...prev, turn]);
      speakText(aiReply);
    }, 700);
  };

  // End and Save Call
  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');

    const finalOutcome = callOutcome || 'confirmed';
    const finalSummary = aiSummary || `Patient conversation completed. Appointment status verified.`;

    recordAICall({
      patientId: activeCallPatient?.id || activeCallAppointment?.patientId || 'PAT-001',
      patientName,
      patientPhone,
      appointmentId: activeCallAppointment?.id || activeCallAppointment?.appointmentId || 'APT-1001',
      doctorId: activeCallAppointment?.doctorId || 'DOC-001',
      doctorName,
      appointmentDetails: {
        date: appointmentDate,
        time: appointmentTime,
        doctor: doctorName,
        department
      },
      purpose: 'appointment_confirmation',
      status: 'completed',
      outcome: finalOutcome,
      durationSeconds: duration > 0 ? duration : 45,
      startedAt: new Date(Date.now() - (duration || 45) * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      summary: finalSummary,
      transcript,
      callbackRequested,
      callbackReason: callbackReason || undefined,
      escalationRequired: callbackRequested,
      escalationType: callbackRequested ? 'human_agent_requested' : undefined,
      resolvedByReceptionist: false
    });
  };

  if (!isCallModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-800 text-white overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Calling Bar */}
        <div className="p-4 px-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">AI Voice Calling Console</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {aiCallingSettings.agentName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calling: <strong className="text-slate-200">{patientName}</strong> ({patientPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isVoiceEnabled
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isVoiceEnabled ? 'Voice Synthesis Active' : 'Voice Synthesis Muted'}
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">{isVoiceEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            <button
              onClick={closeCallModal}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Call Status & Waveform */}
        <div className="p-6 bg-gradient-to-b from-slate-950/60 to-slate-900 border-b border-slate-800 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 mb-4">
            {callState === 'dialing' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Dialing patient phone...</span>
              </>
            )}
            {callState === 'connected' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connected • {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
              </>
            )}
            {callState === 'ended' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Completed & Logged to CRM</span>
              </>
            )}
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">{patientName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Appointment: {appointmentDate} at {appointmentTime} with {doctorName} ({department})
          </p>

          {/* Audio Waveform Animation when AI or Patient Speaks */}
          <div className="h-12 flex items-center justify-center gap-1.5 my-3">
            {callState === 'connected' ? (
              <>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </>
            ) : (
              <div className="text-xs text-slate-600 font-mono tracking-widest">--- VOICE CHANNEL READY ---</div>
            )}
          </div>

          {isSpeakingAI && (
            <div className="text-xs text-sky-400 font-semibold flex items-center justify-center gap-1.5 animate-pulse">
              <Activity className="w-3.5 h-3.5" />
              <span>{aiCallingSettings.agentName} is speaking...</span>
            </div>
          )}
        </div>

        {/* Live Conversation Transcript Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-900/90 max-h-[300px]">
          {transcript.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">
              Connecting voice stream and initializing clinical prompt dialogue...
            </div>
          ) : (
            transcript.map((turn, index) => {
              const isAI = turn.speaker === 'ai';
              return (
                <div
                  key={index}
                  className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                >
                  {isAI && (
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAI
                        ? 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-xs'
                        : 'bg-sky-600 text-white rounded-tr-xs shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[10px] uppercase opacity-75">
                        {isAI ? aiCallingSettings.agentName.split(' ')[0] : patientName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] opacity-60 font-mono">{turn.timestamp}</span>
                    </div>
                    <div>{turn.text}</div>
                    {turn.intentDetected && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-black/20 text-sky-300">
                        intent: {turn.intentDetected}
                      </span>
                    )}
                  </div>

                  {!isAI && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Interactive Response Simulation Chips */}
        {callState === 'connected' && (
          <div className="p-3 bg-slate-950/90 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              ⚡ Simulated Patient Quick Responses:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => processPatientMessage("Yes, I confirm my appointment. I'll be there tomorrow.")}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-xs font-semibold transition-all"
              >
                ✅ "Yes, Confirm Appointment"
              </button>
              <button
                onClick={() => processPatientMessage("I have a conflict. Can I reschedule to 2:00 PM instead?")}
                className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/80 text-xs font-semibold transition-all"
              >
                🔄 "Reschedule to 2:00 PM"
              </button>
              <button
                onClick={() => processPatientMessage("I need to cancel my appointment completely.")}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-semibold transition-all"
              >
                ❌ "Cancel Appointment"
              </button>
              <button
                onClick={() => processPatientMessage("Can I speak to the hospital receptionist directly?")}
                className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-xs font-semibold transition-all"
              >
                👩‍💼 "Request Reception Callback"
              </button>
              <button
                onClick={() => processPatientMessage("My blood pressure was 150/95. Should I take an extra dose of Telmisartan?")}
                className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-xs font-semibold transition-all"
              >
                ⚠️ "Ask Medical Dosage (Test Safety Guardrail)"
              </button>
            </div>
          </div>
        )}

        {/* Input & Call Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
          
          {callState === 'connected' ? (
            <>
              <input
                type="text"
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && patientInput.trim()) {
                    processPatientMessage(patientInput);
                  }
                }}
                placeholder="Type patient response (or click quick options above)..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
              />

              <button
                onClick={() => processPatientMessage(patientInput)}
                disabled={!patientInput.trim()}
                className="p-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors"
                title="Send Speech Input"
              >
                <Send className="w-4 h-4" />
              </button>

              <button
                onClick={handleEndCall}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/30"
              >
                <PhoneOff className="w-4 h-4" />
                End Call
              </button>
            </>
          ) : callState === 'ended' ? (
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Call results & transcript successfully saved to patient profile and records.
              </div>
              <button
                onClick={closeCallModal}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold"
              >
                Close Console
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center text-xs text-slate-400">
              Connecting voice carrier...
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
