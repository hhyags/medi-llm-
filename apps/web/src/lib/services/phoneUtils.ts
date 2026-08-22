/**
 * MedVoice AI — Centralized Phone Number Utility
 * Provides E.164 normalization, strict validation, formatting, and secure masking.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  countryCode?: string;
  error?: string;
}

/**
 * Normalizes any Indian or international phone number into standard E.164 format.
 * Examples:
 *   - "9390285197"      -> "+919390285197"
 *   - "+91 93902 85197"  -> "+919390285197"
 *   - "+91-9390285197"   -> "+919390285197"
 *   - "+1 (463) 262-0069"-> "+14632620069"
 */
export function normalizePhoneToE164(phone?: string | null): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      formatted: '',
      error: 'Please enter a valid phone number with country code.'
    };
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return {
      isValid: false,
      formatted: '',
      error: 'Phone number cannot be empty.'
    };
  }

  // Remove whitespace, dashes, parentheses, dots
  const clean = trimmed.replace(/[\s\-().]/g, '');
  const digitsOnly = clean.replace(/\+/g, '');

  if (!digitsOnly || digitsOnly.length < 10) {
    return {
      isValid: false,
      formatted: '',
      error: `Invalid phone length (${digitsOnly.length} digits). Minimum 10 digits required.`
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      formatted: '',
      error: `Invalid phone length (${digitsOnly.length} digits). Maximum 15 digits allowed.`
    };
  }

  // Reject all identical repeating digits (e.g. 0000000000, 1111111111)
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return {
      isValid: false,
      formatted: '',
      error: 'Phone number cannot consist of identical repeating digits.'
    };
  }

  let formatted = '';

  // 10 digits without prefix -> Default to Indian mobile (+91)
  if (digitsOnly.length === 10) {
    formatted = `+91${digitsOnly}`;
  }
  // 12 digits starting with 91 -> Indian mobile (+91XXXXXXXXXX)
  else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    formatted = `+${digitsOnly}`;
  }
  // 11 digits starting with 1 -> North American (+1XXXXXXXXXX)
  else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    formatted = `+${digitsOnly}`;
  }
  // Started with explicit +
  else if (clean.startsWith('+') && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    formatted = `+${digitsOnly}`;
  }
  // Generic international digits
  else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    formatted = `+${digitsOnly}`;
  } else {
    return {
      isValid: false,
      formatted: '',
      error: 'Please enter a valid phone number with country code.'
    };
  }

  return {
    isValid: true,
    formatted,
    countryCode: formatted.startsWith('+91') ? '+91' : formatted.startsWith('+1') ? '+1' : undefined
  };
}

/**
 * Masks a phone number for privacy in application logs and UI previews.
 * Example: "+919390285197" -> "+91******5197"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.trim();
  if (clean.length <= 6) return clean;
  const start = clean.slice(0, 3);
  const end = clean.slice(-4);
  const stars = '*'.repeat(Math.max(2, clean.length - 7));
  return `${start}${stars}${end}`;
}
