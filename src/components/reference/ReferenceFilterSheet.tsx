import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { SheetHandle } from '@/components/SheetHandle';
import { createStyles } from '@/styles/referenceBrowseStyles';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface FacetOption {
  value: string;
  label: string;
  /** Spoken as the chip's accessibilityHint. */
  hint: string;
  icon: IoniconName;
  /** Omitted on Group By options, which have no meaningful count. */
  count?: number;
}

export interface FacetSection {
  key: string;
  /** Section heading — "Category", "Risk now", "Group By". */
  title: string;
  icon: IoniconName;
  options: readonly FacetOption[];
  selected: string;
  onSelect: (value: string) => void;
}

interface Props {
  /** "Filter pests" / "Filter organic inputs". */
  title: string;
  sections: readonly FacetSection[];
  /** Whether every facet sits at its default — drives the Reset pill. */
  isDefault: boolean;
  onReset: () => void;
  onClose: () => void;
}

/**
 * The count on a chip. A zero still shows — knowing a bucket is empty before
 * tapping it is worth a line — but muted, the same treatment `CatalogFilterSheet`
 * gives its own counts.
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
 * The browse screens' one filter surface: `CatalogFilterSheet` generalised to a
 * declarative facet spec.
 *
 * The catalog's version hard-codes its two sections against the plant taxonomy.
 * Pests carry four facets and organic inputs three, with nothing in common but
 * the chip, so the sections arrive as data and this file owns only the
 * chrome — overlay, scrim, handle, Reset and the chip itself.
 *
 * Like the catalog, a chip closes the sheet on choice rather than making the
 * user dismiss it afterwards: that holds a category change at three taps, which
 * matters because it is the control reached for most. Setting two facets means
 * opening twice, which is the trade accepted there and kept here.
 *
 * These screens sit in the More stack, where `FloatingTabBar` hides itself on
 * any non-root route, so the bottom padding is the safe-area inset alone.
 */
function ReferenceFilterSheetComponent({
  title,
  sections,
  isDefault,
  onReset,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const handleReset = useCallback(() => {
    onReset();
    onClose();
  }, [onReset, onClose]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <SheetHandle onClose={onClose} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
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
          {sections.map((section) => (
            <View key={section.key}>
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name={section.icon} size={14} color={theme.textSecondary} />{' '}
                {section.title}
              </Text>
              <View style={styles.sheetChipWrap}>
                {section.options.map((option) => (
                  <FacetChip
                    key={option.value}
                    option={option}
                    isActive={section.selected === option.value}
                    onSelect={section.onSelect}
                    onClose={onClose}
                    styles={styles}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/**
 * One chip. Split out so its press handler can be a `useCallback` rather than an
 * arrow rebuilt inside a nested `map` on every render of the sheet.
 */
function FacetChip({
  option,
  isActive,
  onSelect,
  onClose,
  styles,
}: {
  option: FacetOption;
  isActive: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const theme = useTheme();

  const handlePress = useCallback(() => {
    onSelect(option.value);
    onClose();
  }, [onSelect, onClose, option.value]);

  return (
    <TouchableOpacity
      style={[styles.sheetChip, isActive && styles.sheetChipActive]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={option.label}
      accessibilityHint={option.hint}
    >
      <Ionicons
        name={option.icon}
        size={14}
        color={isActive ? theme.primary : theme.textSecondary}
      />
      <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
        {option.label}
        {option.count !== undefined && <ChipCount count={option.count} styles={styles} />}
      </Text>
    </TouchableOpacity>
  );
}

export const ReferenceFilterSheet = React.memo(ReferenceFilterSheetComponent);
