import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import type { CatalogGroupMode } from '@/utils/catalogListItems';

interface Props {
  mode: CatalogGroupMode;
  onChange: (mode: CatalogGroupMode) => void;
}

/**
 * Chooses how the browse list sections itself.
 *
 * Three questions a farmer actually asks of a plant list: what kind is it
 * (Type — gourds, keerai, tubers), when does it come and go (Season — sown each
 * year or left in the ground), and where is the name (A–Z). Type leads because
 * nobody looks up a crop by its English initial; A–Z stays because sometimes you
 * do know the name, though search serves that better.
 */
const MODES: { value: CatalogGroupMode; label: string; hint: string }[] = [
  { value: 'type', label: 'Type', hint: 'Group by kind of crop' },
  { value: 'season', label: 'Season', hint: 'Group by annual, perennial or permanent' },
  { value: 'alpha', label: 'A–Z', hint: 'Group by first letter' },
];

function CatalogGroupModeToggleComponent({ mode, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(
    (next: CatalogGroupMode) => () => onChange(next),
    [onChange]
  );

  return (
    <View style={styles.modeToggleRow}>
      {MODES.map(({ value, label, hint }) => {
        const isActive = mode === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.modeToggleButton, isActive && styles.modeToggleButtonActive]}
            onPress={handlePress(value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            accessibilityHint={hint}
          >
            <Text style={[styles.modeToggleText, isActive && styles.modeToggleTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const CatalogGroupModeToggle = React.memo(CatalogGroupModeToggleComponent);
