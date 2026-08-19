'use client';

import React, { useState } from 'react';
import { useMedFlow } from '../../context/MedFlowContext';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  PhoneCall,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

export default function PatientsView() {
  const {
    patients,
    setSelectedPatientId,
    setIsAddPatientOpen,
    setIsNewAppointmentOpen,
    openCallModal
  } = useMedFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q));

    const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchesQuery && matchesGender && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Patient Registry
          </h1>
          <p className="text-xs text-slate-500">
            Search, manage medical records, and view complete care histories ({patients.length} active records)
          </p>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Add Patient
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, phone number, or ID (e.g. PAT-001)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 text-xs w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient List Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/90 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4">Next Appointment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No patients match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedPatientId(patient.id)}
                        className="font-bold text-slate-900 hover:text-sky-600 text-left flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                          {patient.name[0]}
                        </div>
                        <div>
                          <div>{patient.name}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">{patient.patientId}</span>
                        </div>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {patient.phone}
                      </div>
                      {patient.email && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{patient.email}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">{patient.age} yrs</span>
                      <span className="text-slate-400 text-[11px] block">{patient.gender} • {patient.bloodGroup || 'N/A'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {patient.lastVisit || <span className="text-slate-400 italic">None</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {patient.nextAppointment ? (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[11px] border border-sky-100">
                          {patient.nextAppointment}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None scheduled</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {patient.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPatientId(patient.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                          title="View Full Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openCallModal(undefined, patient)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-[11px] flex items-center gap-1 border border-sky-200"
                          title="Start AI Call"
                        >
                          <PhoneCall className="w-3 h-3 text-sky-600" />
                          <span>AI Call</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
