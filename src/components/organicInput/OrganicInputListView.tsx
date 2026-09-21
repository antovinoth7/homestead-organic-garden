import React, { useCallback, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { DEFAULT_ZONE } from '@/config/zones';
import { ReferenceBrowseHeader } from '@/components/reference/ReferenceBrowseHeader';
import { ReferenceFilterSheet } from '@/components/reference/ReferenceFilterSheet';
import type { FacetSection } from '@/components/reference/ReferenceFilterSheet';
import { ReferenceSectionHeader } from '@/components/reference/ReferenceSectionHeader';
import { createStyles } from '@/styles/organicInputListStyles';
import { useOrganicInputBrowse } from '@/hooks/useOrganicInputBrowse';
import {
  ALL_CATEGORIES,
  ORGANIC_INPUT_DIY_OPTIONS,
  ORGANIC_INPUT_GROUP_MODES,
} from '@/utils/organicInputFilters';
import type {
  OrganicInputDiyFilter,
  OrganicInputGroupMode,
  OrganicInputListItem,
} from '@/utils/organicInputFilters';
import { OrganicInputCard } from './OrganicInputCard';
import type { OrganicInputEntry } from '@/types/database.types';

export interface OrganicInputGroup {
  category: string;
  label: string;
  entries: OrganicInputEntry[];
}

interface Props {
  groups: readonly OrganicInputGroup[];
  /** Recipe count shown on the "Make your own" banner. */
  recipeCount: number;
  /** Farm size the recipe calculator will scale to, in cents. */
  landCents: number;
  onSelect: (id: string) => void;
  onOpenRecipes: () => void;
  onBack: () => void;
}

/**
 * Organic-input browse list. Mirrors the pest/disease screen — same header bar
 * and filter sheet — with the "make your own" recipe banner kept between the
 * header and the list, and a DIY facet in place of risk and effort.
 */
export function OrganicInputListView({
  groups,
  recipeCount,
  landCents,
  onSelect,
  onOpenRecipes,
  onBack,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const browse = useOrganicInputBrowse(groups);

  const totalCount = useMemo(() => groups.reduce((sum, g) => sum + g.entries.length, 0), [groups]);

  const { setFilter, setGroupMode } = browse;

  const setCategory = useCallback((value: string) => setFilter('category', value), [setFilter]);
  const setDiy = useCallback(
    (value: string) => setFilter('diy', value as OrganicInputDiyFilter),
    [setFilter]
  );
  const setMode = useCallback(
    (value: string) => setGroupMode(value as OrganicInputGroupMode),
    [setGroupMode]
  );

  const centsLabel = `${landCents} cent${landCents === 1 ? '' : 's'}`;

  const sections: FacetSection[] = useMemo(
    () => [
      {
        key: 'category',
        title: 'Category',
        icon: 'apps',
        selected: browse.filters.category,
        onSelect: setCategory,
        options: [
          {
            value: ALL_CATEGORIES,
            label: 'All',
            hint: 'Browse every category at once',
            icon: 'layers-outline',
            count: browse.facetCounts.category[ALL_CATEGORIES] ?? 0,
          },
          ...[...browse.categoryLabels].map(([value, label]) => ({
            value,
            label,
            hint: `Browse ${label} only`,
            icon: 'pricetag-outline' as const,
            count: browse.facetCounts.category[value] ?? 0,
          })),
        ],
      },
      {
        key: 'diy',
        title: 'DIY recipe',
        icon: 'flask',
        selected: browse.filters.diy,
        onSelect: setDiy,
        options: ORGANIC_INPUT_DIY_OPTIONS.map((option) => ({
          ...option,
          count: browse.facetCounts.diy[option.value] ?? 0,
        })),
      },
      {
        key: 'mode',
        // A grouping does not narrow the list, so its chips carry no count.
        title: 'Group By',
        icon: 'layers',
        selected: browse.groupMode,
        onSelect: setMode,
        options: ORGANIC_INPUT_GROUP_MODES.map((option) => ({ ...option })),
      },
    ],
    [
      browse.filters,
      browse.facetCounts,
      browse.categoryLabels,
      browse.groupMode,
      setCategory,
      setDiy,
      setMode,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: OrganicInputListItem }) =>
      item.kind === 'section' ? (
        <ReferenceSectionHeader title={item.title} count={item.count} />
      ) : (
        <OrganicInputCard entry={item.entry} onPress={onSelect} />
      ),
    [onSelect]
  );

  const keyExtractor = useCallback(
    (item: OrganicInputListItem) =>
      item.kind === 'section' ? `s:${item.title}` : `e:${item.entry.id}`,
    []
  );

  return (
    <View style={styles.container}>
      <ReferenceBrowseHeader
        title="Organic inputs"
        subtitle={`${totalCount} inputs · ${DEFAULT_ZONE.name}`}
        searchPlaceholder="Search inputs, plants or uses"
        searchAccessibilityLabel="Search organic inputs"
        query={browse.query}
        searchActive={browse.searchActive}
        showFilters={browse.showFilters}
        activeFilterCount={browse.activeFilterCount}
        onQueryChange={browse.setQuery}
        onClearQuery={browse.clearQuery}
        onOpenSearch={browse.openSearch}
        onCloseSearch={browse.closeSearch}
        onToggleFilters={browse.toggleFilters}
        onBack={onBack}
      />

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

      <FlatList
        data={browse.items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          // No TAB_BAR_HEIGHT: `FloatingTabBar` hides itself on any non-root
          // route, and this screen is nested in the More stack.
          { paddingBottom: Math.max(insets.bottom, 8) + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No inputs match your filters</Text>
            {browse.isFiltered ? (
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={browse.reset}
                accessibilityRole="button"
              >
                <Text style={styles.emptyActionText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      {browse.showFilters && (
        <ReferenceFilterSheet
          title="Filter organic inputs"
          sections={sections}
          isDefault={browse.isDefault}
          onReset={browse.resetFilters}
          onClose={browse.closeFilters}
        />
      )}
    </View>
  );
}
