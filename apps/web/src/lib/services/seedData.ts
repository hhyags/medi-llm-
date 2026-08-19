// MedFlow AI CRM — Enterprise Multi-Hospital Demo Seed Data
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
  AICallingSettings
} from '../../types/medflow';

export const initialHospitals: Hospital[] = [
  {
    id: 'hospital_001',
    hospitalId: 'hospital_001',
    name: 'MedFlow City Memorial Hospital',
    tagline: 'Leading Patient Care & AI-Assisted Clinical Operations',
    phone: '+1 (800) 555-6337',
    emergencyHotline: '+1 (800) 555-9111 (24/7 ER)',
    address: '450 Healthcare Boulevard, Suite 100, Metro Health District',
    workingHours: 'Mon - Sat: 08:00 AM - 08:00 PM | Sun: Emergency Only',
    email: 'contact@medflowhospital.com',
    website: 'https://medflow-city.health',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'hospital_002',
    hospitalId: 'hospital_002',
    name: 'MedFlow St. Jude Medical Center',
    tagline: 'Excellence in Tertiary Specialty Care',
    phone: '+1 (800) 777-4321',
    emergencyHotline: '+1 (800) 777-9999 (24/7 ER)',
    address: '890 St. Jude Parkway, Westside Medical Complex',
    workingHours: 'Mon - Sun: 24/7 Full Facility',
    email: 'info@stjude.medflow.health',
    website: 'https://stjude.medflow.health',
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z'
  }
];

export const initialHospitalSettings: Record<string, HospitalSettings> = {
  hospital_001: {
    hospitalId: 'hospital_001',
    name: 'MedFlow City Memorial Hospital',
    tagline: 'Leading Patient Care & AI-Assisted Clinical Operations',
    phone: '+1 (800) 555-6337',
    emergencyHotline: '+1 (800) 555-9111 (24/7 ER)',
    address: '450 Healthcare Boulevard, Suite 100, Metro Health District',
    workingHours: 'Mon - Sat: 08:00 AM - 08:00 PM | Sun: Emergency Only',
    email: 'reception@medflowhospital.com',
    website: 'https://medflow-hospital.health'
  },
  hospital_002: {
    hospitalId: 'hospital_002',
    name: 'MedFlow St. Jude Medical Center',
    tagline: 'Excellence in Tertiary Specialty Care',
    phone: '+1 (800) 777-4321',
    emergencyHotline: '+1 (800) 777-9999 (24/7 ER)',
    address: '890 St. Jude Parkway, Westside Medical Complex',
    workingHours: 'Mon - Sun: 24/7 Full Facility',
    email: 'info@stjude.medflow.health',
    website: 'https://stjude.medflow.health'
  }
};

export const initialAICallingSettings: Record<string, AICallingSettings> = {
  hospital_001: {
    hospitalId: 'hospital_001',
    agentName: 'Aria — MedFlow Voice Assistant',
    voicePersona: 'Aria (Neural Gentle)',
    language: 'English',
    callingNumber: '+1 (800) 555-6337',
    callTimeoutSeconds: 45,
    maxRetryAttempts: 2,
    preferences: {
      appointmentReminders: true,
      appointmentConfirmations: true,
      followUpCalls: true,
      allowRescheduling: true,
      createCallbackRequests: true,
      safetyGuardrailDisclaimer: true
    }
  },
  hospital_002: {
    hospitalId: 'hospital_002',
    agentName: 'Ethan — St. Jude AI Assistant',
    voicePersona: 'Ethan (Neural Professional)',
    language: 'English',
    callingNumber: '+1 (800) 777-4321',
    callTimeoutSeconds: 50,
    maxRetryAttempts: 3,
    preferences: {
      appointmentReminders: true,
      appointmentConfirmations: true,
      followUpCalls: true,
      allowRescheduling: true,
      createCallbackRequests: true,
      safetyGuardrailDisclaimer: true
    }
  }
};

