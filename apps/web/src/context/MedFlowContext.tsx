'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient,
  Doctor,
  Appointment,
  Consultation,
  Prescription,
  LabOrder,
  Invoice,
  CallRecord,
  NotificationItem,
  HospitalSettings,
  AICallingSettings,
  AuditLog,
  UserRole
} from '../types/medflow';
import { storageService } from '../lib/services/storage';
import { useAuth } from './AuthContext';

export type NavigationTab = 'dashboard' | 'patients' | 'appointments' | 'calling' | 'records' | 'settings';

interface MedFlowContextType {
  // State scoped to active hospital
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  invoices: Invoice[];
  calls: CallRecord[];
  notifications: NotificationItem[];
  hospitalSettings: HospitalSettings;
  aiCallingSettings: AICallingSettings;
  auditLogs: AuditLog[];

  // Selected state for drawers/modals
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  
  // Active call modal state
  activeCallAppointment: Appointment | null;
  activeCallPatient: Patient | null;
  isCallModalOpen: boolean;
  openCallModal: (appointment?: Appointment, patient?: Patient) => void;
  closeCallModal: () => void;

  // New appointment modal
  isNewAppointmentOpen: boolean;
  setIsNewAppointmentOpen: (open: boolean) => void;

  // Add patient modal
  isAddPatientOpen: boolean;
  setIsAddPatientOpen: (open: boolean) => void;

  // Reschedule modal
  rescheduleAppointmentData: Appointment | null;
  setRescheduleAppointmentData: (apt: Appointment | null) => void;

  // Notification drawer
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;
  unreadNotificationCount: number;

  // Actions
  addPatient: (data: Omit<Patient, 'id' | 'patientId' | 'hospitalId' | 'createdAt' | 'updatedAt'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => Patient | null;
  
  createAppointment: (data: Omit<Appointment, 'id' | 'appointmentId' | 'hospitalId' | 'createdAt' | 'updatedAt'>) => { success: boolean; appointment?: Appointment; error?: string };
  updateAppointmentStatus: (id: string, status: Appointment['status'], reason?: string) => void;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => { success: boolean; appointment?: Appointment; error?: string };
  
  addConsultation: (data: Omit<Consultation, 'id' | 'consultationId' | 'hospitalId' | 'createdAt'>) => Consultation;
  addPrescription: (data: Omit<Prescription, 'id' | 'prescriptionId' | 'hospitalId' | 'createdAt'>) => Prescription;
  addLabOrder: (data: Omit<LabOrder, 'id' | 'labOrderId' | 'hospitalId' | 'createdAt'>) => LabOrder;
  updateLabOrderStatus: (id: string, status: LabOrder['status'], result?: string) => void;
  addInvoice: (data: Omit<Invoice, 'id' | 'invoiceId' | 'hospitalId' | 'createdAt'>) => Invoice;
  updateInvoiceStatus: (id: string, status: Invoice['status'], paymentMethod?: Invoice['paymentMethod']) => void;

  recordAICall: (data: Omit<CallRecord, 'id' | 'callId' | 'hospitalId' | 'createdAt'>) => CallRecord;
  triggerAppointmentConfirmationCall: (appointmentId: string, forceRetry?: boolean) => Promise<{ success: boolean; callId?: string; status?: Appointment['aiCallStatus']; error?: string; duplicateBlocked?: boolean }>;
  resolveCallback: (callId: string) => void;
  markNotificationAsRead: (id: string) => void;

  updateHospitalSettings: (settings: Partial<HospitalSettings>) => void;
  updateAICallingSettings: (settings: Partial<AICallingSettings>) => void;
  resetToDemoData: () => void;
}

const MedFlowContext = createContext<MedFlowContextType | undefined>(undefined);

export function MedFlowProvider({ children }: { children: React.ReactNode }) {
  const { hospitalId, profile } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(storageService.getHospitalSettings(hospitalId));
  const [aiCallingSettings, setAiCallingSettings] = useState<AICallingSettings>(storageService.getAICallingSettings(hospitalId));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal & Drawer states
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [rescheduleAppointmentData, setRescheduleAppointmentData] = useState<Appointment | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Active call modal
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] = useState<Appointment | null>(null);
  const [activeCallPatient, setActiveCallPatient] = useState<Patient | null>(null);

