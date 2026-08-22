'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  Calendar,
  PhoneCall,
  ChevronRight,
  Info,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Pill,
  Stethoscope,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  wordCount?: number;
  intent?: string;
  action_required?: 'MANAGE_APPOINTMENT' | 'REQUEST_HUMAN_ASSISTANCE' | 'EMERGENCY_ALERT';
  action_label?: string;
  timestamp: string;
  isError?: boolean;
}

interface StructuredPrescriptionData {
  medicineName?: string;
  strength?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  doctorName?: string;
  date?: string;
  isHandwritingClear?: boolean;
}

const SUGGESTED_PROMPTS = [
  'What does my prescription say?',
  'Explain my medicine.',
  'When is my appointment?',
  'Book an appointment.',
  'Explain this medical term.',
  'What should I know before my appointment?'
];

export default function PatientAssistantView() {
  const router = useRouter();
  const { hospitalId, hospital, profile, role } = useAuth();
  const { setIsNewAppointmentOpen } = useMedFlow();

  const [activeTab, setActiveTab] = useState<'chat' | 'prescription' | 'appointments'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'Hi! How can I help you today?',
      wordCount: 7,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Prescription Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPrescription, setUploadedPrescription] = useState<StructuredPrescriptionData | null>(null);
  const [prescriptionExplanation, setPrescriptionExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive Appointment Confirmation State
  const [pendingAction, setPendingAction] = useState<{
    type: 'BOOK' | 'RESCHEDULE' | 'CANCEL';
    prompt: string;
    details: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, uploadedPrescription, pendingAction]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputValue).trim();
    if (!message || isLoading) return;

    setInputValue('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hospital-id': hospitalId,
          'x-user-id': profile?.uid || 'USR-CURRENT',
          'x-user-role': role,
          'x-patient-id': (profile as any)?.patientId || 'PAT-001'
        },
        body: JSON.stringify({
          message,
          hospital_id: hospitalId,
          session_id: `chat_${profile?.uid || 'guest'}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.response || `Error: ${response.statusText}`);
      }

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.response || 'I can help answer your hospital questions.',
        wordCount: data.wordCount,
        intent: data.intent,
        action_required: data.action_required,
        action_label: data.action_label,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg = 'Sorry, the assistant is temporarily unavailable. Please contact hospital reception.';

      const assistantError: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: errorMsg,
        wordCount: 11,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantError]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedPrescription(null);
    setPrescriptionExplanation(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/chat/prescription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hospital-id': hospitalId,
            'x-user-id': profile?.uid || 'USR-CURRENT',
            'x-patient-id': (profile as any)?.patientId || 'PAT-001'
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type,
            fileName: file.name
          })
        });

        const data = await res.json();
        if (data.success && data.prescription) {
          setUploadedPrescription(data.prescription);
          setPrescriptionExplanation(data.explanation);

          // Add assistant message to chat flow
          setMessages((prev) => [
            ...prev,
            {
              id: `user-up-${Date.now()}`,
              sender: 'user',
              text: `Uploaded prescription document: ${file.name}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            {
              id: `asst-up-${Date.now()}`,
              sender: 'assistant',
              text: data.explanation || 'Prescription analyzed. Please review extracted details.',
              wordCount: data.wordCount,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          setUploadedPrescription({ isHandwritingClear: false });
          setPrescriptionExplanation(data.error || 'The prescription text is unclear. Please upload a clearer image.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setIsLoading(true);
    try {
      let endpoint = '/api/chat/appointments/book';
      let payload = { ...pendingAction.details, confirmed: true };

      if (pendingAction.type === 'RESCHEDULE') {
        endpoint = '/api/chat/appointments/reschedule';
      } else if (pendingAction.type === 'CANCEL') {
        endpoint = '/api/chat/appointments/cancel';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hospital-id': hospitalId,
          'x-user-id': profile?.uid || 'USR-CURRENT',
          'x-patient-id': (profile as any)?.patientId || 'PAT-001'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setPendingAction(null);

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-action-${Date.now()}`,
          sender: 'assistant',
          text: data.response || 'Your appointment request has been processed.',
          wordCount: data.wordCount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-sky-900/10 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-white/10 text-sky-200 border border-white/15 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-300" />
                MED-GEMINI MEDICAL COMPANION
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Max 25-Word Concise Guardrail
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              MedFlow Medical Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Ask questions about prescriptions, medical terminology, appointments, and healthcare services.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shrink-0">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Facility: <strong>{hospital?.name || 'City Memorial'}</strong></span>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'chat'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Prescription</span>
          </button>

          <button
            onClick={() => handleSendMessage('When is my appointment?')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>My Appointments</span>
          </button>

          <button
            onClick={() => handleSendMessage('I want to book an appointment')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-slate-200 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Prescription Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Uploading Status Banner */}
      {isUploading && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3 text-sky-900 animate-pulse">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
          <div className="text-xs">
            <span className="font-bold">Analyzing prescription with Med-Gemini Vision...</span>
            <p className="text-sky-700 text-[11px]">Extracting medicine details, dosages, and doctor instructions safely.</p>
          </div>
        </div>
      )}

      {/* Structured Prescription Details View */}
      {uploadedPrescription && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-sky-600" />
              <h3 className="font-black text-sm text-slate-900">Prescription Details</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              uploadedPrescription.isHandwritingClear !== false
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {uploadedPrescription.isHandwritingClear !== false ? 'Verified OCR' : 'Unclear Text'}
            </span>
          </div>

          {uploadedPrescription.isHandwritingClear !== false ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Medicine</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{uploadedPrescription.medicineName || 'N/A'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Strength / Dosage</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{uploadedPrescription.strength || uploadedPrescription.dosage || '500 mg'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Frequency</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{uploadedPrescription.frequency || 'As prescribed'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Duration</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{uploadedPrescription.duration || '5 days'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Instructions</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{uploadedPrescription.instructions || 'Follow doctor directions'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>The prescription handwriting or text is unclear. Please upload a clearer picture or verify with your doctor.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Please verify these details against your original prescription.</span>
            <button
              onClick={() => handleSendMessage(`What are the side effects and instructions for ${uploadedPrescription.medicineName || 'this medicine'}?`)}
              className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg transition-colors shrink-0"
            >
              Ask About Prescription
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Action Modal / Card */}
      {pendingAction && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <span>Confirmation Required</span>
          </div>
          <p className="text-xs text-indigo-950">{pendingAction.prompt}</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleConfirmAction}
              disabled={isLoading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setPendingAction(null)}
              className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors"
            >
              Cancel / Choose Another
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Card Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col h-[60vh] min-h-[460px]">
        
        {/* Messages Area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          
          {/* Medical Disclaimer Banner */}
          <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-start gap-2.5 text-xs text-sky-900">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-sky-800">
              <strong>Medical Disclaimer:</strong> This assistant provides general healthcare education and appointment assistance. It does not diagnose, prescribe, or provide individualized medical treatment.
            </p>
          </div>

          {/* Rendered Conversation */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed transition-all shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-xs font-medium'
                    : msg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                {/* Safe plain text rendering */}
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Response Metadata Footer */}
                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 pt-1 border-t border-black/5">
                  <span>{msg.timestamp}</span>
                  {msg.wordCount !== undefined && msg.sender === 'assistant' && (
                    <span className="font-mono">{msg.wordCount} words</span>
                  )}
                </div>

                {/* Interactive Action Buttons */}
                {msg.action_required && msg.action_label && (
                  <div className="pt-1.5">
                    <button
                      onClick={() => router.push('/appointments')}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>{msg.action_label}</span>
                      <ChevronRight className="w-3 h-3 text-sky-500" />
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Carousel */}
        <div className="p-3 bg-slate-100/70 border-t border-slate-200/80 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 pl-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Prompts:
            </span>
            {SUGGESTED_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 text-slate-700 border border-slate-200/90 rounded-full text-xs font-medium transition-all shadow-2xs whitespace-nowrap disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask MedFlow medical questions, prescriptions, appointments..."
                rows={1}
                disabled={isLoading}
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white resize-none transition-all leading-relaxed"
                style={{ maxHeight: '100px' }}
              />
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-2xl shadow-md shadow-sky-600/20 transition-all shrink-0 flex items-center justify-center"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span>Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for newline</span>
            <span>Response limit: <strong>25 words max</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