export const initialUsers: UserProfile[] = [
  // --- Hospital 001 Users ---
  // Multiple Admins for Hospital 001
  {
    uid: 'UID_ADMIN_001',
    name: 'Elena Rostova',
    email: 'admin1@medflow.com',
    phone: '+1 (555) 011-3322',
    role: 'admin',
    hospitalId: 'hospital_001',
    department: 'Hospital Administration',
    status: 'active',
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z'
  },
  {
    uid: 'UID_ADMIN_002',
    name: 'Marcus Vance',
    email: 'admin2@medflow.com',
    phone: '+1 (555) 011-3344',
    role: 'admin',
    hospitalId: 'hospital_001',
    department: 'Operations & Clinical Quality',
    status: 'active',
    createdAt: '2026-01-02T08:00:00Z',
    updatedAt: '2026-01-02T08:00:00Z'
  },
  // Doctors for Hospital 001
  {
    uid: 'UID_DOC_001',
    name: 'Dr. Meera Patel, MD',
    email: 'doctor1@medflow.com',
    phone: '+1 (555) 014-9921',
    role: 'doctor',
    hospitalId: 'hospital_001',
    department: 'Cardiology',
    specialization: 'Consultant Cardiologist',
    status: 'active',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-05T09:00:00Z'
  },
  {
    uid: 'UID_DOC_002',
    name: 'Dr. Arjun Verma, MD',
    email: 'doctor2@medflow.com',
    phone: '+1 (555) 018-7734',
    role: 'doctor',
    hospitalId: 'hospital_001',
    department: 'Internal Medicine',
    specialization: 'Internal Medicine & Diabetologist',
    status: 'active',
    createdAt: '2026-01-08T09:30:00Z',
    updatedAt: '2026-01-08T09:30:00Z'
  },
  // Receptionist for Hospital 001
  {
    uid: 'UID_REC_001',
    name: 'Sarah Jenkins',
    email: 'reception1@medflow.com',
    phone: '+1 (555) 019-2831',
    role: 'receptionist',
    hospitalId: 'hospital_001',
    department: 'Front Desk & Patient Triage',
    status: 'active',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  },
  // Patient for Hospital 001
  {
    uid: 'UID_PAT_001',
    name: 'Rahul Sharma',
    email: 'patient1@gmail.com',
    phone: '+1 (555) 234-5678',
    role: 'patient',
    hospitalId: 'hospital_001',
    status: 'active',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z'
  },

  // --- Hospital 002 Users ---
  // Admin for Hospital 002
  {
    uid: 'UID_ADMIN_003',
    name: 'Dr. David Vance',
    email: 'admin3@medflow.com',
    phone: '+1 (555) 022-8811',
    role: 'admin',
    hospitalId: 'hospital_002',
    department: 'Executive Board',
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z'
  },
  // Doctor for Hospital 002
  {
    uid: 'UID_DOC_003',
    name: 'Dr. Robert King, MD',
    email: 'doctor3@medflow.com',
    phone: '+1 (555) 022-4455',
    role: 'doctor',
    hospitalId: 'hospital_002',
    department: 'Neurology',
    specialization: 'Senior Neurologist',
    status: 'active',
    createdAt: '2026-01-16T09:00:00Z',
    updatedAt: '2026-01-16T09:00:00Z'
  },
  // Receptionist for Hospital 002
  {
    uid: 'UID_REC_002',
    name: 'Emily Watson',
    email: 'reception2@medflow.com',
    phone: '+1 (555) 022-9900',
    role: 'receptionist',
    hospitalId: 'hospital_002',
    department: 'Admission Counter',
    status: 'active',
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-18T08:00:00Z'
  },
  // Patient for Hospital 002
  {
    uid: 'UID_PAT_002',
    name: 'Alex Turner',
    email: 'patient2@gmail.com',
    phone: '+1 (555) 022-1144',
    role: 'patient',
    hospitalId: 'hospital_002',
    status: 'active',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z'
  }
];

export const initialDoctors: Doctor[] = [
  {
    id: 'DOC-001',
    doctorId: 'DOC-001',
    uid: 'UID_DOC_001',
    hospitalId: 'hospital_001',
    name: 'Dr. Meera Patel, MD',
    specialization: 'Consultant Cardiologist',
    department: 'Cardiology',
    phone: '+1 (555) 014-9921',
    email: 'doctor1@medflow.com',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'],
    consultationFee: 150,
    status: 'active'
  },
  {
    id: 'DOC-002',
    doctorId: 'DOC-002',
    uid: 'UID_DOC_002',
    hospitalId: 'hospital_001',
    name: 'Dr. Arjun Verma, MD',
    specialization: 'Internal Medicine & Diabetologist',
    department: 'Internal Medicine',
    phone: '+1 (555) 018-7734',
    email: 'doctor2@medflow.com',
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    timeSlots: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
    consultationFee: 120,
    status: 'active'
  },
  {
    id: 'DOC-003',
    doctorId: 'DOC-003',
    uid: 'UID_DOC_003',
    hospitalId: 'hospital_002',
    name: 'Dr. Robert King, MD',
    specialization: 'Senior Neurologist',
    department: 'Neurology',
    phone: '+1 (555) 022-4455',
    email: 'doctor3@medflow.com',
    availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
    timeSlots: ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00'],
    consultationFee: 180,
    status: 'active'
  }
];

