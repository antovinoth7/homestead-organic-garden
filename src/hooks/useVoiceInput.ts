/**
 * Voice-to-text hook (Phase E). Wraps `expo-speech-recognition` so screens can
 * dictate free text in Tamil (default) or English. Owns listening state, live
 * partial transcripts, permission handling, and user-safe error messages.
 *
 * The native module is resolved with `requireOptionalNativeModule`, which
 * returns `null` (instead of throwing) when the binary lacks it — e.g. Expo Go
 * or a stale dev client built before the dependency was added. In that case
 * `isAvailable` is `false` and callers should hide the mic; the app must never
 * crash just because the module is missing. Web works via the package's own
 * web shim, which this hook does not touch.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';
// Type-only imports — erased at compile time, so they never trigger the
// package's runtime native-module resolution (which throws when absent).
import type {
  ExpoSpeechRecognitionModule as ExpoSpeechRecognitionModuleValue,
  ExpoSpeechRecognitionResultEvent,
  ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { voiceErrorMessage, VOICE_FALLBACK_ERROR } from '@/utils/voiceInput';

// Resolved once at module load. `null` when the native module is not compiled in.
const SpeechModule = requireOptionalNativeModule<typeof ExpoSpeechRecognitionModuleValue>(
  'ExpoSpeechRecognition'
);

const UNAVAILABLE_ERROR = 'Speech recognition is not available on this device.';

/**
 * Why the recognizer is unusable, so callers can tell a missing binary apart
 * from a device with no speech service:
 * - `none`          — usable.
 * - `no-module`     — the native module is not compiled in (Expo Go, web, or a
 *                     dev client built before `expo-speech-recognition` landed).
 *                     Hide the control entirely; there is nothing to explain.
 * - `no-recognizer` — the module is there but the OS exposes no recognizer.
 *                     Worth showing a disabled control that explains itself.
 */
export type VoiceUnavailableReason = 'none' | 'no-module' | 'no-recognizer';

// Surfaced once at load so a stale dev client is visible in the console rather
// than silently erasing every mic in the app.
if (!SpeechModule) {
  logger.warn(
    'useVoiceInput: ExpoSpeechRecognition native module missing — voice input is hidden. ' +
      'Rebuild the dev client (npx expo prebuild --clean) if this is not Expo Go.'
  );
}

// User-correctable outcomes (silence, pausing too long, denying the mic) —
// worth showing a message for, but not worth an error-tracker event.
const BENIGN_VOICE_ERRORS = new Set(['no-speech', 'speech-timeout', 'not-allowed']);

export interface UseVoiceInputOptions {
  /** BCP-47 locale, e.g. "ta-IN" or "en-IN". */
  locale: string;
  /** Called with each finalized transcript so the caller can append it. */
  onResult?: (text: string) => void;
}

export interface UseVoiceInputResult {
  isListening: boolean;
  /** Last finalized transcript (also delivered via `onResult`). */
  transcript: string;
  /** Live interim text while the user is speaking. */
  partialTranscript: string;
  error: string | null;
  /** Whether the device exposes a usable speech recognizer. */
  isAvailable: boolean;
  /** Why it is unusable — lets callers hide vs. explain. `'none'` when usable. */
  unavailableReason: VoiceUnavailableReason;
  start: () => Promise<void>;
  stop: () => void;
}

export function useVoiceInput({ locale, onResult }: UseVoiceInputOptions): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState<VoiceUnavailableReason>(
    SpeechModule ? 'no-recognizer' : 'no-module'
  );

  // Keep the latest onResult without resubscribing native listeners.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // The native listeners are module-global: every mounted instance of this
  // hook receives every recognizer event, including ones for sessions started
  // on other screens. This ref marks whether *this* instance owns the current
  // session, so stray events can't surface errors on unrelated forms.
  const sessionActiveRef = useRef(false);

  useEffect(() => {
    if (!SpeechModule) {
      setIsAvailable(false);
      setUnavailableReason('no-module');
      return;
    }

    let available = false;
    try {
      available = SpeechModule.isRecognitionAvailable();
    } catch {
      available = false;
    }
    setIsAvailable(available);
    setUnavailableReason(available ? 'none' : 'no-recognizer');
    if (!available) {
      logger.warn(
        'useVoiceInput: no speech recognizer on this device — the mic is shown disabled.'
      );
    }

    const subscriptions = [
      SpeechModule.addListener('start', () => setIsListening(true)),
      SpeechModule.addListener('end', () => {
        sessionActiveRef.current = false;
        setIsListening(false);
        setPartialTranscript('');
      }),
      SpeechModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
        const text = event.results[0]?.transcript ?? '';
        if (event.isFinal) {
          setPartialTranscript('');
          if (text) {
            setTranscript(text);
            onResultRef.current?.(text);
          }
        } else {
          setPartialTranscript(text);
        }
      }),
      SpeechModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
        const ownSession = sessionActiveRef.current;
        sessionActiveRef.current = false;
        setIsListening(false);
        setPartialTranscript('');
        // Not our session (another screen's recognizer, or a stray OS event),
        // or an 'aborted' cancellation (navigation away, manual stop, session
        // superseded) — neither is a failure the user should hear about.
        if (!ownSession || event.error === 'aborted') return;
        setError(voiceErrorMessage(event.error));
        if (BENIGN_VOICE_ERRORS.has(event.error)) {
          logger.warn(`useVoiceInput: ${event.error}`, new Error(event.message));
        } else {
          logError('error', `useVoiceInput: ${event.error}`, new Error(event.message));
        }
      }),
    ];

    return () => {
      subscriptions.forEach((sub) => sub.remove());
      try {
        SpeechModule.abort();
      } catch {
        // no-op
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (!SpeechModule) return;
    try {
      SpeechModule.stop();
    } catch (err) {
      logError('error', 'useVoiceInput: stop failed', err);
    }
  }, []);

  const start = useCallback(async () => {
    if (!SpeechModule) {
      setError(UNAVAILABLE_ERROR);
      return;
    }
    setError(null);
    setPartialTranscript('');
    try {
      const permission = await SpeechModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError(voiceErrorMessage('not-allowed'));
        return;
      }
      sessionActiveRef.current = true;
      SpeechModule.start({
        lang: locale,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (err) {
      sessionActiveRef.current = false;
      setError(VOICE_FALLBACK_ERROR);
      logError('error', 'useVoiceInput: start failed', err);
    }
  }, [locale]);

  return {
    isListening,
    transcript,
    partialTranscript,
    error,
    isAvailable,
    unavailableReason,
    start,
    stop,
  };
}
