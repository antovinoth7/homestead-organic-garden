import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { createStyles } from '../styles/themedDropdownStyles';
import FieldHelp from './FieldHelp';
import { OptionPickerSheet } from './OptionPickerSheet';
import type { PickerOption } from './OptionPickerSheet';

/**
 * @deprecated Prefer importing `PickerOption` from `OptionPickerSheet`. Kept as
 * an alias so existing dropdown call sites keep compiling unchanged.
 */
export type DropdownItem = PickerOption;

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
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const [visible, setVisible] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.value === selectedValue),
    [items, selectedValue]
  );

  const open = useCallback(() => {
    if (!enabled) return;
    setVisible(true);
  }, [enabled]);

  const close = useCallback(() => setVisible(false), []);

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

      <OptionPickerSheet
        visible={visible}
        onClose={close}
        title={placeholder}
        options={items}
        selectedValue={selectedValue}
        onSelect={onValueChange}
        searchable={searchable}
      />
    </>
  );
}
