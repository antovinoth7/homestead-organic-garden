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
import { voiceErrorMessage, VOICE_FALLBACK_ERROR } from '@/utils/voiceInput';

// Resolved once at module load. `null` when the native module is not compiled in.
const SpeechModule = requireOptionalNativeModule<typeof ExpoSpeechRecognitionModuleValue>(
  'ExpoSpeechRecognition'
);

const UNAVAILABLE_ERROR = 'Speech recognition is not available on this device.';

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
  start: () => Promise<void>;
  stop: () => void;
}

export function useVoiceInput({ locale, onResult }: UseVoiceInputOptions): UseVoiceInputResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  // Keep the latest onResult without resubscribing native listeners.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!SpeechModule) {
      setIsAvailable(false);
      return;
    }

    try {
      setIsAvailable(SpeechModule.isRecognitionAvailable());
    } catch {
      setIsAvailable(false);
    }

    const subscriptions = [
      SpeechModule.addListener('start', () => setIsListening(true)),
      SpeechModule.addListener('end', () => {
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
        setIsListening(false);
        setPartialTranscript('');
        setError(voiceErrorMessage(event.error));
        logError('error', `useVoiceInput: ${event.error}`, new Error(event.message));
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
      SpeechModule.start({
        lang: locale,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (err) {
      setError(VOICE_FALLBACK_ERROR);
      logError('error', 'useVoiceInput: start failed', err);
    }
  }, [locale]);

  return { isListening, transcript, partialTranscript, error, isAvailable, start, stop };
}
