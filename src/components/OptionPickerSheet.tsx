import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/optionPickerSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

export interface PickerOption {
  label: string;
  value: string;
  color?: string;
  /** Secondary line under the label (e.g. a lifecycle explanation). */
  description?: string;
  /**
   * Section header this option sits under. Options must arrive ordered by
   * group — a header renders wherever the group changes. A value may repeat
   * across groups (a "Recently used" copy); search collapses the copies.
   */
  group?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Sheet title; also seeds the search placeholder. */
  title: string;
  options: readonly PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  /** Shows a search input above the list — worth it past ~10 options. */
  searchable?: boolean;
  /** Renders a "clear" row above the options, for optional enum fields. */
  allowClear?: boolean;
  clearLabel?: string;
  /** Overrides the "Search <title>..." placeholder. */
  searchPlaceholder?: string;
  /** One explanatory line under the title (e.g. why bed plants are absent). */
  subtitle?: string;
}

type PickerRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'option'; key: string; option: PickerOption };

const ROW_HEIGHT = 52;
/** Share of the window a searchable sheet occupies before the keyboard opens. */
const SEARCHABLE_HEIGHT_RATIO = 0.75;
/** Bottom padding while the keyboard is up — the safe-area inset is under it. */
const KEYBOARD_BOTTOM_PADDING = 8;

/**
 * Shared single-select bottom sheet. Extracted from `ThemedDropdown` so one
 * sheet serves both the dropdown's bordered trigger and the plant catalog's
 * dense read-first rows, rather than each screen growing its own picker.
 */
export function OptionPickerSheet({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchable = false,
  allowClear = false,
  clearLabel = 'Clear selection',
  searchPlaceholder,
  subtitle,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [searchQuery, setSearchQuery] = useState('');

  const close = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      close();
    },
    [onSelect, close]
  );

  const grouped = useMemo(() => options.some((option) => !!option.group), [options]);

  const rows = useMemo<PickerRow[]>(() => {
    const q = searchable ? searchQuery.trim().toLowerCase() : '';
    if (q) {
      // Search results are one flat list; a "Recently used" copy collapses
      // onto its original so a match never shows twice.
      const seen = new Set<string>();
      const hits: PickerRow[] = [];
      for (const option of options) {
        const matches =
          option.label.toLowerCase().includes(q) ||
          (option.description?.toLowerCase().includes(q) ?? false);
        if (!matches || seen.has(option.value)) continue;
        seen.add(option.value);
        hits.push({ kind: 'option', key: option.value, option });
      }
      return hits;
    }
    if (!grouped) {
      return options.map((option, index) => ({
        kind: 'option',
        key: `${option.value}-${index}`,
        option,
      }));
    }
    const out: PickerRow[] = [];
    let currentGroup: string | undefined;
    options.forEach((option, index) => {
      if (option.group && option.group !== currentGroup) {
        out.push({ kind: 'header', key: `header-${option.group}-${index}`, title: option.group });
      }
      currentGroup = option.group;
      out.push({ kind: 'option', key: `${option.group ?? ''}:${option.value}`, option });
    });
    return out;
  }, [options, searchQuery, searchable, grouped]);

  const renderItem = useCallback(
    ({ item: row }: { item: PickerRow }) => {
      if (row.kind === 'header') {
        return (
          <Text style={styles.groupHeader} accessibilityRole="header">
            {row.title}
          </Text>
        );
      }
      const item = row.option;
      const isSelected = item.value === selectedValue;
      return (
        <TouchableOpacity
          style={[styles.optionRow, isSelected && styles.optionRowSelected]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.7}
        >
          <View style={styles.optionBody}>
            <Text
              style={[styles.optionText, isSelected && styles.optionTextSelected]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
            {item.description ? (
              <Text style={styles.optionDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
        </TouchableOpacity>
      );
    },
    [selectedValue, handleSelect, styles, theme.primary]
  );

  const keyExtractor = useCallback((row: PickerRow) => row.key, []);

  const handleClear = useCallback(() => handleSelect(''), [handleSelect]);

  // Description lines and group headers make rows differ from ROW_HEIGHT, so
  // the fixed-height fast path only applies to plain label-only option lists.
  const hasVariableRows = useMemo(
    () => grouped || options.some((option) => !!option.description),
    [options, grouped]
  );

  // Bottom-sheet sizing: cap the sheet below the top inset and bound the list so
  // it scrolls instead of pushing the sheet past the screen.
  const bottomInset = Math.max(insets.bottom, 24);
  const sheetMaxHeight = windowHeight - insets.top - 24;
  const headerAllowance = 90 + (allowClear ? ROW_HEIGHT : 0);
  const listMaxHeight = Math.max(ROW_HEIGHT, sheetMaxHeight - headerAllowance - bottomInset);

  // A searchable sheet has a fixed height and rides above the keyboard. Sized
  // to its content, it shrank as the query narrowed to one or no rows and sank
  // behind the keyboard, which covers the bottom of the window.
  const searchableHeight = Math.min(
    windowHeight * SEARCHABLE_HEIGHT_RATIO,
    sheetMaxHeight - keyboardHeight
  );
  const sheetSizing = searchable
    ? {
        height: searchableHeight,
        paddingBottom: keyboardHeight > 0 ? KEYBOARD_BOTTOM_PADDING : bottomInset,
      }
    : { maxHeight: sheetMaxHeight, paddingBottom: bottomInset };

  const trimmedQuery = searchQuery.trim();
  const listEmpty = searchable ? (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={28} color={theme.textTertiary} />
      <Text style={styles.emptyText}>
        {trimmedQuery ? `No matches for "${trimmedQuery}"` : 'No matches found'}
      </Text>
    </View>
  ) : null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={close}
      sheetStyle={[styles.sheet, sheetSizing]}
      keyboardAvoiding={searchable}
    >
      <SheetHandle onClose={close}>
        <Text style={styles.sheetTitle}>{title}</Text>
      </SheetHandle>
      {subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
      {searchable && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}...`}
            placeholderTextColor={theme.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {allowClear && (
        <TouchableOpacity style={styles.clearRow} onPress={handleClear} activeOpacity={0.7}>
          <Text style={styles.clearRowText}>{clearLabel}</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={searchable ? styles.list : { maxHeight: listMaxHeight }}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        getItemLayout={
          hasVariableRows
            ? undefined
            : (_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })
        }
      />
    </BottomSheetModal>
  );
}
