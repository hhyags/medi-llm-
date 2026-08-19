'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMedFlow } from '../../context/MedFlowContext';
import { UserRole } from '../../types/medflow';
import confetti from 'canvas-confetti';
import {
  Settings,
  Building,
  PhoneCall,
  ShieldCheck,
  Database,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  User,
  Stethoscope,
  Headphones
} from 'lucide-react';

export default function SettingsView() {
  const { role: currentUserRole, switchDemoAccount } = useAuth();
  const {
    hospitalSettings,
    updateHospitalSettings,
    aiCallingSettings,
    updateAICallingSettings,
    resetToDemoData
  } = useMedFlow();

  const [hospitalForm, setHospitalForm] = useState(hospitalSettings);
  const [aiForm, setAiForm] = useState(aiCallingSettings);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleSaveHospital = (e: React.FormEvent) => {
    e.preventDefault();
    updateHospitalSettings(hospitalForm);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    updateAICallingSettings(aiForm);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all hospital records to default demo data?')) {
      resetToDemoData();
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            Hospital & AI Calling Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Manage hospital facility details, voice calling parameters, role permissions, and system storage.
          </p>
        </div>

        {saveStatus === 'saved' && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            Changes Saved Successfully!
          </div>
        )}
      </div>

      {/* Grid: Hospital Settings & AI Calling Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Hospital Facility Information */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hospital Information</h3>
              <p className="text-xs text-slate-500">Facility branding & public emergency contacts</p>
            </div>
          </div>

          <form onSubmit={handleSaveHospital} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Main Phone</label>
                <input
                  type="text"
                  value={hospitalForm.phone}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">24/7 Emergency Line</label>
                <input
                  type="text"
                  value={hospitalForm.emergencyHotline}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, emergencyHotline: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-500 text-rose-700 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Working / OPD Hours</label>
              <input
                type="text"
                value={hospitalForm.workingHours}
                onChange={(e) => setHospitalForm({ ...hospitalForm, workingHours: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Save Facility Settings
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: AI Voice Calling Settings */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Calling Configuration</h3>
              <p className="text-xs text-slate-500">Voice synthesis, language & autonomy rules</p>
            </div>
          </div>

          <form onSubmit={handleSaveAI} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Name</label>
                <input
                  type="text"
                  value={aiForm.agentName}
                  onChange={(e) => setAiForm({ ...aiForm, agentName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Outbound Caller ID</label>
                <input
                  type="text"
                  value={aiForm.callingNumber}
                  onChange={(e) => setAiForm({ ...aiForm, callingNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Voice Persona</label>
                <select
                  value={aiForm.voicePersona}
                  onChange={(e) => setAiForm({ ...aiForm, voicePersona: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Aria (Neural Gentle)">Aria (Neural Gentle)</option>
                  <option value="Ethan (Neural Professional)">Ethan (Neural Professional)</option>
                  <option value="Maya (Warm Healthcare)">Maya (Warm Healthcare)</option>
                  <option value="Leo (Clear Confident)">Leo (Clear Confident)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Language</label>
                <select
                  value={aiForm.language}
                  onChange={(e) => setAiForm({ ...aiForm, language: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="English">English</option>
                  <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                  <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
                  <option value="Spanish (Español)">Spanish (Español)</option>
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Automated Calling Permissions
              </span>
              
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiForm.preferences.appointmentConfirmations}
                  onChange={(e) =>
                    setAiForm({
                      ...aiForm,
                      preferences: { ...aiForm.preferences, appointmentConfirmations: e.target.checked }
                    })
                  }
                  className="rounded text-sky-600"
                />
                <span>Automated appointment confirmation calls (24h before)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiForm.preferences.allowRescheduling}
                  onChange={(e) =>
                    setAiForm({
                      ...aiForm,
                      preferences: { ...aiForm.preferences, allowRescheduling: e.target.checked }
                    })
                  }
                  className="rounded text-sky-600"
                />
                <span>Allow autonomous slot checking and appointment rescheduling</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiForm.preferences.safetyGuardrailDisclaimer}
                  onChange={(e) =>
                    setAiForm({
                      ...aiForm,
                      preferences: { ...aiForm.preferences, safetyGuardrailDisclaimer: e.target.checked }
                    })
                  }
                  className="rounded text-sky-600"
                />
                <span>Enforce clinical safety disclaimer & receptionist escalation guardrails</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Save AI Agent Rules
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Role-Based Access Control Matrix Simulation */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-500">Active session role: <strong className="capitalize text-slate-900">{currentUserRole}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              role: 'receptionist' as UserRole,
              email: 'reception1@medflow.com',
              title: 'Receptionist (Front Desk)',
              desc: 'Manage Patients, Book Appointments, Initiate AI Voice Calls, Process Invoices, Manage Callback Queue.',
              icon: <Headphones className="w-4 h-4 text-blue-600" />
            },
            {
              role: 'doctor' as UserRole,
              email: 'doctor1@medflow.com',
              title: 'Doctor (Clinical Staff)',
              desc: 'View Patient Clinical Histories, Write Consultations, Issue Prescriptions, Order Diagnostic Lab Tests.',
              icon: <Stethoscope className="w-4 h-4 text-emerald-600" />
            },
            {
              role: 'admin' as UserRole,
              email: 'admin1@medflow.com',
              title: 'Hospital Admin',
              desc: 'Full Access across all clinical departments, calling agent parameters, billing auditing, and system data.',
              icon: <ShieldCheck className="w-4 h-4 text-purple-600" />
            },
            {
              role: 'patient' as UserRole,
              email: 'patient1@gmail.com',
              title: 'Patient (Self Service)',
              desc: 'View personalized appointment history, active prescriptions, lab report results, and pending invoices.',
              icon: <User className="w-4 h-4 text-amber-600" />
            }
          ].map((item) => (
            <div
              key={item.role}
              onClick={() => switchDemoAccount(item.email)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                currentUserRole === item.role
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {item.icon}
                  <span>{item.title}</span>
                </div>
                {currentUserRole === item.role && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${currentUserRole === item.role ? 'text-slate-300' : 'text-slate-500'}`}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Seed Data Reset Utilities */}
      <div className="glass-card rounded-2xl p-6 border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            Demo Data & Storage Reset
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset local repository to clean initial seed data with 6 sample patients, appointments, and AI calling transcripts.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Demo Seeds
        </button>
      </div>

    </div>
  );
}
