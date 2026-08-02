import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { getAllPlants, deletePlant, archivePlant, getCachedPlants } from '../services/plants';
import { getLocationConfig } from '../services/locations';
import { Plant, HealthStatus } from '../types/database.types';
import PlantCard from '../components/PlantCard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PlantsScreenNavigationProp, PlantsScreenRouteProp } from '../types/navigation.types';
import { useTheme } from '../theme';
import type { Theme } from '../theme/colors';
import { createStyles } from '../styles/plantsStyles';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorLogging';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { PlantFilterSheet } from '../components/PlantFilterSheet';
import { UndoToast } from '../components/UndoToast';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { useBedOptions } from '@/hooks/useBedOptions';
import { isPlantArchived } from '../utils/plantHelpers';
import {
  ActiveFilters,
  BedSegment,
  countActiveFilters,
  countFacets,
  EMPTY_FILTERS,
  filterPlants,
} from '@/utils/plantFilters';

type ListItem = { kind: 'plant'; data: Plant } | { kind: 'header'; title: string };
type SortOption = 'name' | 'newest' | 'oldest' | 'health' | 'age';

const ITEMS_PER_PAGE = 20;

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
    subtitle: 'Your garden is healthy and happy 🎉',
  },
  recovering: {
    icon: 'bandage-outline',
    title: 'Nothing is recovering',
    subtitle: 'No plant is on the mend right now',
  },
  sick: {
    icon: 'medkit-outline',
    title: 'No sick plants — great news!',
    subtitle: 'All your plants are doing well 🌱',
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
  const flatListRef = useRef<FlatList>(null);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [bedSegment, setBedSegment] = useState<BedSegment>('other');
  const { beds } = useBedOptions();
  const bedNameMap = useMemo(() => new Map(beds.map((b) => [b.id, b.name])), [beds]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    plant: Plant;
    index: number;
  } | null>(null);
  // Active plant awaiting the themed delete-confirmation modal.
  const [confirmDelete, setConfirmDelete] = useState<Plant | null>(null);
  const undoProgress = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);
  // Lightweight "Plant saved" confirmation shown after returning from the form.
  const [savedToast, setSavedToast] = useState<{ id: string; name: string } | null>(null);
  const savedToastProgress = useRef(new Animated.Value(1)).current;
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // searchInput: raw controlled value; searchQuery: debounced, drives filtering
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [homeHealthFilter, setHomeHealthFilter] = useState<HealthStatus | null>(null);
  const [parentLocations, setParentLocations] = useState<string[]>([]);
  const [childLocations, setChildLocations] = useState<string[]>([]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onTabBarScroll(e);
    },
    [onTabBarScroll]
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 300);
  }, []);

  const loadPlants = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await getAllPlants();
      setPlants(data);
      if (!options?.silent) {
        setDisplayCount(ITEMS_PER_PAGE);
      }
    } catch (error: unknown) {
      if (!options?.silent) {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
    } catch (error) {
      logger.error('Error loading locations', error as Error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadLocations();
    loadPlants();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted) {
        resetTabBar();
        // Immediately apply any surgical cache update (e.g. bed deletion) so
        // deleted plants don't linger during the async refresh.
        const instant = getCachedPlants();
        if (instant !== null) setPlants(instant);
        void loadPlants({ silent: true });
        void loadLocations();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    };
  }, [navigation, loadPlants, loadLocations, resetTabBar]);

  useEffect(() => {
    if (route.params?.refresh) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      resetTabBar();
      loadPlants();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, loadPlants, resetTabBar]);

  // Show a brief "saved" confirmation when the plant form returns a savedPlantId.
  useEffect(() => {
    const savedPlantId = route.params?.savedPlantId;
    if (!savedPlantId) return;
    setSavedToast({ id: savedPlantId, name: route.params?.savedPlantName || 'Plant' });
    savedToastProgress.setValue(1);
    Animated.timing(savedToastProgress, {
      toValue: 0,
      duration: 2500,
      useNativeDriver: false,
    }).start();
    if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    savedToastTimerRef.current = setTimeout(() => setSavedToast(null), 2500);
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
    setDisplayCount(ITEMS_PER_PAGE);
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
        void loadPlants();
      }
    },
    [loadPlants]
  );

  const startPendingDelete = useCallback(
    (plant: Plant, index: number) => {
      // Cancel any in-flight undo for the previous pending delete
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        if (pendingDelete) {
          void commitDelete(pendingDelete.plant);
        }
      }

      // Optimistic remove
      setPlants((prev) => prev.filter((p) => p.id !== plant.id));
      setPendingDelete({ id: plant.id, plant, index });

      // Animate progress bar from full → empty over 4 seconds
      undoProgress.setValue(1);
      Animated.timing(undoProgress, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: false,
      }).start();

      undoTimerRef.current = setTimeout(() => {
        setPendingDelete(null);
        undoTimerRef.current = null;
        void commitDelete(plant);
      }, 4000);
    },
    [pendingDelete, commitDelete, undoProgress]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const index = plants.findIndex((p) => p.id === id);
      if (index === -1) return;
      const plant = plants[index]!;

      // Active plants are still deletable, but confirm first since deleting one
      // also archives it (ends its place in the bed's rotation).
      if (!isPlantArchived(plant)) {
        setConfirmDelete(plant);
        return;
      }

      startPendingDelete(plant, index);
    },
    [plants, startPendingDelete]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDelete) return;
    const plant = confirmDelete;
    setConfirmDelete(null);
    const index = plants.findIndex((p) => p.id === plant.id);
    if (index === -1) return;
    startPendingDelete(plant, index);
  }, [confirmDelete, plants, startPendingDelete]);

  const handleUndo = useCallback(() => {
    if (!pendingDelete) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    undoProgress.stopAnimation();
    // Restore plant at original index
    setPlants((prev) => {
      const next = [...prev];
      next.splice(pendingDelete.index, 0, pendingDelete.plant);
      return next;
    });
    setPendingDelete(null);
  }, [pendingDelete, undoProgress]);

  const filterState = useMemo(
    () => ({ filters, searchQuery, bedSegment }),
    [filters, searchQuery, bedSegment]
  );

  // Each chip's count is taken against every *other* active filter, so it reads
  // as "how many would I get if I picked this" rather than a farm-wide total
  // sitting above a filtered list.
  const plantCounts = useMemo(() => countFacets(plants, filterState), [plants, filterState]);

  const getSortedPlants = useCallback(
    (plantsToSort: Plant[]) => {
      const sorted = [...plantsToSort];
      switch (sortBy) {
        case 'name':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
          return sorted.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'oldest':
          return sorted.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case 'health': {
          const healthOrder = { healthy: 0, recovering: 1, stressed: 2, sick: 3 };
          return sorted.sort((a, b) => {
            const aHealth = a.health_status || 'healthy';
            const bHealth = b.health_status || 'healthy';
            return healthOrder[aHealth] - healthOrder[bHealth];
          });
        }
        case 'age':
          return sorted.sort((a, b) => {
            const aDate = a.planting_date ? new Date(a.planting_date).getTime() : 0;
            const bDate = b.planting_date ? new Date(b.planting_date).getTime() : 0;
            return aDate - bDate;
          });
        default:
          return sorted;
      }
    },
    [sortBy]
  );

  const updateFilter = <K extends keyof ActiveFilters>(
    category: K,
    value: ActiveFilters[K]
  ): void => {
    setFilters((prev) => ({ ...prev, [category]: value }));
  };

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const hasActiveFilters = useMemo(
    () => activeFilterCount > 0 || searchQuery.trim() !== '',
    [activeFilterCount, searchQuery]
  );

  const clearAllFilters = (): void => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setSearchQuery('');
    setHomeHealthFilter(null);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // An empty list means one of three things: no plants at all, a health count
  // from Today that turned out to be empty, or filters that match nothing.
  const emptyState = useMemo(() => {
    if (plants.length === 0) {
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
  }, [plants.length, homeHealthFilter, theme]);

  const toggleFilters = (): void => {
    if (!showFilters) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowFilters((prev) => !prev);
  };

  const segmentFiltered = useMemo(
    () => filterPlants(plants, filterState),
    [plants, filterState]
  );

  const filteredPlants = useMemo(
    () => getSortedPlants(segmentFiltered),
    [getSortedPlants, segmentFiltered]
  );

  const displayedPlants = useMemo(() => {
    return filteredPlants.slice(0, displayCount);
  }, [filteredPlants, displayCount]);

  const hasMore = displayCount < filteredPlants.length;

  // Group under bed headers automatically when viewing the Bed segment.
  const autoGroup = bedSegment === 'bed';

  const groupedListData = useMemo((): ListItem[] => {
    if (!autoGroup) {
      return displayedPlants.map((p): ListItem => ({ kind: 'plant', data: p }));
    }
    const buckets = new Map<string, Plant[]>();
    // Bucket the paged slice (not the full filtered set) so the Bed segment
    // respects Load More instead of rendering every bed plant at once.
    for (const p of displayedPlants) {
      const key = p.bed_id ?? '';
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(p);
    }
    const items: ListItem[] = [];
    // Beds first (sorted by name), unassigned last
    const sortedEntries = [...buckets.entries()].sort(([a], [b]) => {
      if (!a) return 1;
      if (!b) return -1;
      return (bedNameMap.get(a) ?? '').localeCompare(bedNameMap.get(b) ?? '');
    });
    for (const [bedId, bPlants] of sortedEntries) {
      const title = bedId ? (bedNameMap.get(bedId) ?? 'Unknown Bed') : 'Unassigned';
      items.push({ kind: 'header', title });
      for (const p of bPlants) items.push({ kind: 'plant', data: p });
    }
    return items;
  }, [autoGroup, displayedPlants, bedNameMap]);

  const loadMore = (): void => {
    if (loadingMore || !hasMore) return;
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
    setLoadingMore(true);
    loadMoreTimeoutRef.current = setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredPlants.length));
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filters, searchQuery, sortBy, bedSegment]);

  const listItemKeyExtractor = useCallback(
    (item: ListItem) => (item.kind === 'plant' ? item.data.id : `header-${item.title}`),
    []
  );

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

  const renderUndoToast = (): React.JSX.Element | null => {
    if (!pendingDelete) return null;
    const progressWidth = undoProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    return (
      <View
        style={[
          styles.undoToast,
          {
            bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <View style={styles.undoToastRow}>
          <View style={styles.undoToastLeft}>
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.undoToastText}>{pendingDelete.plant.name} deleted</Text>
          </View>
          <TouchableOpacity
            onPress={handleUndo}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
          >
            <Text style={styles.undoToastAction}>Undo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.undoProgressTrack}>
          <Animated.View style={[styles.undoProgressBar, { width: progressWidth }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearchActive(false);
                if (!searchInput.trim()) {
                  setSearchInput('');
                  setSearchQuery('');
                }
              }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
            </TouchableOpacity>
            <View style={styles.searchExpandedWrapper}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchExpandedInput}
                placeholder="Search plants..."
                value={searchInput}
                onChangeText={handleSearchChange}
                placeholderTextColor={theme.inputPlaceholder}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  setSearchQuery(searchInput);
                }}
              />
              {searchInput.trim() !== '' && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Plants</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setSearchActive(true);
                }}
              >
                <Ionicons name="search" size={20} color={theme.textInverse} />
                {searchInput.trim() !== '' && <View style={styles.searchActiveDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate('ArchivedPlants')}
              >
                <Ionicons name="archive" size={20} color={theme.textInverse} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, showFilters && styles.headerIconBtnActive]}
                onPress={toggleFilters}
              >
                <Ionicons
                  name="funnel"
                  size={20}
                  color={showFilters ? theme.primary : theme.textInverse}
                />
                {activeFilterCount > 0 && !showFilters && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Filter + Sort Bottom Sheet ── */}
      {showFilters && (
        <PlantFilterSheet
          sortBy={sortBy}
          setSortBy={setSortBy}
          filters={filters}
          updateFilter={updateFilter}
          clearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          plantCounts={plantCounts}
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
              ['other', 'Pots & Ground', 'cube-outline', plantCounts.segment.other],
              ['bed', 'Beds', 'grid-outline', plantCounts.segment.bed],
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
        data={groupedListData}
        keyExtractor={listItemKeyExtractor}
        renderItem={renderListItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlants} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name={emptyState.icon} size={64} color={emptyState.color} />
              <Text style={styles.emptyText}>{emptyState.title}</Text>
              <Text style={styles.emptySubtext}>{emptyState.subtitle}</Text>
              {plants.length === 0 ? (
                <TouchableOpacity
                  style={styles.clearFiltersEmptyButton}
                  onPress={() => navigation.navigate('PlantForm')}
                >
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
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Loading more plants...</Text>
            </View>
          ) : hasMore && displayedPlants.length > 0 ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load More</Text>
              <Ionicons name="chevron-down" size={16} color={theme.primary} />
            </TouchableOpacity>
          ) : null
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        // removeClippedSubviews is intentionally OFF: combined with a legacy
        // gesture-handler Swipeable per row under the New Architecture it caused
        // blank/stuck cells while scrolling. Pagination (20/page) bounds cost.
        updateCellsBatchingPeriod={50}
      />

      <AnimatedFAB onPress={() => navigation.navigate('PlantForm')} />
      <ConfirmDeleteModal
        visible={confirmDelete !== null}
        title="Delete plant?"
        message={`This archives and deletes “${confirmDelete?.name ?? ''}”. You’ll have a few seconds to undo.`}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
      />
      {renderUndoToast()}
      <UndoToast
        visible={savedToast !== null}
        message={`${savedToast?.name ?? 'Plant'} saved`}
        onUndo={handleViewSaved}
        progress={savedToastProgress}
        bottomOffset={TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8}
        icon="checkmark-circle"
        actionLabel="View"
      />
    </View>
  );
}
