'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  PhoneCall,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';

export default function RecordsView() {
  const { role: currentUserRole } = useAuth();
  const {
    consultations,
    prescriptions,
    labOrders,
    invoices,
    calls,
    patients,
    doctors,
    addConsultation,
    addPrescription,
    addLabOrder,
    updateLabOrderStatus,
    addInvoice,
    updateInvoiceStatus,
    setSelectedPatientId
  } = useMedFlow();

  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions' | 'labs' | 'billing' | 'calls'>('consultations');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for adding records
  const [isAddConsultationOpen, setIsAddConsultationOpen] = useState(false);
  const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);

  // Form states
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  
  // Consultation form state
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Prescription form state
  const [medicine, setMedicine] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('Twice daily after meals');
  const [duration, setDuration] = useState('5 days');
  const [rxInstructions, setRxInstructions] = useState('Take with water after food');

  // Lab form state
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState<'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Pathology'>('Biochemistry');
  
  // Invoice form state
  const [amount, setAmount] = useState('150');
  const [description, setDescription] = useState('Outpatient Consultation & Review');

  const selectedPatient = patients.find((p) => p.id === patientId) || patients[0];
  const selectedDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  // Submission handlers
  const handleCreateConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !notes.trim()) return;
    addConsultation({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: new Date().toISOString().split('T')[0],
      diagnosis: diagnosis.trim(),
      symptoms: ['Follow-up clinical assessment'],
      notes: notes.trim(),
      followUpDate: followUpDate || undefined
    });
    setIsAddConsultationOpen(false);
    setDiagnosis('');
    setNotes('');
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicine.trim()) return;
    addPrescription({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: new Date().toISOString().split('T')[0],
      medicine: medicine.trim(),
      dosage,
      frequency,
      duration,
      instructions: rxInstructions,
      status: 'active'
    });
    setIsAddPrescriptionOpen(false);
    setMedicine('');
  };

  const handleCreateLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;
    addLabOrder({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      testName: testName.trim(),
      category,
      date: new Date().toISOString().split('T')[0],
      status: 'ordered'
    });
    setIsAddLabOpen(false);
    setTestName('');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || isNaN(num)) return;
    addInvoice({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      amount: num,
      description: description.trim(),
      items: [{ name: description.trim(), quantity: 1, unitPrice: num }],
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddInvoiceOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Hospital Records & Clinical Vault
          </h1>
          <p className="text-xs text-slate-500">
            Unified single-page repository for Consultations, Prescriptions, Lab Orders, Invoices, and Voice Call Records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto self-start sm:self-auto">
          {[
            { id: 'consultations', label: 'Consultations', icon: <Stethoscope className="w-3.5 h-3.5" />, count: consultations.length },
            { id: 'prescriptions', label: 'Prescriptions', icon: <Pill className="w-3.5 h-3.5" />, count: prescriptions.length },
            { id: 'labs', label: 'Laboratory', icon: <FlaskConical className="w-3.5 h-3.5" />, count: labOrders.length },
            { id: 'billing', label: 'Billing', icon: <CreditCard className="w-3.5 h-3.5" />, count: invoices.length },
            { id: 'calls', label: 'Calls', icon: <PhoneCall className="w-3.5 h-3.5" />, count: calls.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content 1: Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Doctor Clinical Consultations ({consultations.length})
            </span>
            <button
              onClick={() => setIsAddConsultationOpen(true)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + New Consultation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultations.map((con) => (
              <div key={con.id} className="glass-card rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                      {con.consultationId}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{con.date}</span>
                  </div>

                  <div className="mt-2">
                    <h3 className="font-bold text-slate-900 text-sm">{con.diagnosis}</h3>
                    <div className="text-xs text-slate-600 mt-1">
                      Patient: <strong className="text-slate-800">{con.patientName}</strong>
                    </div>
                    <div className="text-xs text-slate-500">
                      Doctor: {con.doctorName}
                    </div>
                  </div>

                  {con.vitals && (
                    <div className="mt-2.5 p-2 bg-slate-50 rounded-xl text-[11px] text-slate-600 grid grid-cols-2 gap-1 font-mono">
                      {con.vitals.bloodPressure && <span>BP: {con.vitals.bloodPressure}</span>}
                      {con.vitals.heartRate && <span>HR: {con.vitals.heartRate}</span>}
                    </div>
                  )}

                  <p className="mt-2.5 text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    {con.notes}
                  </p>
                </div>

                {con.followUpDate && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-sky-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Follow-up: {con.followUpDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 2: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Issued Prescriptions ({prescriptions.length})
            </span>
            <button
              onClick={() => setIsAddPrescriptionOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Issue Prescription
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Rx ID</th>
                  <th className="py-3 px-4">Medicine & Dosage</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Frequency & Duration</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{rx.prescriptionId}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" />
                        {rx.medicine}
                      </div>
                      <div className="text-[11px] text-slate-400">Dosage: {rx.dosage}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{rx.patientName}</td>
                    <td className="py-3 px-4">
                      <div>{rx.frequency}</div>
                      <div className="text-[11px] text-slate-400">{rx.duration} ({rx.instructions})</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rx.doctorName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Laboratory */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Diagnostic Laboratory Orders ({labOrders.length})
            </span>
            <button
              onClick={() => setIsAddLabOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Order Lab Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labOrders.map((lab) => (
              <div key={lab.id} className="glass-card rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      {lab.labOrderId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700">
                      {lab.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{lab.testName}</h3>
                  <p className="text-xs text-slate-500">
                    Category: <strong className="text-slate-700">{lab.category}</strong> • Date: {lab.date}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Patient: <strong>{lab.patientName}</strong> | Doctor: {lab.doctorName}
                  </p>

                  {lab.result ? (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-950 font-medium">
                      <strong>Result:</strong> {lab.result}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 italic">
                      Specimen collected. Report pending analysis.
                    </div>
                  )}
                </div>

                {lab.status !== 'reported' && (
                  <button
                    onClick={() => updateLabOrderStatus(lab.id, 'reported', 'Sample analyzed. Clinical parameters within reference range.')}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Upload Final Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 4: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Patient Invoices & Accounts ({invoices.length})
            </span>
            <button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> + Generate Invoice
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{inv.patientName}</td>
                    <td className="py-3 px-4 text-slate-700">{inv.description}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">${inv.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.status === 'pending' && (
                        <button
                          onClick={() => updateInvoiceStatus(inv.id, 'paid', 'Credit Card')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 5: Calls */}
      {activeTab === 'calls' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Call ID</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">AI Result & Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{call.callId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{call.patientName}</td>
                    <td className="py-3 px-4 capitalize">{call.purpose.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 font-mono">{call.durationSeconds}s</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 capitalize">Outcome: {call.outcome}</div>
                      <div className="text-[11px] text-slate-500">{call.summary}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Consultation Modal */}
      {isAddConsultationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Clinical Consultation Note</h3>
            
            <form onSubmit={handleCreateConsultation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Examination findings, management plan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddConsultationOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Prescription Modal */}
      {isAddPrescriptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Issue New Prescription</h3>
            
            <form onSubmit={handleCreatePrescription} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg, Atorvastatin..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPrescriptionOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl"
                >
                  Issue Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lab Modal */}
      {isAddLabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Order Diagnostic Laboratory Test</h3>
            
            <form onSubmit={handleCreateLab} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count, Liver Function Panel..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLabOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl"
                >
                  Order Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Generate Patient Invoice</h3>
            
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Amount ($)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
