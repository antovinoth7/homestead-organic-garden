import React, { useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogRowStyles';
import FieldHelp from '@/components/FieldHelp';
import VoiceDictation from '@/components/VoiceDictation';

interface Props {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  helpText?: string;
  helpTitle?: string;
  /** Renders the தமிழ்/English + mic control above the input. */
  dictation?: boolean;
  numberOfLines?: number;
  isLast?: boolean;
}

/**
 * Free-text field that stays open rather than hiding behind a sheet. Long-form
 * values (descriptions, pruning tips) are the ones worth reading at a glance,
 * and they are also where voice input earns its place.
 */
export function CatalogTextBlock({
  label,
  value,
  onChangeText,
  placeholder,
  helpText,
  helpTitle,
  dictation = false,
  numberOfLines = 3,
  isLast = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.block, isLast && styles.blockLast]}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockLabel}>{label}</Text>
        {helpText ? (
          <FieldHelp
            accessibilityLabel={`More information about ${helpTitle ?? label}`}
            compact
            description={helpText}
            title={helpTitle ?? label}
          />
        ) : null}
      </View>
      {dictation && <VoiceDictation value={value} onChangeText={onChangeText} />}
      <TextInput
        style={styles.blockInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.inputPlaceholder}
        multiline
        numberOfLines={numberOfLines}
      />
    </View>
  );
}
