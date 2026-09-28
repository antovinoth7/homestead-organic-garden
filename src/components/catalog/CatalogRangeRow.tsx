import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
    <View style={[styles.rowGroup, isLast && styles.rowGroupLast, !!errorText && styles.rowError]}>
      {/* The target sits behind the content, not around it, so FieldHelp's
          own button is its sibling — see `rowTarget`. The content is hidden
          from the reader because the target's label already speaks it. */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowTarget}
          onPress={onPress}
          activeOpacity={0.6}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${min || 'not set'} to ${max || 'not set'}`}
        />
        <View style={[styles.labelWrap, styles.rowPassthrough]}>
          <Text
            style={[styles.label, styles.rowPassive]}
            numberOfLines={2}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
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

        <View
          style={[styles.rangeValues, styles.rowPassive]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
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

        <Ionicons
          name="chevron-forward"
          size={14}
          color={theme.textTertiary}
          style={styles.rowPassive}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      {errorText ? (
        <View style={styles.errorWrap}>
          <FieldErrorText message={errorText} />
        </View>
      ) : null}
    </View>
  );
}
