import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { DEFAULT_ZONE } from '@/config/zones';
import FieldHelp from '@/components/FieldHelp';
import { createStyles } from '@/styles/pestDiseaseListStyles';
import { ReferenceFilterChips, type ReferenceChip } from './ReferenceFilterChips';
import { ReferenceListCard } from './ReferenceListCard';
import type { ReferenceEntry, ReferenceGroup } from './types';

const ALL_KEY = '__all__';

interface Props {
  /** Screen title, e.g. "Pests". */
  title: string;
  /** Placeholder for the search field. */
  searchPlaceholder: string;
  /** Noun used in the count line — "pest" / "disease". */
  itemNoun: string;
  groups: readonly ReferenceGroup[];
  categoryDescriptions: Readonly<Record<string, string>>;
  getImage: (entry: ReferenceEntry) => ImageSource | undefined;
  onSelect: (id: string) => void;
  onBack: () => void;
}

/**
 * Chip-filtered browse list shared by the pest and disease screens. Category
 * chips filter in place (replacing the old sectioned list) and compose with
 * the search box.
 */
export function ReferenceListView({
  title,
  searchPlaceholder,
  itemNoun,
  groups,
  categoryDescriptions,
  getImage,
  onSelect,
  onBack,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_KEY);

  const totalCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.entries.length, 0),
    [groups]
  );

  /** Search-filtered groups — the chip counts are derived from these so a chip
   *  never advertises entries the current search has already excluded. */
  const searchedGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups.map((group) => ({
      ...group,
      entries: group.entries.filter(
        (entry) =>
          entry.name.toLowerCase().includes(query) ||
          (entry.tamilName?.toLowerCase().includes(query) ?? false) ||
          entry.plantsAffected.some((plant) => plant.toLowerCase().includes(query))
      ),
    }));
  }, [groups, search]);

  const chips: ReferenceChip[] = useMemo(() => {
    const matched = searchedGroups.reduce((sum, g) => sum + g.entries.length, 0);
    return [
      { key: ALL_KEY, label: 'All', count: matched },
      ...searchedGroups
        .filter((g) => g.entries.length > 0)
        .map((g) => ({ key: g.category, label: g.label, count: g.entries.length })),
    ];
  }, [searchedGroups]);

  // A chip can disappear when the search narrows; fall back to All rather than
  // showing an empty list under a filter the user can no longer see.
  const effectiveCategory = chips.some((c) => c.key === activeCategory) ? activeCategory : ALL_KEY;

  const displayedEntries = useMemo(
    () =>
      searchedGroups
        .filter((g) => effectiveCategory === ALL_KEY || g.category === effectiveCategory)
        .flatMap((g) => g.entries),
    [searchedGroups, effectiveCategory]
  );

  const activeDescription =
    effectiveCategory === ALL_KEY ? undefined : categoryDescriptions[effectiveCategory];
  const activeLabel = groups.find((g) => g.category === effectiveCategory)?.label;

  const isFiltered = search.trim().length > 0 || effectiveCategory !== ALL_KEY;

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setActiveCategory(ALL_KEY);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ReferenceEntry }) => (
      <ReferenceListCard entry={item} image={getImage(item)} onPress={onSelect} />
    ),
    [getImage, onSelect]
  );

  const keyExtractor = useCallback((item: ReferenceEntry) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.headerBlock, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} in the {DEFAULT_ZONE.name}
            </Text>
          </View>
        </View>

        <View style={styles.searchField}>
          <Ionicons name="search" size={16} color={theme.inputPlaceholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={theme.inputPlaceholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ReferenceFilterChips
        chips={chips}
        activeKey={effectiveCategory}
        onChange={setActiveCategory}
      />

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {displayedEntries.length} {displayedEntries.length === 1 ? itemNoun : `${itemNoun}s`}
        </Text>
        {activeDescription && activeLabel ? (
          <FieldHelp title={activeLabel} description={activeDescription} compact />
        ) : null}
      </View>

      <FlatList
        data={displayedEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No {itemNoun}s match your filters</Text>
            {isFiltered ? (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={handleClearFilters}
                accessibilityRole="button"
              >
                <Text style={styles.emptyActionText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />
    </View>
  );
}
