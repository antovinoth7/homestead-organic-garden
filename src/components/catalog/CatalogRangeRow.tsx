import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogRowStyles';
import FieldHelp from '@/components/FieldHelp';
import FieldErrorText from '@/components/FieldErrorText';

interface Props {
  label: string;
  min: string;
  max: string;
  /** Trailing unit shown after the max chip, e.g. 'days', 'cm', '°C'. */
  unit?: string;
  helpText?: string;
  helpTitle?: string;
  onPress: () => void;
  errorText?: string;
  isLast?: boolean;
}

const EMPTY = '—';

/** Min/max pair rendered as two monospace chips, tapping opens a range editor. */
export function CatalogRangeRow({
  label,
  min,
  max,
  unit,
  helpText,
  helpTitle,
  onPress,
  errorText,
  isLast = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, isLast && !errorText && styles.rowLast, !!errorText && styles.rowError]}
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${min || 'not set'} to ${max || 'not set'}`}
      >
        <View style={styles.labelWrap}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {helpText ? (
            <FieldHelp
              accessibilityLabel={`More information about ${helpTitle ?? label}`}
              compact
              description={helpText}
              title={helpTitle ?? label}
            />
          ) : null}
        </View>

        <View style={styles.rangeValues}>
          <View style={styles.rangeChip}>
            <Text style={[styles.rangeChipText, !min && styles.rangeChipPlaceholder]}>
              {min || EMPTY}
            </Text>
          </View>
          <Text style={styles.rangeDash}>–</Text>
          <View style={styles.rangeChip}>
            <Text style={[styles.rangeChipText, !max && styles.rangeChipPlaceholder]}>
              {max || EMPTY}
            </Text>
          </View>
          {unit ? <Text style={styles.rangeUnit}>{unit}</Text> : null}
        </View>

        <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
      </TouchableOpacity>
      {errorText ? (
        <View style={styles.errorWrap}>
          <FieldErrorText message={errorText} />
        </View>
      ) : null}
    </View>
  );
}
