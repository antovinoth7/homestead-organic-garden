import React, { useMemo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  placeholder?: string;
}

/** Persistent search field above the catalog list. */
export function CatalogSearchBar({
  value,
  onChangeText,
  onClear,
  onSubmit,
  placeholder = 'Search plants or Tamil name',
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isActive = value.length > 0;

  return (
    <View style={[styles.searchBar, isActive && styles.searchBarActive]}>
      <Ionicons
        name="search"
        size={18}
        color={isActive ? theme.primary : theme.textTertiary}
      />
      <TextInput
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
}
