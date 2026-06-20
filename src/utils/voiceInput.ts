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
 * Appends dictated text to existing content with a separating space, then runs
 * the shared sanitizer (which preserves Tamil letters via `\p{L}`).
 */
export const appendVoiceTranscript = (prev: string, text: string): string => {
  if (!text) return prev;
  const combined = prev ? `${prev} ${text}` : text;
  return sanitizeAlphaNumericSpaces(combined);
};
