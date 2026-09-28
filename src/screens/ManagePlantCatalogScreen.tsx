import React, { useMemo, useCallback, useState } from 'react';
import {
  BackHandler,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { createStyles, catalogRowTotalHeight } from '@/styles/managePlantCatalogStyles';
import { MoreStackParamList } from '@/types/navigation.types';
import { CatalogSearchBar } from '@/components/catalog/CatalogSearchBar';
import { CatalogBrowseRow } from '@/components/catalog/CatalogBrowseRow';
import { CatalogSkeletonRows } from '@/components/catalog/CatalogSkeletonRows';
import { CatalogSearchResultRow } from '@/components/catalog/CatalogSearchResultRow';
import { CatalogSectionHeader } from '@/components/catalog/CatalogSectionHeader';
import { CatalogFilterSheet } from '@/components/catalog/CatalogFilterSheet';
import { DEFAULT_CATALOG_GROUP_MODE } from '@/components/catalog/catalogGroupModes';
import { RecentSearchChips } from '@/components/catalog/RecentSearchChips';
import { usePlantCatalogManager } from '@/hooks/usePlantCatalogManager';
import { useCatalogSearch } from '@/hooks/useCatalogSearch';
import { findCatalogPlant } from '@/utils/catalogSearch';
import {
  ALL_GROUPS,
  buildBrowseItems,
  buildSearchItems,
  measureCatalogItems,
} from '@/utils/catalogListItems';
import type { CatalogListItem } from '@/utils/catalogListItems';
import { CATALOG_GROUP_DEFAULT_TYPE } from '@/config/plants/catalogTaxonomy';
import type { CatalogGroup, PlantType } from '@/types/database.types';

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  // The row heights the list promises getItemLayout scale with the OS font
  // setting, so the screen, the rows and the headers must all read the same one.
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);
  const insets = useSafeAreaInsets();

  const {
    activeGroup,
    setActiveGroup,
    groupMode,
    setGroupMode,
    loading,
    error,
    refreshing,
    groupData,
    reload,
    groupCounts,
    plantCountsByType,
    mergedProfiles,
    hiddenPlantNames,
    restore,
    refresh,
  } = usePlantCatalogManager();

  /**
   * A new entry starts in the chosen category, with that category's care model;
   * the entry form lets both be corrected. Under `all` no category is chosen, so
   * it starts from the one most plants are added to.
   */
  const newPlantGroup: CatalogGroup = activeGroup === ALL_GROUPS ? 'vegetables' : activeGroup;
  const newPlantType = CATALOG_GROUP_DEFAULT_TYPE[newPlantGroup];

  // Search and the filter sheet each take over the header, so only one is
  // open at a time. No LayoutAnimation here: on the New Architecture it drives
  // UIManager::animationTick → ShadowTreeRegistry::enumerate, the frame of a
  // native crash this app has already had, and it only animated a search box.
  const [searchActive, setSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const openSearch = useCallback(() => {
    setShowFilters(false);
    setSearchActive(true);
  }, []);

  const toggleFilters = useCallback(() => {
    setSearchActive(false);
    setShowFilters((prev) => !prev);
  }, []);

  const closeFilters = useCallback(() => setShowFilters(false), []);

  // `enabled` latches inside the hook, so opening search once is enough — a
  // query that outlives the collapsed bar keeps its index.
  const {
    query,
    setQuery,
    clearQuery,
    isSearching,
    results,
    totalMatches,
    recentSearches,
    commitSearch,
    clearRecentSearches,
  } = useCatalogSearch({ profiles: mergedProfiles, plantCountsByType, enabled: searchActive });

  // Collapsing search ends it. Keeping the query left a results list with no
  // field on screen, and category changes then did nothing visible.
  const closeSearch = useCallback(() => {
    clearQuery();
    setSearchActive(false);
  }, [clearQuery]);

  // Android back closes what is open before it leaves the screen.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showFilters) {
          setShowFilters(false);
          return true;
        }
        if (searchActive) {
          closeSearch();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [showFilters, searchActive, closeSearch])
  );

  const onBack = useCallback(() => moreNav.goBack(), [moreNav]);

  const openPlant = useCallback(
    (plantName: string, plantType: PlantType) => {
      // Opening a result is the usual end of a search, so that is when it is
      // remembered — not only on the keyboard's submit key.
      if (query.trim()) commitSearch(query.trim());
      // Search spans categories, so the row's own type wins over the active pill.
      moreNav.navigate('CatalogPlantDetail', {
        plantName,
        plantType,
        isCreating: false,
      });
    },
    [moreNav, query, commitSearch]
  );

  const onAddPlant = useCallback(() => {
    moreNav.navigate('CatalogPlantDetail', {
      plantName: '',
      plantType: newPlantType,
      isCreating: true,
      group: newPlantGroup,
    });
  }, [moreNav, newPlantType, newPlantGroup]);

  // "Okra" and "Methi" are Ladies Finger and Fenugreek. Creating a second entry
  // for a name the catalog already knows is how the duplicates got there, so
  // resolve the query first and open the existing plant when one matches.
  const onCreateFromQuery = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    commitSearch(trimmed);

    // Checked against the whole catalog, not the on-screen results: those lag
    // the typed text by the debounce, so a fast tap compared the previous query.
    // A Tamil name typed exactly is the same plant too.
    const existing = findCatalogPlant(mergedProfiles, trimmed);
    if (existing) {
      moreNav.navigate('CatalogPlantDetail', {
        plantName: existing.name,
        plantType: existing.plantType,
        isCreating: false,
      });
      return;
    }

    moreNav.navigate('CatalogPlantDetail', {
      plantName: trimmed,
      plantType: newPlantType,
      isCreating: true,
      group: newPlantGroup,
    });
  }, [moreNav, query, newPlantType, newPlantGroup, commitSearch, mergedProfiles]);

  /**
   * How many of the sheet's two facets are off default. A dot could say only
   * that something was filtered, not whether the category, the grouping or both
   * were responsible for the list on screen.
   */
  const activeFilterCount =
    (activeGroup === ALL_GROUPS ? 0 : 1) + (groupMode === DEFAULT_CATALOG_GROUP_MODE ? 0 : 1);

  const onSubmitSearch = useCallback(() => commitSearch(query), [commitSearch, query]);

  // Items and their pixel offsets are built together: the browse list mixes
  // two heights, so getItemLayout needs a table rather than one multiplication.
  const {
    items: data,
    offsets,
    heights,
  } = useMemo(
    () =>
      measureCatalogItems(
        isSearching
          ? buildSearchItems(results)
          : // `groupData` carries the group and mode it was built for, so the
            // list can never pair a freshly tapped category with the old rows.
            buildBrowseItems({
              group: groupData.group,
              entries: groupData.entries,
              mode: groupData.mode,
            }),
        fontScale
      ),
    [isSearching, results, groupData, fontScale]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CatalogListItem; index: number }) => {
      if (item.kind === 'section') {
        return <CatalogSectionHeader title={item.title} count={item.count} fontScale={fontScale} />;
      }
      if (item.kind === 'result') {
        // Search results are one flat card: no letter groups to break them up.
        return (
          <CatalogSearchResultRow
            result={item.result}
            isFirst={index === 0}
            // `results.length`, not `data.length`: only search rows read this,
            // and keying on the whole list would give `renderItem` a new
            // identity on every group switch, re-rendering every browse row.
            isLast={index === results.length - 1}
            fontScale={fontScale}
            onPress={openPlant}
          />
        );
      }
      return (
        <CatalogBrowseRow
          plantName={item.name}
          tamilName={item.tamilName}
          // The row's own type, not the active pill: a group spans several.
          plantType={item.plantType}
          habit={item.habit}
          count={item.count}
          subtitle={item.subtitle}
          isFirst={item.isFirst}
          isLast={item.isLast}
          fontScale={fontScale}
          onPress={openPlant}
        />
      );
    },
    [results.length, openPlant, fontScale]
  );

  // Browse items are fixed heights — two of them, rows and letter headers — so
  // the fast path reads the offset table built alongside the data. Search rows
  // wrap to an unknown height, so the screen passes `undefined` instead.
  const getItemLayout = useCallback(
    (_: ArrayLike<CatalogListItem> | null | undefined, index: number) => ({
      length: heights[index] ?? catalogRowTotalHeight(fontScale),
      offset: offsets[index] ?? 0,
      index,
    }),
    [heights, offsets, fontScale]
  );

  const keyExtractor = useCallback((item: CatalogListItem) => {
    if (item.kind === 'section') return `s:${item.title}`;
    return item.kind === 'browse'
      ? `b:${item.plantType}:${item.name}`
      : `r:${item.result.plantType}:${item.result.name}`;
  }, []);

  // Search and the category filter both live in the header bar now, so browsing
  // needs no list header at all — only a search does, to count its matches. The
  // count is worth stating because a search spans every category, unlike the
  // list beneath it.
  const onRetry = useCallback(() => {
    void reload();
  }, [reload]);

  // The bundled catalog always renders, so a failed load is never an empty
  // list — it is the user's own plants and edits missing. Say so above the
  // list, with a way to retry, instead of an alert on every visit.
  const errorBanner = useMemo(
    () =>
      error ? (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Couldn't load your catalog changes. Tap to try again."
        >
          <Ionicons name="cloud-offline-outline" size={18} color={theme.textSecondary} />
          <Text style={styles.errorBannerText}>
            Couldn&apos;t load your catalog changes.{' '}
            <Text style={styles.errorBannerAction}>Retry</Text>
          </Text>
        </TouchableOpacity>
      ) : null,
    [error, styles, onRetry, theme.textSecondary]
  );

  const showRecents = searchActive && query.trim() === '';

  const listHeader = useMemo(
    () => (
      <>
        {errorBanner}
        {showRecents ? (
          <RecentSearchChips
            queries={recentSearches}
            onSelect={setQuery}
            onClearAll={clearRecentSearches}
          />
        ) : null}
        {isSearching ? (
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Matches</Text>
            <Text style={styles.sectionLabelCount}>
              {totalMatches > results.length
                ? `${results.length} of ${totalMatches}`
                : `${totalMatches} ${totalMatches === 1 ? 'plant' : 'plants'}`}
            </Text>
          </View>
        ) : null}
      </>
    ),
    [
      errorBanner,
      showRecents,
      recentSearches,
      setQuery,
      clearRecentSearches,
      isSearching,
      results.length,
      totalMatches,
      styles,
    ]
  );

  const listFooter = useMemo(() => {
    // The create CTA only makes sense once a query has come up short.
    if (!isSearching) return null;
    return (
      <TouchableOpacity style={styles.createCta} onPress={onCreateFromQuery} activeOpacity={0.8}>
        <Ionicons name="leaf-outline" size={18} color={theme.primary} />
        <Text style={styles.createCtaText}>
          {results.length > 0 ? 'Not the one? ' : 'No match? '}
          <Text style={styles.createCtaStrong}>Add “{query.trim()}” as a new plant</Text>
        </Text>
      </TouchableOpacity>
    );
  }, [isSearching, styles, onCreateFromQuery, theme.primary, results.length, query]);

  // Clearing the query is what returns the list to browsing: collapsing search
  // deliberately keeps it, so without this the pills stay hidden behind a
  // results list the user can no longer see a field for.
  const onClearSearch = useCallback(() => {
    clearQuery();
    setSearchActive(false);
  }, [clearQuery]);

  /**
   * Different nothings, which the old single line of text could not tell
   * apart: the load failed, the search matched nothing, or the group is empty.
   * Only the first two have a way out, and both offer it.
   */
  const listEmpty = useMemo(() => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={40} color={theme.textTertiary} />
          <Text style={styles.emptyTitle}>No plants match that search</Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={onClearSearch}
            accessibilityRole="button"
            accessibilityLabel="Clear the search and browse the catalog"
          >
            <Text style={styles.emptyActionText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Under `all` there is no category to blame, so an empty list means the
    // catalog itself is empty rather than the filter being too narrow.
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={40} color={theme.textTertiary} />
        <Text style={styles.emptyTitle}>
          {activeGroup === ALL_GROUPS ? 'No plants in the catalog yet' : 'No plants in this group'}
        </Text>
        <Text style={styles.emptyText}>Tap + to add one.</Text>
      </View>
    );
  }, [styles, isSearching, onClearSearch, theme.textTertiary, activeGroup]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              onPress={closeSearch}
              style={styles.searchBackBtn}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
            </TouchableOpacity>
            <CatalogSearchBar
              autoFocus
              value={query}
              onChangeText={setQuery}
              onClear={clearQuery}
              onSubmit={onSubmitSearch}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
            </TouchableOpacity>
            <Text style={styles.title}>Plant Catalog</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel="Search plant catalog"
              >
                <Ionicons name="search" size={20} color={theme.textInverse} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, showFilters && styles.headerIconBtnActive]}
                onPress={toggleFilters}
                accessibilityRole="button"
                accessibilityLabel="Filter plants"
              >
                <Ionicons
                  name="funnel"
                  size={20}
                  color={showFilters ? theme.primary : theme.textInverse}
                />
                {activeFilterCount > 0 && !showFilters && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText} maxFontSizeMultiplier={1.2}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {showFilters && (
        <CatalogFilterSheet
          group={activeGroup}
          groupCounts={groupCounts}
          onGroupChange={setActiveGroup}
          mode={groupMode}
          onChange={setGroupMode}
          onClose={closeFilters}
          hiddenPlants={hiddenPlantNames}
          onRestore={restore}
        />
      )}

      {loading ? (
        <CatalogSkeletonRows />
      ) : (
        <View style={styles.contentWrapper}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            ListEmptyComponent={listEmpty}
            style={styles.contentWrapper}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 48) + 80 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            windowSize={7}
            removeClippedSubviews
            getItemLayout={isSearching ? undefined : getItemLayout}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
          />

          {/* Hidden while searching: the keyboard lifts it over the results, and
              the "Add … as a new plant" row already offers the same action. */}
          {!searchActive && (
            <TouchableOpacity
              style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
              onPress={onAddPlant}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add a plant to the catalog"
            >
              <Ionicons name="add" size={28} color={theme.textInverse} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
