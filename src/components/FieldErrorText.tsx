import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/fieldErrorTextStyles';

interface Props {
  /** Inline validation message; nothing renders when empty. */
  message?: string;
}

/**
 * Single inline validation message under a form field — the one implementation
 * shared by PickerField, FloatingLabelInput and the journal form sections.
 */
export default function FieldErrorText({ message }: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!message) return null;

  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={13} color={theme.error} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}
