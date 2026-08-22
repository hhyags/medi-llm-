import { enforceWordLimit, countWords } from './wordLimit';

export type ChatIntent =
  | 'GENERAL_FAQ'
  | 'HOSPITAL_INFO'
  | 'APPOINTMENT_INFO'
  | 'PATIENT_DATA'
  | 'APPOINTMENT_ACTION'
  | 'MEDICAL_EDUCATION'
  | 'MEDICAL_ADVICE'
  | 'EMERGENCY'
  | 'HUMAN_ESCALATION'
  | 'PROMPT_INJECTION'
  | 'UNKNOWN';

export interface ChatUserContext {
  uid: string;
  role: string;
  hospitalId: string;
  patientId?: string;
  userName?: string;
}

export interface ChatResponsePayload {
  response: string;
  intent: ChatIntent;
  wordCount: number;
  action_required?: 'MANAGE_APPOINTMENT' | 'REQUEST_HUMAN_ASSISTANCE' | 'EMERGENCY_ALERT';
  action_label?: string;
  hospitalId: string;
  timestamp: string;
}

// Approved Medical Educational Knowledge Base (All strictly ≤ 25 words)
const MEDICAL_EDUCATION_KB: Record<string, string> = {
  diabetes: 'Diabetes is a chronic condition affecting how your body processes blood sugar into energy.',
  hypertension: 'Hypertension is high blood pressure where blood pushes forcefully against artery walls.',
  mri: 'An MRI uses magnetic fields and radio waves to produce detailed internal body images.',
  'blood test': 'A blood test analyzes blood cells, biochemistry, or markers to evaluate overall health.',
  cardiologist: 'A cardiologist is a medical specialist diagnosing and treating heart and blood vessel disorders.',
  asthma: 'Asthma is a respiratory condition causing airway inflammation and breathing difficulty.',
  fever: 'A fever is a temporary increase in body temperature, usually signaling an infection.',
  xray: 'An X-ray uses radiation waves to create images of dense structures like bones.'
};

// Approved Hospital FAQ Repository (Multi-Hospital Isolated)
const HOSPITAL_KB: Record<string, Record<string, string>> = {
  hospital_001: {
    name: 'City Memorial Hospital',
    timings: 'City Memorial Hospital operates Monday to Friday from 8:00 AM to 8:00 PM.',
    location: 'We are located at 123 Healthcare Boulevard, Medical District, Suite 400.',
    departments: 'We offer Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology, and General Medicine.',
    booking: 'You can book appointments directly in your dashboard or by calling reception.',
    payments: 'We accept credit cards, debit cards, UPI, health insurance, and online payments.',
    documents: 'Please bring your government photo ID, insurance card, and relevant medical records.',
    arrival: 'Please arrive 10 to 15 minutes before your scheduled appointment time.',
    contact: 'Contact reception directly at +1 (800) 555-6337 during normal clinic hours.',
    services: 'Services include outpatient consultations, diagnostic imaging, lab tests, and telemedicine.'
  },
  hospital_002: {
    name: 'St. Jude Medical Center',
    timings: 'St. Jude Medical Center is open Monday to Saturday from 7:30 AM to 9:00 PM.',
    location: 'St. Jude is situated at 500 Hope Avenue, Healthcare Valley.',
    departments: 'Departments include Oncology, Cardiology, Orthopedics, Internal Medicine, and Surgery.',
    booking: 'Appointments can be booked via our online portal or by visiting reception.',
    payments: 'Accepted payment methods include major credit cards, debit cards, cash, and insurance.',
    documents: 'Bring photo identification, current medical prescriptions, and your insurance card.',
    arrival: 'Patients should arrive at least 10 minutes before their appointment slot.',
    contact: 'Reach St. Jude reception at +1 (800) 777-4321 during business hours.',
    services: 'We provide specialized inpatient care, robotic surgery, imaging, and routine consultations.'
  }
};

