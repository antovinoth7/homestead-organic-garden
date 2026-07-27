import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { DEFAULT_ZONE } from '@/config/zones';
import FieldHelp from '@/components/FieldHelp';
import { ReferenceFilterChips, type ReferenceChip } from '@/components/reference/ReferenceFilterChips';
import { createStyles } from '@/styles/organicInputListStyles';
import { OrganicInputCard } from './OrganicInputCard';
import type { OrganicInputEntry } from '@/types/database.types';

const ALL_KEY = '__all__';

export interface OrganicInputGroup {
  category: string;
  label: string;
  entries: OrganicInputEntry[];
}

interface Props {
  groups: readonly OrganicInputGroup[];
  categoryDescriptions: Readonly<Record<string, string>>;
  /** Recipe count shown on the "Make your own" banner. */
  recipeCount: number;
  /** Farm size the recipe calculator will scale to, in cents. */
  landCents: number;
  onSelect: (id: string) => void;
  onOpenRecipes: () => void;
  onBack: () => void;
}

/**
 * Chip-filtered organic-input browse list. Mirrors the pest/disease list
 * layout, with a "make your own" recipe banner between the search field and
 * the category chips.
 */
export function OrganicInputListView({
  groups,
  categoryDescriptions,
  recipeCount,
  landCents,
  onSelect,
  onOpenRecipes,
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

  /** Search-filtered groups — chip counts derive from these so a chip never
   *  advertises entries the current search has already excluded. */
  const searchedGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups.map((group) => ({
      ...group,
      entries: group.entries.filter(
        (entry) =>
          entry.name.toLowerCase().includes(query) ||
          (entry.tamilName?.toLowerCase().includes(query) ?? false) ||
          entry.description.toLowerCase().includes(query) ||
          entry.plantsIdeal.some((plant) => plant.toLowerCase().includes(query))
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

  const handleClearSearch = useCallback(() => setSearch(''), []);

  const renderItem = useCallback(
    ({ item }: { item: OrganicInputEntry }) => (
      <OrganicInputCard entry={item} onPress={onSelect} />
    ),
    [onSelect]
  );

  const keyExtractor = useCallback((item: OrganicInputEntry) => item.id, []);

  const centsLabel = `${landCents} cent${landCents === 1 ? '' : 's'}`;

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
            <Ionicons name="chevron-back" size={20} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Organic inputs</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} inputs · {DEFAULT_ZONE.name}
            </Text>
          </View>
        </View>

        <View style={styles.searchField}>
          <Ionicons name="search" size={16} color={theme.inputPlaceholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inputs, plants or uses"
            placeholderTextColor={theme.inputPlaceholder}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={16} color={theme.inputPlaceholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        style={styles.recipeBanner}
        onPress={onOpenRecipes}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <View style={styles.recipeBannerIcon}>
          <Ionicons name="flask" size={21} color={theme.textInverse} />
        </View>
        <View style={styles.recipeBannerBody}>
          <Text style={styles.recipeBannerTitle}>Make your own</Text>
          <Text style={styles.recipeBannerSubtitle} numberOfLines={2}>
            {recipeCount} recipes, scaled to your {centsLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textInverse} />
      </TouchableOpacity>

      <ReferenceFilterChips
        chips={chips}
        activeKey={effectiveCategory}
        onChange={setActiveCategory}
      />

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {displayedEntries.length} {displayedEntries.length === 1 ? 'input' : 'inputs'}
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
            <Text style={styles.emptyText}>No inputs match your filters</Text>
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
