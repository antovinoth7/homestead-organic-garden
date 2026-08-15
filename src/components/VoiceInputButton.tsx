import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { createStyles } from '../styles/voiceInputButtonStyles';

interface Props {
  isListening: boolean;
  disabled?: boolean;
  /**
   * Device has no recognizer: looks the same as disabled but stays pressable so
   * the tap can explain why nothing will happen.
   */
  unavailable?: boolean;
  onPress: () => void;
}

/**
 * Presentational mic toggle for voice-to-text input. Logic (permissions,
 * recognition state) lives in the `useVoiceInput` hook; this only renders the
 * mic and its listening/disabled appearance.
 */
export default function VoiceInputButton({
  isListening,
  disabled = false,
  unavailable = false,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const muted = disabled || unavailable;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        unavailable
          ? 'Voice input unavailable on this device'
          : isListening
            ? 'Stop voice input'
            : 'Start voice input'
      }
      accessibilityState={{ disabled, busy: isListening }}
    >
      <View
        style={[
          styles.buttonCircle,
          isListening && styles.buttonListening,
          muted && styles.buttonDisabled,
        ]}
      >
        <Ionicons
          name={isListening ? 'stop' : 'mic'}
          size={17}
          color={isListening ? theme.textInverse : muted ? theme.textTertiary : theme.primary}
        />
      </View>
    </TouchableOpacity>
  );
}