  const loadData = useCallback(() => {
    if (!hospitalId) return;
    setPatients(storageService.getPatients(hospitalId));
    setDoctors(storageService.getDoctors(hospitalId));
    setAppointments(storageService.getAppointments(hospitalId));
    setConsultations(storageService.getConsultations(hospitalId));
    setPrescriptions(storageService.getPrescriptions(hospitalId));
    setLabOrders(storageService.getLabOrders(hospitalId));
    setInvoices(storageService.getInvoices(hospitalId));
    setCalls(storageService.getCalls(hospitalId));
    setNotifications(storageService.getNotifications(hospitalId));
    setHospitalSettings(storageService.getHospitalSettings(hospitalId));
    setAiCallingSettings(storageService.getAICallingSettings(hospitalId));
    setAuditLogs(storageService.getAuditLogs(hospitalId));
  }, [hospitalId]);

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });

    const handleCustomChange = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleCustomChange);
      window.addEventListener('medflow_data_changed', handleCustomChange);
      window.addEventListener('medflow_call_updated', handleCustomChange);
    }

    // Auto-sync interval for live calling status updates
    const syncTimer = setInterval(loadData, 2500);

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleCustomChange);
        window.removeEventListener('medflow_data_changed', handleCustomChange);
        window.removeEventListener('medflow_call_updated', handleCustomChange);
      }
      clearInterval(syncTimer);
    };
  }, [loadData]);

  const openCallModal = (appointment?: Appointment, patient?: Patient) => {
    if (appointment) {
      setActiveCallAppointment(appointment);
      const pat = patient || storageService.getPatientById(hospitalId, appointment.patientId);
      setActiveCallPatient(pat || null);
    } else if (patient) {
      setActiveCallPatient(patient);
      const patApt = appointments.find((a) => a.patientId === patient.id && a.status === 'scheduled');
      setActiveCallAppointment(patApt || null);
    } else {
      const scheduledApt = appointments.find((a) => a.status === 'scheduled') || appointments[0];
      setActiveCallAppointment(scheduledApt || null);
      if (scheduledApt) {
        setActiveCallPatient(storageService.getPatientById(hospitalId, scheduledApt.patientId) || null);
      }
    }
    setIsCallModalOpen(true);
  };

  const closeCallModal = () => {
    setIsCallModalOpen(false);
    setActiveCallAppointment(null);
    setActiveCallPatient(null);
  };

  // Actions wrapped with storageService & tenant validation
  const addPatient = (data: Omit<Patient, 'id' | 'patientId' | 'hospitalId' | 'createdAt' | 'updatedAt'>) => {
    return storageService.addPatient(hospitalId, data, profile || undefined);
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    return storageService.updatePatient(hospitalId, id, updates, profile || undefined);
  };

  const createAppointment = (data: Omit<Appointment, 'id' | 'appointmentId' | 'hospitalId' | 'createdAt' | 'updatedAt'>) => {
    return storageService.createAppointment(hospitalId, data, profile || undefined);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status'], reason?: string) => {
    storageService.updateAppointmentStatus(hospitalId, id, status, reason, profile || undefined);
  };

  const rescheduleAppointment = (id: string, newDate: string, newTime: string) => {
    return storageService.rescheduleAppointment(hospitalId, id, newDate, newTime, profile || undefined);
  };

  const addConsultation = (data: Omit<Consultation, 'id' | 'consultationId' | 'hospitalId' | 'createdAt'>) => {
    return storageService.addConsultation(hospitalId, data, profile || undefined);
  };

  const addPrescription = (data: Omit<Prescription, 'id' | 'prescriptionId' | 'hospitalId' | 'createdAt'>) => {
    return storageService.addPrescription(hospitalId, data, profile || undefined);
  };

  const addLabOrder = (data: Omit<LabOrder, 'id' | 'labOrderId' | 'hospitalId' | 'createdAt'>) => {
    return storageService.addLabOrder(hospitalId, data, profile || undefined);
  };

  const updateLabOrderStatus = (id: string, status: LabOrder['status'], result?: string) => {
    storageService.updateLabOrderStatus(hospitalId, id, status, result, profile || undefined);
  };

  const addInvoice = (data: Omit<Invoice, 'id' | 'invoiceId' | 'hospitalId' | 'createdAt'>) => {
    return storageService.addInvoice(hospitalId, data, profile || undefined);
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status'], paymentMethod?: Invoice['paymentMethod']) => {
    storageService.updateInvoiceStatus(hospitalId, id, status, paymentMethod, profile || undefined);
  };

  const recordAICall = (data: Omit<CallRecord, 'id' | 'callId' | 'hospitalId' | 'createdAt'>) => {
    return storageService.recordAICall(hospitalId, data, profile || undefined);
  };

  const triggerAppointmentConfirmationCall = async (appointmentId: string, forceRetry: boolean = false) => {
    return storageService.triggerAppointmentConfirmationCall(hospitalId, appointmentId, profile || undefined, forceRetry);
  };

  const resolveCallback = (callId: string) => {
    storageService.resolveCallback(hospitalId, callId, profile || undefined);
  };

  const markNotificationAsRead = (id: string) => {
    storageService.markNotificationAsRead(hospitalId, id);
  };

  const updateHospitalSettings = (settings: Partial<HospitalSettings>) => {
    storageService.updateHospitalSettings(hospitalId, settings, profile || undefined);
  };

  const updateAICallingSettings = (settings: Partial<AICallingSettings>) => {
    storageService.updateAICallingSettings(hospitalId, settings, profile || undefined);
  };

  const resetToDemoData = () => {
    storageService.initDefaultData(true);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <MedFlowContext.Provider
      value={{
        patients,
        doctors,
        appointments,
        consultations,
        prescriptions,
        labOrders,
        invoices,
        calls,
        notifications,
        hospitalSettings,
        aiCallingSettings,
        auditLogs,
        selectedPatientId,
        setSelectedPatientId,
        activeCallAppointment,
        activeCallPatient,
        isCallModalOpen,
        openCallModal,
        closeCallModal,
        isNewAppointmentOpen,
        setIsNewAppointmentOpen,
        isAddPatientOpen,
        setIsAddPatientOpen,
        rescheduleAppointmentData,
        setRescheduleAppointmentData,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        unreadNotificationCount,
        addPatient,
        updatePatient,
        createAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        addConsultation,
        addPrescription,
        addLabOrder,
        updateLabOrderStatus,
        addInvoice,
        updateInvoiceStatus,
        recordAICall,
        triggerAppointmentConfirmationCall,
        resolveCallback,
        markNotificationAsRead,
        updateHospitalSettings,
        updateAICallingSettings,
        resetToDemoData
      }}
    >
      {children}
    </MedFlowContext.Provider>
  );
}

export function useMedFlow() {
  const context = useContext(MedFlowContext);
  if (!context) {
    throw new Error('useMedFlow must be used within a MedFlowProvider');
  }
  return context;
}
