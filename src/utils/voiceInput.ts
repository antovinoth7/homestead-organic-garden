/**
 * Pure helpers for voice-to-text journaling (Phase E). Kept free of the native
 * `expo-speech-recognition` import so they remain unit-testable under the
 * node/ts-jest environment.
 */
import { sanitizeAlphaNumericSpaces } from './textSanitizer';

export const VOICE_FALLBACK_ERROR = 'Voice input failed. Please try again.';

const VOICE_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone permission is required for voice input.',
  'service-not-allowed': 'Speech recognition is not available on this device.',
  'language-not-supported': 'This language is not supported on your device.',
  'no-speech': 'No speech detected. Please try again.',
  'speech-timeout': 'No speech detected. Please try again.',
  network: 'Voice input needs a network connection. Please check and try again.',
  'audio-capture': 'Could not access the microphone. Please try again.',
};

/** Maps a recognizer error code to a user-safe message. */
export const voiceErrorMessage = (code: string): string =>
  VOICE_ERROR_MESSAGES[code] ?? VOICE_FALLBACK_ERROR;

/**
 * Sanitizes the dictated text (preserving Tamil letters via `\p{L}`) and appends
 * it to existing content with a separating space. The previous content is left
 * untouched, so dictating into a field never rewrites text the user already
 * typed — important for fields whose typed path keeps punctuation or newlines.
 */
export const appendVoiceTranscript = (prev: string, text: string): string => {
  const clean = sanitizeAlphaNumericSpaces(text).trim();
  if (!clean) return prev;
  return prev ? `${prev} ${clean}` : clean;
};
