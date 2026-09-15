import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
import { CatalogGroupModeToggle } from '@/components/catalog/CatalogGroupModeToggle';
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

  const onSubmitSearch = useCallback(() => commitSearch(query), [commitSearch, query]);

  // Items and their pixel offsets are built together: the browse list mixes
  // two heights, so getItemLayout needs a table rather than one multiplication.
  const { items: data, offsets, heights } = useMemo(
    () =>
      measureCatalogItems(
        isSearching
          ? buildSearchItems(results)
          : buildBrowseItems({
              group: activeGroup,
              entries: groupData.entries,
              mode: groupMode,
            })
      ),
    [isSearching, results, activeGroup, groupData, groupMode]
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

  const listHeader = useMemo(
    () => (
      <>
        <CatalogSearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearQuery}
          onSubmit={onSubmitSearch}
        />
        {isSearching ? (
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>Matches</Text>
            <Text style={styles.sectionLabelCount}>
              {totalMatches > results.length
                ? `${results.length} of ${totalMatches}`
                : `${totalMatches} ${totalMatches === 1 ? 'plant' : 'plants'}`}
            </Text>
          </View>
        ) : (
          <>
            <PlantCategoryTabs
              activeGroup={activeGroup}
              groupCounts={groupCounts}
              onGroupChange={setActiveGroup}
            />
            <CatalogGroupModeToggle mode={groupMode} onChange={setGroupMode} />
          </>
        )}
      </>
    ),
    [
      query,
      setQuery,
      clearQuery,
      onSubmitSearch,
      isSearching,
      results.length,
      totalMatches,
      styles,
      activeGroup,
      groupCounts,
      setActiveGroup,
      groupMode,
      setGroupMode,
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
        {isSearching ? 'No plants match that search.' : 'No plants yet. Tap + to add one.'}
      </Text>
    ),
    [styles, isSearching]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => moreNav.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plant Catalog</Text>
        <View style={styles.headerSpacer} />
      </View>

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
