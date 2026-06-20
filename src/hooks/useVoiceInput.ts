/**
 * Voice-to-text hook (Phase E). Wraps `expo-speech-recognition` so screens can
 * dictate free text in Tamil (default) or English. Owns listening state, live
 * partial transcripts, permission handling, and user-safe error messages.
 *
 * Note: the native module is only available in a dev/production build, not in
 * Expo Go. `isAvailable` reflects on-device recognizer support.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { logError } from '@/utils/errorLogging';
import { voiceErrorMessage, VOICE_FALLBACK_ERROR } from '@/utils/voiceInput';

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
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    try {
      setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch {
      setIsAvailable(false);
    }
  }, []);

  useSpeechRecognitionEvent('start', () => setIsListening(true));

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    setPartialTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      setPartialTranscript('');
      if (text) {
        setTranscript(text);
        onResult?.(text);
      }
    } else {
      setPartialTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    setPartialTranscript('');
    setError(voiceErrorMessage(event.error));
    logError('error', `useVoiceInput: ${event.error}`, new Error(event.message));
  });

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      logError('error', 'useVoiceInput: stop failed', err);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setPartialTranscript('');
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError(voiceErrorMessage('not-allowed'));
        return;
      }
      ExpoSpeechRecognitionModule.start({
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

  // Abort any in-flight recognition when the consuming screen unmounts.
  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // no-op: native module may be unavailable (e.g. Expo Go)
      }
    };
  }, []);

  return { isListening, transcript, partialTranscript, error, isAvailable, start, stop };
}
