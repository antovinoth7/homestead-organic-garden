import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { SheetHandle } from '@/components/SheetHandle';
import { GardenIcon } from '@/components/GardenIcon';
import { createStyles } from '@/styles/managePlantCatalogStyles';
import { CATALOG_GROUP_ICON_KEYS } from '@/config/iconRegistry';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_LABELS } from '@/utils/plantLabels';
import {
  CATALOG_GROUP_MODES,
  DEFAULT_CATALOG_GROUP_MODE,
} from '@/components/catalog/catalogGroupModes';
import { ALL_GROUPS } from '@/utils/catalogListItems';
import type { CatalogGroupFilter, CatalogGroupMode } from '@/utils/catalogListItems';

interface Props {
  group: CatalogGroupFilter;
  groupCounts: Record<CatalogGroupFilter, number>;
  onGroupChange: (group: CatalogGroupFilter) => void;
  mode: CatalogGroupMode;
  onChange: (mode: CatalogGroupMode) => void;
  onClose: () => void;
}

/**
 * The " (n)" on a category chip. A zero still shows — an empty category is worth
 * knowing before you tap it — but muted, the same treatment `PlantFilterSheet`
 * gives its facet counts.
 */
function ChipCount({
  count,
  styles,
}: {
  count: number;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return <Text style={count === 0 ? styles.sheetChipCountZero : undefined}> ({count})</Text>;
}

/**
 * The catalog's one filter surface: which category to browse, and how that list
 * sections itself.
 *
 * Category used to be a pill rail above the list. As a `ListHeaderComponent` it
 * scrolled away with the rows, so it cost a permanent-feeling row of the screen
 * without staying reachable — and it left one idea with two homes, the rail and
 * this sheet. Folding it in costs two extra taps per category change and buys
 * back the row.
 *
 * `All` leads the categories and is the default: until now the catalog could
 * only be searched across every group, never browsed across them.
 *
 * Both sections close the sheet on choice rather than making the user dismiss it
 * afterwards. That holds a category change at three taps, which matters because
 * it is the control reached for most; setting both facets means opening twice.
 *
 * Unlike `PlantFilterSheet`, this screen is in the More stack with no floating
 * tab bar, so the bottom padding is the safe-area inset alone.
 */
function CatalogFilterSheetComponent({
  group,
  groupCounts,
  onGroupChange,
  mode,
  onChange,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const handleGroupPress = useCallback(
    (next: CatalogGroupFilter) => () => {
      onGroupChange(next);
      onClose();
    },
    [onGroupChange, onClose]
  );

  const handleModePress = useCallback(
    (next: CatalogGroupMode) => () => {
      onChange(next);
      onClose();
    },
    [onChange, onClose]
  );

  const isDefault = group === ALL_GROUPS && mode === DEFAULT_CATALOG_GROUP_MODE;

  const handleReset = useCallback(() => {
    onGroupChange(ALL_GROUPS);
    onChange(DEFAULT_CATALOG_GROUP_MODE);
    onClose();
  }, [onGroupChange, onChange, onClose]);

  const allSelected = group === ALL_GROUPS;

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle onClose={onClose} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Filter plants</Text>
          {!isDefault && (
            <TouchableOpacity
              onPress={handleReset}
              style={styles.sheetClearBtn}
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
            >
              <Text style={styles.sheetClearText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="apps" size={14} color={theme.textSecondary} /> Category
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, allSelected && styles.sheetChipActive]}
              onPress={handleGroupPress(ALL_GROUPS)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: allSelected }}
              accessibilityLabel="All"
              accessibilityHint="Browse every category at once"
            >
              <Ionicons
                name="layers-outline"
                size={14}
                color={allSelected ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.sheetChipText, allSelected && styles.sheetChipTextActive]}>
                All
                <ChipCount count={groupCounts[ALL_GROUPS] ?? 0} styles={styles} />
              </Text>
            </TouchableOpacity>
            {CATALOG_GROUP_ORDER.map((value) => {
              const isActive = group === value;
              const label = CATALOG_GROUP_LABELS[value];
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={handleGroupPress(value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={label}
                  accessibilityHint={`Browse ${label} only`}
                >
                  <GardenIcon
                    name={CATALOG_GROUP_ICON_KEYS[value]}
                    size={14}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                    <ChipCount count={groupCounts[value] ?? 0} styles={styles} />
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="layers" size={14} color={theme.textSecondary} /> Group By
          </Text>
          <View style={styles.sheetChipWrap}>
            {CATALOG_GROUP_MODES.map(({ value, label, hint, icon }) => {
              const isActive = mode === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                  onPress={handleModePress(value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={label}
                  accessibilityHint={hint}
                >
                  <Ionicons
                    name={icon}
                    size={14}
                    color={isActive ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

export const CatalogFilterSheet = React.memo(CatalogFilterSheetComponent);
