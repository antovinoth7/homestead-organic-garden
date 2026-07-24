import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles } from '../styles/themedDropdownStyles';
import FieldHelp from './FieldHelp';

export interface DropdownItem {
  label: string;
  value: string;
  color?: string;
}

interface ThemedDropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass setters for various string union types
  onValueChange: (value: any) => void;
  placeholder?: string;
  /** Floating label displayed on the trigger (Material Design style) */
  label?: string;
  enabled?: boolean;
  /** Compact mode uses a shorter height (44px vs 52px) */
  compact?: boolean;
  /** Show a search input at the top of the dropdown sheet */
  searchable?: boolean;
  helpText?: string;
  helpLabel?: string;
}

const ROW_HEIGHT = 52;

export default function ThemedDropdown({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select...',
  label,
  enabled = true,
  compact = false,
  searchable = false,
  helpText,
  helpLabel,
}: ThemedDropdownProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = useMemo(
    () => items.find((item) => item.value === selectedValue),
    [items, selectedValue]
  );

  const open = useCallback(() => {
    if (!enabled) return;
    setSearchQuery('');
    setVisible(true);
  }, [enabled]);

  const close = useCallback(() => setVisible(false), []);

  const handleSelect = useCallback(
    (value: string) => {
      onValueChange(value);
      close();
    },
    [onValueChange, close]
  );

  const filteredItems = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, searchQuery, searchable]);

  const renderItem = useCallback(
    ({ item }: { item: DropdownItem }) => {
      const isSelected = item.value === selectedValue;
      return (
        <TouchableOpacity
          style={[styles.optionRow, isSelected && styles.optionRowSelected]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.optionText, isSelected && styles.optionTextSelected]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
        </TouchableOpacity>
      );
    },
    [selectedValue, handleSelect, styles, theme.primary]
  );

  const keyExtractor = useCallback(
    (item: DropdownItem, index: number) => `${item.value}-${index}`,
    []
  );

  // Bottom-sheet sizing: cap the sheet below the top inset and bound the list so
  // it scrolls instead of pushing the sheet past the screen.
  const bottomInset = Math.max(insets.bottom, 24);
  const sheetMaxHeight = windowHeight - insets.top - 24;
  const headerAllowance = searchable ? 150 : 90;
  const listMaxHeight = Math.max(ROW_HEIGHT, sheetMaxHeight - headerAllowance - bottomInset);

  return (
    <>
      {/* Option A: label left — value right */}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          !enabled && styles.triggerDisabled,
          pressed && enabled && { opacity: 0.7 },
        ]}
        onPress={open}
      >
        {label ? (
          <>
            <View style={styles.triggerLeading}>
              <Text
                style={[styles.triggerLabel, !enabled && styles.triggerLabelDisabled]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {helpText ? (
                <FieldHelp
                  accessibilityLabel={`More information about ${helpLabel ?? label}`}
                  compact
                  description={helpText}
                  title={helpLabel ?? label}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.triggerText,
                !selectedItem && styles.triggerPlaceholder,
                !enabled && styles.triggerTextDisabled,
              ]}
              numberOfLines={1}
            >
              {selectedItem ? selectedItem.label : '—'}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.triggerText,
              styles.triggerTextNoLabel,
              !selectedItem && styles.triggerPlaceholder,
              !enabled && styles.triggerTextDisabled,
            ]}
            numberOfLines={1}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={enabled ? theme.textTertiary : theme.border}
        />
      </Pressable>

      {/* Native slide bottom-sheet, matching the app's other picker sheets
          (StagePickerSheet/PlantPickerSheet): the full-screen overlay closes on
          tap; the inner sheet swallows taps so only the handle bar / rows act. */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={close}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.sheet, { maxHeight: sheetMaxHeight, paddingBottom: bottomInset }]}
          >
            <TouchableOpacity
              style={styles.sheetCloseRow}
              activeOpacity={0.7}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{placeholder}</Text>
            </TouchableOpacity>
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color={theme.textTertiary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${placeholder.toLowerCase()}...`}
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
            {searchable && filteredItems.length === 0 && (
              <Text style={styles.emptyText}>No matches found</Text>
            )}
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={{ maxHeight: listMaxHeight }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              getItemLayout={(_, index) => ({
                length: ROW_HEIGHT,
                offset: ROW_HEIGHT * index,
                index,
              })}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