export const initialPatients: Patient[] = [
  // Hospital 001 Patients
  {
    id: 'PAT-001',
    patientId: 'PAT-001',
    hospitalId: 'hospital_001',
    name: 'Rahul Sharma',
    phone: '+1 (555) 234-5678',
    email: 'patient1@gmail.com',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    address: '742 Evergreen Terrace, Sector 4, Metro City',
    medicalNotes: 'Known case of mild essential hypertension. No known drug allergies.',
    emergencyContact: {
      name: 'Pooja Sharma',
      phone: '+1 (555) 234-5679',
      relation: 'Spouse'
    },
    lastVisit: '2026-08-05',
    nextAppointment: '2026-08-20 at 10:30 AM',
    status: 'active',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-08-15T14:30:00Z'
  },
  {
    id: 'PAT-002',
    patientId: 'PAT-002',
    hospitalId: 'hospital_001',
    name: 'Priya Sharma',
    phone: '+1 (555) 876-5432',
    email: 'priya.s@example.com',
    age: 29,
    gender: 'Female',
    bloodGroup: 'O+',
    address: '108 Riverside Blvd, Apt 4B, Metro City',
    medicalNotes: 'Type-2 Diabetes mellitus under dietary control with Metformin. Penicillin allergic.',
    emergencyContact: {
      name: 'Anil Sharma',
      phone: '+1 (555) 876-5400',
      relation: 'Brother'
    },
    lastVisit: '2026-08-10',
    nextAppointment: '2026-08-19 at 11:00 AM',
    status: 'active',
    createdAt: '2026-02-01T11:20:00Z',
    updatedAt: '2026-08-18T09:15:00Z'
  },
  {
    id: 'PAT-003',
    patientId: 'PAT-003',
    hospitalId: 'hospital_001',
    name: 'Kiran Kumar',
    phone: '+1 (555) 432-1098',
    email: 'kiran.k@example.com',
    age: 48,
    gender: 'Male',
    bloodGroup: 'A+',
    address: '32 Lakeview Avenue, Green Valley',
    medicalNotes: 'Post-CABG cardiac rehab follow-up. Statin therapy ongoing.',
    emergencyContact: {
      name: 'Sunita Kumar',
      phone: '+1 (555) 432-1090',
      relation: 'Spouse'
    },
    lastVisit: '2026-07-28',
    nextAppointment: '2026-08-19 at 09:30 AM',
    status: 'active',
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-08-12T16:00:00Z'
  },
  {
    id: 'PAT-004',
    patientId: 'PAT-004',
    hospitalId: 'hospital_001',
    name: 'Ananya Deshmukh',
    phone: '+1 (555) 765-4321',
    email: 'ananya.d@example.com',
    age: 24,
    gender: 'Female',
    bloodGroup: 'AB+',
    address: '15 Highline Heights, Tech District',
    medicalNotes: 'Seasonal allergic rhinitis and mild asthma.',
    emergencyContact: {
      name: 'Rajesh Deshmukh',
      phone: '+1 (555) 765-4300',
      relation: 'Father'
    },
    lastVisit: '2026-08-12',
    nextAppointment: '2026-08-21 at 14:00 PM',
    status: 'active',
    createdAt: '2026-03-05T09:40:00Z',
    updatedAt: '2026-08-12T10:30:00Z'
  },

  // Hospital 002 Patient (Isolated)
  {
    id: 'PAT-201',
    patientId: 'PAT-201',
    hospitalId: 'hospital_002',
    name: 'Alex Turner',
    phone: '+1 (555) 022-1144',
    email: 'patient2@gmail.com',
    age: 41,
    gender: 'Male',
    bloodGroup: 'O+',
    address: '99 St. Jude Blvd, Westside',
    medicalNotes: 'Chronic migraine with visual aura.',
    status: 'active',
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z'
  }
];

