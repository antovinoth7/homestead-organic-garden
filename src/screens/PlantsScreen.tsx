import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { deletePlant, archivePlant } from '@/services/plants';
import { Plant, HealthStatus } from '@/types/database.types';
import PlantCard from '@/components/PlantCard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { PlantsScreenNavigationProp, PlantsScreenRouteProp } from '@/types/navigation.types';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { createStyles } from '@/styles/plantsStyles';
import { getErrorMessage } from '@/utils/errorLogging';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '@/components/FloatingTabBar';
import { PlantFilterSheet } from '@/components/PlantFilterSheet';
import { HeaderIconButton } from '@/components/header/HeaderIconButton';
import { HeaderSearchField } from '@/components/header/HeaderSearchField';
import { UndoToast } from '@/components/UndoToast';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { useBedOptions } from '@/hooks/useBedOptions';
import { usePlantList } from '@/hooks/usePlantList';
import { isPlantArchived } from '@/utils/plantHelpers';
import { PlantSortOption, sortPlantsBy } from '@/utils/plantSort';
import {
  ActiveFilters,
  BedSegment,
  countActiveFilters,
  countFacets,
  countSegments,
  EMPTY_FILTERS,
  filterPlants,
} from '@/utils/plantFilters';

type ListItem = { kind: 'plant'; data: Plant } | { kind: 'header'; key: string; title: string };

/** How long a swipe-delete stays undoable, and how long "Plant saved" shows. */
const UNDO_WINDOW_MS = 4000;
const SAVED_TOAST_MS = 2500;

const NO_HIDDEN_IDS: ReadonlySet<string> = new Set();
const NO_ITEMS: ListItem[] = [];

/**
 * One list item per Plant object. `getAllPlants` reuses unchanged plants, so a
 * rebuilt list hands FlatList the same items and its cells skip re-rendering.
 */
const plantItems = new WeakMap<Plant, ListItem>();
function plantListItem(plant: Plant): ListItem {
  let item = plantItems.get(plant);
  if (!item) {
    item = { kind: 'plant', data: plant };
    plantItems.set(plant, item);
  }
  return item;
}

/** The Bed segment's rows: a header per bed (by name), unassigned plants last. */
function groupByBed(plants: readonly Plant[], bedNames: ReadonlyMap<string, string>): ListItem[] {
  const buckets = new Map<string, Plant[]>();
  for (const plant of plants) {
    const key = plant.bed_id ?? '';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(plant);
    else buckets.set(key, [plant]);
  }
  const sortedEntries = [...buckets.entries()].sort(([a], [b]) => {
    if (!a) return 1;
    if (!b) return -1;
    return (bedNames.get(a) ?? '').localeCompare(bedNames.get(b) ?? '');
  });
  const items: ListItem[] = [];
  for (const [bedId, bedPlants] of sortedEntries) {
    // Keyed by bed id: two beds can share a name.
    items.push({
      kind: 'header',
      key: `header-${bedId || 'unassigned'}`,
      title: bedId ? (bedNames.get(bedId) ?? 'Unknown Bed') : 'Unassigned',
    });
    for (const plant of bedPlants) items.push(plantListItem(plant));
  }
  return items;
}

const withoutId = (ids: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  if (!ids.has(id)) return ids;
  const next = new Set(ids);
  next.delete(id);
  return next;
};

const listItemKey = (item: ListItem): string => (item.kind === 'plant' ? item.data.id : item.key);

/**
 * What an empty list says when it was opened from a Today plot card's health
 * count — a table rather than a ternary ladder, so a fifth status is one row.
 */
const HEALTH_EMPTY_STATE: Record<
  HealthStatus,
  { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string }
> = {
  healthy: {
    icon: 'happy-outline',
    title: 'No healthy plants yet',
    subtitle: 'Add plants and keep them thriving',
  },
  stressed: {
    icon: 'warning-outline',
    title: 'No stressed plants — looking good!',
    subtitle: 'Your garden is healthy and happy',
  },
  recovering: {
    icon: 'bandage-outline',
    title: 'Nothing is recovering',
    subtitle: 'No plant is on the mend right now',
  },
  sick: {
    icon: 'medkit-outline',
    title: 'No sick plants — great news!',
    subtitle: 'All your plants are doing well',
  },
};

