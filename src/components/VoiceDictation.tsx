import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useVoiceLocale, VOICE_LOCALES } from '@/hooks/useVoiceLocale';
import { appendVoiceTranscript, micAccessibilityLabel } from '@/utils/voiceInput';
import VoiceInputButton from '@/components/VoiceInputButton';
import { createStyles } from '@/styles/voiceDictationStyles';

/**
 * Outer-side-only slop: 28px tall + 16 = 44, and each half's width + 10 = 44.
 * Keeping the slop off the shared inner edge stops the two rects overlapping,
 * so a tap near the divider never lands on the wrong half.
 */
const COMPACT_MIC_HIT_SLOP = { top: 8, bottom: 8, left: 10, right: 0 };
const COMPACT_LOCALE_HIT_SLOP = { top: 8, bottom: 8, left: 0, right: 10 };

interface Props {
  /** Current field value — dictated text is appended to it. */
  value: string;
  /** Receives the full appended (and sanitized) string. */
  onChangeText: (next: string) => void;
  disabled?: boolean;
  /**
   * Renders a split `mic | language` pill sized to sit at the trailing end of a
   * field's existing label row, instead of the stacked row above the input.
   */
  compact?: boolean;
}

/**
 * Reusable speech-to-text control for notes/analysis fields. Appends finalized
 * speech to the field via `appendVoiceTranscript`.
 *
 * Two layouts, same behaviour and the same mic accessibility contract:
 * - default — a தமிழ்/English segmented control with an adjacent mic on its own
 *   row above the input, and the live transcript beneath it.
 * - `compact` — a 28px split pill (mic half, language half) that costs a field
 *   no extra vertical space, with the live transcript inline to its left. The
 *   language shows as a one-token tag; the full name lives in the a11y label.
 *
 * The chosen language is app-wide and persisted (`useVoiceLocale`), so every
 * mounted control agrees and the choice survives a restart.
 *
 * Renders nothing when the binary has no speech module at all (Expo Go / web /
 * a dev client built before the dependency landed) — there is nothing the user
 * could act on. When the module is present but the OS exposes no recognizer the
 * mic stays visible but disabled and explains itself on tap, so the feature
 * never just silently vanishes. Either way callers need no extra guards.
 */
export default function VoiceDictation({
  value,
  onChangeText,
  disabled = false,
  compact = false,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { locale, option, nextOption, setLocale, toggleLocale } = useVoiceLocale();

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
    unavailableReason,
    start,
    stop,
  } = useVoiceInput({ locale, onResult: handleResult });

  const handleMicPress = useCallback(() => {
    if (!isAvailable) {
      Alert.alert(
        'Voice Input',
        'This device has no speech recognition service. On Android, install or enable the Google app and set it as the speech service.'
      );
      return;
    }
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isAvailable, isListening, start, stop]);

  useEffect(() => {
    if (voiceError) {
      Alert.alert('Voice Input', voiceError);
    }
  }, [voiceError]);

  if (unavailableReason === 'no-module') {
    return null;
  }

  const micMuted = disabled || !isAvailable;
  /**
   * Switching the recognizer's language mid-session is meaningless, so this
   * control locks while it listens. Another instance's control is not locked,
   * but `start()` captured the language for the running session, so a change
   * made there only takes effect on the next start.
   */
  const localeLocked = isListening || !isAvailable;

  if (compact) {
    return (
      <>
        {isListening && (
          <Text style={styles.compactPreview} numberOfLines={1} ellipsizeMode="head">
            {partialTranscript || 'Listening…'}
          </Text>
        )}
        <View style={[styles.compactPill, isListening && styles.compactPillListening]}>
          <TouchableOpacity
            style={[
              styles.compactMic,
              isListening && styles.compactMicListening,
              micMuted && styles.compactMicMuted,
            ]}
            onPress={handleMicPress}
            disabled={disabled}
            hitSlop={COMPACT_MIC_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={micAccessibilityLabel(isListening, !isAvailable)}
            accessibilityState={{ disabled, busy: isListening }}
          >
            <Ionicons
              name={isListening ? 'stop' : 'mic'}
              size={16}
              color={
                isListening ? theme.textInverse : micMuted ? theme.textTertiary : theme.primary
              }
            />
          </TouchableOpacity>
          <View pointerEvents="none" style={styles.compactDivider} />
          <TouchableOpacity
            style={styles.compactLocale}
            onPress={toggleLocale}
            disabled={localeLocked}
            hitSlop={COMPACT_LOCALE_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`Voice language: ${option.label}`}
            accessibilityHint={`Switches voice input to ${nextOption.label}`}
            accessibilityState={{ disabled: localeLocked }}
          >
            <Text
              style={[
                styles.compactLocaleText,
                option.code === 'ta-IN' && styles.compactLocaleTextTamil,
                localeLocked && styles.compactLocaleTextMuted,
              ]}
            >
              {option.shortLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <View>
      <View style={styles.voiceRow}>
        <View style={styles.voiceLocaleRow}>
          <View pointerEvents="none" style={styles.voiceLocaleCapsule} />
          {VOICE_LOCALES.map((loc) => (
            <TouchableOpacity
              key={loc.code}
              style={styles.voiceLocaleTouchTarget}
              onPress={() => setLocale(loc.code)}
              disabled={localeLocked}
              accessibilityRole="button"
              accessibilityLabel={`${loc.label} voice language`}
              accessibilityState={{
                disabled: localeLocked,
                selected: locale === loc.code,
              }}
            >
              <View
                style={[
                  styles.voiceLocaleSegment,
                  locale === loc.code && styles.voiceLocaleSegmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.voiceLocaleText,
                    locale === loc.code && styles.voiceLocaleTextActive,
                  ]}
                >
                  {loc.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <VoiceInputButton
          isListening={isListening}
          disabled={disabled}
          unavailable={!isAvailable}
          onPress={handleMicPress}
        />
      </View>
      {isListening && <Text style={styles.voicePreview}>{partialTranscript || 'Listening…'}</Text>}
    </View>
  );
}
