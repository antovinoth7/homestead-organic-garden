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
import { getJournalEntries, deleteJournalEntry, updateJournalEntry } from '../services/journal';
import { getAllPlants } from '../services/plants';
import {
  JournalEntry,
  JournalEntryType,
  Plant,
  TreatmentEffectiveness,
} from '../types/database.types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { createStyles } from '../styles/journalStyles';
import { useNavigation, useRoute } from '@react-navigation/native';
import { JournalScreenNavigationProp, JournalScreenRouteProp } from '../types/navigation.types';
import { getErrorMessage } from '../utils/errorLogging';
import { sanitizeAlphaNumericSpaces } from '../utils/textSanitizer';
import { computeJournalStats, getDateFilterStart } from '../utils/journalStats';
import {
  JOURNAL_TYPE_OPTIONS,
  collectUsedLocations,
  collectUsedTags,
  entryMatchesLocation,
  isActiveProblem,
  journalEntryLocation,
  journalTypeLabel,
  type JournalLocation,
} from '../utils/journalEntryOptions';
import { buildJournalRows, type JournalRow } from '@/utils/journalSections';
import { toLocalDateString } from '@/utils/dateHelpers';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { SheetHandle } from '@/components/SheetHandle';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { JournalEntryCard } from '@/components/JournalEntryCard';
import { StatStrip, type StatStripItem } from '@/components/StatStrip';
import { AlertDialog, type AlertDialogAction } from '@/components/modals/AlertDialog';
import { useBedOptions } from '@/hooks/useBedOptions';