export const initialAppointments: Appointment[] = [
  // Hospital 001 Appointments
  {
    id: 'APT-1001',
    appointmentId: 'APT-1001',
    hospitalId: 'hospital_001',
    patientId: 'PAT-001',
    patientName: 'Rahul Sharma',
    patientPhone: '+1 (555) 234-5678',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    doctorSpecialization: 'Consultant Cardiologist',
    department: 'Cardiology',
    date: '2026-08-20',
    time: '10:30',
    durationMinutes: 30,
    status: 'scheduled',
    appointmentType: 'Specialist Follow-up',
    reason: '6-Month Cardiac Review & Blood Pressure evaluation',
    notes: 'Patient requested AI appointment reminder call.',
    aiCallStatus: 'pending',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'APT-1002',
    appointmentId: 'APT-1002',
    hospitalId: 'hospital_001',
    patientId: 'PAT-002',
    patientName: 'Priya Sharma',
    patientPhone: '+1 (555) 876-5432',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    doctorSpecialization: 'Internal Medicine & Diabetologist',
    department: 'Internal Medicine',
    date: '2026-08-19',
    time: '11:00',
    durationMinutes: 30,
    status: 'waiting',
    appointmentType: 'General Consultation',
    reason: 'Fasting Blood Sugar & HbA1c Lab Report Review',
    notes: 'Arrived at reception, waiting in lounge 2.',
    aiCallStatus: 'completed',
    lastCallId: 'CALL-10022',
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-19T10:45:00Z'
  },
  {
    id: 'APT-1003',
    appointmentId: 'APT-1003',
    hospitalId: 'hospital_001',
    patientId: 'PAT-003',
    patientName: 'Kiran Kumar',
    patientPhone: '+1 (555) 432-1098',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    doctorSpecialization: 'Consultant Cardiologist',
    department: 'Cardiology',
    date: '2026-08-19',
    time: '09:30',
    durationMinutes: 30,
    status: 'completed',
    appointmentType: 'Specialist Follow-up',
    reason: 'Post-CABG Exercise Tolerance ECG Review',
    notes: 'Vitals stable. ECG normal. Next follow-up in 3 months.',
    aiCallStatus: 'completed',
    lastCallId: 'CALL-10020',
    createdAt: '2026-08-12T14:30:00Z',
    updatedAt: '2026-08-19T10:15:00Z'
  },
  {
    id: 'APT-1004',
    appointmentId: 'APT-1004',
    hospitalId: 'hospital_001',
    patientId: 'PAT-004',
    patientName: 'Ananya Deshmukh',
    patientPhone: '+1 (555) 765-4321',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    doctorSpecialization: 'Internal Medicine & Diabetologist',
    department: 'Internal Medicine',
    date: '2026-08-21',
    time: '14:00',
    durationMinutes: 30,
    status: 'confirmed',
    appointmentType: 'General Consultation',
    reason: 'Seasonal asthma exacerbation & inhaler adjustment',
    aiCallStatus: 'completed',
    lastCallId: 'CALL-10021',
    createdAt: '2026-08-16T16:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },

  // Hospital 002 Appointment
  {
    id: 'APT-2001',
    appointmentId: 'APT-2001',
    hospitalId: 'hospital_002',
    patientId: 'PAT-201',
    patientName: 'Alex Turner',
    patientPhone: '+1 (555) 022-1144',
    doctorId: 'DOC-003',
    doctorName: 'Dr. Robert King, MD',
    doctorSpecialization: 'Senior Neurologist',
    department: 'Neurology',
    date: '2026-08-22',
    time: '11:00',
    durationMinutes: 45,
    status: 'scheduled',
    appointmentType: 'Specialist Follow-up',
    reason: 'Brain MRI Review & Preventive Migraine Therapy',
    aiCallStatus: 'pending',
    createdAt: '2026-08-17T11:00:00Z',
    updatedAt: '2026-08-17T11:00:00Z'
  }
];

export const initialConsultations: Consultation[] = [
  {
    id: 'CON-2001',
    consultationId: 'CON-2001',
    hospitalId: 'hospital_001',
    patientId: 'PAT-003',
    patientName: 'Kiran Kumar',
    appointmentId: 'APT-1003',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    date: '2026-08-19',
    diagnosis: 'Post-CABG Coronary Artery Disease (Stable, NYHA Class I)',
    symptoms: ['Mild exertional dyspnea (resolved)', 'Good exercise tolerance'],
    notes: 'Patient reports walking 4km daily without chest discomfort. Blood pressure well controlled at 122/78 mmHg. Resting ECG shows normal sinus rhythm. Continue current medications.',
    followUpDate: '2026-11-19',
    vitals: {
      bloodPressure: '122/78 mmHg',
      heartRate: '68 bpm',
      temperature: '98.4 F',
      weightKg: 74
    },
    createdAt: '2026-08-19T10:15:00Z'
  },
  {
    id: 'CON-2002',
    consultationId: 'CON-2002',
    hospitalId: 'hospital_001',
    patientId: 'PAT-001',
    patientName: 'Rahul Sharma',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    date: '2026-08-05',
    diagnosis: 'Primary Stage 1 Essential Hypertension',
    symptoms: ['Occasional morning occipital headache', 'Mild fatigue'],
    notes: 'Office BP recorded at 138/88 mmHg. Advised DASH diet, reduced sodium intake, and regular aerobic exercise. Initiated Telmisartan 40mg once daily in morning. Scheduled 2-week follow-up.',
    followUpDate: '2026-08-20',
    vitals: {
      bloodPressure: '138/88 mmHg',
      heartRate: '72 bpm',
      temperature: '98.6 F',
      weightKg: 81
    },
    createdAt: '2026-08-05T11:00:00Z'
  }
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'RX-3001',
    prescriptionId: 'RX-3001',
    hospitalId: 'hospital_001',
    patientId: 'PAT-001',
    patientName: 'Rahul Sharma',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    consultationId: 'CON-2002',
    date: '2026-08-05',
    medicine: 'Telmisartan 40mg Tablets',
    dosage: '40mg',
    frequency: 'Once daily (Morning after breakfast)',
    duration: '30 days',
    instructions: 'Take regularly at the same time each morning. Monitor BP twice weekly.',
    status: 'active',
    createdAt: '2026-08-05T11:15:00Z'
  },
  {
    id: 'RX-3002',
    prescriptionId: 'RX-3002',
    hospitalId: 'hospital_001',
    patientId: 'PAT-002',
    patientName: 'Priya Sharma',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    date: '2026-08-10',
    medicine: 'Metformin Hydrochloride 1000mg (Extended Release)',
    dosage: '1000mg',
    frequency: 'Twice daily with meals (Breakfast & Dinner)',
    duration: '60 days',
    instructions: 'Do not crush or chew. Maintain adequate hydration.',
    status: 'active',
    createdAt: '2026-08-10T14:45:00Z'
  }
];

