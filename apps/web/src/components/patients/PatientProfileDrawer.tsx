'use client';

import React, { useState } from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  X,
  User,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  PhoneCall,
  MapPin,
  Mail,
  Phone,
  Heart,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus
} from 'lucide-react';

export default function PatientProfileDrawer() {
  const {
    selectedPatientId,
    setSelectedPatientId,
    patients,
    appointments,
    consultations,
    prescriptions,
    labOrders,
    invoices,
    calls,
    openCallModal,
    setIsNewAppointmentOpen
  } = useMedFlow();

  const [activeSubTab, setActiveSubTab] = useState<
    'info' | 'appointments' | 'consultations' | 'prescriptions' | 'labs' | 'billing' | 'calls'
  >('info');

  if (!selectedPatientId) return null;

  const patient = patients.find((p) => p.id === selectedPatientId || p.patientId === selectedPatientId);
  if (!patient) return null;

  const patientAppointments = appointments.filter((a) => a.patientId === patient.id || a.patientId === patient.patientId);
  const patientConsultations = consultations.filter((c) => c.patientId === patient.id || c.patientId === patient.patientId);
  const patientPrescriptions = prescriptions.filter((p) => p.patientId === patient.id || p.patientId === patient.patientId);
  const patientLabs = labOrders.filter((l) => l.patientId === patient.id || l.patientId === patient.patientId);
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id || i.patientId === patient.patientId);
  const patientCalls = calls.filter((c) => c.patientId === patient.id || c.patientId === patient.patientId);

  const tabs: { id: typeof activeSubTab; label: string; count?: number }[] = [
    { id: 'info', label: 'Patient Info' },
    { id: 'appointments', label: 'Appointments', count: patientAppointments.length },
    { id: 'consultations', label: 'Consultations', count: patientConsultations.length },
    { id: 'prescriptions', label: 'Prescriptions', count: patientPrescriptions.length },
    { id: 'labs', label: 'Lab Reports', count: patientLabs.length },
    { id: 'billing', label: 'Billing', count: patientInvoices.length },
    { id: 'calls', label: 'AI Call History', count: patientCalls.length }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md">
                {patient.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 text-xs font-mono font-bold">
                    {patient.patientId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {patient.age} yrs • {patient.gender} • Blood Group: <strong className="text-slate-700">{patient.bloodGroup || 'N/A'}</strong>
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {patient.phone}</span>
                  {patient.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {patient.email}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openCallModal(patientAppointments[0], patient)}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                AI Call
              </button>
              <button
                onClick={() => setSelectedPatientId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto mt-6 border-b border-slate-200 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? 'border-sky-600 text-sky-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tab 1: Personal Information */}
          {activeSubTab === 'info' && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Address & Demographics</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Residential Address:</span>
                    <span className="text-slate-800 font-medium">{patient.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Registration Date:</span>
                    <span className="text-slate-800 font-medium">{new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Last Hospital Visit:</span>
                    <span className="text-slate-800 font-medium">{patient.lastVisit || 'None recorded'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Next Scheduled Consult:</span>
                    <span className="text-sky-700 font-bold">{patient.nextAppointment || 'None booked'}</span>
                  </div>
                </div>
              </div>

              {patient.emergencyContact && (
                <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    Emergency Contact
                  </h4>
                  <div className="text-xs grid grid-cols-2 gap-2 text-rose-950">
                    <div><strong>Name:</strong> {patient.emergencyContact.name} ({patient.emergencyContact.relation})</div>
                    <div><strong>Phone:</strong> {patient.emergencyContact.phone}</div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Medical Background & Notes
                </h4>
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  {patient.medicalNotes || 'No specific medical notes or known allergies on file.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Appointments */}
          {activeSubTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Patient Appointments</h4>
                <button
                  onClick={() => setIsNewAppointmentOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Book Appointment
                </button>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No appointments on record for this patient.</div>
              ) : (
                patientAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{apt.appointmentType}</div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {apt.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Doctor:</strong> {apt.doctorName} ({apt.department})
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Schedule:</strong> {apt.date} at {apt.time}
                    </div>
                    <div className="text-xs text-slate-500 italic">
                      Reason: {apt.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Consultations */}
          {activeSubTab === 'consultations' && (
            <div className="space-y-4">
              {patientConsultations.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No doctor consultation notes yet.</div>
              ) : (
                patientConsultations.map((con) => (
                  <div key={con.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{con.diagnosis}</div>
                      <span className="text-[11px] text-slate-400 font-medium">{con.date}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Doctor:</strong> {con.doctorName}
                    </div>
                    {con.vitals && (
                      <div className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600 flex flex-wrap gap-3">
                        {con.vitals.bloodPressure && <span>BP: {con.vitals.bloodPressure}</span>}
                        {con.vitals.heartRate && <span>HR: {con.vitals.heartRate}</span>}
                        {con.vitals.temperature && <span>Temp: {con.vitals.temperature}</span>}
                      </div>
                    )}
                    <p className="text-xs text-slate-700 leading-relaxed">{con.notes}</p>
                    {con.followUpDate && (
                      <div className="text-[11px] text-sky-700 font-semibold">
                        Next follow-up recommended on: {con.followUpDate}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Prescriptions */}
          {activeSubTab === 'prescriptions' && (
            <div className="space-y-3">
              {patientPrescriptions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No active prescriptions.</div>
              ) : (
                patientPrescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        {rx.medicine}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rx.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Dosage & Frequency:</strong> {rx.dosage} • {rx.frequency} ({rx.duration})
                    </div>
                    <div className="text-xs text-slate-500 italic">
                      Instructions: {rx.instructions}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Prescribed by {rx.doctorName} on {rx.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 5: Labs */}
          {activeSubTab === 'labs' && (
            <div className="space-y-3">
              {patientLabs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No laboratory records.</div>
              ) : (
                patientLabs.map((lab) => (
                  <div key={lab.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs">{lab.testName}</div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {lab.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Category:</strong> {lab.category} • <strong>Date:</strong> {lab.date}
                    </div>
                    {lab.result && (
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-semibold">
                        Result: {lab.result}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 6: Billing */}
          {activeSubTab === 'billing' && (
            <div className="space-y-3">
              {patientInvoices.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No invoices generated.</div>
              ) : (
                patientInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{inv.description}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{inv.invoiceId} • {inv.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">${inv.amount}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 7: AI Call History */}
          {activeSubTab === 'calls' && (
            <div className="space-y-4">
              {patientCalls.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No AI voice calls recorded yet for this patient.</div>
              ) : (
                patientCalls.map((call) => (
                  <div key={call.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
                        {call.callId} • {call.purpose.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Duration: {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-sky-950">
                      <strong>AI Summary:</strong> {call.summary}
                    </div>
                    {call.transcript && call.transcript.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transcript Snapshot</div>
                        {call.transcript.slice(0, 3).map((t, idx) => (
                          <div key={idx} className="text-xs flex gap-2">
                            <span className="font-bold uppercase text-[10px] text-slate-500 w-12 shrink-0">{t.speaker}:</span>
                            <span className="text-slate-700">{t.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
