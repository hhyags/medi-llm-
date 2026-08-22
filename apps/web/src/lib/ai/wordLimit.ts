/**
 * MedFlow Patient Assistant — 25-Word Strict Response Validator & Enforcer
 * HARD REQUIREMENT: Every chatbot response must contain maximum 25 words.
 */

/**
 * Counts words in a string according to standard whitespace tokenization.
 */
export function countWords(text: string | null | undefined): number {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Split on one or more whitespace characters
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return tokens.length;
}

/**
 * Validates whether a response satisfies the strict word limit (default max 25 words).
 */
export function validateResponseLength(text: string | null | undefined, maxWords: number = 25): boolean {
  const count = countWords(text);
  return count <= maxWords;
}

/**
 * Enforces the word limit on a response.
 * If the response exceeds maxWords (25), it rewrites or trims cleanly to a coherent sentence ending ≤ maxWords.
 */
export function enforceWordLimit(text: string, maxWords: number = 25): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  
  if (tokens.length <= maxWords) {
    return trimmed;
  }

  // If longer than maxWords, slice first maxWords
  const sliced = tokens.slice(0, maxWords);
  let result = sliced.join(' ');

  // Clean trailing punctuation and close sentence neatly
  result = result.replace(/[,;:\-\s]+$/, '');
  if (!/[.!?]$/.test(result)) {
    result += '.';
  }

  // Verify again
  const finalTokens = result.trim().split(/\s+/).filter(Boolean);
  if (finalTokens.length > maxWords) {
    return finalTokens.slice(0, maxWords).join(' ') + '.';
  }

  return result;
}
