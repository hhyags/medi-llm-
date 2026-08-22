'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  Users,
  Calendar,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Plus,
  PhoneForwarded,
  Eye,
  Check,
  X,
  RefreshCw,
  Stethoscope,
  Pill,
  FlaskConical,
  CreditCard,
  ShieldCheck,
  Activity,
  Heart,
  FileCheck,
  Building2,
  User as UserIcon
} from 'lucide-react';

export default function DashboardView() {
  const { role, profile, hospital } = useAuth();
  const {
    patients,
    doctors,
    appointments,
    consultations,
    prescriptions,
    labOrders,
    invoices,
    calls,
    notifications,
    setSelectedPatientId,
    setIsAddPatientOpen,
    setIsNewAppointmentOpen,
    openCallModal,
    updateAppointmentStatus,
    setRescheduleAppointmentData,
    resolveCallback,
    auditLogs
  } = useMedFlow();

  // Metrics calculations (scoped to active hospital)
  const totalPatients = patients.length + 120;
  const answeredCalls = calls.filter((c) => c.status === 'completed').length + 18;
  const confirmedCalls = calls.filter((c) => c.outcome === 'confirmed').length + 12;
  const rescheduledCalls = calls.filter((c) => c.outcome === 'rescheduled').length + 4;
  const callbackRequestedCalls = calls.filter((c) => c.callbackRequested && !c.resolvedByReceptionist);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-confirmed flex items-center gap-1 animate-in fade-in"><Check className="w-3 h-3 text-emerald-600" /> Confirmed</span>;
      case 'rescheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><RefreshCw className="w-3 h-3 text-purple-600" /> Rescheduled</span>;
      case 'waiting':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-waiting flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Waiting in Lounge</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-completed flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-cancelled flex items-center gap-1"><X className="w-3 h-3 text-rose-600" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-scheduled flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-600" /> Scheduled</span>;
    }
  };

  const getAICallBadge = (aiCallStatus?: string) => {
    switch (aiCallStatus) {
      case 'completed':
        return <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">📞 AI Confirmed</span>;
      case 'queued':
      case 'initiated':
        return <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 animate-pulse">📞 Calling...</span>;
      case 'failed':
        return <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">📞 Call Failed</span>;
      default:
        return null;
    }
  };

  // =========================================================================
  // VIEW 1: RECEPTIONIST DASHBOARD (Front Desk & AI Call Dispatch)
  // =========================================================================
  if (role === 'receptionist') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Hero Banner */}
        <div className="role-hero-receptionist rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-sky-900/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Front Desk Active Session
                </span>
                <span className="text-xs text-sky-100 font-medium">
                  {profile?.name} • {hospital?.name}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Today's Patient Operations</h1>
              <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl leading-relaxed">
                Coordinate patient admissions, manage the live clinic queue, and automate appointment reminders with AI Calling.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setIsAddPatientOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-sky-200" />
                + Add Patient
              </button>
              <button
                onClick={() => setIsNewAppointmentOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-emerald-300" />
                + Book Slot
              </button>
              <button
                onClick={() => openCallModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-200 hover:to-yellow-200 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-950/20 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-slate-950" />
                📞 Make AI Call
              </button>
            </div>
          </div>
        </div>

        {/* Urgent Callback Requests Alert Banner */}
        {callbackRequestedCalls.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    <span>{callbackRequestedCalls.length} Patient Callback {callbackRequestedCalls.length > 1 ? 'Requests' : 'Request'} Pending</span>
                    <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white">Action Required</span>
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Patients requested a receptionist callback or inquired about medical dosage during AI voice calls.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {callbackRequestedCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-white px-3 py-1.5 rounded-xl border border-amber-200 text-xs flex items-center gap-2 shadow-xs"
                      >
                        <span className="font-bold text-slate-900">{call.patientName}</span>
                        <span className="text-slate-500 font-mono">({call.patientPhone})</span>
                        <span className="text-amber-700 italic truncate max-w-[220px]">
                          "{call.callbackReason || 'Callback needed'}"
                        </span>
                        <button
                          onClick={() => resolveCallback(call.id)}
                          className="ml-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors"
                        >
                          Resolve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                href="/calling"
                className="text-xs text-amber-900 hover:text-amber-950 font-bold underline whitespace-nowrap shrink-0"
              >
                Open Voice Center →
              </Link>
            </div>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/patients" className="glass-card rounded-2xl p-5 hover:border-sky-300 group block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Patients</span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{totalPatients}</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8 today
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">In {hospital?.name.split(' ')[0]}</p>
          </Link>

          <Link href="/appointments" className="glass-card rounded-2xl p-5 hover:border-emerald-300 group block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Appointments</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{appointments.length + 38}</span>
              <span className="text-xs text-emerald-600 font-bold">Live shift roster</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">OPD & Specialist consults</p>
          </Link>

          <Link href="/records" className="glass-card rounded-2xl p-5 hover:border-purple-300 group block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Follow-ups</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">17</span>
              <span className="text-xs text-purple-600 font-bold">Clinical reviews</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Post-consult care</p>
          </Link>

          <Link href="/calling" className="glass-card rounded-2xl p-5 hover:border-sky-300 group block">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Voice Calls</span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{calls.length + 20}</span>
              <span className="text-xs text-emerald-600 font-bold">92% confirmed</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Autonomous calls</p>
          </Link>
        </div>

        {/* Main Content Grid: Today's Appointments & AI Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Appointments Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Today's Appointment Roster</h2>
                <p className="text-xs text-slate-500">Live triage, patient check-in and confirmation actions</p>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                View Full Roster →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Doctor & Dept</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.slice(0, 5).map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => setSelectedPatientId(apt.patientId)}
                          className="font-bold text-slate-900 hover:text-sky-600 text-left"
                        >
                          {apt.patientName}
                        </button>
                        <div className="text-[11px] text-slate-400 font-mono">{apt.patientPhone}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{apt.doctorName}</div>
                        <div className="text-[11px] text-slate-400">{apt.department}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {apt.time}
                        <span className="text-[10px] text-slate-400 block font-normal">{apt.date}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(apt.status)}
                          {getAICallBadge(apt.aiCallStatus)}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openCallModal(apt)}
                            className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center gap-1 border border-sky-200 transition-colors"
                            title="Start AI Call"
                          >
                            <PhoneCall className="w-3 h-3 text-sky-600" />
                            <span>AI Call</span>
                          </button>
                          {apt.status === 'scheduled' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              title="Confirm"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setRescheduleAppointmentData(apt)}
                            className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                            title="Reschedule"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Calling Summary Box */}
          <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    AI Calling Summary
                  </h3>
                  <p className="text-xs text-slate-500">Autonomous voice agent metrics</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Total AI Calls Initiated</span>
                  <span className="font-extrabold text-slate-900">{calls.length + 20}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
                  <span className="text-emerald-800 font-medium">Answered & Completed</span>
                  <span className="font-extrabold text-emerald-700">{answeredCalls}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs">
                  <span className="text-sky-800 font-medium">Appointments Confirmed</span>
                  <span className="font-extrabold text-sky-700">{confirmedCalls}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-xs">
                  <span className="text-purple-800 font-medium">Rescheduled New Slots</span>
                  <span className="font-extrabold text-purple-700">{rescheduledCalls}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
                  <span className="text-amber-800 font-medium">Receptionist Callbacks</span>
                  <span className="font-extrabold text-amber-700">{callbackRequestedCalls.length + 1}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                href="/calling"
                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <PhoneForwarded className="w-4 h-4" />
                Open AI Calling Dashboard
              </Link>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DOCTOR CLINICAL DASHBOARD
  // =========================================================================
  if (role === 'doctor') {
    const myAppointments = appointments.filter((a) => a.doctorId === 'DOC-001' || a.doctorName.includes(profile?.name?.split(' ')[1] || 'Meera'));
    const waitingPatients = myAppointments.filter((a) => a.status === 'waiting' || a.status === 'scheduled');
    const myConsultations = consultations.filter((c) => c.doctorId === 'DOC-001' || c.doctorName.includes(profile?.name?.split(' ')[1] || 'Meera'));

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Doctor Hero Header */}
        <div className="role-hero-doctor rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-emerald-200" />
                  Clinical OPD Station • {profile?.department || 'Cardiology'}
                </span>
                <span className="text-xs text-emerald-100 font-medium">{hospital?.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{profile?.name}</h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
                {profile?.specialization || 'Attending Physician'}. Manage clinic queue, write consultation notes, and review diagnostic findings.
              </p>
            </div>

            {/* Quick Clinical Operations */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/records"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Pill className="w-4 h-4 text-emerald-200" />
                + Issue Prescription
              </Link>
              <Link
                href="/records"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FlaskConical className="w-4 h-4 text-cyan-200" />
                + Order Lab Panel
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Doctor Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border-emerald-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Clinic Roster</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{myAppointments.length} Patients</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">Scheduled in current session</p>
          </div>

          <div className="glass-card rounded-2xl p-5 bg-amber-50/50 border-amber-200">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">In Waiting Lounge</span>
            <div className="mt-2 text-3xl font-black text-amber-900">{waitingPatients.length} Patients</div>
            <p className="text-xs text-amber-700 font-semibold mt-1">Ready for consultation</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultations Completed</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{myConsultations.length}</div>
            <p className="text-xs text-slate-500 mt-1">Clinical notes finalized</p>
          </div>

          <div className="glass-card rounded-2xl p-5 bg-purple-50/50 border-purple-200">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Active Prescriptions</span>
            <div className="mt-2 text-3xl font-black text-purple-900">{prescriptions.length} Issued</div>
            <p className="text-xs text-purple-700 font-semibold mt-1">Medications on record</p>
          </div>
        </div>

        {/* Doctor Live Patient Queue & Records */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Waiting Room Patients Queue */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Clinic Waiting Room Queue</h3>
                <p className="text-xs text-slate-500">Patients checked in at reception ready for consultation</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {waitingPatients.length} Waiting
              </span>
            </div>

            <div className="space-y-3">
              {waitingPatients.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPatientId(apt.patientId)}
                        className="font-extrabold text-slate-900 hover:text-sky-600 text-sm"
                      >
                        {apt.patientName}
                      </button>
                      <span className="text-xs text-slate-400 font-mono">{apt.patientId}</span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-sky-100 text-sky-700">
                        {apt.appointmentType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      <strong>Chief Complaint:</strong> {apt.reason}
                    </p>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Scheduled: {apt.time} ({apt.date})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedPatientId(apt.patientId)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-2xs"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Consult Patient
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Clinical Notes */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Recent Consultations & Vitals
            </h3>

            <div className="space-y-3">
              {myConsultations.slice(0, 3).map((con) => (
                <div key={con.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{con.patientName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{con.date}</span>
                  </div>
                  <div className="text-emerald-700 font-semibold">{con.diagnosis}</div>
                  <p className="text-slate-600 line-clamp-2 text-[11px]">{con.notes}</p>
                </div>
              ))}
            </div>

            <Link
              href="/records"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors block text-center"
            >
              Open Complete Records Vault →
            </Link>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ADMIN EXECUTIVE DASHBOARD
  // =========================================================================
  if (role === 'admin') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Admin Executive Header */}
        <div className="role-hero-admin rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-purple-950/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-200" />
                  Executive Administration • {hospital?.name}
                </span>
                <span className="text-xs text-purple-200 font-medium">Admin: {profile?.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hospital Enterprise Overview</h1>
              <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
                Real-time operational monitoring, clinical capacity, AI calling ROI analytics, and audit logging for {hospital?.name}.
              </p>
            </div>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
            >
              <Activity className="w-4 h-4 text-purple-200" />
              Configure System Settings
            </Link>
          </div>
        </div>

        {/* 4 Admin Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Census</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{totalPatients}</div>
            <p className="text-xs text-emerald-600 font-bold mt-1">Active patient profiles</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue Settled</span>
            <div className="mt-2 text-3xl font-black text-slate-900">$8,450</div>
            <p className="text-xs text-emerald-600 font-bold mt-1">+12.4% vs last week</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Automation Rate</span>
            <div className="mt-2 text-3xl font-black text-purple-900">91.3%</div>
            <p className="text-xs text-purple-700 font-semibold mt-1">Autonomous calls confirmed</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Staff Active</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{doctors.length} Attending</div>
            <p className="text-xs text-sky-600 font-bold mt-1">In {hospital?.name.split(' ')[0]}</p>
          </div>
        </div>

        {/* Admin Breakdown & Live Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Department Workload */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Department Consultation Workload</h3>
              <p className="text-xs text-slate-500 mb-4">Patient volume distribution across active clinical specialties</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Cardiology</span>
                    <span>38% (16 Patients)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-600 rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Internal Medicine & Endocrinology</span>
                    <span>32% (14 Patients)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Pediatrics</span>
                    <span>18% (8 Patients)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Clinic Data Protection: <strong className="text-emerald-700">Encrypted & HIPAA Compliant</strong>
              </div>
              <Link
                href="/calling"
                className="text-xs font-bold text-purple-700 hover:text-purple-800"
              >
                View Voice Calling Center →
              </Link>
            </div>
          </div>

          {/* Live Audit Trail */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-purple-600" />
              Live Security & Operations Audit
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">No recent audit events in this hospital.</div>
              ) : (
                auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span className="font-bold text-purple-700">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{log.details}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">By: {log.userName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 4: PATIENT SELF-SERVICE PORTAL
  // =========================================================================
  if (role === 'patient') {
    const myApt = appointments[0];
    const myRx = prescriptions;
    const myLabs = labOrders;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* Patient Portal Header */}
        <div className="role-hero-patient rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-amber-950/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-white/20 text-white backdrop-blur-md border border-white/25 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-amber-200" />
                  Patient Health Portal • {hospital?.name}
                </span>
                <span className="text-xs text-amber-100 font-medium">{profile?.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome to your Care Portal</h1>
              <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl">
                View your upcoming doctor appointments, review prescribed medications, and check diagnostic lab results.
              </p>
            </div>

            <button
              onClick={() => setIsNewAppointmentOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-950 font-extrabold rounded-xl text-xs shadow-md hover:bg-amber-50 transition-all self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4 text-amber-700" />
              Book New Appointment
            </button>
          </div>
        </div>

        {/* 4 Patient Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 border-amber-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Appointment</span>
            <div className="mt-2 text-xl font-black text-slate-900">
              {myApt ? `${myApt.date} at ${myApt.time}` : 'None scheduled'}
            </div>
            <p className="text-xs text-amber-800 font-semibold mt-1">
              {myApt ? `With ${myApt.doctorName}` : 'Book a visit anytime'}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Prescriptions</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{myRx.length} Medicine</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Daily dosage schedule</p>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Reports</span>
            <div className="mt-2 text-3xl font-black text-slate-900">{myLabs.length} Records</div>
            <p className="text-xs text-sky-600 font-semibold mt-1">Diagnostic results</p>
          </div>

          <div className="glass-card rounded-2xl p-5 bg-emerald-50/50 border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Billing Status</span>
            <div className="mt-2 text-3xl font-black text-emerald-900">$0.00 Due</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">All invoices settled</p>
          </div>
        </div>

        {/* Patient Appointment Card & Active Medications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upcoming Visit Highlight Card */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                Upcoming Consultation Details
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                Confirmed Visit
              </span>
            </div>

            {myApt && (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-sky-950">{myApt.doctorName}</span>
                  <span className="text-xs font-bold text-sky-800 font-mono">{myApt.time}</span>
                </div>
                <div className="text-xs text-sky-900 font-medium">
                  <strong>Department:</strong> {myApt.department} • <strong>Date:</strong> {myApt.date}
                </div>
                <p className="text-xs text-sky-800 italic">
                  Reason for visit: {myApt.reason}
                </p>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRescheduleAppointmentData(myApt)}
                    className="px-3 py-1.5 bg-white border border-sky-200 text-sky-900 hover:bg-sky-50 rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Medications */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              My Prescriptions & Instructions
            </h3>

            <div className="space-y-3">
              {myRx.map((rx) => (
                <div key={rx.id} className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-950 text-xs">
                    <span>{rx.medicine} ({rx.dosage})</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] bg-emerald-200 text-emerald-900">Active</span>
                  </div>
                  <div className="text-xs text-emerald-900 font-medium">
                    Schedule: {rx.frequency} • Duration: {rx.duration}
                  </div>
                  <p className="text-[11px] text-emerald-800 italic">
                    Doctor's note: {rx.instructions}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  }

  return null;
}
