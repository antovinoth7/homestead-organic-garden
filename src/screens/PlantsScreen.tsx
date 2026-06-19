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
import { getAllPlants, deletePlant, getCachedPlants } from '../services/plants';
import { getLocationConfig } from '../services/locations';
import {
  Plant,
  PlantType,
  SpaceType,
  HealthStatus,
  SunlightLevel,
  WaterRequirement,
} from '../types/database.types';
import PlantCard from '../components/PlantCard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PlantsScreenNavigationProp, PlantsScreenRouteProp } from '../types/navigation.types';
import { useTheme } from '../theme';
import { createStyles } from '../styles/plantsStyles';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorLogging';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { PlantFilterSheet } from '../components/PlantFilterSheet';
import { useBedData } from '../hooks/useBedData';
import { isPlantArchived } from '../utils/plantHelpers';

type FilterType = 'all' | PlantType;

type ListItem = { kind: 'plant'; data: Plant } | { kind: 'header'; title: string };
type SortOption = 'name' | 'newest' | 'oldest' | 'health' | 'age';

interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | 'all';
  space: SpaceType | 'all';
  sunlight: SunlightLevel | 'all';
  water: WaterRequirement | 'all';
  parentLocation: string;
  childLocation: string;
  pestStatus: 'all' | 'active_issues' | 'no_issues';
}

const ITEMS_PER_PAGE = 20;

