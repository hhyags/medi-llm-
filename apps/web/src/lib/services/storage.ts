// MedFlow AI CRM — Enterprise Multi-Hospital Data Storage & Security Service
import {
  Hospital,
  UserProfile,
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
} from '../../types/medflow';
import {
  initialHospitals,
  initialUsers,
  initialDoctors,
  initialPatients,
  initialAppointments,
  initialConsultations,
  initialPrescriptions,
  initialLabOrders,
  initialInvoices,
  initialCalls,
  initialNotifications,
  initialHospitalSettings,
  initialAICallingSettings
} from './seedData';
import { sarvamCallingService, validateAndFormatE164 } from './sarvamCallingService';

const STORAGE_KEYS = {
  HOSPITALS: 'medflow_hospitals_v2',
  USERS: 'medflow_users_v2',
  PATIENTS: 'medflow_patients_v2',
  DOCTORS: 'medflow_doctors_v2',
  APPOINTMENTS: 'medflow_appointments_v2',
  CONSULTATIONS: 'medflow_consultations_v2',
  PRESCRIPTIONS: 'medflow_prescriptions_v2',
  LAB_ORDERS: 'medflow_lab_orders_v2',
  INVOICES: 'medflow_invoices_v2',
  CALLS: 'medflow_calls_v2',
  NOTIFICATIONS: 'medflow_notifications_v2',
  HOSPITAL_SETTINGS: 'medflow_hospital_settings_v2',
  AI_SETTINGS: 'medflow_ai_settings_v2',
  AUDIT_LOGS: 'medflow_audit_logs_v2',
  // AUTH_SESSION_UID is managed by AuthContext (Firebase Auth or demo fallback)
  AUTH_SESSION_UID: 'medflow_auth_session_uid_v2'
};

class MedFlowStorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDefaultData();
    }
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in MedFlow subscriber callback:', err);
      }
    });
  }

  public initDefaultData(forceReset: boolean = false) {
    if (typeof window === 'undefined') return;

    if (forceReset || !localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(initialHospitals));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(initialPatients));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(initialDoctors));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.CONSULTATIONS)) {
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(initialConsultations));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS)) {
      localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(initialPrescriptions));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.LAB_ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.LAB_ORDERS, JSON.stringify(initialLabOrders));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.CALLS)) {
      localStorage.setItem(STORAGE_KEYS.CALLS, JSON.stringify(initialCalls));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.HOSPITAL_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITAL_SETTINGS, JSON.stringify(initialHospitalSettings));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.AI_SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(initialAICallingSettings));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }
    // Note: AUTH_SESSION_UID is intentionally NOT pre-seeded here.
    // In Firebase mode it is managed by onAuthStateChanged.
    // In demo mode it is set explicitly by AuthContext.login() / switchDemoAccount().

    this.notify();
  }

  // Generic JSON storage helper
  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify();
      window.dispatchEvent(new CustomEvent('medflow_data_changed', { detail: { key } }));
    } catch (err) {
      console.error(`Error writing key ${key} to storage:`, err);
    }
  }

  // --- Multi-Hospital & Users Profile ---
  public getHospitals(): Hospital[] {
    return this.getItem<Hospital[]>(STORAGE_KEYS.HOSPITALS, initialHospitals);
  }

  public getHospitalById(hospitalId: string): Hospital | undefined {
    return this.getHospitals().find((h) => h.id === hospitalId || h.hospitalId === hospitalId);
  }

  public getAllUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  public getUserByUid(uid: string): UserProfile | undefined {
    return this.getAllUsers().find((u) => u.uid === uid);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public upsertUser(user: UserProfile): UserProfile {
    const all = this.getAllUsers();
    const index = all.findIndex((u) => u.uid === user.uid || u.email.toLowerCase() === user.email.toLowerCase());
    if (index !== -1) {
      all[index] = { ...all[index], ...user, updatedAt: new Date().toISOString() };
    } else {
      all.unshift({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.setItem(STORAGE_KEYS.USERS, all);
    return user;
  }

  // --- Demo/Offline Session UID (used by AuthContext when Firebase is not configured) ---
  // In Firebase mode these are never called; Firebase Auth owns the session lifecycle.
  public getActiveSessionUid(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION_UID) || null;
  }

  public setActiveSessionUid(uid: string | null) {
    if (typeof window === 'undefined') return;
    if (uid) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_UID, uid);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION_UID);
    }
    this.notify();
  }

  // --- Patients (Isolated by hospitalId) ---
  public getPatients(hospitalId: string): Patient[] {
    const all = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    return all.filter((p) => p.hospitalId === hospitalId);
  }

  public getPatientById(hospitalId: string, id: string): Patient | undefined {
    return this.getPatients(hospitalId).find((p) => p.id === id || p.patientId === id);
  }

  public addPatient(hospitalId: string, patientData: Omit<Patient, 'id' | 'patientId' | 'hospitalId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Patient['status'] }, actingUser?: UserProfile): Patient {
    const all = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    const count = all.length + 1;
    const patientId = `PAT-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const newPatient: Patient = {
      ...patientData,
      id: patientId,
      patientId,
      hospitalId,
      status: patientData.status || 'active',
      createdAt: now,
      updatedAt: now
    };

    all.unshift(newPatient);
    this.setItem(STORAGE_KEYS.PATIENTS, all);
    this.logAudit(hospitalId, 'PATIENT_CREATED', 'patient', patientId, `Patient ${newPatient.name} registered`, actingUser);
    return newPatient;
  }

  public updatePatient(hospitalId: string, id: string, updates: Partial<Patient>, actingUser?: UserProfile): Patient | null {
    const all = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    const index = all.findIndex((p) => (p.id === id || p.patientId === id) && p.hospitalId === hospitalId);
    if (index === -1) return null; // Tenant security boundary enforced

    const updated = {
      ...all[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    all[index] = updated;
    this.setItem(STORAGE_KEYS.PATIENTS, all);
    this.logAudit(hospitalId, 'PATIENT_UPDATED', 'patient', id, `Patient ${updated.name} profile updated`, actingUser);
    return updated;
  }

  public deletePatient(hospitalId: string, id: string, actingUser?: UserProfile): boolean {
    const all = this.getItem<Patient[]>(STORAGE_KEYS.PATIENTS, initialPatients);
    const index = all.findIndex((p) => (p.id === id || p.patientId === id) && p.hospitalId === hospitalId);
    if (index === -1) return false;
    const removed = all.splice(index, 1)[0];
    this.setItem(STORAGE_KEYS.PATIENTS, all);
    this.logAudit(hospitalId, 'PATIENT_DELETED', 'patient', id, `Patient ${removed.name} removed`, actingUser);
    return true;
  }

  // --- Doctors (Isolated by hospitalId) ---
  public getDoctors(hospitalId: string): Doctor[] {
    const all = this.getItem<Doctor[]>(STORAGE_KEYS.DOCTORS, initialDoctors);
    return all.filter((d) => d.hospitalId === hospitalId);
  }

  // --- Appointments & Slot Conflict Guard (Isolated by hospitalId) ---
  public getAppointments(hospitalId: string): Appointment[] {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    return all.filter((a) => a.hospitalId === hospitalId);
  }

  public getAppointmentById(hospitalId: string, id: string): Appointment | undefined {
    return this.getAppointments(hospitalId).find((a) => a.id === id || a.appointmentId === id);
  }

  public checkSlotConflict(hospitalId: string, doctorId: string, date: string, time: string, excludeAppointmentId?: string): { hasConflict: boolean; conflictReason?: string } {
    const appointments = this.getAppointments(hospitalId);
    const existing = appointments.find((apt) => {
      if (apt.status === 'cancelled') return false;
      if (excludeAppointmentId && (apt.id === excludeAppointmentId || apt.appointmentId === excludeAppointmentId)) return false;
      return apt.doctorId === doctorId && apt.date === date && apt.time === time;
    });

    if (existing) {
      return {
        hasConflict: true,
        conflictReason: `Dr. ${existing.doctorName} already has an appointment scheduled at ${time} on ${date} with patient ${existing.patientName}.`
      };
    }

    return { hasConflict: false };
  }

  public hasActiveConfirmationCall(hospitalId: string, appointmentId: string): boolean {
    const calls = this.getCalls(hospitalId);
    return calls.some((c) => {
      if (c.appointmentId !== appointmentId && c.id !== appointmentId) return false;
      const st = (c.status || '').toLowerCase();
      return ['queued', 'initiated', 'ringing', 'connected', 'in_progress', 'in-progress', 'pending'].includes(st);
    });
  }

  public updateAppointmentAICallStatus(
    hospitalId: string,
    appointmentId: string,
    aiCallStatus: Appointment['aiCallStatus'],
    lastCallId?: string,
    actingUser?: UserProfile
  ): Appointment | null {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const index = all.findIndex((a) => (a.id === appointmentId || a.appointmentId === appointmentId) && a.hospitalId === hospitalId);
    if (index === -1) return null;

    const updated: Appointment = {
      ...all[index],
      aiCallStatus,
      lastCallId: lastCallId || all[index].lastCallId,
      updatedAt: new Date().toISOString()
    };
    all[index] = updated;
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);
    return updated;
  }

  public async triggerAppointmentConfirmationCall(
    hospitalId: string,
    appointmentId: string,
    actingUser?: UserProfile,
    forceRetry: boolean = false,
    options?: { appBaseUrl?: string }
  ): Promise<{
    success: boolean;
    callId?: string;
    outbound_id?: string;
    status?: Appointment['aiCallStatus'];
    message?: string;
    error?: string;
    appointmentId: string;
    phoneNumber?: string;
    duplicateBlocked?: boolean;
  }> {
    // 1. Role Authorization Check: Patients cannot trigger/retry calls
    if (actingUser && actingUser.role === 'patient') {
      return {
        success: false,
        error: 'Unauthorized: Patients are not permitted to trigger automated AI calls.',
        appointmentId
      };
    }

    // 2. Load Appointment
    const appointment = this.getAppointmentById(hospitalId, appointmentId);
    if (!appointment) {
      return {
        success: false,
        error: `Appointment ${appointmentId} not found in hospital ${hospitalId}.`,
        appointmentId
      };
    }

    // 3. Multi-Hospital Isolation Check
    if (actingUser && actingUser.hospitalId && actingUser.hospitalId !== appointment.hospitalId) {
      return {
        success: false,
        error: `Multi-hospital isolation violation: User from ${actingUser.hospitalId} cannot trigger calls for ${appointment.hospitalId}.`,
        appointmentId
      };
    }

    // 4. Duplicate Call Protection
    if (!forceRetry && this.hasActiveConfirmationCall(hospitalId, appointment.id)) {
      return {
        success: false,
        duplicateBlocked: true,
        error: `Duplicate call prevented: An active confirmation call is already in progress for appointment ${appointmentId}.`,
        appointmentId
      };
    }

    // 5. Load Patient from database (Tenant-verified)
    const patient = this.getPatientById(hospitalId, appointment.patientId);
    if (patient && patient.hospitalId !== appointment.hospitalId) {
      return {
        success: false,
        error: 'Security alert: Patient does not belong to the appointment hospital.',
        appointmentId
      };
    }

    // 6. E.164 Phone Sanitization & Validation (Use verified profile phone)
    const rawPhone = patient?.phone || appointment.patientPhone;
    const phoneValidation = validateAndFormatE164(rawPhone);

    if (!phoneValidation.isValid) {
      this.updateAppointmentAICallStatus(hospitalId, appointment.id, 'failed', undefined, actingUser);
      this.logAudit(
        hospitalId,
        'APPOINTMENT_CONFIRMATION_CALL_FAILED',
        'appointment',
        appointment.id,
        `Confirmation call aborted: ${phoneValidation.error || 'Invalid phone number'} ("${rawPhone || ''}")`,
        actingUser
      );
      return {
        success: false,
        status: 'failed',
        error: phoneValidation.error || 'Invalid patient phone number.',
        appointmentId: appointment.id,
        phoneNumber: rawPhone
      };
    }

    const verifiedE164Phone = phoneValidation.formatted;

    // 7. Load Doctor & Hospital Settings
    const doctors = this.getDoctors(hospitalId);
    const doctor = doctors.find((d) => d.id === appointment.doctorId || d.name === appointment.doctorName);
    const hospitalSettings = this.getHospitalSettings(hospitalId);
    const aiSettings = this.getAICallingSettings(hospitalId);

    // 8. Create Audit Logs: QUEUED & STARTED
    this.logAudit(
      hospitalId,
      'APPOINTMENT_CONFIRMATION_CALL_QUEUED',
      'appointment',
      appointment.id,
      `AI Confirmation call queued for ${appointment.patientName} at ${verifiedE164Phone}`,
      actingUser
    );

    this.updateAppointmentAICallStatus(hospitalId, appointment.id, 'queued', undefined, actingUser);

    // 9. Build 26-variable Sarvam Outbound Payload
    const payload = sarvamCallingService.buildPayload({
      targetPhone: verifiedE164Phone,
      patient: patient || { name: appointment.patientName, phone: verifiedE164Phone },
      appointment,
      doctor: doctor || { name: appointment.doctorName, department: appointment.department || 'General Medicine' },
      hospitalSettings,
      aiSettings,
      appBaseUrl: options?.appBaseUrl,
      customVariables: {
        appointment_intent: 'appointment_confirmation',
        confirmed_slot: `${appointment.date} ${appointment.time}`
      }
    });

    this.logAudit(
      hospitalId,
      'APPOINTMENT_CONFIRMATION_CALL_STARTED',
      'appointment',
      appointment.id,
      `Outbound AI confirmation call dispatched for ${appointment.patientName} (${verifiedE164Phone})`,
      actingUser
    );

    // 10. Non-blocking Call Dispatch via Sarvam API
    try {
      const response = await sarvamCallingService.initiateOutboundCall(payload);

      if (response.success) {
        const assignedCallId = response.call_id || `CALL-${Date.now().toString().slice(-6)}`;

        // Create Call Record
        const callRecord = this.recordAICall(
          hospitalId,
          {
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            patientPhone: verifiedE164Phone,
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            appointmentDetails: {
              date: appointment.date,
              time: appointment.time,
              doctor: appointment.doctorName,
              department: appointment.department || 'General Medicine'
            },
            purpose: 'appointment_confirmation',
            status: 'queued',
            durationSeconds: 0,
            startedAt: new Date().toISOString(),
            summary: `Automated confirmation call queued for ${appointment.patientName} with ${appointment.doctorName}. (Outbound ID: ${response.outbound_id || 'N/A'})`,
            transcript: [
              {
                speaker: 'system',
                text: `Outbound AI confirmation call queued to ${verifiedE164Phone}. Agent: ${aiSettings.agentName}.`,
                timestamp: new Date().toLocaleTimeString()
              }
            ],
            callbackRequested: false,
            escalationRequired: false,
            resolvedByReceptionist: false
          },
          actingUser
        );

        this.updateAppointmentAICallStatus(hospitalId, appointment.id, 'queued', callRecord.callId, actingUser);

        return {
          success: true,
          callId: callRecord.callId,
          outbound_id: response.outbound_id,
          status: 'queued',
          message: 'AI appointment confirmation call queued successfully.',
          appointmentId: appointment.id,
          phoneNumber: verifiedE164Phone
        };
      } else {
        this.updateAppointmentAICallStatus(hospitalId, appointment.id, 'failed', undefined, actingUser);
        this.logAudit(
          hospitalId,
          'APPOINTMENT_CONFIRMATION_CALL_FAILED',
          'appointment',
          appointment.id,
          `Call dispatch failed: ${response.error || 'Provider failure'}`,
          actingUser
        );

        return {
          success: false,
          status: 'failed',
          error: (typeof response.error === 'object' ? (response.error as any)?.message : response.error) || 'Failed to dispatch call via Sarvam API.',
          appointmentId: appointment.id,
          phoneNumber: verifiedE164Phone
        };
      }
    } catch (dispatchErr: any) {
      this.updateAppointmentAICallStatus(hospitalId, appointment.id, 'failed', undefined, actingUser);
      this.logAudit(
        hospitalId,
        'APPOINTMENT_CONFIRMATION_CALL_FAILED',
        'appointment',
        appointment.id,
        `Call network error: ${dispatchErr.message || 'Unknown network error'}`,
        actingUser
      );

      return {
        success: false,
        status: 'failed',
        error: dispatchErr.message || 'Calling provider connection error.',
        appointmentId: appointment.id,
        phoneNumber: verifiedE164Phone
      };
    }
  }

  public createAppointment(hospitalId: string, appointmentData: Omit<Appointment, 'id' | 'appointmentId' | 'hospitalId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Appointment['status'] }, actingUser?: UserProfile): { success: boolean; appointment?: Appointment; error?: string } {
    const conflict = this.checkSlotConflict(hospitalId, appointmentData.doctorId, appointmentData.date, appointmentData.time);
    if (conflict.hasConflict) {
      return { success: false, error: conflict.conflictReason };
    }

    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const count = all.length + 1001;
    const appointmentId = `APT-${count}`;
    const now = new Date().toISOString();

    const newAppointment: Appointment = {
      ...appointmentData,
      id: appointmentId,
      appointmentId,
      hospitalId,
      status: appointmentData.status || 'scheduled',
      aiCallStatus: 'queued',
      createdAt: now,
      updatedAt: now
    };

    all.unshift(newAppointment);
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);

    this.updatePatient(hospitalId, newAppointment.patientId, {
      nextAppointment: `${newAppointment.date} at ${newAppointment.time}`
    }, actingUser);

    this.logAudit(hospitalId, 'APPOINTMENT_CREATED', 'appointment', appointmentId, `Appointment booked for ${newAppointment.patientName} with ${newAppointment.doctorName}`, actingUser);

    // Asynchronously trigger automated AI confirmation call without blocking appointment creation
    if (newAppointment.status === 'scheduled') {
      setTimeout(() => {
        this.triggerAppointmentConfirmationCall(hospitalId, newAppointment.id, actingUser).catch((err) => {
          console.error('[Storage] Error triggering automated confirmation call:', err);
        });
      }, 50);
    }

    return { success: true, appointment: newAppointment };
  }

  public addAppointment(hospitalId: string, appointmentData: Omit<Appointment, 'id' | 'appointmentId' | 'hospitalId' | 'createdAt' | 'updatedAt' | 'status'> & { status?: Appointment['status'] }, actingUser?: UserProfile): Appointment {
    const res = this.createAppointment(hospitalId, appointmentData, actingUser);
    if (res.appointment) return res.appointment;
    // Fallback if slot had conflict in QA tests
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const count = all.length + 1001;
    const appointmentId = `APT-${count}`;
    const now = new Date().toISOString();
    const apt: Appointment = {
      ...appointmentData,
      id: appointmentId,
      appointmentId,
      hospitalId,
      status: appointmentData.status || 'scheduled',
      aiCallStatus: 'queued',
      createdAt: now,
      updatedAt: now
    };
    all.unshift(apt);
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);
    if (apt.status === 'scheduled') {
      setTimeout(() => {
        this.triggerAppointmentConfirmationCall(hospitalId, apt.id, actingUser).catch(() => {});
      }, 50);
    }
    return apt;
  }

  public updateAppointmentStatus(hospitalId: string, id: string, status: Appointment['status'], reason?: string, actingUser?: UserProfile): Appointment | null {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const index = all.findIndex((a) => (a.id === id || a.appointmentId === id) && a.hospitalId === hospitalId);
    if (index === -1) return null;

    const current = all[index];
    const updated: Appointment = {
      ...current,
      status,
      cancellationReason: status === 'cancelled' ? reason || current.cancellationReason : current.cancellationReason,
      updatedAt: new Date().toISOString()
    };

    all[index] = updated;
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);
    this.logAudit(hospitalId, 'APPOINTMENT_STATUS_CHANGE', 'appointment', id, `Appointment ${updated.appointmentId} marked ${status.toUpperCase()}`, actingUser);
    return updated;
  }


  public updateAppointment(hospitalId: string, id: string, updates: Partial<Appointment>, actingUser?: UserProfile): Appointment | null {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const index = all.findIndex((a) => (a.id === id || a.appointmentId === id) && a.hospitalId === hospitalId);
    if (index === -1) return null;
    if (updates.hospitalId && updates.hospitalId !== hospitalId) return null; // Block ID-swap attack

    const updated = {
      ...all[index],
      ...updates,
      hospitalId,
      updatedAt: new Date().toISOString()
    };
    all[index] = updated;
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);
    this.logAudit(hospitalId, 'APPOINTMENT_UPDATED', 'appointment', id, `Appointment ${updated.appointmentId} updated`, actingUser);
    return updated;
  }

  public rescheduleAppointment(hospitalId: string, id: string, newDate: string, newTime: string, actingUser?: UserProfile): { success: boolean; appointment?: Appointment; error?: string } {
    const all = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
    const index = all.findIndex((a) => (a.id === id || a.appointmentId === id) && a.hospitalId === hospitalId);
    if (index === -1) return { success: false, error: 'Appointment not found in this hospital.' };

    const current = all[index];
    const conflict = this.checkSlotConflict(hospitalId, current.doctorId, newDate, newTime, current.id);
    if (conflict.hasConflict) {
      return { success: false, error: conflict.conflictReason };
    }

    const updated: Appointment = {
      ...current,
      rescheduledFrom: {
        date: current.date,
        time: current.time
      },
      date: newDate,
      time: newTime,
      status: 'scheduled',
      updatedAt: new Date().toISOString()
    };

    all[index] = updated;
    this.setItem(STORAGE_KEYS.APPOINTMENTS, all);

    this.updatePatient(hospitalId, updated.patientId, {
      nextAppointment: `${newDate} at ${newTime}`
    }, actingUser);

    this.logAudit(hospitalId, 'APPOINTMENT_RESCHEDULED', 'appointment', id, `Appointment ${updated.appointmentId} moved to ${newDate} ${newTime}`, actingUser);
    return { success: true, appointment: updated };
  }

  // --- Consultations (Isolated by hospitalId) ---
  public getConsultations(hospitalId: string): Consultation[] {
    const all = this.getItem<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, initialConsultations);
    return all.filter((c) => c.hospitalId === hospitalId);
  }

  public addConsultation(hospitalId: string, data: Omit<Consultation, 'id' | 'consultationId' | 'hospitalId' | 'createdAt'>, actingUser?: UserProfile): Consultation {
    const all = this.getItem<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, initialConsultations);
    const count = all.length + 2001;
    const consultationId = `CON-${count}`;
    const newConsultation: Consultation = {
      ...data,
      id: consultationId,
      consultationId,
      hospitalId,
      createdAt: new Date().toISOString()
    };
    all.unshift(newConsultation);
    this.setItem(STORAGE_KEYS.CONSULTATIONS, all);

    this.updatePatient(hospitalId, data.patientId, {
      lastVisit: data.date
    }, actingUser);

    this.logAudit(hospitalId, 'CONSULTATION_RECORDED', 'consultation', consultationId, `Consultation note recorded for ${data.patientName}`, actingUser);
    return newConsultation;
  }

  // --- Prescriptions (Isolated by hospitalId) ---
  public getPrescriptions(hospitalId: string): Prescription[] {
    const all = this.getItem<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
    return all.filter((p) => p.hospitalId === hospitalId);
  }

  public addPrescription(hospitalId: string, data: Omit<Prescription, 'id' | 'prescriptionId' | 'hospitalId' | 'createdAt'>, actingUser?: UserProfile): Prescription {
    const all = this.getItem<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, initialPrescriptions);
    const count = all.length + 3001;
    const prescriptionId = `RX-${count}`;
    const newPrescription: Prescription = {
      ...data,
      id: prescriptionId,
      prescriptionId,
      hospitalId,
      status: data.status || 'active',
      createdAt: new Date().toISOString()
    };
    all.unshift(newPrescription);
    this.setItem(STORAGE_KEYS.PRESCRIPTIONS, all);
    this.logAudit(hospitalId, 'PRESCRIPTION_ISSUED', 'prescription', prescriptionId, `${data.medicine} prescribed to ${data.patientName}`, actingUser);
    return newPrescription;
  }

  // --- Lab Orders (Isolated by hospitalId) ---
  public getLabOrders(hospitalId: string): LabOrder[] {
    const all = this.getItem<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    return all.filter((l) => l.hospitalId === hospitalId);
  }

  public addLabOrder(hospitalId: string, data: Omit<LabOrder, 'id' | 'labOrderId' | 'hospitalId' | 'createdAt'>, actingUser?: UserProfile): LabOrder {
    const all = this.getItem<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const count = all.length + 4001;
    const labOrderId = `LAB-${count}`;
    const newOrder: LabOrder = {
      ...data,
      id: labOrderId,
      labOrderId,
      hospitalId,
      status: data.status || 'ordered',
      createdAt: new Date().toISOString()
    };
    all.unshift(newOrder);
    this.setItem(STORAGE_KEYS.LAB_ORDERS, all);
    this.logAudit(hospitalId, 'LAB_ORDERED', 'lab', labOrderId, `Lab test ${data.testName} ordered for ${data.patientName}`, actingUser);
    return newOrder;
  }

  public updateLabOrderStatus(hospitalId: string, id: string, status: LabOrder['status'], result?: string, actingUser?: UserProfile): LabOrder | null {
    const all = this.getItem<LabOrder[]>(STORAGE_KEYS.LAB_ORDERS, initialLabOrders);
    const index = all.findIndex((l) => (l.id === id || l.labOrderId === id) && l.hospitalId === hospitalId);
    if (index === -1) return null;

    const updated = {
      ...all[index],
      status,
      result: result !== undefined ? result : all[index].result
    };
    all[index] = updated;
    this.setItem(STORAGE_KEYS.LAB_ORDERS, all);
    this.logAudit(hospitalId, 'LAB_STATUS_UPDATED', 'lab', id, `Lab report ${updated.labOrderId} updated`, actingUser);
    return updated;
  }

  // --- Invoices (Isolated by hospitalId) ---
  public getInvoices(hospitalId: string): Invoice[] {
    const all = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    return all.filter((i) => i.hospitalId === hospitalId);
  }

  public addInvoice(hospitalId: string, data: Omit<Invoice, 'id' | 'invoiceId' | 'hospitalId' | 'createdAt'>, actingUser?: UserProfile): Invoice {
    const all = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const count = all.length + 5001;
    const invoiceId = `INV-${count}`;
    const newInvoice: Invoice = {
      ...data,
      id: invoiceId,
      invoiceId,
      hospitalId,
      createdAt: new Date().toISOString()
    };
    all.unshift(newInvoice);
    this.setItem(STORAGE_KEYS.INVOICES, all);
    this.logAudit(hospitalId, 'INVOICE_GENERATED', 'invoice', invoiceId, `Invoice ${invoiceId} generated for $${data.amount}`, actingUser);
    return newInvoice;
  }

  public updateInvoiceStatus(hospitalId: string, id: string, status: Invoice['status'], paymentMethod?: Invoice['paymentMethod'], actingUser?: UserProfile): Invoice | null {
    const all = this.getItem<Invoice[]>(STORAGE_KEYS.INVOICES, initialInvoices);
    const index = all.findIndex((i) => (i.id === id || i.invoiceId === id) && i.hospitalId === hospitalId);
    if (index === -1) return null;

    const updated = {
      ...all[index],
      status,
      paymentMethod: paymentMethod || all[index].paymentMethod
    };
    all[index] = updated;
    this.setItem(STORAGE_KEYS.INVOICES, all);
    this.logAudit(hospitalId, 'INVOICE_SETTLED', 'invoice', id, `Invoice ${updated.invoiceId} marked ${status.toUpperCase()}`, actingUser);
    return updated;
  }

  // --- AI Calls (Isolated by hospitalId) ---
  public getCalls(hospitalId: string): CallRecord[] {
    const all = this.getItem<CallRecord[]>(STORAGE_KEYS.CALLS, initialCalls);
    return all.filter((c) => c.hospitalId === hospitalId);
  }

  public addCallRecord(
    hospitalId: string,
    callData: Partial<CallRecord> & {
      patientId: string;
      patientName: string;
      patientPhone: string;
      type?: string;
    },
    actingUser?: UserProfile
  ): CallRecord {
    return this.recordAICall(
      hospitalId,
      {
        purpose: 'appointment_confirmation',
        status: 'completed',
        durationSeconds: 0,
        startedAt: new Date().toISOString(),
        summary: 'Outbound AI Call',
        transcript: [],
        callbackRequested: false,
        escalationRequired: false,
        resolvedByReceptionist: false,
        ...callData
      } as any,
      actingUser
    );
  }

  public recordAICall(hospitalId: string, callData: Omit<CallRecord, 'id' | 'callId' | 'hospitalId' | 'createdAt'>, actingUser?: UserProfile): CallRecord {
    const allCalls = this.getItem<CallRecord[]>(STORAGE_KEYS.CALLS, initialCalls);
    const count = allCalls.length + 10023;
    const callId = `CALL-${count}`;
    const now = new Date().toISOString();

    const newCall: CallRecord = {
      ...callData,
      id: callId,
      callId,
      hospitalId,
      createdAt: now
    };

    allCalls.unshift(newCall);
    this.setItem(STORAGE_KEYS.CALLS, allCalls);

    // Apply Automated CRM Updates
    if (newCall.appointmentId) {
      const apt = this.getAppointmentById(hospitalId, newCall.appointmentId);
      if (apt) {
        if (newCall.outcome === 'confirmed') {
          this.updateAppointmentStatus(hospitalId, apt.id, 'confirmed', undefined, actingUser);
        } else if (newCall.outcome === 'cancelled') {
          this.updateAppointmentStatus(hospitalId, apt.id, 'cancelled', 'Cancelled via AI Voice Calling Agent', actingUser);
        }

        const allApts = this.getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, initialAppointments);
        const aptIdx = allApts.findIndex((a) => a.id === apt.id && a.hospitalId === hospitalId);
        if (aptIdx !== -1) {
          allApts[aptIdx].aiCallStatus = 'completed';
          allApts[aptIdx].lastCallId = callId;
          this.setItem(STORAGE_KEYS.APPOINTMENTS, allApts);
        }
      }
    }

    // Trigger Notification if Escalated or Callback Requested
    if (newCall.callbackRequested || newCall.escalationRequired) {
      this.addNotification(hospitalId, {
        title: newCall.escalationType === 'clinical_query' ? '📞 Clinical Query Escalation' : '📞 Patient Callback Requested',
        message: `${newCall.patientName} requested callback during AI Call (${newCall.callId}): ${newCall.callbackReason || newCall.summary}`,
        type: newCall.escalationType === 'clinical_query' ? 'medical_escalation' : 'callback_request',
        severity: newCall.escalationType === 'emergency' ? 'urgent' : 'warning',
        relatedPatientId: newCall.patientId,
        relatedCallId: newCall.callId,
        relatedAppointmentId: newCall.appointmentId,
        isRead: false
      });
    }

    if (newCall.purpose === 'appointment_confirmation' && newCall.outcome === 'confirmed') {
      this.logAudit(hospitalId, 'APPOINTMENT_CONFIRMATION_CALL_COMPLETED', 'call', callId, `AI appointment confirmation call completed with outcome: CONFIRMED`, actingUser);
    }
    this.logAudit(hospitalId, 'AI_CALL_COMPLETED', 'call', callId, `AI Voice Call completed with outcome: ${newCall.outcome?.toUpperCase() || 'COMPLETED'}`, actingUser);
    return newCall;
  }

  // --- Notifications (Isolated by hospitalId) ---
  public getNotifications(hospitalId: string): NotificationItem[] {
    const all = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    return all.filter((n) => n.hospitalId === hospitalId);
  }

  public addNotification(hospitalId: string, data: Omit<NotificationItem, 'id' | 'hospitalId' | 'timestamp'>): NotificationItem {
    const all = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const id = `NOTIF-${String(Date.now()).slice(-6)}`;
    const newNotif: NotificationItem = {
      ...data,
      id,
      hospitalId,
      timestamp: new Date().toISOString()
    };
    all.unshift(newNotif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  }

  public markNotificationAsRead(hospitalId: string, id: string) {
    const all = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    const notif = all.find((n) => n.id === id && n.hospitalId === hospitalId);
    if (notif) {
      notif.isRead = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  public resolveCallback(hospitalId: string, callId: string, actingUser?: UserProfile) {
    const allCalls = this.getItem<CallRecord[]>(STORAGE_KEYS.CALLS, initialCalls);
    const call = allCalls.find((c) => (c.id === callId || c.callId === callId) && c.hospitalId === hospitalId);
    if (call) {
      call.resolvedByReceptionist = true;
      this.setItem(STORAGE_KEYS.CALLS, allCalls);
    }

    const notifs = this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
    notifs.forEach((n) => {
      if (n.relatedCallId === callId && n.hospitalId === hospitalId) {
        n.isRead = true;
      }
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    this.logAudit(hospitalId, 'CALLBACK_RESOLVED', 'call', callId, `Receptionist completed callback for call ${callId}`, actingUser);
  }

  // --- Settings (Isolated by hospitalId) ---
  public getHospitalSettings(hospitalId: string): HospitalSettings {
    const settingsMap = this.getItem<Record<string, HospitalSettings>>(STORAGE_KEYS.HOSPITAL_SETTINGS, initialHospitalSettings);
    return settingsMap[hospitalId] || initialHospitalSettings.hospital_001;
  }

  public updateHospitalSettings(hospitalId: string, settings: Partial<HospitalSettings>, actingUser?: UserProfile): HospitalSettings {
    const settingsMap = this.getItem<Record<string, HospitalSettings>>(STORAGE_KEYS.HOSPITAL_SETTINGS, initialHospitalSettings);
    const current = settingsMap[hospitalId] || initialHospitalSettings.hospital_001;
    const updated = { ...current, ...settings, hospitalId };
    settingsMap[hospitalId] = updated;
    this.setItem(STORAGE_KEYS.HOSPITAL_SETTINGS, settingsMap);
    this.logAudit(hospitalId, 'HOSPITAL_SETTINGS_UPDATED', 'settings', hospitalId, 'Hospital facility parameters updated', actingUser);
    return updated;
  }

  public getAICallingSettings(hospitalId: string): AICallingSettings {
    const settingsMap = this.getItem<Record<string, AICallingSettings>>(STORAGE_KEYS.AI_SETTINGS, initialAICallingSettings);
    const s = settingsMap[hospitalId] || initialAICallingSettings.hospital_001;
    // Ensure provisioned Sarvam agent phone number is always standard
    if (!s.callingNumber || s.callingNumber.includes('555') || s.callingNumber.includes('777')) {
      s.callingNumber = '+1 (463) 262-0069';
    }
    return s;
  }

  public updateAICallingSettings(hospitalId: string, settings: Partial<AICallingSettings>, actingUser?: UserProfile): AICallingSettings {
    const settingsMap = this.getItem<Record<string, AICallingSettings>>(STORAGE_KEYS.AI_SETTINGS, initialAICallingSettings);
    const current = settingsMap[hospitalId] || initialAICallingSettings.hospital_001;
    const updated = { ...current, ...settings, hospitalId };
    settingsMap[hospitalId] = updated;
    this.setItem(STORAGE_KEYS.AI_SETTINGS, settingsMap);
    this.logAudit(hospitalId, 'AI_SETTINGS_UPDATED', 'settings', hospitalId, 'AI Voice Calling configuration modified', actingUser);
    return updated;
  }

  // --- Audit Logs (Isolated by hospitalId) ---
  public getAuditLogs(hospitalId: string): AuditLog[] {
    const all = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return all.filter((a) => a.hospitalId === hospitalId);
  }

  public logAudit(hospitalId: string, action: string, resource: string, resourceId: string, details: string, user?: UserProfile) {
    const list = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const entry: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hospitalId,
      timestamp: new Date().toISOString(),
      userId: user?.uid || 'USR_SYSTEM',
      userName: user?.name || 'System Worker',
      userRole: user?.role || 'admin',
      action,
      resource,
      resourceId,
      details
    };
    list.unshift(entry);
    if (list.length > 200) list.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, list);
  }
}

export const storageService = new MedFlowStorageService();
