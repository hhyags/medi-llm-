'use client';

import React from 'react';
import Navbar from './Navbar';
import AddPatientModal from '../patients/AddPatientModal';
import NewAppointmentModal from '../appointments/NewAppointmentModal';
import RescheduleModal from '../appointments/RescheduleModal';
import PatientProfileDrawer from '../patients/PatientProfileDrawer';
import AICallModal from '../calling/AICallModal';
import NotificationDrawer from '../common/NotificationDrawer';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import { AppResource } from '../../lib/auth/permissions';

interface AppLayoutProps {
  children: React.ReactNode;
  resource?: AppResource;
  action?: 'read' | 'create' | 'update' | 'delete';
}

export default function AppLayout({ children, resource = 'dashboard', action = 'read' }: AppLayoutProps) {
  const { hospital } = useAuth();

  return (
    <ProtectedRoute resource={resource} action={action}>
      <div className="min-h-screen flex flex-col bg-slate-100/60 font-sans text-slate-900 selection:bg-sky-500 selection:text-white">
        {/* Top Sticky Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Global Modals & Drawers */}
        <AddPatientModal />
        <NewAppointmentModal />
        <RescheduleModal />
        <PatientProfileDrawer />
        <AICallModal />
        <NotificationDrawer />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">MedFlow AI CRM</span>
              <span>•</span>
              <span className="font-medium text-slate-600">{hospital?.name || 'MedFlow Healthcare System'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                {hospital?.hospitalId || 'hospital_001'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-rose-600 font-semibold">{hospital?.emergencyHotline || '+1 (800) 555-9111'}</span>
              <span>•</span>
              <span className="text-slate-400">Enterprise Multi-Tenant Auth v2.0</span>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
