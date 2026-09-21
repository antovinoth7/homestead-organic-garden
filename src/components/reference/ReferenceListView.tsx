import React, { useCallback, useMemo } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import type { ImageSource } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { DEFAULT_ZONE } from '@/config/zones';
import { createStyles } from '@/styles/pestDiseaseListStyles';
import { useReferenceBrowse } from '@/hooks/useReferenceBrowse';
import {
  ALL_CATEGORIES,
  REFERENCE_EFFORT_OPTIONS,
  REFERENCE_GROUP_MODES,
  REFERENCE_RISK_OPTIONS,
} from '@/utils/referenceFilters';
import type {
  ReferenceEffortFilter,
  ReferenceGroupMode,
  ReferenceListItem,
  ReferenceRiskFilter,
} from '@/utils/referenceFilters';
import { ReferenceBrowseHeader } from './ReferenceBrowseHeader';
import { ReferenceFilterSheet } from './ReferenceFilterSheet';
import type { FacetSection } from './ReferenceFilterSheet';
import { ReferenceSectionHeader } from './ReferenceSectionHeader';
import { ReferenceListCard } from './ReferenceListCard';
import type { ReferenceEntry, ReferenceGroup } from './types';
import type { VisualIconKey } from '@/types/visual.types';

interface Props {
  /** Screen title, e.g. "Pests". */
  title: string;
  /** Placeholder for the search field. */
  searchPlaceholder: string;
  /** Noun used in the empty state — "pest" / "disease". */
  itemNoun: string;
  groups: readonly ReferenceGroup[];
  getImage: (entry: ReferenceEntry) => ImageSource | undefined;
  fallbackIcon: VisualIconKey;
  onSelect: (id: string) => void;
  onBack: () => void;
}

/**
 * Browse list shared by the pest and disease screens.
 *
 * Search and the category filter used to sit permanently above the list, one as
 * a field and one as a pill rail. Both now live in the header bar the plant
 * catalog uses — a magnifier that expands in place and a funnel that opens
 * `ReferenceFilterSheet` — which buys back two rows and gives the screen room
 * for the risk and effort facets, and for sectioning the rows.
 */
export function ReferenceListView({
  title,
  searchPlaceholder,
  itemNoun,
  groups,
  getImage,
  fallbackIcon,
  onSelect,
  onBack,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const browse = useReferenceBrowse(groups);

  const totalCount = useMemo(() => groups.reduce((sum, g) => sum + g.entries.length, 0), [groups]);

  const { setFilter, setGroupMode } = browse;

  const setCategory = useCallback((value: string) => setFilter('category', value), [setFilter]);
  const setRisk = useCallback(
    (value: string) => setFilter('risk', value as ReferenceRiskFilter),
    [setFilter]
  );
  const setEffort = useCallback(
    (value: string) => setFilter('effort', value as ReferenceEffortFilter),
    [setFilter]
  );
  const setMode = useCallback(
    (value: string) => setGroupMode(value as ReferenceGroupMode),
    [setGroupMode]
  );

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
        key: 'risk',
        title: 'Risk now',
        icon: 'thermometer',
        selected: browse.filters.risk,
        onSelect: setRisk,
        options: REFERENCE_RISK_OPTIONS.map((option) => ({
          ...option,
          count: browse.facetCounts.risk[option.value] ?? 0,
        })),
      },
      {
        key: 'effort',
        title: 'Treatment effort',
        icon: 'hammer',
        selected: browse.filters.effort,
        onSelect: setEffort,
        options: REFERENCE_EFFORT_OPTIONS.map((option) => ({
          ...option,
          count: browse.facetCounts.effort[option.value] ?? 0,
        })),
      },
      {
        key: 'mode',
        // A grouping does not narrow the list, so its chips carry no count.
        title: 'Group By',
        icon: 'layers',
        selected: browse.groupMode,
        onSelect: setMode,
        options: REFERENCE_GROUP_MODES.map((option) => ({ ...option })),
      },
    ],
    [
      browse.filters,
      browse.facetCounts,
      browse.categoryLabels,
      browse.groupMode,
      setCategory,
      setRisk,
      setEffort,
      setMode,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: ReferenceListItem }) =>
      item.kind === 'section' ? (
        <ReferenceSectionHeader title={item.title} count={item.count} />
      ) : (
        <ReferenceListCard
          entry={item.entry}
          image={getImage(item.entry)}
          fallbackIcon={fallbackIcon}
          onPress={onSelect}
        />
      ),
    [fallbackIcon, getImage, onSelect]
  );

  const keyExtractor = useCallback(
    (item: ReferenceListItem) =>
      item.kind === 'section' ? `s:${item.title}` : `e:${item.entry.id}`,
    []
  );

  return (
    <View style={styles.container}>
      <ReferenceBrowseHeader
        title={title}
        subtitle={`${totalCount} in the ${DEFAULT_ZONE.name}`}
        searchPlaceholder={searchPlaceholder}
        searchAccessibilityLabel={`Search ${title.toLowerCase()}`}
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

      <FlatList
        data={browse.items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          // No TAB_BAR_HEIGHT: `FloatingTabBar` hides itself on any non-root
          // route, and these screens are nested in the More stack.
          { paddingBottom: Math.max(insets.bottom, 8) + 16 },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No {itemNoun}s match your filters</Text>
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
          title={`Filter ${title.toLowerCase()}`}
          sections={sections}
          isDefault={browse.isDefault}
          onReset={browse.resetFilters}
          onClose={browse.closeFilters}
        />
      )}
    </View>
  );
}
