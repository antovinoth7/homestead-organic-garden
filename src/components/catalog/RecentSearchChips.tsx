import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';

interface ChipProps {
  query: string;
  onSelect: (query: string) => void;
}

function RecentSearchChip({ query, onSelect }: ChipProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onSelect(query), [onSelect, query]);

  return (
    <TouchableOpacity style={styles.recentChip} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name="arrow-undo-outline" size={13} color={theme.textTertiary} />
      <Text style={styles.recentChipText}>{query}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  queries: readonly string[];
  onSelect: (query: string) => void;
  onClearAll: () => void;
}

export function RecentSearchChips({
  queries,
  onSelect,
  onClearAll,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (queries.length === 0) return null;

  return (
    <View>
      <View style={styles.recentHeaderRow}>
        <Text style={styles.sectionLabel}>Recent searches</Text>
        <TouchableOpacity onPress={onClearAll} hitSlop={8}>
          <Text style={styles.recentClearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.recentChipRow}>
        {queries.map((query) => (
          <RecentSearchChip key={query} query={query} onSelect={onSelect} />
        ))}
      </View>
    </View>
  );
}