export const initialLabOrders: LabOrder[] = [
  {
    id: 'LAB-4001',
    labOrderId: 'LAB-4001',
    hospitalId: 'hospital_001',
    patientId: 'PAT-002',
    patientName: 'Priya Sharma',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    testName: 'Fasting Blood Glucose & HbA1c Glycated Hemoglobin',
    category: 'Biochemistry',
    date: '2026-08-18',
    status: 'reported',
    result: 'Fasting Blood Sugar: 134 mg/dL | HbA1c: 7.4% (Suboptimal control)',
    normalRange: 'FBS: 70-99 mg/dL | HbA1c: < 5.7%',
    notes: 'Results uploaded to patient portal.',
    createdAt: '2026-08-16T09:00:00Z'
  },
  {
    id: 'LAB-4002',
    labOrderId: 'LAB-4002',
    hospitalId: 'hospital_001',
    patientId: 'PAT-001',
    patientName: 'Rahul Sharma',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    testName: 'Complete Lipid Profile & Serum Electrolytes',
    category: 'Biochemistry',
    date: '2026-08-20',
    status: 'ordered',
    notes: 'Scheduled for morning collection prior to consultation.',
    createdAt: '2026-08-15T09:15:00Z'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'INV-5001',
    invoiceId: 'INV-5001',
    hospitalId: 'hospital_001',
    patientId: 'PAT-003',
    patientName: 'Kiran Kumar',
    appointmentId: 'APT-1003',
    amount: 150,
    description: 'Specialist Cardiology Follow-up & Resting ECG',
    items: [
      { name: 'Cardiology Consultation', quantity: 1, unitPrice: 120 },
      { name: '12-Lead Resting ECG', quantity: 1, unitPrice: 30 }
    ],
    status: 'paid',
    paymentMethod: 'Credit Card',
    date: '2026-08-19',
    createdAt: '2026-08-19T10:30:00Z'
  },
  {
    id: 'INV-5002',
    invoiceId: 'INV-5002',
    hospitalId: 'hospital_001',
    patientId: 'PAT-002',
    patientName: 'Priya Sharma',
    appointmentId: 'APT-1002',
    amount: 175,
    description: 'Internal Medicine Consult + Comprehensive Metabolic Panel',
    items: [
      { name: 'Consultation Fee', quantity: 1, unitPrice: 120 },
      { name: 'HbA1c & Fasting Glucose Panel', quantity: 1, unitPrice: 55 }
    ],
    status: 'pending',
    paymentMethod: 'Insurance',
    date: '2026-08-19',
    createdAt: '2026-08-19T10:50:00Z'
  },
  {
    id: 'INV-5003',
    invoiceId: 'INV-5003',
    hospitalId: 'hospital_001',
    patientId: 'PAT-001',
    patientName: 'Rahul Sharma',
    amount: 150,
    description: 'Cardiology Initial Workup & Vitals Assessment',
    items: [
      { name: 'Cardiology Initial Visit', quantity: 1, unitPrice: 150 }
    ],
    status: 'paid',
    paymentMethod: 'UPI / Online',
    date: '2026-08-05',
    createdAt: '2026-08-05T11:30:00Z'
  }
];

