import { normalizePhoneToE164, maskPhoneNumber } from './src/lib/services/phoneUtils.ts';

console.log('Testing normalizePhoneToE164...');

// Test cases
const testCases = [
  { input: '9390285197', expected: '+919390285197', valid: true },
  { input: '+91 93902 85197', expected: '+919390285197', valid: true },
  { input: '+91-9390285197', expected: '+919390285197', valid: true },
  { input: '+1 (463) 262-0069', expected: '+14632620069', valid: true },
  { input: '0000000000', expected: '', valid: false },
  { input: '123', expected: '', valid: false },
  { input: '', expected: '', valid: false },
  { input: null, expected: '', valid: false }
];

let passed = 0;
for (const tc of testCases) {
  const res = normalizePhoneToE164(tc.input);
  if (res.isValid === tc.valid && (!tc.valid || res.formatted === tc.expected)) {
    console.log(`[PASS] Input "${tc.input}" -> isValid: ${res.isValid}, formatted: "${res.formatted}"`);
    passed++;
  } else {
    console.error(`[FAIL] Input "${tc.input}" -> Got ${JSON.stringify(res)}, Expected ${JSON.stringify(tc)}`);
    process.exit(1);
  }
}

// Test masking
const masked = maskPhoneNumber('+919390285197');
console.log('Masked phone test:', masked);
if (masked !== '+91******5197') {
  console.error('[FAIL] maskPhoneNumber failed, got:', masked);
  process.exit(1);
}

console.log(`\nALL ${passed + 1} PHONE UTILITY TESTS PASSED SUCCESSFULLY!`);
