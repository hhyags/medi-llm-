// MedFlow AI CRM — Core Type Definitions with Multi-Hospital Architecture

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'patient';

export interface Hospital {
  id: string;
  hospitalId: string;
  name: string;
  tagline?: string;
  phone: string;
  emergencyHotline: string;
  address: string;
  workingHours: string;
  email: string;
  website: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hospitalId: string;
  department?: string;
  specialization?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  patientId: string; // e.g. PAT-001
  hospitalId: string;
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'male' | 'female' | 'other';
  bloodGroup?: string;
  address?: string;
  medicalNotes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  lastVisit?: string;
  nextAppointment?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  doctorId: string; // e.g. DOC-001
  uid?: string;
  hospitalId: string;
  name: string;
  specialization: string;
  department: string;
  phone: string;
  email: string;
  availableDays: string[];
  timeSlots: string[];
  consultationFee: number;
  status: 'active' | 'inactive';
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'waiting' | 'completed' | 'cancelled';
export type AppointmentType = 'General Consultation' | 'Specialist Follow-up' | 'Lab Review' | 'Urgent / OPD' | 'Vaccination';

export interface Appointment {
  id: string;
  appointmentId: string; // e.g. APT-1001
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorDepartment?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  status: AppointmentStatus;
  appointmentType?: AppointmentType | string;
  type?: string;
  reason?: string;
  notes?: string;
  cancellationReason?: string;
  rescheduledFrom?: {
    date: string;
    time: string;
  };
  aiCallStatus?: CallStatus;
  lastCallId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  consultationId: string; // e.g. CON-2001
  hospitalId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  notes: string;
  followUpDate?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weightKg?: number;
  };
  createdAt: string;
}

export interface Prescription {
  id: string;
  prescriptionId: string; // e.g. RX-3001
  hospitalId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultationId?: string;
  date: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  createdAt: string;
}

export interface LabOrder {
  id: string;
  labOrderId: string; // e.g. LAB-4001
  hospitalId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Pathology';
  date: string;
  status: 'ordered' | 'processing' | 'reported';
  result?: string;
  normalRange?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceId: string; // e.g. INV-5001
  hospitalId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  amount: number;
  description: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  status: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'Cash' | 'Credit Card' | 'Insurance' | 'UPI / Online';
  date: string;
  createdAt: string;
}

export type CallPurpose = 'appointment_confirmation' | 'appointment_reminder' | 'follow_up' | 'rescheduling' | 'cancellation_check';
export type CallStatus = 'not_started' | 'queued' | 'initiated' | 'ringing' | 'connected' | 'in_progress' | 'in-progress' | 'completed' | 'missed' | 'failed' | 'no_answer' | 'busy' | 'cancelled' | 'pending';
export type CallOutcome = 'confirmed' | 'rescheduled' | 'cancelled' | 'callback_requested' | 'unanswered' | 'no_answer' | 'busy' | 'escalated_medical' | 'failed';

export interface CallDialogueTurn {
  speaker: 'ai' | 'patient' | 'system';
  text: string;
  timestamp: string;
  intentDetected?: string;
}

export interface CallRecord {
  id: string;
  callId: string; // e.g. CALL-10023
  hospitalId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentDetails?: {
    date: string;
    time: string;
    doctor: string;
    department: string;
  };
  purpose: CallPurpose;
  status: CallStatus;
  outcome?: CallOutcome;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  summary: string;
  transcript: CallDialogueTurn[];
  callbackRequested: boolean;
  callbackReason?: string;
  escalationRequired: boolean;
  escalationType?: 'clinical_query' | 'human_agent_requested' | 'slot_unavailable' | 'emergency';
  resolvedByReceptionist?: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  hospitalId: string;
  title: string;
  message: string;
  type: 'callback_request' | 'medical_escalation' | 'appointment_conflict' | 'system';
  severity: 'info' | 'warning' | 'urgent';
  relatedPatientId?: string;
  relatedCallId?: string;
  relatedAppointmentId?: string;
  isRead: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  hospitalId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource?: string;
  resourceId?: string;
  details: string;
}

export interface HospitalSettings {
  hospitalId: string;
  name: string;
  tagline: string;
  phone: string;
  emergencyHotline: string;
  address: string;
  workingHours: string;
  email: string;
  website: string;
}

export interface AICallingSettings {
  hospitalId: string;
  agentName: string;
  voicePersona: 'Aria (Neural Gentle)' | 'Ethan (Neural Professional)' | 'Maya (Warm Healthcare)' | 'Leo (Clear Confident)';
  language: 'English' | 'Hindi (हिन्दी)' | 'Telugu (తెలుగు)' | 'Spanish (Español)';
  callingNumber: string;
  callTimeoutSeconds: number;
  maxRetryAttempts: number;
  preferences: {
    appointmentReminders: boolean;
    appointmentConfirmations: boolean;
    followUpCalls: boolean;
    allowRescheduling: boolean;
    createCallbackRequests: boolean;
    safetyGuardrailDisclaimer: boolean;
  };
}
