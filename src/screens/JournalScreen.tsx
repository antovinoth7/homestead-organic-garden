import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
  UIManager,
} from 'react-native';
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
  buildJournalPlaceFilterOptions,
  collectUsedLocations,
  collectUsedPlots,
  collectUsedTags,
  daysOpen,
  entryMatchesPlot,
  formatDaysOpen,
  isActiveProblem,
  journalEntryHeadline,
  journalEntryLocation,
  journalLocationKey,
  journalLocationPlot,
  journalTypeLabel,
  type JournalLocation,
} from '../utils/journalEntryOptions';
import {
  EMPTY_JOURNAL_FILTERS,
  countActiveJournalFilters,
  filterJournalEntries,
  journalEmptySubtext,
  journalEntriesTileLabel,
  type JournalFilterContext,
  type JournalFilters,
} from '@/utils/journalListHelpers';
import { buildJournalRows, type JournalRow } from '@/utils/journalSections';
import { toLocalDateString } from '@/utils/dateHelpers';
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from '../components/FloatingTabBar';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { JournalEntryCard } from '@/components/JournalEntryCard';
import { StatusToast } from '@/components/StatusToast';
import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import { JournalActionSheet } from '@/components/journal/JournalActionSheet';
import { JournalResolveSheet } from '@/components/journal/JournalResolveSheet';
import { JournalStatTiles, type JournalStatTile } from '@/components/journal/JournalStatTiles';
import {
  JournalFilterSheet,
  type JournalFilterCount,
} from '@/components/journal/JournalFilterSheet';
import { useBedOptions } from '@/hooks/useBedOptions';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * iOS can't present a Modal while another is still dismissing — the second
 * never appears. Swapping one journal sheet for another waits out the fade.
 */
const SHEET_SWAP_DELAY_MS = Platform.OS === 'ios' ? 320 : 0;

type OpenSheet = 'filter' | 'place' | null;

