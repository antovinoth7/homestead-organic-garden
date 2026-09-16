import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { SheetHandle } from '@/components/SheetHandle';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { CATALOG_GROUP_MODES } from '@/components/catalog/catalogGroupModes';
import type { CatalogGroupMode } from '@/utils/catalogListItems';

interface Props {
  mode: CatalogGroupMode;
  onChange: (mode: CatalogGroupMode) => void;
  onClose: () => void;
}

/**
 * Chooses how the browse list sections itself.
 *
 * This lived inline as a third control row above the list, which left roughly
 * six plant rows visible in a category of fifty. Grouping is set once and then
 * left alone, so it earns a sheet rather than permanent screen space — and the
 * section headers on the list already say which mode is in force.
 *
 * Unlike `PlantFilterSheet`, this screen is in the More stack with no floating
 * tab bar, so the bottom padding is the safe-area inset alone.
 */
function CatalogGroupSheetComponent({ mode, onChange, onClose }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  // Picking a mode is the whole purpose of the sheet, so it closes on choice
  // rather than making the user dismiss it afterwards.
  const handlePress = useCallback(
    (next: CatalogGroupMode) => () => {
      onChange(next);
      onClose();
    },
    [onChange, onClose]
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle onClose={onClose} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Group plants by</Text>
        </View>

        {CATALOG_GROUP_MODES.map(({ value, label, hint, icon }) => {
          const isActive = mode === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.sheetOptionRow, isActive && styles.sheetOptionRowActive]}
              onPress={handlePress(value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label}
              accessibilityHint={hint}
            >
              <Ionicons
                name={icon}
                size={18}
                color={isActive ? theme.primary : theme.textSecondary}
              />
              <View style={styles.sheetOptionText}>
                <Text style={[styles.sheetOptionLabel, isActive && styles.sheetOptionLabelActive]}>
                  {label}
                </Text>
                <Text style={styles.sheetOptionHint}>{hint}</Text>
              </View>
              {isActive && <Ionicons name="checkmark" size={18} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export const CatalogGroupSheet = React.memo(CatalogGroupSheetComponent);
