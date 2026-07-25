import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MilestoneKind } from '../../types/database.types';
import { MILESTONE_KINDS } from '../../utils/journalEntryOptions';
import FieldErrorText from '../FieldErrorText';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/journalFormStyles';

interface Props {
  value: MilestoneKind | null;
  onChange: (kind: MilestoneKind) => void;
  /** Inline validation message shown under the milestone chips. */
  errorText?: string;
}

export function JournalMilestoneSection({
  value,
  onChange,
  errorText,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.harvestSection, !!errorText && styles.harvestSectionError]}>
      <Text style={styles.sectionTitle}>Milestone</Text>
      <View style={styles.milestoneGrid}>
        {MILESTONE_KINDS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.milestoneChip, active && styles.milestoneChipActive]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? theme.primary : theme.textTertiary}
              />
              <Text style={[styles.milestoneChipText, active && styles.milestoneChipTextActive]}>
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