export const initialCalls: CallRecord[] = [
  {
    id: 'CALL-10020',
    callId: 'CALL-10020',
    hospitalId: 'hospital_001',
    patientId: 'PAT-003',
    patientName: 'Kiran Kumar',
    patientPhone: '+1 (555) 432-1098',
    appointmentId: 'APT-1003',
    doctorId: 'DOC-001',
    doctorName: 'Dr. Meera Patel, MD',
    appointmentDetails: {
      date: '2026-08-19',
      time: '09:30',
      doctor: 'Dr. Meera Patel, MD',
      department: 'Cardiology'
    },
    purpose: 'appointment_confirmation',
    status: 'completed',
    outcome: 'confirmed',
    durationSeconds: 84,
    startedAt: '2026-08-18T16:00:00Z',
    endedAt: '2026-08-18T16:01:24Z',
    summary: 'Patient confirmed attendance for 19 Aug at 09:30 AM with Dr. Meera Patel. Inquired about bringing previous ECG records, which was affirmed.',
    transcript: [
      {
        speaker: 'ai',
        text: "Hello Kiran, I'm Aria calling from MedFlow City Memorial Hospital regarding your cardiology follow-up tomorrow, August 19th at 9:30 AM with Dr. Meera Patel. Would you like to confirm your appointment?",
        timestamp: '16:00:02',
        intentDetected: 'greeting_and_confirmation_prompt'
      },
      {
        speaker: 'patient',
        text: 'Yes, hello! I will definitely be there. Should I bring my previous ECG report?',
        timestamp: '16:00:15',
        intentDetected: 'confirm_appointment'
      },
      {
        speaker: 'ai',
        text: 'Wonderful! Your appointment is confirmed for tomorrow at 9:30 AM. Yes, bringing your previous reports is always helpful for the doctor. We look forward to seeing you.',
        timestamp: '16:00:25',
        intentDetected: 'confirm_and_close'
      }
    ],
    callbackRequested: false,
    escalationRequired: false,
    createdAt: '2026-08-18T16:01:24Z'
  },
  {
    id: 'CALL-10021',
    callId: 'CALL-10021',
    hospitalId: 'hospital_001',
    patientId: 'PAT-004',
    patientName: 'Ananya Deshmukh',
    patientPhone: '+1 (555) 765-4321',
    appointmentId: 'APT-1004',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    appointmentDetails: {
      date: '2026-08-21',
      time: '14:00',
      doctor: 'Dr. Arjun Verma, MD',
      department: 'Internal Medicine'
    },
    purpose: 'rescheduling',
    status: 'completed',
    outcome: 'rescheduled',
    durationSeconds: 112,
    startedAt: '2026-08-18T11:30:00Z',
    endedAt: '2026-08-18T11:31:52Z',
    summary: 'Patient had a university conflict for 20 Aug 10:00 AM. AI checked availability and rescheduled to Friday 21 Aug at 2:00 PM with Dr. Arjun Verma.',
    transcript: [
      {
        speaker: 'ai',
        text: "Hello Ananya, this is Aria from MedFlow Hospital calling to confirm your appointment on Thursday August 20th at 10:00 AM with Dr. Arjun Verma. Are you available for this slot?",
        timestamp: '11:30:05',
        intentDetected: 'confirmation_prompt'
      },
      {
        speaker: 'patient',
        text: "Hi Aria, unfortunately I have an exam at that time. Is it possible to reschedule to Friday afternoon instead?",
        timestamp: '11:30:18',
        intentDetected: 'request_reschedule'
      },
      {
        speaker: 'ai',
        text: "I can check that for you right now. Dr. Arjun Verma has an opening on Friday, August 21st at 2:00 PM. Would you like me to book that slot for you?",
        timestamp: '11:30:30',
        intentDetected: 'suggest_slots'
      }
    ],
    callbackRequested: false,
    escalationRequired: false,
    createdAt: '2026-08-18T11:31:52Z'
  },
  {
    id: 'CALL-10022',
    callId: 'CALL-10022',
    hospitalId: 'hospital_001',
    patientId: 'PAT-002',
    patientName: 'Priya Sharma',
    patientPhone: '+1 (555) 876-5432',
    appointmentId: 'APT-1002',
    doctorId: 'DOC-002',
    doctorName: 'Dr. Arjun Verma, MD',
    appointmentDetails: {
      date: '2026-08-19',
      time: '11:00',
      doctor: 'Dr. Arjun Verma, MD',
      department: 'Internal Medicine'
    },
    purpose: 'appointment_confirmation',
    status: 'completed',
    outcome: 'callback_requested',
    durationSeconds: 98,
    startedAt: '2026-08-18T17:15:00Z',
    endedAt: '2026-08-18T17:16:38Z',
    summary: 'Patient confirmed the 11:00 AM appointment but asked clinical questions regarding increasing her Metformin dose. AI applied safety guardrail and scheduled a receptionist callback.',
    transcript: [
      {
        speaker: 'ai',
        text: "Hello Priya, this is Aria from MedFlow City Hospital calling regarding your appointment with Dr. Arjun Verma tomorrow at 11:00 AM. Would you like to confirm?",
        timestamp: '17:15:02',
        intentDetected: 'confirmation_prompt'
      },
      {
        speaker: 'patient',
        text: "Yes, I will be there. But my blood sugar was 160 this morning. Should I double my Metformin tablet tonight?",
        timestamp: '17:15:15',
        intentDetected: 'clinical_dosage_query'
      },
      {
        speaker: 'ai',
        text: "I am unable to provide clinical advice or adjust medication dosages as I am an AI assistant. I have placed an urgent callback request so our clinical team can call you right back with proper guidance.",
        timestamp: '17:15:30',
        intentDetected: 'safety_guardrail_triggered'
      }
    ],
    callbackRequested: true,
    callbackReason: 'Patient asked clinical advice about doubling Metformin dosage following high blood sugar reading.',
    escalationRequired: true,
    escalationType: 'clinical_query',
    resolvedByReceptionist: false,
    createdAt: '2026-08-18T17:16:38Z'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    hospitalId: 'hospital_001',
    title: '📞 Clinical Callback Requested',
    message: 'Priya Sharma (PAT-002) asked about doubling Metformin dosage during AI confirmation call. Action needed.',
    type: 'medical_escalation',
    severity: 'urgent',
    relatedPatientId: 'PAT-002',
    relatedCallId: 'CALL-10022',
    relatedAppointmentId: 'APT-1002',
    isRead: false,
    timestamp: '2026-08-18T17:16:40Z'
  },
  {
    id: 'NOTIF-002',
    hospitalId: 'hospital_001',
    title: '📅 Appointment Rescheduled via AI',
    message: 'Ananya Deshmukh (PAT-004) successfully rescheduled to Friday 21 Aug at 2:00 PM with Dr. Arjun Verma.',
    type: 'system',
    severity: 'info',
    relatedPatientId: 'PAT-004',
    relatedCallId: 'CALL-10021',
    relatedAppointmentId: 'APT-1004',
    isRead: true,
    timestamp: '2026-08-18T11:32:00Z'
  }
];