type BedSegment = 'all' | 'bed' | 'other';

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
  const [bedSegment, setBedSegment] = useState<BedSegment>('all');
  const { beds } = useBedData();
  const bedNameMap = useMemo(() => new Map(beds.map((b) => [b.id, b.name])), [beds]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    plant: Plant;
    index: number;
  } | null>(null);
  const undoProgress = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);

  // searchInput: raw controlled value; searchQuery: debounced, drives filtering
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ActiveFilters>({
    type: 'all',
    health: 'all',
    space: 'all',
    sunlight: 'all',
    water: 'all',
    parentLocation: '',
    childLocation: '',
    pestStatus: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [homeHealthFilter, setHomeHealthFilter] = useState<string | null>(null);
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

  useEffect(() => {
    const healthFilter = route.params?.healthFilter;
    if (healthFilter) {
      if (healthFilter === 'healthy') {
        setFilters((prev) => ({ ...prev, health: 'healthy' as HealthStatus }));
        setHomeHealthFilter('healthy');
      } else if (healthFilter === 'sick') {
        setFilters((prev) => ({ ...prev, health: 'sick' as HealthStatus }));
        setHomeHealthFilter('sick');
      } else if (healthFilter === 'stressed') {
        setFilters((prev) => ({ ...prev, health: 'stressed' as HealthStatus }));
        setHomeHealthFilter('stressed');
      }
      setShowFilters(false);
      navigation.setParams({ healthFilter: undefined });
    }
  }, [route.params, navigation]);

  const commitDelete = useCallback(
    async (id: string) => {
      try {
        await deletePlant(id);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error));
        void loadPlants();
      }
    },
    [loadPlants]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const index = plants.findIndex((p) => p.id === id);
      if (index === -1) return;
      const plant = plants[index]!;

      // Block deleting an active plant — it must be archived first.
      if (!isPlantArchived(plant)) {
        Alert.alert(
          'Can’t delete active plant',
          'This plant is still active. Archive it (after harvest or clearing the bed) before deleting.'
        );
        return;
      }

      // Cancel any in-flight undo for the previous pending delete
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        if (pendingDelete) {
          void commitDelete(pendingDelete.id);
        }
      }

      // Optimistic remove
      setPlants((prev) => prev.filter((p) => p.id !== id));
      setPendingDelete({ id, plant, index });

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
        void commitDelete(id);
      }, 4000);
    },
    [plants, pendingDelete, commitDelete, undoProgress]
  );

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

  // Per-category counts from unfiltered plants for chip display
  const plantCounts = useMemo(() => {
    const type: Record<string, number> = {};
    const health: Record<string, number> = {};
    const space: Record<string, number> = {};
    const sunlight: Record<string, number> = {};
    const water: Record<string, number> = {};
    let pestActive = 0;

    plants.forEach((p) => {
      type[p.plant_type] = (type[p.plant_type] || 0) + 1;
      const h = p.health_status || 'healthy';
      health[h] = (health[h] || 0) + 1;
      if (p.space_type) space[p.space_type] = (space[p.space_type] || 0) + 1;
      if (p.sunlight) sunlight[p.sunlight] = (sunlight[p.sunlight] || 0) + 1;
      if (p.water_requirement) water[p.water_requirement] = (water[p.water_requirement] || 0) + 1;
      if ((p.pest_disease_history || []).some((r) => !r.resolved)) pestActive++;
    });

    return {
      type,
      health,
      space,
      sunlight,
      water,
      pestActive,
      pestNone: plants.length - pestActive,
    };
  }, [plants]);

  const getFilteredPlants = useCallback(() => {
    if (!plants || plants.length === 0) return [];
    let filtered = [...plants];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p &&
          p.name &&
          (p.name.toLowerCase().includes(query) ||
            (p.plant_variety && p.plant_variety.toLowerCase().includes(query)) ||
            (p.variety && p.variety.toLowerCase().includes(query)) ||
            (p.location && p.location.toLowerCase().includes(query)) ||
            (p.landmarks && p.landmarks.toLowerCase().includes(query)))
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter((p) => p.plant_type === filters.type);
    }

    if (filters.health !== 'all') {
      if (filters.health === 'healthy') {
        filtered = filtered.filter(
          (p) =>
            !p.health_status || p.health_status === 'healthy' || p.health_status === 'recovering'
        );
      } else {
        filtered = filtered.filter((p) => p.health_status === filters.health);
      }
    }

    if (filters.space !== 'all') {
      filtered = filtered.filter((p) => p.space_type === filters.space);
    }

    if (filters.sunlight !== 'all') {
      filtered = filtered.filter((p) => p.sunlight === filters.sunlight);
    }

    if (filters.water !== 'all') {
      filtered = filtered.filter((p) => p.water_requirement === filters.water);
    }

    if (filters.parentLocation) {
      filtered = filtered.filter((p) => p.location?.includes(filters.parentLocation));
    }

    if (filters.childLocation) {
      filtered = filtered.filter((p) => p.location?.includes(filters.childLocation));
    }

    if (filters.pestStatus !== 'all') {
      filtered = filtered.filter((p) => {
        const activeIssues = (p.pest_disease_history || []).filter((r) => !r.resolved).length;
        return filters.pestStatus === 'active_issues' ? activeIssues > 0 : activeIssues === 0;
      });
    }

    return filtered;
  }, [filters, plants, searchQuery]);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.health !== 'all') count++;
    if (filters.space !== 'all') count++;
    if (filters.sunlight !== 'all') count++;
    if (filters.water !== 'all') count++;
    if (filters.parentLocation !== '') count++;
    if (filters.childLocation !== '') count++;
    if (filters.pestStatus !== 'all') count++;
    return count;
  }, [filters]);

  const hasActiveFilters = useMemo(
    () => activeFilterCount > 0 || searchQuery.trim() !== '',
    [activeFilterCount, searchQuery]
  );

  const clearAllFilters = (): void => {
    setFilters({
      type: 'all',
      health: 'all',
      space: 'all',
      sunlight: 'all',
      water: 'all',
      parentLocation: '',
      childLocation: '',
      pestStatus: 'all',
    });
    setSearchInput('');
    setSearchQuery('');
    setHomeHealthFilter(null);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const toggleFilters = (): void => {
    if (!showFilters) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowFilters((prev) => !prev);
  };

  // Search + filter result, before the All/Bed/Other segment is applied — drives the
  // segment counts so they reflect the active search and filters.
  const baseFiltered = useMemo(() => getFilteredPlants(), [getFilteredPlants]);

  const segmentCounts = useMemo(
    () => ({
      all: baseFiltered.length,
      bed: baseFiltered.filter((p) => p.bed_id != null).length,
      other: baseFiltered.filter((p) => p.bed_id == null).length,
    }),
    [baseFiltered]
  );

  const segmentFiltered = useMemo(() => {
    if (bedSegment === 'bed') return baseFiltered.filter((p) => p.bed_id != null);
    if (bedSegment === 'other') return baseFiltered.filter((p) => p.bed_id == null);
    return baseFiltered;
  }, [baseFiltered, bedSegment]);

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
    for (const p of filteredPlants) {
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
      const title = bedId ? bedNameMap.get(bedId) ?? 'Unknown Bed' : 'Unassigned';
      items.push({ kind: 'header', title });
      for (const p of bPlants) items.push({ kind: 'plant', data: p });
    }
    return items;
  }, [autoGroup, displayedPlants, filteredPlants, bedNameMap]);

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
          onPress={() => navigation.navigate('PlantDetail', { plantId: item.data.id })}
          onEdit={() => navigation.navigate('PlantForm', { plantId: item.data.id })}
          onDelete={() => handleDelete(item.data.id)}
        />
      );
    },
    [navigation, handleDelete, searchQuery, handleSwipeableOpen, styles, theme]
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
        {/* ── All / Bed / Other segmented control ── */}
        <View style={styles.segmentRow}>
          {(
          [
              ['all', 'All', '🌱', segmentCounts.all],
              ['bed', 'Beds', '🟫', segmentCounts.bed],
              ['other', 'Pots & Ground', '🪴', segmentCounts.other],
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
                <Text style={styles.segmentIcon}>{icon}</Text>
                <Text style={[styles.segmentChipText, active && styles.segmentChipTextActive]}>
                  {label}
                </Text>
                <Text style={[styles.segmentCount, active && styles.segmentChipTextActive]}>
                  {count}
                </Text>
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
              <Ionicons
                name={
                  plants.length === 0
                    ? 'leaf-outline'
                    : homeHealthFilter === 'healthy'
                    ? 'happy-outline'
                    : homeHealthFilter === 'sick'
                    ? 'medkit-outline'
                    : homeHealthFilter === 'stressed'
                    ? 'warning-outline'
                    : 'search-outline'
                }
                size={64}
                color={
                  plants.length === 0
                    ? theme.primary
                    : homeHealthFilter === 'healthy'
                    ? theme.success
                    : homeHealthFilter === 'sick'
                    ? theme.error
                    : homeHealthFilter === 'stressed'
                    ? theme.warning
                    : theme.border
                }
              />
              <Text style={styles.emptyText}>
                {plants.length === 0
                  ? 'Your garden is empty'
                  : homeHealthFilter === 'healthy'
                  ? 'No healthy plants yet'
                  : homeHealthFilter === 'sick'
                  ? 'No sick plants — great news!'
                  : homeHealthFilter === 'stressed'
                  ? 'No stressed plants — looking good!'
                  : 'No plants match'}
              </Text>
              <Text style={styles.emptySubtext}>
                {plants.length === 0
                  ? 'Tap + to add your first plant and start tracking your garden'
                  : homeHealthFilter === 'healthy'
                  ? 'Add plants and keep them thriving'
                  : homeHealthFilter === 'sick'
                  ? 'All your plants are doing well 🌱'
                  : homeHealthFilter === 'stressed'
                  ? 'Your garden is healthy and happy 🎉'
                  : 'Try adjusting your filters or search'}
              </Text>
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
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
      />

      <AnimatedFAB onPress={() => navigation.navigate('PlantForm')} />
      {renderUndoToast()}
    </View>
  );
}
