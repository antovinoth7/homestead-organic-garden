import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Alert,
  LayoutAnimation,
} from 'react-native';
import type Swipeable from 'react-native-gesture-handler/Swipeable';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBedData, BedWithCoverage } from '@/hooks/useBedData';
import { deleteBed } from '@/services/beds';
import { BedCard } from '@/components/BedCard';
import { BedFilterSheet, BedCounts } from '@/components/BedFilterSheet';
import { BedDeleteModal } from '@/components/modals/BedDeleteModal';
import { AnimatedFAB, useTabBarScroll, TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { createStyles } from '@/styles/bedListStyles';
import {
  filterAndSortBeds,
  BedActiveFilters,
  BedSortOption,
  DEFAULT_BED_FILTERS,
  LOW_LEGUME_THRESHOLD,
} from '@/utils/filterAndSortBeds';
import { bedExpectsLegumes } from '@/config/beds';
import type { BedListScreenNavigationProp } from '@/types/navigation.types';

const SORT_LABELS: Record<BedSortOption, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  name: 'A–Z',
  area: 'Area',
  plants: 'Plants',
  legume: 'Legume',
};

export default function BedListScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BedListScreenNavigationProp>();
  const { beds: bedsData, loading, error, refresh } = useBedData();
  const { resetTabBar } = useTabBarScroll();

  // Ids hidden from the list: covers both the in-flight undo window and the gap
  // between committing a delete and the hook reload dropping the bed. Deriving the
  // list from the hook (rather than a resynced local copy) avoids the deleted bed
  // flickering back when the optimistic state and stale hook data disagree.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<BedWithCoverage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BedWithCoverage | null>(null);
  const undoProgress = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);
  // Mirror of pendingDelete read inside callbacks, so handleDelete/requestDelete
  // keep a stable identity (no pendingDelete in their deps) and the list rows
  // don't re-render every time a delete is in flight.
  const pendingDeleteRef = useRef<BedWithCoverage | null>(null);
  const setPending = useCallback((bed: BedWithCoverage | null) => {
    pendingDeleteRef.current = bed;
    setPendingDelete(bed);
  }, []);

  // searchInput: raw controlled value; searchQuery: debounced, drives filtering.
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sort & filter (mirrors the Plants listing).
  const [sortBy, setSortBy] = useState<BedSortOption>('newest');
  const [filters, setFilters] = useState<BedActiveFilters>(DEFAULT_BED_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 200);
  }, []);

  const beds = useMemo(() => bedsData.filter((b) => !deletedIds.has(b.id)), [bedsData, deletedIds]);

  const visibleBeds = useMemo(
    () => filterAndSortBeds(beds, filters, sortBy, searchQuery),
    [beds, filters, sortBy, searchQuery]
  );

  // Unique parent locations across beds (for the location filter chips).
  const parentLocations = useMemo(() => {
    const set = new Set<string>();
    for (const b of beds) {
      const loc = b.parent_location?.trim();
      if (loc) set.add(loc);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [beds]);

  // Child locations scoped to the currently selected parent.
  const childLocations = useMemo(() => {
    const set = new Set<string>();
    for (const b of beds) {
      if (filters.parentLocation && b.parent_location !== filters.parentLocation) continue;
      const loc = b.child_location?.trim();
      if (loc) set.add(loc);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [beds, filters.parentLocation]);

  const bedCounts = useMemo<BedCounts>(() => {
    const counts: BedCounts = {
      type: {},
      sunlight: {},
      raised: 0,
      inGround: 0,
      resting: 0,
      permanent: 0,
    };
    for (const b of beds) {
      counts.type[b.type] = (counts.type[b.type] ?? 0) + 1;
      counts.sunlight[b.sunlight] = (counts.sunlight[b.sunlight] ?? 0) + 1;
      if (b.is_raised_bed) counts.raised += 1;
      else counts.inGround += 1;
      if (b.is_resting) counts.resting += 1;
      if (b.is_permanent) counts.permanent += 1;
    }
    return counts;
  }, [beds]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'all') count += 1;
    if (filters.sunlight !== 'all') count += 1;
    if (filters.construction !== 'all') count += 1;
    if (filters.status !== 'all') count += 1;
    if (filters.parentLocation !== '') count += 1;
    if (filters.childLocation !== '') count += 1;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || searchQuery.trim() !== '';

  const updateFilter = useCallback(
    <K extends keyof BedActiveFilters>(category: K, value: BedActiveFilters[K]) => {
      setFilters((prev) => ({ ...prev, [category]: value }));
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_BED_FILTERS);
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  }, []);

  // Drop committed ids once the hook no longer returns them, so the set can't grow
  // unbounded. Beds still inside the undo window remain in bedsData, so they stay.
  useEffect(() => {
    setDeletedIds((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(bedsData.map((b) => b.id));
      const next = new Set([...prev].filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [bedsData]);

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    []
  );

  // Ensure the bottom tab bar is shown whenever the list regains focus (e.g.
  // returning here after creating a bed), regardless of any leftover scroll state.
  useFocusEffect(
    useCallback(() => {
      resetTabBar();
    }, [resetTabBar])
  );

  const commitDelete = useCallback(
    async (id: string) => {
      try {
        await deleteBed(id);
        // Reload so bedsData drops the bed; the id stays in deletedIds across the
        // reload so it never flashes back, then the prune effect clears it.
        refresh({ silent: true });
      } catch {
        Alert.alert('Error', 'Failed to delete bed. Check your connection and try again.');
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        refresh({ silent: true });
      }
    },
    [refresh]
  );

  const handleDelete = useCallback(
    (bed: BedWithCoverage) => {
      // Flush any in-flight undo for the previous pending delete.
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
        const prevPending = pendingDeleteRef.current;
        if (prevPending) void commitDelete(prevPending.id);
      }

      setDeletedIds((prev) => new Set(prev).add(bed.id));
      setPending(bed);

      undoProgress.setValue(1);
      Animated.timing(undoProgress, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: false,
      }).start();

      undoTimerRef.current = setTimeout(() => {
        setPending(null);
        undoTimerRef.current = null;
        void commitDelete(bed.id);
      }, 4000);
    },
    [commitDelete, undoProgress, setPending]
  );

  const handleUndo = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    undoProgress.stopAnimation();
    // Un-hide the bed — it returns in its correct newest-first sorted slot.
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(pending.id);
      return next;
    });
    setPending(null);
  }, [undoProgress, setPending]);

  const requestDelete = useCallback(
    (bed: BedWithCoverage) => {
      // Warn before removing a bed that still holds active plants.
      if (bed.active_plant_count > 0) {
        setDeleteTarget(bed);
        return;
      }
      handleDelete(bed);
    },
    [handleDelete]
  );

  const handleSwipeableOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const navigateToBed = useCallback(
    (bed: BedWithCoverage) => navigation.navigate('BedDetail', { bedId: bed.id }),
    [navigation]
  );

  const handleEdit = useCallback(
    (bed: BedWithCoverage) => navigation.navigate('BedCreationWizard', { editBedId: bed.id }),
    [navigation]
  );

  const handleRotation = useCallback(
    (_bed: BedWithCoverage) => navigation.navigate('BedRotation'),
    [navigation]
  );

  const lowLegumeBeds = useMemo(
    () =>
      beds.filter(
        (b) =>
          bedExpectsLegumes(b.type) &&
          b.legume_coverage_pct < LOW_LEGUME_THRESHOLD &&
          b.plant_count > 0
      ),
    [beds]
  );

  const renderItem = useCallback(
    ({ item }: { item: BedWithCoverage }): React.JSX.Element => (
      <BedCard
        bed={item}
        onPress={navigateToBed}
        onDelete={requestDelete}
        onEdit={handleEdit}
        onRotation={handleRotation}
        onSwipeableOpen={handleSwipeableOpen}
      />
    ),
    [navigateToBed, requestDelete, handleEdit, handleRotation, handleSwipeableOpen]
  );

  const renderUndoToast = (): React.JSX.Element | null => {
    if (!pendingDelete) return null;
    const progressWidth = undoProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    return (
      <View
        style={[styles.undoToast, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8 }]}
      >
        <View style={styles.undoToastRow}>
          <View style={styles.undoToastLeft}>
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.undoToastText}>{pendingDelete.name} deleted</Text>
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

  if (loading && beds.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && beds.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => refresh()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                placeholder="Search beds..."
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
            <View>
              <Text style={styles.title}>Beds</Text>
              <Text style={styles.bedCount}>
                {beds.length > 0 ? `${beds.length} Bed${beds.length > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
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
            </View>
          </>
        )}
      </View>

      {beds.length > 0 && (
        <View style={styles.resultsHeader}>
          <View style={styles.resultsLeft}>
            <Ionicons name="grid" size={14} color={theme.primary} />
            <Text style={styles.resultsCount}>{visibleBeds.length}</Text>
            {hasActiveFilters ? (
              <>
                <Text style={styles.resultsLabel}>of {beds.length} Beds</Text>
                <View style={styles.resultsFilteredBadge}>
                  <Text style={styles.resultsFilteredText}>filtered</Text>
                </View>
              </>
            ) : (
              <Text style={styles.resultsLabel}>
                {visibleBeds.length === 1 ? 'Bed' : 'Beds'}
              </Text>
            )}
          </View>
          <View style={styles.resultsRight}>
            <TouchableOpacity style={styles.sortPill} onPress={toggleFilters}>
              <Ionicons name="swap-vertical" size={13} color={theme.textSecondary} />
              <Text style={styles.sortPillText}>{SORT_LABELS[sortBy]}</Text>
              <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
              onPress={toggleFilters}
              accessibilityLabel="Sort and filter beds"
            >
              <Ionicons
                name="funnel"
                size={16}
                color={showFilters ? theme.textInverse : theme.primary}
              />
              {activeFilterCount > 0 && !showFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {lowLegumeBeds.length > 0 && (
        <View style={styles.legumeBanner}>
          <Ionicons name="warning-outline" size={16} color={theme.warning ?? '#f59e0b'} />
          <Text style={styles.legumeBannerText}>
            {lowLegumeBeds.length} bed{lowLegumeBeds.length > 1 ? 's' : ''} under 20% legume
            coverage
          </Text>
        </View>
      )}

      {beds.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="grid-outline" size={56} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>No beds yet</Text>
          <Text style={styles.emptySubtitle}>Tap + to create your first garden bed</Text>
        </View>
      ) : visibleBeds.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={56} color={theme.textSecondary} />
          <Text style={styles.emptyTitle}>No matching beds</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersEmptyButton} onPress={clearAllFilters}>
              <Ionicons name="close-circle-outline" size={16} color={theme.primary} />
              <Text style={styles.clearFiltersEmptyText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={visibleBeds}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      {renderUndoToast()}

      <AnimatedFAB
        onPress={() => navigation.navigate('BedCreationWizard', undefined)}
        iconName="add"
      />

      <BedDeleteModal
        visible={deleteTarget !== null}
        bedName={deleteTarget?.name ?? ''}
        activePlantCount={deleteTarget?.active_plant_count ?? 0}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) handleDelete(target);
        }}
      />

      {showFilters && (
        <BedFilterSheet
          sortBy={sortBy}
          setSortBy={setSortBy}
          filters={filters}
          updateFilter={updateFilter}
          clearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
          bedCounts={bedCounts}
          parentLocations={parentLocations}
          childLocations={childLocations}
          onClose={toggleFilters}
        />
      )}
    </View>
  );
}
