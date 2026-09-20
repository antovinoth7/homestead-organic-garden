import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/optionPickerSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';

export interface PickerOption {
  label: string;
  value: string;
  color?: string;
  /** Secondary line under the label (e.g. a lifecycle explanation). */
  description?: string;
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
}

const ROW_HEIGHT = 52;

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
}: Props): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
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

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  const renderItem = useCallback(
    ({ item }: { item: PickerOption }) => {
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

  const keyExtractor = useCallback(
    (item: PickerOption, index: number) => `${item.value}-${index}`,
    []
  );

  const handleClear = useCallback(() => handleSelect(''), [handleSelect]);

  // Description lines make rows taller than ROW_HEIGHT, so the fixed-height
  // fast path only applies to plain label-only option lists.
  const hasDescriptions = useMemo(
    () => options.some((option) => !!option.description),
    [options]
  );

  // Bottom-sheet sizing: cap the sheet below the top inset and bound the list so
  // it scrolls instead of pushing the sheet past the screen.
  const bottomInset = Math.max(insets.bottom, 24);
  const sheetMaxHeight = windowHeight - insets.top - 24;
  const headerAllowance = (searchable ? 150 : 90) + (allowClear ? ROW_HEIGHT : 0);
  const listMaxHeight = Math.max(ROW_HEIGHT, sheetMaxHeight - headerAllowance - bottomInset);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={close}
      sheetStyle={[styles.sheet, { maxHeight: sheetMaxHeight, paddingBottom: bottomInset }]}
    >
      <SheetHandle onClose={close}>
        <Text style={styles.sheetTitle}>{title}</Text>
      </SheetHandle>
      {searchable && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${title.toLowerCase()}...`}
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
      {searchable && filteredOptions.length === 0 && (
        <Text style={styles.emptyText}>No matches found</Text>
      )}
      <FlatList
        data={filteredOptions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={{ maxHeight: listMaxHeight }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        getItemLayout={
          hasDescriptions
            ? undefined
            : (_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })
        }
      />
    </BottomSheetModal>
  );
}
