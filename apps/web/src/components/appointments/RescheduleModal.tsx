'use client';

import React, { useState, useEffect } from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import { X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RescheduleModal() {
  const {
    rescheduleAppointmentData,
    setRescheduleAppointmentData,
    doctors,
    rescheduleAppointment
  } = useMedFlow();

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (rescheduleAppointmentData) {
      setNewDate(rescheduleAppointmentData.date);
      setNewTime(rescheduleAppointmentData.time);
      setError('');
      setSuccess(false);
    }
  }, [rescheduleAppointmentData]);

  if (!rescheduleAppointmentData) return null;

  const doctor = doctors.find((d) => d.id === rescheduleAppointmentData.doctorId) || doctors[0];

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = rescheduleAppointment(rescheduleAppointmentData.id, newDate, newTime);
    if (!result.success) {
      setError(result.error || 'Conflict detected: this doctor is already booked for this slot.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setRescheduleAppointmentData(null);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Reschedule Appointment</h3>
              <p className="text-xs text-slate-500">{rescheduleAppointmentData.appointmentId} • {rescheduleAppointmentData.patientName}</p>
            </div>
          </div>
          <button
            onClick={() => setRescheduleAppointmentData(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleReschedule} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Appointment successfully moved to {newDate} at {newTime}!</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <div><strong>Attending Doctor:</strong> {rescheduleAppointmentData.doctorName}</div>
            <div><strong>Department:</strong> {rescheduleAppointmentData.department}</div>
            <div><strong>Current Schedule:</strong> {rescheduleAppointmentData.date} at {rescheduleAppointmentData.time}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Consultation Date</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Time Slot</label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 bg-white"
            >
              {doctor.timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setRescheduleAppointmentData(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
            >
              Update Slot
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
