import React, { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { createStyles } from '../styles/voiceInputButtonStyles';

interface Props {
  isListening: boolean;
  disabled?: boolean;
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
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isListening && styles.buttonListening,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
      accessibilityState={{ disabled, busy: isListening }}
    >
      <Ionicons
        name={isListening ? 'stop' : 'mic'}
        size={22}
        color={isListening ? theme.textInverse : disabled ? theme.textTertiary : theme.primary}
      />
    </TouchableOpacity>
  );
}