/** The status tone each empty state paints its icon in. */
const HEALTH_EMPTY_COLOR: Record<HealthStatus, (theme: Theme) => string> = {
  healthy: (theme) => theme.success,
  stressed: (theme) => theme.warning,
  recovering: (theme) => theme.info,
  sick: (theme) => theme.error,
};

/** Narrows the free-string route param to a status the filter understands. */
const isHealthStatus = (value: string | undefined): value is HealthStatus =>
  value !== undefined && value in HEALTH_EMPTY_STATE;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PlantsScreen(): React.JSX.Element {
  const navigation = useNavigation<PlantsScreenNavigationProp>();
  const route = useRoute<PlantsScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ListItem>>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const { plants, parentLocations, childLocations, loading, refreshing, refresh, reload } =
    usePlantList();
  const [bedSegment, setBedSegment] = useState<BedSegment>('other');
  const { beds } = useBedOptions();
  const bedNameMap = useMemo(() => new Map(beds.map((b) => [b.id, b.name])), [beds]);

  // Deleting hides the plant by id rather than editing a local copy of the list:
  // Undo just un-hides it (it returns to its sorted slot), and nothing below has
  // to depend on the whole list. Mirrors BedListScreen.
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(NO_HIDDEN_IDS);
  const [pendingDelete, setPendingDelete] = useState<Plant | null>(null);
  // Mirror of pendingDelete read inside callbacks, so the delete handlers keep a
  // stable identity and the cards don't re-render while a delete is in flight.
  const pendingDeleteRef = useRef<Plant | null>(null);
  const setPending = useCallback((plant: Plant | null) => {
    pendingDeleteRef.current = plant;
    setPendingDelete(plant);
  }, []);
  // Active plant awaiting the themed delete-confirmation modal.
  const [confirmDelete, setConfirmDelete] = useState<Plant | null>(null);
  const undoProgress = useAnimatedValue(1);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);
  // Lightweight "Plant saved" confirmation shown after returning from the form.
  const [savedToast, setSavedToast] = useState<{ id: string; name: string } | null>(null);
  const savedToastProgress = useAnimatedValue(1);
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // searchInput: raw controlled value; searchQuery: debounced, drives filtering
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const [sortBy, setSortBy] = useState<PlantSortOption>('newest');
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [homeHealthFilter, setHomeHealthFilter] = useState<HealthStatus | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 300);
  }, []);

  const openSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchActive(true);
  }, []);

  // Collapsing keeps a real query in force (the magnifier's dot says so) and
  // drops one that is only whitespace.
  const closeSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchActive(false);
    if (!searchInput.trim()) {
      setSearchInput('');
      setSearchQuery('');
    }
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const submitSearch = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearchQuery(searchInput);
  }, [searchInput]);

  const openArchived = useCallback(() => navigation.navigate('ArchivedPlants'), [navigation]);
  const openPlantForm = useCallback(() => navigation.navigate('PlantForm'), [navigation]);

  // Data refreshes on focus inside usePlantList; the screen only resets the bar.
  useFocusEffect(
    useCallback(() => {
      resetTabBar();
    }, [resetTabBar])
  );

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    },
    []
  );

  // After a save the form pops back with `refresh`. The save already
  // invalidated the cache and the focus revalidate picks it up; this only puts
  // the list back at the top (and revalidates once more in case the list was
  // already focused, which is a cache hit otherwise).
  useEffect(() => {
    if (route.params?.refresh) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      resetTabBar();
      void reload();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, reload, resetTabBar]);

  // Show a brief "saved" confirmation when the plant form returns a savedPlantId.
  useEffect(() => {
    const savedPlantId = route.params?.savedPlantId;
    if (!savedPlantId) return;
    setSavedToast({ id: savedPlantId, name: route.params?.savedPlantName || 'Plant' });
    savedToastProgress.setValue(1);
    Animated.timing(savedToastProgress, {
      toValue: 0,
      duration: SAVED_TOAST_MS,
      useNativeDriver: true,
    }).start();
    if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    savedToastTimerRef.current = setTimeout(() => setSavedToast(null), SAVED_TOAST_MS);
    navigation.setParams({ savedPlantId: undefined, savedPlantName: undefined });
  }, [route.params, navigation, savedToastProgress]);

  // Health and plot scope arrive together from a Today plot card's health count.
  // The plot lands in `parentLocation` — the filter sheet's own Location filter —
  // rather than a separate scope of its own, so the sheet shows what is applied
  // and clearing it works the way every other filter does. Both go in one
  // `setFilters` so the list never paints an intermediate combination.
  //
  // The segment is forced back to Pots & Ground because that is the population
  // the card counted — `bedSegment` otherwise persists across visits and would
  // show a figure that contradicts the count just tapped.
  useEffect(() => {
    const healthFilter = route.params?.healthFilter;
    const plotFilter = route.params?.plotFilter;
    if (!healthFilter && !plotFilter) return;

    const health: HealthStatus | null = isHealthStatus(healthFilter) ? healthFilter : null;

    setFilters((prev) => ({
      ...prev,
      ...(health !== null && { health }),
      ...(plotFilter && { parentLocation: plotFilter, childLocation: '' }),
    }));
    if (health !== null) setHomeHealthFilter(health);
    if (plotFilter) setBedSegment('other');
    setShowFilters(false);
    navigation.setParams({ healthFilter: undefined, plotFilter: undefined });
  }, [route.params, navigation]);

  const commitDelete = useCallback(
    async (plant: Plant) => {
      try {
        // Active plants are archived first (preserving rotation history and
        // disabling their tasks) before the soft delete.
        if (!isPlantArchived(plant)) {
          await archivePlant(plant.id);
        }
        await deletePlant(plant.id);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error));
      }
      // Either way the reloaded list now says what happened — the plant is gone,
      // or (on failure) back — so it no longer needs hiding. Un-hiding matters:
      // a deleted plant can be restored from Archived and must show again.
      await reload();
      setHiddenIds((prev) => withoutId(prev, plant.id));
    },
    [reload]
  );

  const startPendingDelete = useCallback(
    (plant: Plant) => {
      // A new delete closes the previous Undo window: commit that one now.
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        const previous = pendingDeleteRef.current;
        if (previous) void commitDelete(previous);
      }

      setHiddenIds((prev) => new Set(prev).add(plant.id));
      setPending(plant);

      // Drain the Undo bar from full to empty across the window.
      undoProgress.setValue(1);
      Animated.timing(undoProgress, {
        toValue: 0,
        duration: UNDO_WINDOW_MS,
        useNativeDriver: true,
      }).start();

      undoTimerRef.current = setTimeout(() => {
        undoTimerRef.current = null;
        setPending(null);
        void commitDelete(plant);
      }, UNDO_WINDOW_MS);
    },
    [commitDelete, setPending, undoProgress]
  );

  const handleDelete = useCallback(
    (plant: Plant) => {
      // Active plants are still deletable, but confirm first since deleting one
      // also archives it (ends its place in the bed's rotation).
      if (!isPlantArchived(plant)) {
        setConfirmDelete(plant);
        return;
      }
      startPendingDelete(plant);
    },
    [startPendingDelete]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    const plant = confirmDelete;
    setConfirmDelete(null);
    startPendingDelete(plant);
  }, [confirmDelete, startPendingDelete]);

  const handleCancelDelete = useCallback(() => setConfirmDelete(null), []);

  const handleUndo = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    undoProgress.stopAnimation();
    setHiddenIds((prev) => withoutId(prev, pending.id));
    setPending(null);
  }, [setPending, undoProgress]);

  const visiblePlants = useMemo(
    () => (hiddenIds.size === 0 ? plants : plants.filter((p) => !hiddenIds.has(p.id))),
    [plants, hiddenIds]
  );

  const filterState = useMemo(
    () => ({ filters, searchQuery, bedSegment }),
    [filters, searchQuery, bedSegment]
  );

  // The segment badges are always on screen; the other facets only matter while
  // the filter sheet is open (it unmounts when closed), so only then are they
  // counted. Each chip's count is taken against every *other* active filter, so
  // it reads as "how many would I get if I picked this".
  const segmentCounts = useMemo(
    () => countSegments(visiblePlants, filterState),
    [visiblePlants, filterState]
  );
  const facetCounts = useMemo(
    () => (showFilters ? countFacets(visiblePlants, filterState) : null),
    [showFilters, visiblePlants, filterState]
  );

  const updateFilter = useCallback(
    <K extends keyof ActiveFilters>(category: K, value: ActiveFilters[K]): void => {
      setFilters((prev) => ({ ...prev, [category]: value }));
    },
    []
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const hasActiveFilters = useMemo(
    () => activeFilterCount > 0 || searchQuery.trim() !== '',
    [activeFilterCount, searchQuery]
  );

  const clearAllFilters = useCallback((): void => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setSearchQuery('');
    setHomeHealthFilter(null);
  }, []);

  const gardenIsEmpty = visiblePlants.length === 0;

  // An empty list means one of three things: no plants at all, a health count
  // from Today that turned out to be empty, or filters that match nothing.
  const emptyState = useMemo(() => {
    if (gardenIsEmpty) {
      return {
        icon: 'leaf-outline' as const,
        color: theme.primary,
        title: 'Your garden is empty',
        subtitle: 'Tap + to add your first plant and start tracking your garden',
      };
    }
    if (homeHealthFilter !== null) {
      const copy = HEALTH_EMPTY_STATE[homeHealthFilter];
      return { ...copy, color: HEALTH_EMPTY_COLOR[homeHealthFilter](theme) };
    }
    return {
      icon: 'search-outline' as const,
      color: theme.border,
      title: 'No plants match',
      subtitle: 'Try adjusting your filters or search',
    };
  }, [gardenIsEmpty, homeHealthFilter, theme]);

  const toggleFilters = useCallback((): void => {
    if (!showFilters) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowFilters((prev) => !prev);
  }, [showFilters]);

  const segmentFiltered = useMemo(
    () => filterPlants(visiblePlants, filterState),
    [visiblePlants, filterState]
  );

  const filteredPlants = useMemo(
    () => sortPlantsBy(segmentFiltered, sortBy),
    [segmentFiltered, sortBy]
  );

  // Group under bed headers automatically when viewing the Bed segment. The
  // whole filtered list goes to FlatList, which windows it: there is no paging,
  // so no stall and spinner every 20 plants.
  const autoGroup = bedSegment === 'bed';

  const ungroupedItems = useMemo(
    () => (autoGroup ? NO_ITEMS : filteredPlants.map(plantListItem)),
    [autoGroup, filteredPlants]
  );
  // Only the grouped list reads bed names, so a bed reload can't rebuild the
  // ungrouped one.
  const groupedItems = useMemo(
    () => (autoGroup ? groupByBed(filteredPlants, bedNameMap) : NO_ITEMS),
    [autoGroup, filteredPlants, bedNameMap]
  );
  const listData = autoGroup ? groupedItems : ungroupedItems;

  // A new result set starts at the top.
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filters, searchQuery, sortBy, bedSegment]);

  const handleSwipeableOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const handleCardPress = useCallback(
    (plantId: string) => navigation.navigate('PlantDetail', { plantId }),
    [navigation]
  );

  const handleViewSaved = useCallback(() => {
    if (!savedToast) return;
    if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    savedToastProgress.stopAnimation();
    const id = savedToast.id;
    setSavedToast(null);
    navigation.navigate('PlantDetail', { plantId: id });
  }, [savedToast, navigation, savedToastProgress]);

  const handleCardEdit = useCallback(
    (plantId: string) => navigation.navigate('PlantForm', { plantId }),
    [navigation]
  );

  const renderListItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return (
          <View style={styles.groupHeader}>
            <Ionicons name="grid-outline" size={13} color={theme.textSecondary} />
            <Text style={styles.groupHeaderText}>{item.title}</Text>
          </View>
        );
      }
      return (
        <PlantCard
          plant={item.data}
          searchQuery={searchQuery}
          onSwipeableOpen={handleSwipeableOpen}
          onPress={handleCardPress}
          onEdit={handleCardEdit}
          onDelete={handleDelete}
        />
      );
    },
    [handleCardPress, handleCardEdit, handleDelete, searchQuery, handleSwipeableOpen, styles, theme]
  );

  // Stable list props: an inline style, refresh control or empty state is a new
  // object every render, which re-renders the FlatList and re-runs every cell.
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 },
    ],
    [styles.listContent, insets.bottom]
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={loading || refreshing} onRefresh={refresh} />,
    [loading, refreshing, refresh]
  );

  const listEmpty = useMemo(
    () =>
      loading ? null : (
        <View style={styles.emptyState}>
          <Ionicons name={emptyState.icon} size={64} color={emptyState.color} />
          <Text style={styles.emptyText}>{emptyState.title}</Text>
          <Text style={styles.emptySubtext}>{emptyState.subtitle}</Text>
          {gardenIsEmpty ? (
            <TouchableOpacity style={styles.clearFiltersEmptyButton} onPress={openPlantForm}>
              <Ionicons name="add" size={16} color={theme.primary} />
              <Text style={styles.clearFiltersEmptyText}>Add First Plant</Text>
            </TouchableOpacity>
          ) : hasActiveFilters ? (
            <TouchableOpacity style={styles.clearFiltersEmptyButton} onPress={clearAllFilters}>
              <Ionicons name="close-circle-outline" size={16} color={theme.primary} />
              <Text style={styles.clearFiltersEmptyText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ),
    [
      loading,
      styles,
      emptyState,
      gardenIsEmpty,
      hasActiveFilters,
      openPlantForm,
      clearAllFilters,
      theme.primary,
    ]
  );

  const toastBottomOffset = TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <HeaderSearchField
            inputRef={searchInputRef}
            value={searchInput}
            onChangeText={handleSearchChange}
            onClear={clearSearch}
            onClose={closeSearch}
            onSubmitEditing={submitSearch}
            placeholder="Search plants..."
            accessibilityLabel="Search plants"
          />
        ) : (
          <>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Plants
            </Text>
            <View style={styles.headerActions}>
              <HeaderIconButton
                icon="search"
                onPress={openSearch}
                accessibilityLabel="Search plants"
                showDot={searchInput.trim() !== ''}
              />
              <HeaderIconButton
                icon="archive"
                onPress={openArchived}
                accessibilityLabel="Archived plants"
              />
              <HeaderIconButton
                icon="funnel"
                onPress={toggleFilters}
                accessibilityLabel="Sort and filter plants"
                active={showFilters}
                badgeCount={activeFilterCount}
              />
            </View>
          </>
        )}
      </View>

      {/* ── Filter + Sort Bottom Sheet ── */}
      {showFilters && facetCounts && (
        <PlantFilterSheet
          sortBy={sortBy}
          setSortBy={setSortBy}
          filters={filters}
          updateFilter={updateFilter}
          clearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          plantCounts={facetCounts}
          parentLocations={parentLocations}
          childLocations={childLocations}
          onClose={toggleFilters}
        />
      )}

      {/* ── Results & Toolbar Bar ── */}
      <View style={styles.resultsHeader}>
        {/* ── Pots & Ground / Beds segmented control ── */}
        <View style={styles.segmentRow}>
          {(
            [
              ['other', 'Pots & Ground', 'cube-outline', segmentCounts.other],
              ['bed', 'Beds', 'grid-outline', segmentCounts.bed],
            ] as const
          ).map(([value, label, icon, count]) => {
            const active = bedSegment === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.segmentChip, active && styles.segmentChipActive]}
                onPress={() => setBedSegment(value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${label} plants, ${count}`}
              >
                <Ionicons
                  name={icon}
                  size={14}
                  color={active ? theme.primary : theme.textSecondary}
                />
                <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                  {label}
                </Text>
                <View style={[styles.segmentBadge, active && styles.segmentBadgeActive]}>
                  <Text style={[styles.segmentBadgeText, active && styles.segmentBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={listItemKey}
        renderItem={renderListItem}
        contentContainerStyle={listContentStyle}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={refreshControl}
        ListEmptyComponent={listEmpty}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        // Memoizes FlatList's per-cell renderer: without it every FlatList
        // render hands each mounted cell a new renderItem and re-runs it.
        strictMode
        // Explicitly OFF — FlatList defaults it ON for Android. With a legacy
        // gesture-handler Swipeable per row under the New Architecture it caused
        // blank/stuck cells while scrolling. Windowing (windowSize) bounds cost.
        removeClippedSubviews={false}
      />

      <AnimatedFAB onPress={openPlantForm} />
      <ConfirmDeleteModal
        visible={confirmDelete !== null}
        title="Delete plant?"
        message={`This archives and deletes “${confirmDelete?.name ?? ''}”. You’ll have a few seconds to undo.`}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      <UndoToast
        visible={pendingDelete !== null}
        message={`${pendingDelete?.name ?? 'Plant'} deleted`}
        onUndo={handleUndo}
        progress={undoProgress}
        bottomOffset={toastBottomOffset}
      />
      <UndoToast
        visible={savedToast !== null}
        message={`${savedToast?.name ?? 'Plant'} saved`}
        onUndo={handleViewSaved}
        progress={savedToastProgress}
        bottomOffset={toastBottomOffset}
        icon="checkmark-circle"
        actionLabel="View"
      />
    </View>
  );
}
