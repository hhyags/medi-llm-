'use client';

import React, { useState } from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import { AppointmentStatus, Appointment } from '../../types/medflow';
import {
  Calendar,
  Plus,
  PhoneCall,
  Check,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  Filter,
  User,
  Stethoscope,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function AppointmentsView() {
  const {
    appointments,
    doctors,
    setIsNewAppointmentOpen,
    setSelectedPatientId,
    setRescheduleAppointmentData,
    openCallModal,
    updateAppointmentStatus
  } = useMedFlow();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [doctorFilter, setDoctorFilter] = useState<string>('ALL');
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Patient requested cancellation');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === 'ALL' || apt.doctorId === doctorFilter;
    return matchesStatus && matchesDoctor;
  });

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-confirmed flex items-center gap-1"><Check className="w-3 h-3" /> Confirmed</span>;
      case 'waiting':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-waiting flex items-center gap-1"><Clock className="w-3 h-3" /> Waiting in Lounge</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-completed flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-cancelled flex items-center gap-1"><X className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-scheduled flex items-center gap-1"><Calendar className="w-3 h-3" /> Scheduled</span>;
    }
  };

  const handleConfirmCancel = (id: string) => {
    updateAppointmentStatus(id, 'cancelled', cancelReason);
    setCancellingAptId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Appointments Management
          </h1>
          <p className="text-xs text-slate-500">
            Book slots, check live patient queue, resolve conflicts, and initiate automated AI confirmation calls.
          </p>
        </div>

        <button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + New Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Slots' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'waiting', label: 'Waiting' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Doctor Dropdown Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-full md:w-auto">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Attending Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.department})
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Cancel Confirmation Dialog Overlay (if active) */}
      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-4 h-4" /> Cancel Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Please enter the cancellation reason for the audit trail:
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Patient rescheduled, emergency conflict..."
              className="w-full mt-3 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-rose-500"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setCancellingAptId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => handleConfirmCancel(cancellingAptId)}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List Grid */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs">
            No appointments found for the selected filters.
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/90 hover:border-slate-300"
            >
              {/* Left Column: Date/Time Badge & Details */}
              <div className="flex items-start gap-4">
                
                {/* Time Badge Box */}
                <div className="w-20 rounded-xl bg-slate-50 border border-slate-200 p-2 text-center shrink-0">
                  <span className="text-xs font-bold text-slate-900 block">{apt.time}</span>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">{apt.date}</span>
                  <span className="text-[9px] text-sky-600 font-bold block mt-0.5 font-mono">{apt.appointmentId}</span>
                </div>

                {/* Patient & Doctor Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedPatientId(apt.patientId)}
                      className="font-bold text-slate-900 hover:text-sky-600 text-sm text-left"
                    >
                      {apt.patientName}
                    </button>
                    <span className="text-xs text-slate-400 font-mono">({apt.patientPhone})</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {apt.appointmentType}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>{apt.doctorName}</strong> ({apt.department} • {apt.doctorSpecialization})</span>
                  </div>

                  <p className="text-xs text-slate-500 italic">
                    Reason: {apt.reason}
                  </p>

                  {apt.cancellationReason && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      Cancellation: {apt.cancellationReason}
                    </p>
                  )}
                </div>

              </div>

              {/* Right Column: Status Badge & Interactive Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div>
                  {getStatusBadge(apt.status)}
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* AI Call Button */}
                  <button
                    onClick={() => openCallModal(apt)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                    title="Start AI Voice Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>AI Call</span>
                  </button>

                  {/* Quick Confirm Button if Scheduled */}
                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                      title="Mark as Confirmed"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reschedule Button */}
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => setRescheduleAppointmentData(apt)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                      title="Reschedule Slot"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Cancel Button */}
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => setCancellingAptId(apt.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                      title="Cancel Appointment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                </div>

              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