export default function JournalScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const route = useRoute<JournalScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<JournalRow>>(null);
  const searchInputRef = useRef<TextInput>(null);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const { beds } = useBedOptions();
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<JournalFilters>(EMPTY_JOURNAL_FILTERS);
  const [searchActive, setSearchActive] = useState(false);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  // Entry whose ⋯ menu is open, and the problem awaiting its "what worked?" answer.
  const [actionTarget, setActionTarget] = useState<JournalEntry | null>(null);
  const [resolvePrompt, setResolvePrompt] = useState<JournalEntry | null>(null);
  // Gallery modal state — the tapped entry's photos plus the photo to open on.
  const [gallery, setGallery] = useState<{ uris: string[]; index: number } | null>(null);
  // Resolve/delete confirmations; the form's save message arrives as a param.
  const [localToast, setLocalToast] = useState<string | null>(null);
  const toast = localToast ?? route.params?.savedMessage ?? null;

  const updateFilters = useCallback((patch: Partial<JournalFilters>): void => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

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

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    []
  );

  /** Close whatever sheet is open, then run `next` once it has faded. */
  const afterSheetCloses = useCallback((next: () => void): void => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    if (SHEET_SWAP_DELAY_MS === 0) {
      next();
      return;
    }
    swapTimer.current = setTimeout(next, SHEET_SWAP_DELAY_MS);
  }, []);

  const plantById = useMemo(() => new Map(plants.map((p) => [p.id, p])), [plants]);
  const bedById = useMemo(() => new Map(beds.map((b) => [b.id, b])), [beds]);
  const bedNameById = useMemo(() => new Map(beds.map((b) => [b.id, b.name])), [beds]);
  const getLocation = useCallback(
    (entry: JournalEntry): JournalLocation | null =>
      journalEntryLocation(entry, plantById, bedNameById),
    [plantById, bedNameById]
  );
  const filterContext = useMemo<JournalFilterContext>(
    () => ({
      plantById,
      bedById,
      placeLabel: (entry) => getLocation(entry)?.label ?? null,
    }),
    [plantById, bedById, getLocation]
  );

  // Summary tiles. Entries/harvests/weight follow the date filter; active
  // problems is a current-state count over all entries (see computeJournalStats).
  const stats = useMemo(
    () => computeJournalStats(entries, getDateFilterStart(filters.period)),
    [entries, filters.period]
  );

  const filteredEntries = useMemo(
    () => filterJournalEntries(entries, filters, filterContext),
    [entries, filters, filterContext]
  );

  // ─── Filter sheet data — each chip counts what picking it would show ────
  const typeCounts = useMemo<JournalFilterCount[]>(() => {
    const base = filterJournalEntries(entries, filters, filterContext, 'type');
    return [
      { value: '', count: base.length },
      ...JOURNAL_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        count: base.filter((e) => e.entry_type === option.value).length,
      })),
    ];
  }, [entries, filters, filterContext]);
  const plotCounts = useMemo<JournalFilterCount[]>(() => {
    const base = filterJournalEntries(entries, filters, filterContext, 'plot');
    return collectUsedPlots(entries, plantById, bedById).map((plot) => ({
      value: plot,
      count: base.filter((e) => entryMatchesPlot(e, plot, plantById, bedById)).length,
    }));
  }, [entries, filters, filterContext, plantById, bedById]);
  const tagCounts = useMemo<JournalFilterCount[]>(() => {
    const base = filterJournalEntries(entries, filters, filterContext, 'tag');
    return collectUsedTags(entries).map((tag) => ({
      value: tag,
      count: base.filter((e) => (e.tags ?? []).includes(tag)).length,
    }));
  }, [entries, filters, filterContext]);

  // Plants and beds that have entries, grouped by plot, for the place picker.
  const usedLocations = useMemo(
    () => collectUsedLocations(entries, plantById, beds),
    [entries, plantById, beds]
  );
  const placeOptions = useMemo(
    () => buildJournalPlaceFilterOptions(usedLocations, plantById, bedById, filters.plot),
    [usedLocations, plantById, bedById, filters.plot]
  );
  const placeLabel = useMemo(
    () => usedLocations.find((loc) => loc.key === filters.location)?.label ?? null,
    [usedLocations, filters.location]
  );
  const placePlot = useMemo(
    () => (filters.location ? journalLocationPlot(filters.location, plantById, bedById) : null),
    [filters.location, plantById, bedById]
  );

  const activeFilterCount = countActiveJournalFilters(filters);
  // The place picker is part of filtering, so the funnel stays lit while it is open.
  const filterSheetOpen = openSheet !== null;

  const clearAllFilters = useCallback((): void => {
    setFilters(EMPTY_JOURNAL_FILTERS);
    setSearchActive(false);
  }, []);
  const clearSheetFilters = useCallback((): void => {
    setFilters((prev) => ({ ...EMPTY_JOURNAL_FILTERS, query: prev.query }));
  }, []);
  // ─── Header ──────────────────────────────────────────────────────────────
  const openSearch = useCallback((): void => setSearchActive(true), []);
  // Back closes the field but keeps the query, as on Plants and Beds.
  const closeSearch = useCallback((): void => setSearchActive(false), []);
  const clearQuery = useCallback((): void => updateFilters({ query: '' }), [updateFilters]);
  const handleQueryChange = useCallback(
    (text: string): void => updateFilters({ query: sanitizeAlphaNumericSpaces(text) }),
    [updateFilters]
  );
  const openFilters = useCallback((): void => setOpenSheet('filter'), []);
  const closeSheet = useCallback((): void => setOpenSheet(null), []);
  const openPlacePicker = useCallback((): void => {
    setOpenSheet(null);
    afterSheetCloses(() => setOpenSheet('place'));
  }, [afterSheetCloses]);
  const backToFilters = useCallback((): void => {
    setOpenSheet(null);
    afterSheetCloses(() => setOpenSheet('filter'));
  }, [afterSheetCloses]);
  const selectPlace = useCallback(
    (value: string): void => updateFilters({ location: value || null }),
    [updateFilters]
  );

  // ─── Entry actions ───────────────────────────────────────────────────────
  const handleCardPress = useCallback(
    (entry: JournalEntry): void => {
      navigation.navigate('JournalForm', { entry });
    },
    [navigation]
  );

  const handlePhotoPress = useCallback((uris: string[], index: number): void => {
    setGallery({ uris, index });
  }, []);

  const handleLocationPress = useCallback(
    (entry: JournalEntry): void => {
      const location = getLocation(entry);
      const id = location?.kind === 'plant' ? entry.plant_id : entry.bed_id;
      if (!location || !id) return;
      updateFilters({ location: journalLocationKey(location.kind, id) });
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
    [getLocation, updateFilters]
  );

  // Mirrors the form's resolve path (status + resolved date) without opening
  // the form. The effectiveness answer is written only when given, so Skip
  // keeps any earlier one.
  const resolveEntry = useCallback(
    async (entry: JournalEntry, effectiveness: TreatmentEffectiveness | null): Promise<void> => {
      try {
        await updateJournalEntry(entry.id, {
          pest_status: 'resolved',
          pest_resolved_at: toLocalDateString(new Date()),
          ...(effectiveness ? { pest_treatment_effectiveness: effectiveness } : {}),
        });
        setLocalToast(
          effectiveness ? 'Marked resolved. Treatment rating saved.' : 'Marked resolved'
        );
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
  const answerResolvePrompt = useCallback(
    (effectiveness: TreatmentEffectiveness | null): void => {
      const entry = resolvePrompt;
      setResolvePrompt(null);
      if (entry) void resolveEntry(entry, effectiveness);
    },
    [resolvePrompt, resolveEntry]
  );

  const openActions = useCallback((entry: JournalEntry): void => setActionTarget(entry), []);
  const closeActions = useCallback((): void => setActionTarget(null), []);
  const resolveFromActions = useCallback((): void => {
    const entry = actionTarget;
    setActionTarget(null);
    if (entry) afterSheetCloses(() => handleResolve(entry));
  }, [actionTarget, afterSheetCloses, handleResolve]);
  const editFromActions = useCallback((): void => {
    const entry = actionTarget;
    setActionTarget(null);
    if (entry) navigation.navigate('JournalForm', { entry });
  }, [actionTarget, navigation]);
  const deleteFromActions = useCallback(async (): Promise<void> => {
    const entry = actionTarget;
    setActionTarget(null);
    if (!entry) return;
    try {
      await deleteJournalEntry(entry.id);
      setLocalToast('Entry deleted');
      void loadData({ silent: true });
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    }
  }, [actionTarget]);
  const handleDeleteConfirmed = useCallback((): void => {
    void deleteFromActions();
  }, [deleteFromActions]);

  const hideToast = useCallback((): void => {
    setLocalToast(null);
    if (route.params?.savedMessage) navigation.setParams({ savedMessage: undefined });
  }, [route.params?.savedMessage, navigation]);

  const openNewEntry = useCallback((): void => navigation.navigate('JournalForm'), [navigation]);
  const closeGallery = useCallback((): void => setGallery(null), []);

  // Day headings are interleaved as rows so the list stays a single FlatList.
  const rows = useMemo(() => buildJournalRows(filteredEntries), [filteredEntries]);
  const rowKey = useCallback((row: JournalRow): string => row.key, []);

  const renderItem = useCallback(
    ({ item }: { item: JournalRow }): React.JSX.Element => {
      if (item.kind === 'header') {
        return (
          <Text style={styles.dayHeader} accessibilityRole="header">
            {item.title}
          </Text>
        );
      }
      const location = getLocation(item.entry);
      return (
        <JournalEntryCard
          entry={item.entry}
          locationName={location?.label ?? null}
          locationKind={location?.kind ?? null}
          onPress={handleCardPress}
          onMore={openActions}
          onResolve={handleResolve}
          onLocationPress={handleLocationPress}
          onPhotoPress={handlePhotoPress}
        />
      );
    },
    [
      styles,
      getLocation,
      handleCardPress,
      openActions,
      handleResolve,
      handleLocationPress,
      handlePhotoPress,
    ]
  );

  // Tapping a stat tile toggles the matching type filter. Open issues counts
  // unresolved problems over all time, so it filters to exactly those and
  // widens the date window — otherwise an older unresolved problem would read
  // "1" and filter to nothing.
  const issuesSelected = filters.type === JournalEntryType.PestDisease && filters.openOnly;
  const showAllTypes = useCallback(
    (): void => updateFilters({ type: null, openOnly: false }),
    [updateFilters]
  );
  const toggleHarvestFilter = useCallback((): void => {
    setFilters((prev) => ({
      ...prev,
      openOnly: false,
      type: prev.type === JournalEntryType.Harvest ? null : JournalEntryType.Harvest,
    }));
  }, []);
  const toggleIssuesFilter = useCallback((): void => {
    setFilters((prev) =>
      prev.type === JournalEntryType.PestDisease && prev.openOnly
        ? { ...prev, type: null, openOnly: false }
        : { ...prev, type: JournalEntryType.PestDisease, openOnly: true, period: 'all' }
    );
  }, []);

  const statTiles = useMemo<JournalStatTile[]>(
    () => [
      {
        key: 'entries',
        value: String(stats.entries),
        label: journalEntriesTileLabel(filters.period),
        tone: 'neutral',
        muted: stats.entries === 0,
        onPress: showAllTypes,
      },
      {
        key: 'harvest',
        // "0 pcs" before anything is picked reads like a measurement; a dash doesn't.
        value: stats.harvestCount === 0 ? '—' : String(stats.harvestTotal),
        ...(stats.harvestCount === 0 ? {} : { unit: stats.harvestUnit }),
        label:
          stats.harvestCount === 0
            ? 'Harvest'
            : `${stats.harvestCount} picking${stats.harvestCount === 1 ? '' : 's'}`,
        tone: 'harvest',
        muted: stats.harvestCount === 0,
        selected: filters.type === JournalEntryType.Harvest,
        onPress: toggleHarvestFilter,
      },
      {
        key: 'issues',
        value: String(stats.activeProblems),
        label: 'Open issues',
        tone: 'issues',
        muted: stats.activeProblems === 0,
        selected: issuesSelected,
        onPress: toggleIssuesFilter,
      },
    ],
    [
      stats,
      filters.period,
      filters.type,
      issuesSelected,
      showAllTypes,
      toggleHarvestFilter,
      toggleIssuesFilter,
    ]
  );

  // The tiles name their own period, so there is no caption row above them.
  const listHeader = (
    <View style={styles.statsHeader}>
      <JournalStatTiles tiles={statTiles} />
    </View>
  );

  // Empty state — hidden while the first load is in flight to avoid a flash.
  const listEmpty = loading ? null : (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={56} color={theme.border} />
      {entries.length === 0 ? (
        <>
          <Text style={styles.emptyText}>No journal entries yet</Text>
          <Text style={styles.emptySubtext}>Start documenting your garden journey</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyText}>No entries found</Text>
          <Text style={styles.emptySubtext}>{journalEmptySubtext(filters)}</Text>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const resolveName = resolvePrompt?.pest_name?.trim() || 'problem';
  const resolveOpenDays = resolvePrompt ? daysOpen(resolvePrompt) : null;
  const resolveSubtitle = resolvePrompt
    ? [
        getLocation(resolvePrompt)?.label,
        resolveOpenDays === null ? null : `open ${formatDaysOpen(resolveOpenDays)}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const actionTitle = actionTarget
    ? (journalEntryHeadline(actionTarget) ??
      (actionTarget.content.trim().slice(0, 40) || journalTypeLabel(actionTarget.entry_type)))
    : '';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={closeSearch}
              accessibilityRole="button"
              accessibilityLabel="Close search"
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
                value={filters.query}
                onChangeText={handleQueryChange}
                autoFocus
                returnKeyType="search"
                accessibilityLabel="Search journal"
              />
              {filters.query !== '' && (
                <TouchableOpacity
                  onPress={clearQuery}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Journal
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={openSearch}
                accessibilityRole="button"
                accessibilityLabel="Search journal"
              >
                <Ionicons name="search" size={20} color={theme.textInverse} />
                {filters.query.trim() !== '' && <View style={styles.searchActiveDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerIconBtn, filterSheetOpen && styles.headerIconBtnActive]}
                onPress={openFilters}
                accessibilityRole="button"
                accessibilityLabel={
                  activeFilterCount > 0
                    ? `Filter journal, ${activeFilterCount} active`
                    : 'Filter journal'
                }
              >
                <Ionicons
                  name="funnel"
                  size={20}
                  color={filterSheetOpen ? theme.primary : theme.textInverse}
                />
                {activeFilterCount > 0 && !filterSheetOpen && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
      />

      <AnimatedFAB onPress={openNewEntry} />

      <StatusToast
        message={toast}
        onHide={hideToast}
        bottomOffset={TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 84}
      />

      <JournalFilterSheet
        visible={openSheet === 'filter'}
        filters={filters}
        onChange={updateFilters}
        onClearAll={clearSheetFilters}
        onClose={closeSheet}
        activeCount={activeFilterCount}
        typeCounts={typeCounts}
        openCount={stats.activeProblems}
        plotCounts={plotCounts}
        tagCounts={tagCounts}
        placeLabel={placeLabel}
        placePlot={placePlot}
        onOpenPlacePicker={openPlacePicker}
        resultCount={filteredEntries.length}
      />

      <OptionPickerSheet
        visible={openSheet === 'place'}
        onClose={backToFilters}
        title="Bed or plant"
        subtitle={
          filters.plot
            ? `Showing ${filters.plot} only. Change Location to see more.`
            : 'Grouped by location.'
        }
        options={placeOptions}
        selectedValue={filters.location ?? ''}
        onSelect={selectPlace}
        searchable
        searchPlaceholder="Search bed, plant or crop"
        allowClear
        clearLabel="Any bed or plant"
      />

      <JournalActionSheet
        visible={actionTarget !== null}
        title={actionTitle}
        canResolve={!!actionTarget && isActiveProblem(actionTarget)}
        onResolve={resolveFromActions}
        onEdit={editFromActions}
        onDelete={handleDeleteConfirmed}
        onClose={closeActions}
      />

      <JournalResolveSheet
        visible={resolvePrompt !== null}
        name={resolveName}
        subtitle={resolveSubtitle}
        treatment={resolvePrompt?.pest_treatment?.trim() ?? ''}
        onAnswer={answerResolvePrompt}
        onClose={dismissResolvePrompt}
      />

      {/* Fullscreen swipeable image viewer with pinch/pan/double-tap zoom */}
      {gallery && (
        <ImageZoomModal
          visible
          sources={gallery.uris}
          initialIndex={gallery.index}
          onClose={closeGallery}
        />
      )}
    </View>
  );
}
