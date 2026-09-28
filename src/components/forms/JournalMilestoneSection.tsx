import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MilestoneKind } from '@/types/database.types';
import { MILESTONE_KINDS } from '@/utils/journalEntryOptions';
import FieldErrorText from '../FieldErrorText';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalFormStyles';

interface Props {
  value: MilestoneKind | null;
  onChange: (kind: MilestoneKind) => void;
  /** Inline validation message shown under the milestone tiles. */
  errorText?: string;
}

export function JournalMilestoneSection({ value, onChange, errorText }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlers = useMemo(
    () => Object.fromEntries(MILESTONE_KINDS.map((opt) => [opt.value, () => onChange(opt.value)])),
    [onChange]
  );

  return (
    <View style={[styles.sectionCard, !!errorText && styles.sectionCardError]}>
      <Text style={styles.label}>Which milestone?</Text>
      <View style={styles.milestoneGrid}>
        {MILESTONE_KINDS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.milestoneTile, active && styles.optionTileActive]}
              onPress={handlers[opt.value]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={active ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[styles.optionTileText, active && styles.optionTileTextActive]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FieldErrorText message={errorText} />
    </View>
  );
}
