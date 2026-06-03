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
import { BedDeleteModal } from '@/components/modals/BedDeleteModal';
import { AnimatedFAB, useTabBarScroll, TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { createStyles } from '@/styles/bedListStyles';
import type { BedListScreenNavigationProp } from '@/types/navigation.types';

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

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 200);
  }, []);

  const beds = useMemo(
    () => bedsData.filter((b) => !deletedIds.has(b.id)),
    [bedsData, deletedIds]
  );

  const visibleBeds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return beds;
    return beds.filter((b) =>
      [b.name, b.type, b.notes, b.parent_location, b.child_location].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [beds, searchQuery]);

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

  const lowLegumeBeds = useMemo(
    () => beds.filter((b) => b.legume_coverage_pct < 20 && b.plant_count > 0),
    [beds]
  );

  const renderItem = useCallback(
    ({ item }: { item: BedWithCoverage }): React.JSX.Element => (
      <BedCard
        bed={item}
        onPress={navigateToBed}
        onDelete={requestDelete}
        onEdit={handleEdit}
        onSwipeableOpen={handleSwipeableOpen}
      />
    ),
    [navigateToBed, requestDelete, handleEdit, handleSwipeableOpen]
  );

  const renderUndoToast = (): React.JSX.Element | null => {
    if (!pendingDelete) return null;
    const progressWidth = undoProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    return (
      <View style={[styles.undoToast, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.undoToastRow}>
          <View style={styles.undoToastLeft}>
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.undoToastText}>{pendingDelete.name} deleted</Text>
          </View>
          <TouchableOpacity onPress={handleUndo} hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}>
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
          <Text style={styles.emptySubtitle}>Try a different name or location</Text>
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
    </View>
  );
}