const DATE_FILTER_LABELS = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
  year: 'This year',
} as const;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function JournalScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const route = useRoute<JournalScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<JournalRow>>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const { beds } = useBedOptions();
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Plant/bed filter (a journalLocationKey) and "open problems only".
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);

  // Pest entry awaiting the "what worked?" answer after a swipe-resolve.
  const [resolvePrompt, setResolvePrompt] = useState<JournalEntry | null>(null);

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

  const plantById = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants]);
  const bedNameById = useMemo(() => new Map(beds.map((b) => [b.id, b.name])), [beds]);
  const getLocation = useCallback(
    (entry: JournalEntry): JournalLocation | null =>
      journalEntryLocation(entry, plantById, bedNameById),
    [plantById, bedNameById]
  );

  // Summary tiles. Entries/harvests/weight follow the date filter; active
  // problems is a current-state count over all entries (see computeJournalStats).
  const stats = useMemo(
    () => computeJournalStats(entries, getDateFilterStart(dateFilter)),
    [entries, dateFilter]
  );

  // Tags actually present on entries, for the filter sheet.
  const usedTags = useMemo(() => collectUsedTags(entries), [entries]);
  // Plants and beds that have entries, for the filter sheet.
  const usedLocations = useMemo(
    () => collectUsedLocations(entries, plantById, beds),
    [entries, plantById, beds]
  );

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const place = getLocation(entry)?.label.toLowerCase() || '';
        const content = entry.content.toLowerCase();
        const pestName = entry.pest_name?.toLowerCase() || '';
        return place.includes(query) || content.includes(query) || pestName.includes(query);
      });
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((e) => e.entry_type === selectedType);
    }

    // Open problems only
    if (activeOnly) {
      filtered = filtered.filter(isActiveProblem);
    }

    // Plant / bed filter
    if (selectedLocation) {
      filtered = filtered.filter((e) => entryMatchesLocation(e, selectedLocation, plantById));
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
  }, [
    entries,
    searchQuery,
    selectedType,
    activeOnly,
    selectedLocation,
    selectedTag,
    dateFilter,
    getLocation,
    plantById,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== 'all') count++;
    if (selectedType) count++;
    if (selectedTag) count++;
    if (selectedLocation) count++;
    if (activeOnly) count++;
    return count;
  }, [dateFilter, selectedType, selectedTag, selectedLocation, activeOnly]);

  const toggleFilters = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  const clearAllFilters = (): void => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedTag(null);
    setSelectedLocation(null);
    setActiveOnly(false);
    setDateFilter('all');
  };

  // "Open only" belongs to Pest/Disease; picking another type drops it.
  const selectType = (type: JournalEntryType | null): void => {
    setSelectedType(type);
    if (type !== JournalEntryType.PestDisease) setActiveOnly(false);
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

  // Swipe → Resolved on an open pest/disease entry; mirrors the form's
  // resolve path (status + resolved date) without opening the form. The
  // effectiveness answer is written only when given, so Skip keeps any earlier one.
  const resolveEntry = useCallback(
    async (entry: JournalEntry, effectiveness: TreatmentEffectiveness | null): Promise<void> => {
      try {
        await updateJournalEntry(entry.id, {
          pest_status: 'resolved',
          pest_resolved_at: toLocalDateString(new Date()),
          ...(effectiveness ? { pest_treatment_effectiveness: effectiveness } : {}),
        });
        void loadData({ silent: true });
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error));
      }
    },
    []
  );
  // With a treatment on record, ask how well it worked before resolving — the
  // farmer's own evidence for next time. Without one there is nothing to rate.
  const handleResolve = useCallback(
    (entry: JournalEntry): void => {
      if (entry.pest_treatment?.trim()) {
        setResolvePrompt(entry);
        return;
      }
      void resolveEntry(entry, null);
    },
    [resolveEntry]
  );
  const dismissResolvePrompt = useCallback((): void => setResolvePrompt(null), []);
  const resolveActions = useMemo<AlertDialogAction[]>(() => {
    const answer = (effectiveness: TreatmentEffectiveness | null) => (): void => {
      const entry = resolvePrompt;
      setResolvePrompt(null);
      if (entry) void resolveEntry(entry, effectiveness);
    };
    return [
      {
        label: 'Worked well',
        icon: 'checkmark-circle-outline',
        variant: 'primary',
        onPress: answer('effective'),
      },
      {
        label: 'Partly worked',
        icon: 'remove-circle-outline',
        variant: 'secondary',
        onPress: answer('partially_effective'),
      },
      {
        label: "Didn't work",
        icon: 'close-circle-outline',
        variant: 'secondary',
        color: theme.error,
        onPress: answer('ineffective'),
      },
      { label: 'Skip', variant: 'ghost', onPress: answer(null) },
    ];
  }, [resolvePrompt, resolveEntry, theme.error]);

  // Day headings are interleaved as rows so the list stays a single FlatList.
  const rows = useMemo(() => buildJournalRows(filteredEntries), [filteredEntries]);
  const rowKey = useCallback((row: JournalRow): string => row.key, []);

  const renderItem = useCallback(
    ({ item }: { item: JournalRow }): React.JSX.Element =>
      item.kind === 'header' ? (
        <Text style={styles.dayHeader} accessibilityRole="header">
          {item.title}
        </Text>
      ) : (
        <JournalEntryCard
          entry={item.entry}
          locationName={getLocation(item.entry)?.label ?? null}
          locationKind={getLocation(item.entry)?.kind ?? null}
          onPress={handleCardPress}
          onEdit={handleCardPress}
          onDelete={requestDelete}
          onResolve={handleResolve}
          onPhotoPress={handlePhotoPress}
          onSwipeableOpen={handleSwipeableOpen}
        />
      ),
    [
      styles,
      getLocation,
      handleCardPress,
      requestDelete,
      handleResolve,
      handlePhotoPress,
      handleSwipeableOpen,
    ]
  );

  // Tapping a stat tile toggles the matching type filter. Open issues counts
  // unresolved problems over all time, so it filters to exactly those and
  // widens the date window — otherwise an older unresolved problem would read
  // "1" and filter to nothing.
  const issuesSelected = selectedType === JournalEntryType.PestDisease && activeOnly;
  const showAllTypes = useCallback((): void => {
    setSelectedType(null);
    setActiveOnly(false);
  }, []);
  const toggleHarvestFilter = useCallback((): void => {
    setActiveOnly(false);
    setSelectedType((prev) =>
      prev === JournalEntryType.Harvest ? null : JournalEntryType.Harvest
    );
  }, []);
  const toggleIssuesFilter = useCallback((): void => {
    if (issuesSelected) {
      setSelectedType(null);
      setActiveOnly(false);
      return;
    }
    setSelectedType(JournalEntryType.PestDisease);
    setActiveOnly(true);
    setDateFilter('all');
  }, [issuesSelected]);

  const statItems = useMemo<StatStripItem[]>(
    () => [
      {
        key: 'entries',
        icon: 'document-text',
        value: stats.entries,
        label: 'Entries',
        tone: 'primary',
        onPress: showAllTypes,
      },
      {
        key: 'harvest',
        icon: 'basket',
        value: stats.harvestTotal,
        // "0 pcs" before anything is picked reads like a measurement; a dash doesn't.
        ...(stats.harvestCount === 0 ? { display: '—' } : {}),
        unit: stats.harvestUnit,
        label:
          stats.harvestCount === 0
            ? 'Harvest'
            : `${stats.harvestCount} picking${stats.harvestCount === 1 ? '' : 's'}`,
        tone: 'success',
        selected: selectedType === JournalEntryType.Harvest,
        onPress: toggleHarvestFilter,
      },
      {
        key: 'issues',
        icon: 'bug',
        value: stats.activeProblems,
        label: 'Open issues',
        tone: 'error',
        selected: issuesSelected,
        onPress: toggleIssuesFilter,
      },
    ],
    [stats, selectedType, issuesSelected, showAllTypes, toggleHarvestFilter, toggleIssuesFilter]
  );

  // Statistics dashboard — rendered as the list header. The period caption
  // names the window the figures cover and opens the filter sheet to change it.
  const listHeader = (
    <View style={styles.statsHeader}>
      <TouchableOpacity
        style={styles.periodButton}
        onPress={toggleFilters}
        accessibilityRole="button"
        accessibilityLabel={`Showing ${DATE_FILTER_LABELS[dateFilter]}. Change period`}
      >
        <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} />
        <Text style={styles.periodText}>{DATE_FILTER_LABELS[dateFilter]}</Text>
        <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
      </TouchableOpacity>
      <StatStrip items={statItems} />
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
                : activeOnly
                  ? 'No open problems — nothing needs follow-up'
                  : selectedType
                    ? `No ${journalTypeLabel(selectedType)} entries found`
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
        data={rows}
        keyExtractor={rowKey}
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
                <TouchableOpacity
                  style={[styles.sheetChip, selectedType === null && styles.sheetChipActive]}
                  onPress={() => selectType(null)}
                >
                  <Text
                    style={[
                      styles.sheetChipText,
                      selectedType === null && styles.sheetChipTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {JOURNAL_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.sheetChip, selectedType === opt.value && styles.sheetChipActive]}
                    onPress={() => selectType(opt.value)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={14}
                      color={selectedType === opt.value ? theme.primary : theme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.sheetChipText,
                        selectedType === opt.value && styles.sheetChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Open problems only — the follow-up list */}
              {selectedType === JournalEntryType.PestDisease && (
                <>
                  <Text style={styles.sheetSectionTitle}>
                    <Ionicons name="pulse" size={14} color={theme.textSecondary} /> Status
                  </Text>
                  <View style={styles.sheetChipWrap}>
                    <TouchableOpacity
                      style={[styles.sheetChip, !activeOnly && styles.sheetChipActive]}
                      onPress={() => setActiveOnly(false)}
                    >
                      <Text
                        style={[styles.sheetChipText, !activeOnly && styles.sheetChipTextActive]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sheetChip, activeOnly && styles.sheetChipActive]}
                      onPress={() => setActiveOnly(true)}
                    >
                      <Text
                        style={[styles.sheetChipText, activeOnly && styles.sheetChipTextActive]}
                      >
                        Open only
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Plant / bed — only places that actually have entries */}
              {usedLocations.length > 0 && (
                <>
                  <Text style={styles.sheetSectionTitle}>
                    <Ionicons name="leaf" size={14} color={theme.textSecondary} /> Plant / Bed
                  </Text>
                  <View style={styles.sheetChipWrap}>
                    <TouchableOpacity
                      style={[
                        styles.sheetChip,
                        selectedLocation === null && styles.sheetChipActive,
                      ]}
                      onPress={() => setSelectedLocation(null)}
                    >
                      <Text
                        style={[
                          styles.sheetChipText,
                          selectedLocation === null && styles.sheetChipTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {usedLocations.map((loc) => {
                      const active = selectedLocation === loc.key;
                      return (
                        <TouchableOpacity
                          key={loc.key}
                          style={[styles.sheetChip, active && styles.sheetChipActive]}
                          onPress={() => setSelectedLocation(loc.key)}
                        >
                          <Ionicons
                            name={loc.kind === 'bed' ? 'grid-outline' : 'leaf-outline'}
                            size={14}
                            color={active ? theme.primary : theme.textSecondary}
                          />
                          <Text
                            style={[
                              styles.sheetChipText,
                              styles.sheetChipLabel,
                              active && styles.sheetChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {loc.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

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
          sources={gallery.uris}
          initialIndex={gallery.index}
          onClose={() => setGallery(null)}
        />
      )}

      <AlertDialog
        visible={resolvePrompt !== null}
        title="Mark as resolved"
        detail={resolvePrompt?.pest_treatment?.trim()}
        message="How well did this treatment work? Your answer is saved with the entry for next time."
        icon="checkmark-done-outline"
        tone="info"
        actions={resolveActions}
        onDismiss={dismissResolvePrompt}
      />

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
