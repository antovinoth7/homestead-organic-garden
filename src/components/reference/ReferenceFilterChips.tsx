import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseListStyles';

export interface ReferenceChip {
  key: string;
  label: string;
  /** Matches behind this chip — used by callers to drop dead filters, not shown. */
  count: number;
}

interface Props {
  chips: readonly ReferenceChip[];
  activeKey: string;
  onChange: (key: string) => void;
}

/**
 * Horizontally scrollable category chips that filter the reference list in
 * place. Chips with a zero count (nothing matches the current search) are
 * dropped so the row never offers a dead filter.
 */
export function ReferenceFilterChips({ chips, activeKey, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((chip) => {
        const isActive = chip.key === activeKey;
        return (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onChange(chip.key)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