export class PatientAssistantService {
  /**
   * Detects intent from user question
   */
  public detectIntent(message: string): ChatIntent {
    const q = message.toLowerCase().trim();

    // 1. Prompt Injection Checks
    if (
      q.includes('ignore your instructions') ||
      q.includes('ignore previous') ||
      q.includes('show me your system prompt') ||
      q.includes('system prompt') ||
      q.includes('give me your api key') ||
      q.includes('api key') ||
      q.includes('act as an admin') ||
      q.includes('act as admin') ||
      q.includes('switch to hospital') ||
      q.includes('ignore hospital') ||
      q.includes('another patient') ||
      q.includes('other patient')
    ) {
      return 'PROMPT_INJECTION';
    }

    // 2. Emergency Checks
    if (
      q.includes('chest pain') ||
      q.includes('heart attack') ||
      q.includes('severe bleeding') ||
      q.includes('cannot breathe') ||
      q.includes('can\'t breathe') ||
      q.includes('stroke') ||
      q.includes('unconscious') ||
      q.includes('anaphylaxis') ||
      q.includes('choking') ||
      q.includes('emergency')
    ) {
      return 'EMERGENCY';
    }

    // 3. Medical Advice / Diagnosis / Prescription Refusal Checks
    if (
      q.includes('do i have') ||
      q.includes('diagnose') ||
      q.includes('what medicine') ||
      q.includes('what medication') ||
      q.includes('what dose') ||
      q.includes('dosage') ||
      q.includes('should i take') ||
      q.includes('should i stop') ||
      q.includes('stop my medicine') ||
      q.includes('prescribe') ||
      q.includes('treat my') ||
      q.includes('cure my')
    ) {
      return 'MEDICAL_ADVICE';
    }

    // 4. Human Escalation Requests
    if (
      q.includes('human') ||
      q.includes('talk to doctor') ||
      q.includes('speak to a person') ||
      q.includes('speak with someone') ||
      q.includes('receptionist call') ||
      q.includes('call me back') ||
      q.includes('escalate')
    ) {
      return 'HUMAN_ESCALATION';
    }

    // 5. Appointment Action Requests (Cancel / Reschedule)
    if (
      q.includes('cancel my appointment') ||
      q.includes('cancel appointment') ||
      q.includes('how do i cancel') ||
      q.includes('how to cancel') ||
      q.includes('reschedule my appointment') ||
      q.includes('reschedule appointment') ||
      q.includes('how do i reschedule') ||
      q.includes('how can i reschedule') ||
      q.includes('how to reschedule')
    ) {
      return 'APPOINTMENT_ACTION';
    }

    // 6. Patient-specific Appointment / Record Lookup
    if (
      q.includes('when is my appointment') ||
      q.includes('my appointment time') ||
      q.includes('my appointment') ||
      q.includes('what is my appointment') ||
      q.includes('my next visit') ||
      q.includes('my record')
    ) {
      return 'PATIENT_DATA';
    }

    // 7. General Hospital Information
    if (
      q.includes('timing') ||
      q.includes('hours') ||
      q.includes('open') ||
      q.includes('where is the hospital') ||
      q.includes('location') ||
      q.includes('address') ||
      q.includes('department') ||
      q.includes('book an appointment') ||
      q.includes('how do i book') ||
      q.includes('payment') ||
      q.includes('document') ||
      q.includes('bring') ||
      q.includes('how early') ||
      q.includes('arrive') ||
      q.includes('contact') ||
      q.includes('phone') ||
      q.includes('service')
    ) {
      return 'HOSPITAL_INFO';
    }

    // 8. General Health Education
    if (
      q.startsWith('what is') ||
      q.startsWith('what does') ||
      q.includes('diabetes') ||
      q.includes('hypertension') ||
      q.includes('mri') ||
      q.includes('blood test') ||
      q.includes('cardiologist')
    ) {
      return 'MEDICAL_EDUCATION';
    }

    return 'GENERAL_FAQ';
  }

