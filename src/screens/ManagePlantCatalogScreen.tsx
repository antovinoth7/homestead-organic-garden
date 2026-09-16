import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme';
import { createStyles, CATALOG_ROW_TOTAL_HEIGHT } from '@/styles/managePlantCatalogStyles';
import { MoreStackParamList } from '@/types/navigation.types';
import { PlantCategoryTabs } from '@/components/PlantCategoryTabs';
import { CatalogSearchBar } from '@/components/catalog/CatalogSearchBar';
import { CatalogBrowseRow } from '@/components/catalog/CatalogBrowseRow';
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
import { buildSowNowView } from '@/utils/catalogSowNow';
import { getActiveZone } from '@/config/zones';
import type { AgroClimaticZoneId } from '@/config/zones';
import type { CatalogGroup, PlantType } from '@/types/database.types';

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const {
    activeGroup,
    setActiveGroup,
    groupMode,
    setGroupMode,
    loading,
    refreshing,
    groupData,
    groupCounts,
    plantCountsByType,
    countsByName,
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
  const isSowNow = activeGroup === 'sow_now';
  const newPlantType = isSowNow ? 'vegetable' : CATALOG_GROUP_DEFAULT_TYPE[activeGroup];

  /** The zone decides which sowing windows apply; null until Settings has one. */
  const zoneId = useMemo(() => (getActiveZone()?.id as AgroClimaticZoneId) ?? null, []);
  const sowNow = useMemo(
    () => (isSowNow ? buildSowNowView(zoneId, countsByName) : null),
    [isSowNow, zoneId, countsByName]
  );

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
          : sowNow
            ? sowNow.items
            : buildBrowseItems({
                group: activeGroup as CatalogGroup,
                entries: groupData.entries,
                mode: groupMode,
              })
      ),
    [isSearching, results, sowNow, activeGroup, groupData, groupMode]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: CatalogListItem; index: number }) => {
      if (item.kind === 'section') {
        return <CatalogSectionHeader title={item.title} count={item.count} />;
      }
      if (item.kind === 'result') {
        // Search results are one flat card: no letter groups to break them up.
        return (
          <CatalogSearchResultRow
            result={item.result}
            isFirst={index === 0}
            isLast={index === data.length - 1}
            onPress={openPlant}
          />
        );
      }
      return (
        <CatalogBrowseRow
          plantName={item.name}
          // The row's own type, not the active pill: a group spans several.
          plantType={item.plantType}
          habit={item.habit}
          count={item.count}
          subtitle={item.subtitle}
          isFirst={item.isFirst}
          isLast={item.isLast}
          onPress={openPlant}
        />
      );
    },
    [data.length, openPlant]
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

  const listEmpty = useMemo(
    () => (
      <Text style={styles.emptyText}>
        {sowNow?.message ??
          (isSearching ? 'No plants match that search.' : 'No plants yet. Tap + to add one.')}
      </Text>
    ),
    [styles, isSearching, sowNow]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              onPress={closeSearch}
              style={styles.headerIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Close search"
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <CatalogSearchBar
              variant="header"
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
              onPress={() => moreNav.goBack()}
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
                <Ionicons name="search" size={20} color={theme.text} />
                {query.trim() !== '' && <View style={styles.headerIconDot} />}
              </TouchableOpacity>
              {/* Sow Now sections itself by sowing window, so it has no mode to set. */}
              {!isSowNow && (
                <TouchableOpacity
                  style={[styles.headerIconBtn, showGrouping && styles.headerIconBtnActive]}
                  onPress={toggleGrouping}
                  accessibilityRole="button"
                  accessibilityLabel={`Group plants by ${groupModeLabel}`}
                >
                  <Ionicons
                    name="funnel"
                    size={20}
                    color={showGrouping ? theme.primary : theme.text}
                  />
                  {groupMode !== DEFAULT_CATALOG_GROUP_MODE && !showGrouping && (
                    <View style={styles.headerIconDot} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>

      {showGrouping && (
        <CatalogGroupSheet mode={groupMode} onChange={setGroupMode} onClose={closeGrouping} />
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
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
            // Browse items are fixed heights — two of them, rows and letter
            // headers — so the fast path reads the offset table built alongside
            // the data. Search rows wrap to an unknown height, so it stays off.
            getItemLayout={
              isSearching
                ? undefined
                : (_, index) => ({
                    length: heights[index] ?? CATALOG_ROW_TOTAL_HEIGHT,
                    offset: offsets[index] ?? 0,
                    index,
                  })
            }
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
          >
            <Ionicons name="add" size={28} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
