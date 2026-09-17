import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  LayoutAnimation,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { createStyles, catalogRowTotalHeight } from '@/styles/managePlantCatalogStyles';
import { MoreStackParamList } from '@/types/navigation.types';
import { PlantCategoryTabs } from '@/components/PlantCategoryTabs';
import { CatalogSearchBar } from '@/components/catalog/CatalogSearchBar';
import { CatalogBrowseRow } from '@/components/catalog/CatalogBrowseRow';
import { CatalogSkeletonRows } from '@/components/catalog/CatalogSkeletonRows';
import { CatalogSearchResultRow } from '@/components/catalog/CatalogSearchResultRow';
import { CatalogSectionHeader } from '@/components/catalog/CatalogSectionHeader';
import { CatalogGroupSheet } from '@/components/catalog/CatalogGroupSheet';
import {
  CATALOG_GROUP_MODES,
  DEFAULT_CATALOG_GROUP_MODE,
} from '@/components/catalog/catalogGroupModes';
import { RecentSearchChips } from '@/components/catalog/RecentSearchChips';
import { HiddenPlantsSection } from '@/components/catalog/HiddenPlantsSection';
import { usePlantCatalogManager } from '@/hooks/usePlantCatalogManager';
import { useCatalogSearch } from '@/hooks/useCatalogSearch';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import {
  buildBrowseItems,
  buildSearchItems,
  measureCatalogItems,
} from '@/utils/catalogListItems';
import type { CatalogListItem } from '@/utils/catalogListItems';
import { CATALOG_GROUP_DEFAULT_TYPE } from '@/config/plants/catalogTaxonomy';
import type { PlantType } from '@/types/database.types';

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
   * A group spans several care models — Fruits holds both `fruit_tree` trees and
   * herbaceous quick fruits — so a newly created entry only gets a starting type
   * from the active pill; the entry form lets it be corrected.
   */
  const newPlantType = CATALOG_GROUP_DEFAULT_TYPE[activeGroup];

  // Search and the grouping sheet each take over the header, so only one is
  // open at a time; the query itself survives collapsing, marked by the dot.
  const [searchActive, setSearchActive] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);

  const openSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowGrouping(false);
    setSearchActive(true);
  }, []);

  const closeSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchActive(false);
  }, []);

  const toggleGrouping = useCallback(() => {
    setSearchActive(false);
    setShowGrouping((prev) => !prev);
  }, []);

  const closeGrouping = useCallback(() => setShowGrouping(false), []);

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
  } = useCatalogSearch({ profiles: mergedProfiles, plantCountsByType });

  const onBack = useCallback(() => moreNav.goBack(), [moreNav]);

  const openPlant = useCallback(
    (plantName: string, plantType: PlantType) => {
      // Search spans categories, so the row's own type wins over the active pill.
      moreNav.navigate('CatalogPlantDetail', {
        plantName,
        plantType,
        isCreating: false,
      });
    },
    [moreNav]
  );

  const onAddPlant = useCallback(() => {
    moreNav.navigate('CatalogPlantDetail', {
      plantName: '',
      plantType: newPlantType,
      isCreating: true,
    });
  }, [moreNav, newPlantType]);

  // "Okra" and "Methi" are Ladies Finger and Fenugreek. Creating a second entry
  // for a name the catalog already knows is how the duplicates got there, so
  // resolve the query first and open the existing plant when one matches.
  const onCreateFromQuery = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    commitSearch(trimmed);

    const canonical = getCanonicalPlantKey(trimmed);
    const existing = results.find(
      (result) => getCanonicalPlantKey(result.name) === canonical
    );
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
    });
  }, [moreNav, query, newPlantType, commitSearch, results]);

  /** Names the active grouping for the funnel's accessibility label. */
  const groupModeLabel =
    CATALOG_GROUP_MODES.find((entry) => entry.value === groupMode)?.label ?? groupMode;

  const onSubmitSearch = useCallback(() => commitSearch(query), [commitSearch, query]);

  // Items and their pixel offsets are built together: the browse list mixes
  // two heights, so getItemLayout needs a table rather than one multiplication.
  const { items: data, offsets, heights } = useMemo(
    () =>
      measureCatalogItems(
        isSearching
          ? buildSearchItems(results)
          : // `groupData` carries the group and mode it was built for, so the
            // list can never pair a freshly tapped pill with the old rows.
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
        return (
          <CatalogSectionHeader title={item.title} count={item.count} fontScale={fontScale} />
        );
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

  // The search field now lives in the header bar, and the grouping toggle in a
  // sheet, so the list header is just the group pills — or the match count,
  // which replaces them because a search spans every group.
  const listHeader = useMemo(
    () =>
      isSearching ? (
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>Matches</Text>
          <Text style={styles.sectionLabelCount}>
            {totalMatches > results.length
              ? `${results.length} of ${totalMatches}`
              : `${totalMatches} ${totalMatches === 1 ? 'plant' : 'plants'}`}
          </Text>
        </View>
      ) : (
        <PlantCategoryTabs
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          onGroupChange={setActiveGroup}
        />
      ),
    [
      isSearching,
      results.length,
      totalMatches,
      styles,
      activeGroup,
      groupCounts,
      setActiveGroup,
    ]
  );

  const listFooter = useMemo(() => {
    // Recent searches are a way *into* a search, so they belong to the browse
    // state; the create CTA only makes sense once a query has come up short.
    if (!isSearching) {
      return (
        <>
          <RecentSearchChips
            queries={recentSearches}
            onSelect={setQuery}
            onClearAll={clearRecentSearches}
          />
          <HiddenPlantsSection plants={hiddenPlantNames} onRestore={restore} />
        </>
      );
    }
    return (
      <TouchableOpacity style={styles.createCta} onPress={onCreateFromQuery} activeOpacity={0.8}>
        <Ionicons name="leaf-outline" size={18} color={theme.primary} />
        <Text style={styles.createCtaText}>
          {results.length > 0 ? 'Not the one? ' : 'No match? '}
          <Text style={styles.createCtaStrong}>Add “{query.trim()}” as a new plant</Text>
        </Text>
      </TouchableOpacity>
    );
  }, [
    isSearching,
    recentSearches,
    setQuery,
    clearRecentSearches,
    hiddenPlantNames,
    restore,
    styles,
    onCreateFromQuery,
    theme.primary,
    results.length,
    query,
  ]);

  // Clearing the query is what returns the list to browsing: collapsing search
  // deliberately keeps it, so without this the pills stay hidden behind a
  // results list the user can no longer see a field for.
  const onClearSearch = useCallback(() => {
    clearQuery();
    setSearchActive(false);
  }, [clearQuery]);

  const onRetry = useCallback(() => {
    void reload();
  }, [reload]);

  /**
   * Three different nothings, which the old single line of text could not tell
   * apart: the load failed, the search matched nothing, or the group is empty.
   * Only the first two have a way out, and both offer it.
   */
  const listEmpty = useMemo(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.textTertiary} />
          <Text style={styles.emptyTitle}>Couldn&apos;t load the catalog</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading the plant catalog"
          >
            <Text style={styles.emptyActionText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

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

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={40} color={theme.textTertiary} />
        <Text style={styles.emptyTitle}>No plants in this group</Text>
        <Text style={styles.emptyText}>Tap + to add one.</Text>
      </View>
    );
  }, [styles, isSearching, error, onClearSearch, onRetry, theme.textTertiary]);

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
                {query.trim() !== '' && <View style={styles.headerActiveDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, showGrouping && styles.headerIconBtnActive]}
                onPress={toggleGrouping}
                accessibilityRole="button"
                accessibilityLabel={`Group plants by ${groupModeLabel}`}
              >
                <Ionicons
                  name="funnel"
                  size={20}
                  color={showGrouping ? theme.primary : theme.textInverse}
                />
                {groupMode !== DEFAULT_CATALOG_GROUP_MODE && !showGrouping && (
                  <View style={styles.headerActiveDot} />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {showGrouping && (
        <CatalogGroupSheet mode={groupMode} onChange={setGroupMode} onClose={closeGrouping} />
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

          <TouchableOpacity
            style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
            onPress={onAddPlant}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add a plant to the catalog"
          >
            <Ionicons name="add" size={28} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
