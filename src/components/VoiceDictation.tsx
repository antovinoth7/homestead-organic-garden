import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/theme';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { appendVoiceTranscript } from '@/utils/voiceInput';
import VoiceInputButton from '@/components/VoiceInputButton';
import { createStyles } from '@/styles/voiceDictationStyles';

/** Voice locales offered per field — Tamil (default) and Indian English. */
const VOICE_LOCALES = [
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'en-IN', label: 'English' },
] as const;

interface Props {
  /** Current field value — dictated text is appended to it. */
  value: string;
  /** Receives the full appended (and sanitized) string. */
  onChangeText: (next: string) => void;
  disabled?: boolean;
}

/**
 * Reusable speech-to-text control for notes/analysis fields. Renders a compact
 * தமிழ்/English locale toggle, a mic button, and a live transcript preview, then
 * appends finalized speech to the field via `appendVoiceTranscript`.
 *
 * Renders nothing when the device has no usable recognizer (e.g. Expo Go / web),
 * so callers can drop it above any field without extra guards.
 */
export default function VoiceDictation({
  value,
  onChangeText,
  disabled = false,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [locale, setLocale] = useState<string>('ta-IN');

  // Keep the latest value so the result listener appends without a stale closure.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleResult = useCallback(
    (text: string) => {
      onChangeText(appendVoiceTranscript(valueRef.current, text));
    },
    [onChangeText]
  );

  const {
    isListening,
    partialTranscript,
    error: voiceError,
    isAvailable,
    start,
    stop,
  } = useVoiceInput({ locale, onResult: handleResult });

  const handleMicPress = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  useEffect(() => {
    if (voiceError) {
      Alert.alert('Voice Input', voiceError);
    }
  }, [voiceError]);

  if (!isAvailable) {
    return null;
  }

  return (
    <View>
      <View style={styles.voiceRow}>
        <View style={styles.voiceLocaleRow}>
          {VOICE_LOCALES.map((loc) => (
            <TouchableOpacity
              key={loc.code}
              style={[
                styles.voiceLocaleChip,
                locale === loc.code && styles.voiceLocaleChipActive,
              ]}
              onPress={() => setLocale(loc.code)}
              disabled={isListening}
            >
              <Text
                style={[
                  styles.voiceLocaleChipText,
                  locale === loc.code && styles.voiceLocaleChipTextActive,
                ]}
              >
                {loc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <VoiceInputButton isListening={isListening} disabled={disabled} onPress={handleMicPress} />
      </View>
      {isListening && <Text style={styles.voicePreview}>{partialTranscript || 'Listening…'}</Text>}
    </View>
  );
}