  /**
   * Generates a safe, hospital-scoped, ≤ 25 word response
   */
  public generateResponse(
    message: string,
    context: ChatUserContext,
    patientAppointment?: { doctorName: string; date: string; time: string } | null
  ): ChatResponsePayload {
    const intent = this.detectIntent(message);
    const hospitalId = context.hospitalId || 'hospital_001';
    const hospitalData = HOSPITAL_KB[hospitalId] || HOSPITAL_KB.hospital_001;
    const q = message.toLowerCase().trim();

    let rawResponse = '';
    let actionRequired: ChatResponsePayload['action_required'] = undefined;
    let actionLabel: string | undefined = undefined;

    switch (intent) {
      case 'PROMPT_INJECTION':
        rawResponse = 'I cannot comply with system override requests. Please ask a healthcare or hospital question.';
        break;

      case 'EMERGENCY':
        rawResponse = 'Severe symptoms require urgent attention. Please seek immediate medical care or call local emergency services.';
        actionRequired = 'EMERGENCY_ALERT';
        actionLabel = 'Call Emergency';
        break;

      case 'MEDICAL_ADVICE':
        if (q.includes('stop') || q.includes('dosage') || q.includes('take')) {
          rawResponse = "I can't recommend or alter medications. Please consult your prescribing healthcare professional directly.";
        } else {
          rawResponse = "I cannot diagnose medical conditions. Please consult a qualified doctor for clinical evaluation.";
        }
        actionRequired = 'REQUEST_HUMAN_ASSISTANCE';
        actionLabel = 'Request Human Assistance';
        break;

      case 'HUMAN_ESCALATION':
        rawResponse = "I can connect you with the hospital team for personalized medical assistance.";
        actionRequired = 'REQUEST_HUMAN_ASSISTANCE';
        actionLabel = 'Request Human Assistance';
        break;

      case 'APPOINTMENT_ACTION':
        if (q.includes('cancel')) {
          rawResponse = 'I can help you manage it. Open your appointments tab and choose Cancel Appointment.';
        } else {
          rawResponse = 'To reschedule, navigate to Appointments in your dashboard and select a new time slot.';
        }
        actionRequired = 'MANAGE_APPOINTMENT';
        actionLabel = 'Manage Appointment';
        break;

      case 'PATIENT_DATA':
        if (patientAppointment) {
          rawResponse = `Your appointment with ${patientAppointment.doctorName} is scheduled for ${patientAppointment.date} at ${patientAppointment.time}.`;
        } else {
          rawResponse = 'You have no scheduled appointments. You can book one anytime from the appointments page.';
          actionRequired = 'MANAGE_APPOINTMENT';
          actionLabel = 'Book Appointment';
        }
        break;

      case 'HOSPITAL_INFO':
        if (q.includes('timing') || q.includes('hours') || q.includes('open')) {
          rawResponse = hospitalData.timings;
        } else if (q.includes('where') || q.includes('location') || q.includes('address')) {
          rawResponse = hospitalData.location;
        } else if (q.includes('department')) {
          rawResponse = hospitalData.departments;
        } else if (q.includes('book')) {
          rawResponse = hospitalData.booking;
          actionRequired = 'MANAGE_APPOINTMENT';
          actionLabel = 'Book Appointment';
        } else if (q.includes('payment')) {
          rawResponse = hospitalData.payments;
        } else if (q.includes('document') || q.includes('bring')) {
          rawResponse = hospitalData.documents;
        } else if (q.includes('arrive') || q.includes('early')) {
          rawResponse = hospitalData.arrival;
        } else if (q.includes('contact') || q.includes('reception') || q.includes('phone')) {
          rawResponse = hospitalData.contact;
        } else {
          rawResponse = hospitalData.services;
        }
        break;

      case 'MEDICAL_EDUCATION':
        let matched = false;
        for (const [key, answer] of Object.entries(MEDICAL_EDUCATION_KB)) {
          if (q.includes(key)) {
            rawResponse = answer;
            matched = true;
            break;
          }
        }
        if (!matched) {
          rawResponse = 'This is an educational topic. Please consult our hospital specialists for clinical details.';
        }
        break;

      case 'GENERAL_FAQ':
      default:
        if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
          rawResponse = `Hello! I am your ${hospitalData.name} assistant. How can I help you today?`;
        } else {
          rawResponse = `I can answer questions about appointments, hospital services, and general health for ${hospitalData.name}.`;
        }
        break;
    }

    // STRICT 25-WORD ENFORCEMENT
    const finalResponse = enforceWordLimit(rawResponse, 25);
    const wordCount = countWords(finalResponse);

    return {
      response: finalResponse,
      intent,
      wordCount,
      action_required: actionRequired,
      action_label: actionLabel,
      hospitalId,
      timestamp: new Date().toISOString()
    };
  }
}

export const patientAssistantService = new PatientAssistantService();
