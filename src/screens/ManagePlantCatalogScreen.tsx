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
import { RecentSearchChips } from '@/components/catalog/RecentSearchChips';
import { HiddenPlantsSection } from '@/components/catalog/HiddenPlantsSection';
import { usePlantCatalogManager } from '@/hooks/usePlantCatalogManager';
import { useCatalogSearch } from '@/hooks/useCatalogSearch';
import type { CatalogSearchResult } from '@/utils/catalogSearch';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import type { PlantType } from '@/types/database.types';

type CatalogListItem =
  | { kind: 'browse'; name: string; count: number }
  | { kind: 'result'; result: CatalogSearchResult };

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const {
    activeCategory,
    setActiveCategory,
    loading,
    refreshing,
    categoryData,
    allCategoryCounts,
    plantCountsByType,
    mergedProfiles,
    hiddenPlantNames,
    restore,
    refresh,
  } = usePlantCatalogManager();

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
      plantType: activeCategory,
      isCreating: true,
    });
  }, [moreNav, activeCategory]);

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
      plantType: activeCategory,
      isCreating: true,
    });
  }, [moreNav, query, activeCategory, commitSearch, results]);

  const onSubmitSearch = useCallback(() => commitSearch(query), [commitSearch, query]);

  const data = useMemo<CatalogListItem[]>(() => {
    if (isSearching) {
      return results.map((result) => ({ kind: 'result' as const, result }));
    }
    return categoryData.plantNames.map((name) => ({
      kind: 'browse' as const,
      name,
      count: categoryData.counts[name] ?? 0,
    }));
  }, [isSearching, results, categoryData]);

  const renderItem = useCallback(
    ({ item, index }: { item: CatalogListItem; index: number }) => {
      const isFirst = index === 0;
      const isLast = index === data.length - 1;
      if (item.kind === 'result') {
        return (
          <CatalogSearchResultRow
            result={item.result}
            isFirst={isFirst}
            isLast={isLast}
            onPress={openPlant}
          />
        );
      }
      return (
        <CatalogBrowseRow
          plantName={item.name}
          plantType={activeCategory}
          count={item.count}
          isFirst={isFirst}
          isLast={isLast}
          onPress={openPlant}
        />
      );
    },
    [data.length, activeCategory, openPlant]
  );

  const keyExtractor = useCallback(
    (item: CatalogListItem) =>
      item.kind === 'browse'
        ? `b:${item.name}`
        : `r:${item.result.plantType}:${item.result.name}`,
    []
  );

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
          <PlantCategoryTabs
            activeCategory={activeCategory}
            allCategoryCounts={allCategoryCounts}
            onCategoryChange={setActiveCategory}
          />
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
      activeCategory,
      allCategoryCounts,
      setActiveCategory,
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
          <HiddenPlantsSection names={hiddenPlantNames} onRestore={restore} />
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
            // Browse rows are a fixed height; search rows carry a sub-line and
            // are not, so the measurement fast path only applies to browsing.
            getItemLayout={
              isSearching
                ? undefined
                : (_, index) => ({
                    length: CATALOG_ROW_TOTAL_HEIGHT,
                    offset: CATALOG_ROW_TOTAL_HEIGHT * index,
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
