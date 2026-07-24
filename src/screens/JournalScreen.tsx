import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from 'react-native';
import type Swipeable from 'react-native-gesture-handler/Swipeable';
import { getJournalEntries, deleteJournalEntry } from '../services/journal';
import { getAllPlants } from '../services/plants';
import { JournalEntry, JournalEntryType, Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles } from '../styles/journalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { JournalScreenNavigationProp, JournalScreenRouteProp } from '../types/navigation.types';
import { getErrorMessage } from '../utils/errorLogging';
import { sanitizeAlphaNumericSpaces } from '../utils/textSanitizer';
import { computeJournalStats, getDateFilterStart } from '../utils/journalStats';
import { collectUsedTags } from '../utils/journalEntryOptions';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { SheetHandle } from '@/components/SheetHandle';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { JournalEntryCard } from '@/components/JournalEntryCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function JournalScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const route = useRoute<JournalScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<JournalEntry>>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('week');

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collapsible filter state
  const [showFilters, setShowFilters] = useState(false);

  // Gallery modal state — the tapped entry's photos plus the photo to open on.
  const [gallery, setGallery] = useState<{ uris: string[]; index: number } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = async (options?: { silent?: boolean }): Promise<void> => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const [entriesData, plantsData] = await Promise.all([getJournalEntries(), getAllPlants()]);
      setEntries(entriesData);
      setPlants(plantsData);
    } catch (error: unknown) {
      if (!options?.silent) {
        Alert.alert('Error', getErrorMessage(error));
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Load data on mount
    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted) {
        // Reset scroll and refresh data so imported image URIs render immediately.
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
        resetTabBar();
        void loadData({ silent: true });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation, resetTabBar]);

  // Listen for refresh param from child screens (after add/edit/delete)
  useEffect(() => {
    if (route.params?.refresh) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation]);

  const getPlantName = useCallback(
    (plantId: string | null) => {
      if (!plantId) return null;
      const plant = plants.find((p) => p.id === plantId);
      return plant?.name;
    },
    [plants]
  );

  // Summary tiles. Entries/harvests/weight follow the date filter; active
  // problems is a current-state count over all entries (see computeJournalStats).
  const stats = useMemo(
    () => computeJournalStats(entries, getDateFilterStart(dateFilter)),
    [entries, dateFilter]
  );

  const periodLabel = useMemo(() => {
    const scope =
      dateFilter === 'week'
        ? 'This week'
        : dateFilter === 'month'
        ? 'This month'
        : dateFilter === 'year'
        ? 'This year'
        : 'All time';
    return `${scope} · issues all-time`;
  }, [dateFilter]);

  // Tags actually present on entries, for the filter sheet.
  const usedTags = useMemo(() => collectUsedTags(entries), [entries]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const plantName = getPlantName(entry.plant_id)?.toLowerCase() || '';
        const content = entry.content.toLowerCase();
        const pestName = entry.pest_name?.toLowerCase() || '';
        return plantName.includes(query) || content.includes(query) || pestName.includes(query);
      });
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((e) => e.entry_type === selectedType);
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter((e) => e.tags && e.tags.includes(selectedTag));
    }

    // Date filter
    const filterStart = getDateFilterStart(dateFilter);
    if (filterStart) {
      filtered = filtered.filter((e) => new Date(e.created_at) >= filterStart);
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [entries, searchQuery, selectedType, selectedTag, dateFilter, getPlantName]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== 'week') count++;
    if (selectedType) count++;
    if (selectedTag) count++;
    return count;
  }, [dateFilter, selectedType, selectedTag]);

  const toggleFilters = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  const clearAllFilters = (): void => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedTag(null);
    setDateFilter('week');
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteJournalEntry(id);
      loadData();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

  // Keep only one row swiped open at a time (mirrors BedListScreen).
  const handleSwipeableOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const handleCardPress = useCallback(
    (entry: JournalEntry): void => {
      navigation.navigate('JournalForm', { entry });
    },
    [navigation]
  );

  const requestDelete = useCallback((entry: JournalEntry): void => {
    setDeleteId(entry.id);
  }, []);

  const handlePhotoPress = useCallback((uris: string[], index: number): void => {
    setGallery({ uris, index });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: JournalEntry }): React.JSX.Element => (
      <JournalEntryCard
        entry={item}
        plantName={getPlantName(item.plant_id) ?? null}
        onPress={handleCardPress}
        onEdit={handleCardPress}
        onDelete={requestDelete}
        onPhotoPress={handlePhotoPress}
        onSwipeableOpen={handleSwipeableOpen}
      />
    ),
    [getPlantName, handleCardPress, requestDelete, handlePhotoPress, handleSwipeableOpen]
  );

  // Statistics dashboard — rendered as the list header.
  const listHeader = (
    <View style={styles.statsHeader}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={18} color={theme.primary} />
          <Text style={styles.statNumber}>{stats.entries}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Entries
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="basket" size={18} color={theme.warning} />
          <Text style={styles.statNumber}>{stats.harvests}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Harvests
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="scale" size={18} color={theme.success} />
          <Text style={styles.statNumber}>{stats.weightKg}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            kg
          </Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="bug" size={18} color={theme.error} />
          <Text style={styles.statNumber}>{stats.activeProblems}</Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            Active
          </Text>
        </View>
      </View>
      <Text style={styles.statsPeriodLabel}>{periodLabel}</Text>
    </View>
  );

  // Empty state — hidden while the first load is in flight to avoid a flash.
  const listEmpty = loading ? null : (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={64} color={theme.border} />
      {entries.length === 0 ? (
        <>
          <Text style={styles.emptyText}>No journal entries yet</Text>
          <Text style={styles.emptySubtext}>Start documenting your garden journey</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>No entries found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : dateFilter !== 'all'
              ? `No entries in ${
                  dateFilter === 'week'
                    ? 'the past week'
                    : dateFilter === 'month'
                    ? 'this month'
                    : 'this year'
                }`
              : selectedType
              ? `No ${selectedType} entries found`
              : 'Try adjusting your filters'}
          </Text>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          {searchActive ? (
            <View style={styles.searchExpandedRow}>
              <TouchableOpacity
                style={styles.searchBackBtn}
                onPress={() => {
                  setSearchActive(false);
                  if (!searchQuery.trim()) setSearchQuery('');
                }}
              >
                <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
              </TouchableOpacity>
              <View style={styles.searchExpandedWrapper}>
                <Ionicons name="search" size={16} color={theme.textSecondary} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchExpandedInput}
                  placeholder="Search journal..."
                  placeholderTextColor={theme.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(sanitizeAlphaNumericSpaces(text))}
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.headerTitle}>Journal</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.searchIconBtn}
                  onPress={() => setSearchActive(true)}
                >
                  <Ionicons name="search" size={20} color={theme.textInverse} />
                  {searchQuery !== '' && <View style={styles.searchActiveDot} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterToggleButton,
                    showFilters && styles.filterToggleButtonActive,
                  ]}
                  onPress={toggleFilters}
                >
                  <Ionicons name="funnel" size={20} color={theme.textInverse} />
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
      </View>

      <FlatList
        ref={listRef}
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.content}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 },
        ]}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
      />

      {/* Floating Action Button */}
      <AnimatedFAB onPress={() => navigation.navigate('JournalForm')} />

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleFilters} />

          {/* Sheet */}
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
            ]}
          >
            <SheetHandle onClose={toggleFilters} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Journal</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearAllFilters} style={styles.sheetClearBtn}>
                  <Text style={styles.sheetClearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              bounces={false}
              nestedScrollEnabled
            >
              {/* Date Range */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="calendar" size={14} color={theme.textSecondary} /> Date Range
              </Text>
              <View style={styles.sheetChipWrap}>
                {(
                  [
                    ['all', 'All Time'],
                    ['week', 'This Week'],
                    ['month', 'This Month'],
                    ['year', 'This Year'],
                  ] as const
                ).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, dateFilter === val && styles.sheetChipActive]}
                    onPress={() => setDateFilter(val)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        dateFilter === val && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Entry Type */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="document-text" size={14} color={theme.textSecondary} /> Entry Type
              </Text>
              <View style={styles.sheetChipWrap}>
                {(
                  [
                    [null, 'All'],
                    [JournalEntryType.Observation, '👁️ Observation'],
                    [JournalEntryType.Harvest, '🧺 Harvest'],
                    [JournalEntryType.PestDisease, '🐛 Pest/Disease'],
                    [JournalEntryType.Milestone, '🏁 Milestone'],
                  ] as const
                ).map(([val, label]) => (
                  <TouchableOpacity
                    key={val ?? 'all'}
                    style={[styles.sheetChip, selectedType === val && styles.sheetChipActive]}
                    onPress={() => setSelectedType(val as JournalEntryType | null)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        selectedType === val && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tags — only those actually in use */}
              {usedTags.length > 0 && (
                <>
                  <Text style={styles.sheetSectionTitle}>
                    <Ionicons name="pricetag" size={14} color={theme.textSecondary} /> Tag
                  </Text>
                  <View style={styles.sheetChipWrap}>
                    <TouchableOpacity
                      style={[styles.sheetChip, selectedTag === null && styles.sheetChipActive]}
                      onPress={() => setSelectedTag(null)}
                    >
                      <Text
                        style={[
                          styles.sheetChipText,
                          selectedTag === null && styles.sheetChipTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {usedTags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={[styles.sheetChip, selectedTag === tag && styles.sheetChipActive]}
                        onPress={() => setSelectedTag(tag)}
                      >
                        <Text
                          style={[
                            styles.sheetChipText,
                            selectedTag === tag && styles.sheetChipTextActive,
                          ]}
                        >
                          {tag.replace(/_/g, ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Fullscreen swipeable image viewer with pinch/pan/double-tap zoom */}
      {gallery && (
        <ImageZoomModal
          visible
          uris={gallery.uris}
          initialIndex={gallery.index}
          onClose={() => setGallery(null)}
        />
      )}

      <ConfirmDeleteModal
        visible={deleteId !== null}
        title="Delete entry?"
        message="This journal entry will be permanently removed. This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}
