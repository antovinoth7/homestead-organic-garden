import React, { forwardRef, useMemo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Search field for the catalog, rendered inside the screen's header bar. */
export const CatalogSearchBar = forwardRef<TextInput, Props>(function CatalogSearchBar(
  {
    value,
    onChangeText,
    onClear,
    onSubmit,
    placeholder = 'Search plants or Tamil name',
    autoFocus = false,
  },
  ref
): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isActive = value.length > 0;

  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={16} color={theme.textSecondary} />
      <TextInput
        ref={ref}
        autoFocus={autoFocus}
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.inputPlaceholder}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="Search plant catalog"
      />
      {isActive && (
        <TouchableOpacity onPress={onClear} hitSlop={8} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
});
