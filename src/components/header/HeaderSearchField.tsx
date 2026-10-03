import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/headerActionStyles';

interface Props {
  value: string;
  /** Sanitising and debounce stay with the caller. */
  onChangeText: (next: string) => void;
  onClear: () => void;
  /** Collapses the bar back to the title row. */
  onClose: () => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  /** Spoken label for the field, e.g. "Search journal". */
  accessibilityLabel: string;
  inputRef?: React.Ref<TextInput>;
  autoFocus?: boolean;
}

/**
 * The expanded search every browse header swaps in for its title row: a
 * chevron that collapses it, then the field filling the rest of the bar.
 */
function HeaderSearchFieldComponent({
  value,
  onChangeText,
  onClear,
  onClose,
  onSubmitEditing,
  placeholder,
  accessibilityLabel,
  inputRef,
  autoFocus = true,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.searchRow}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.searchBackBtn}
        accessibilityRole="button"
        accessibilityLabel="Close search"
      >
        <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
      </TouchableOpacity>
      <View style={styles.searchField}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextInput
          ref={inputRef}
          autoFocus={autoFocus}
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={accessibilityLabel}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export const HeaderSearchField = React.memo(HeaderSearchFieldComponent);
