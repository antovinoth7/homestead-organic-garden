import React, { useEffect, useMemo, useState, useRef } from 'react';
import { calculateTaskPriority, getTaskTemplates, getTodayTaskLogs } from '../services/tasks';
import { getAllPlants } from '../services/plants';
import { getBeds } from '../services/beds';
import { getHarvestJournalMetadata } from '../services/journal';
import { Bed, TaskTemplate, Plant, JournalEntry, TaskLog } from '../types/database.types';
import { computeHarvestsReady, type HarvestReadyItem } from '../utils/harvestStats';
import { calendarDaysOverdue } from '../services/taskSchedulingLogic';
import { isNetworkAvailable } from '../utils/networkState';
import { resolveTaskBedId, isBedLevelOrphanTask } from '../utils/taskBed';
import { logger } from '../utils/logger';
import { addDaysToDateKey, calendarDateKey, farmDateKey, farmToday } from '@/utils/farmDate';
import { getErrorMessage } from '@/utils/errorLogging';
import { groupByPlot, UNASSIGNED_PLOT_NAME, type PlotResolution } from '@/utils/plotGrouping';
import {
  countCareFacets,
  countOverdueBySegment,
  filterCareTasks,
  matchesBedSegment,
  sortCareTasks,
  type BedSegment,
  type CareTaskContext,
  type CareTaskFacetCounts,
  type CareTaskFilters,
  type TaskPriority,
  type TaskSortOption,
} from '@/utils/careTaskFilters';

type GroupBy = 'none' | 'location' | 'type' | 'plant' | 'bed';

export type { BedSegment };

export interface BedSegmentCounts {
  bed: number;
  other: number;
}

// Re-exported so the Care Plan keeps importing it from the hook it renders from.
export type { HarvestReadyItem };

export interface UseCalendarDataReturn {
  tasks: TaskTemplate[];
  plants: Plant[];
  initialLoading: boolean;
  refreshing: boolean;
  error: string | null;
  isStale: boolean;
  lastUpdatedAt: string | null;
  isMountedRef: React.MutableRefObject<boolean>;
  loadData: (options?: { force?: boolean }) => Promise<void>;
  handleRefresh: () => Promise<void>;
  plantMap: Map<string, Plant>;
  filteredTasks: TaskTemplate[];
  overdueTasks: TaskTemplate[];
  tasksByDateKey: Map<string, TaskTemplate[]>;
  /** Due or overdue harvest checks — the pinned "Harvest Ready" section. */
  harvestsReadyNow: HarvestReadyItem[];
  /** Still ahead (8–30 days) — the collapsed "Harvest soon" row below Today. */
  harvestsSoon: HarvestReadyItem[];
  todayTasks: TaskTemplate[];
  weekTasks: TaskTemplate[];
  tasksForDisplay: TaskTemplate[];
  groupedTasks: Record<string, TaskTemplate[]>;
  segmentCounts: BedSegmentCounts;
  /**
   * Overdue work either side of the segment split, counted before the segment
   * is applied. `overdueTasks` only ever holds the active segment's share, so a
   * caller that means to *show* the overdue work — the Today card's count opens
   * the plan at it — needs this to tell "there is none" from "it is in the
   * other segment".
   */
  overdueSegmentCounts: BedSegmentCounts;
  /** Chip counts for the filter sheet — each category counted against the rest. */
  facetCounts: CareTaskFacetCounts;
  /**
   * The task → plot join, built once here. The screen reuses it for weather
   * placement and for the location filter's chips rather than rebuilding it.
   */
  plotResolution: PlotResolution;
  isSearching: boolean;
  getTasksForDate: (date: Date) => TaskTemplate[];
  getRawTasksForDate: (date: Date) => TaskTemplate[];
  getPlantDetails: (plantId: string | null) => { name: string; location: string; type: string };
  groupTasks: (taskList: TaskTemplate[]) => Record<string, TaskTemplate[]>;
  sortTasks: (taskList: TaskTemplate[]) => TaskTemplate[];
}

interface UseCalendarDataOptions {
  normalizedSearchQuery: string;
  normalizeSearchText: (value: string) => string;
  selectedView: 'week' | 'month';
  currentWeekStart: Date;
  currentMonth: Date;
  selectedDate: Date | null;
  groupBy: GroupBy;
  sortBy?: TaskSortOption;
  filters: CareTaskFilters;
  bedSegment?: BedSegment;
  /** Beds drive the plot join, the bed filter and the bed group labels. */
  beds?: Bed[];
  /** Configured plot names, in display order — from `useWeatherLocations`. */
  parentLocations?: string[];
  /** Plot name used when none are configured; must match `useWeatherLocations`. */
  fallbackPlotName?: string;
}

export function useCalendarData({
  normalizedSearchQuery,
  normalizeSearchText,
  selectedView,
  currentWeekStart,
  currentMonth,
  selectedDate,
  groupBy,
  sortBy = 'due',
  filters,
  bedSegment = 'other',
  beds,
  parentLocations,
  fallbackPlotName,
}: UseCalendarDataOptions): UseCalendarDataReturn {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [todayLogs, setTodayLogs] = useState<TaskLog[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  // Bed-level tasks whose bed was deleted — hidden from the Care Plan and
  // self-healed (see loadData). Keyed by task id so display filtering is O(1).
  const [orphanBedTaskIds, setOrphanBedTaskIds] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastLoadTimeRef = useRef(0);
  const hasLoadedDataRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = React.useCallback(async (options?: { force?: boolean }) => {
    // Debounce: skip if loaded recently (within 2s) unless forced
    const now = Date.now();
    if (!options?.force && now - lastLoadTimeRef.current < 2000) return;
    lastLoadTimeRef.current = now;

    try {
      // Beds ride along in the same round trip rather than waiting for the other
      // four: nothing here depends on them, only the orphan filter below does.
      // The catch keeps a bed failure from rejecting the whole load and blanking
      // the task list — it degrades to "no orphan hiding", as it did when this
      // was a separate try/catch.
      const [tasksData, plantsData, harvestEntriesData, todayLogsData, bedsData] =
        await Promise.all([
          getTaskTemplates(),
          getAllPlants(),
          getHarvestJournalMetadata(),
          getTodayTaskLogs(),
          getBeds().catch((error) => {
            logger.warn('Failed to load beds for orphan filtering', error as Error);
            return null;
          }),
        ]);

      if (!isMountedRef.current) return;

      const plantIds = new Set(plantsData.map((plant) => plant.id));
      const filteredTasks = tasksData.filter(
        (task) => task.enabled && (!task.plant_id || plantIds.has(task.plant_id))
      );

      setTasks(filteredTasks);
      setPlants(plantsData);
      setTodayLogs(todayLogsData);
      setHarvestEntries(harvestEntriesData);
      hasLoadedDataRef.current = true;
      setError(null);
      const loadedOffline = !isNetworkAvailable();
      setIsStale(loadedOffline);
      if (!loadedOffline) setLastUpdatedAt(new Date().toISOString());

      // Bed-level tasks whose bed is missing from `getBeds()` are hidden, never
      // deleted. Absence from a read is not evidence the bed was deleted: a
      // cached, partial, or filtered bed list makes live beds look gone, and
      // this hook previously hard-deleted those tasks (and their logs) from
      // Firestore on nothing more than that. Real deletion belongs to the bed
      // cascade in `beds.ts`, which knows a bed was actually removed.
      if (bedsData) {
        const liveBedIds = new Set(bedsData.map((bed) => bed.id));
        const orphanBedTasks = filteredTasks.filter((task) =>
          isBedLevelOrphanTask(task, liveBedIds)
        );
        setOrphanBedTaskIds(new Set(orphanBedTasks.map((task) => task.id)));
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      logger.error('Failed to load calendar data', error as Error);
      setError(getErrorMessage(error));
      setIsStale(hasLoadedDataRef.current);
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData({ force: true });
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadData]);

  // O(1) plant lookup map instead of O(n) .find() per task
  const plantMap = useMemo(() => {
    const map = new Map<string, Plant>();
    for (const p of plants) {
      map.set(p.id, p);
    }
    return map;
  }, [plants]);

  // A task's bed: bed-level tasks carry bed_id directly; plant tasks inherit it.
  const resolveBedId = React.useCallback(
    (task: TaskTemplate): string | null => resolveTaskBedId(task, plantMap),
    [plantMap]
  );

  const getPlantDetails = React.useCallback(
    (plantId: string | null) => {
      if (!plantId) return { name: 'General', location: '', type: '' };
      const plant = plantMap.get(plantId);
      if (!plant) return { name: 'Unknown', location: '', type: '' };
      return {
        name: plant.name || 'Unknown',
        location: plant.location || '',
        type: plant.plant_type || '',
      };
    },
    [plantMap]
  );

  // Hoisted above the grouping/sorting helpers because the plot join, the
  // priority map and the filter context are all built from it.
  // Drop bed-level tasks whose bed was deleted so they never surface in the
  // lists, calendar cells, or segment counts (they're also being self-healed).
  const visibleTasks = useMemo(
    () => (orphanBedTaskIds.size > 0 ? tasks.filter((t) => !orphanBedTaskIds.has(t.id)) : tasks),
    [tasks, orphanBedTaskIds]
  );

  const bedNames = useMemo(() => new Map((beds ?? []).map((bed) => [bed.id, bed.name])), [beds]);

  // What the task is *about*: the plant, or for bed-level tasks (which have no
  // plant) the bed. Used by the plant sort and by the bed group labels.
  const subjectLabel = React.useCallback(
    (task: TaskTemplate): string => {
      if (task.plant_id) return getPlantDetails(task.plant_id).name;
      const bedId = resolveBedId(task);
      return (bedId ? bedNames.get(bedId) : undefined) ?? 'General';
    },
    [getPlantDetails, resolveBedId, bedNames]
  );

  // The one task -> plot join. `groupByPlot` resolves a task through its plant's
  // parent location, then its bed's, then the unassigned bucket — so bed-level
  // tasks land on a real plot instead of the "General" bucket the old
  // `Plant.location` string grouping put them in. Returned to the screen so the
  // weather placement and the location chips share this exact resolution.
  const plotResolution = useMemo(
    () =>
      groupByPlot({
        parentLocations: parentLocations ?? [],
        fallbackName: fallbackPlotName ?? 'My Farm',
        plants,
        beds: beds ?? [],
        tasks: visibleTasks,
        logs: [],
        alerts: [],
      }),
    [parentLocations, fallbackPlotName, plants, beds, visibleTasks]
  );

  const plotNameById = useMemo(
    () => new Map(plotResolution.groups.map((group) => [group.id, group.name])),
    [plotResolution]
  );

  // Resolved once per task, not inside a comparator: `calculateTaskPriority`
  // loads a care profile and computes a growth stage per call, so re-deriving it
  // on every comparison would make the priority sort O(n log n) profile lookups.
  const priorityByTaskId = useMemo(() => {
    const map = new Map<string, TaskPriority>();
    for (const task of visibleTasks) {
      map.set(
        task.id,
        task.priority_level ??
          calculateTaskPriority(task, (task.plant_id ? plantMap.get(task.plant_id) : null) ?? null)
      );
    }
    return map;
  }, [visibleTasks, plantMap]);

  const careCtx = useMemo<CareTaskContext>(
    () => ({
      resolvePlotId: plotResolution.resolveTaskPlotId,
      resolveBedId,
      resolvePriority: (task) => priorityByTaskId.get(task.id) ?? 'medium',
      subjectLabel,
    }),
    [plotResolution, resolveBedId, priorityByTaskId, subjectLabel]
  );

  const filterTasksBySearch = React.useCallback(
    (taskList: TaskTemplate[]) => {
      if (!normalizedSearchQuery) return taskList;
      return taskList.filter((task) => {
        if (!task) return false;
        const plantDetails = getPlantDetails(task.plant_id);
        const plantType = plantDetails.type || '';
        const searchableValues = [
          plantDetails.name,
          plantDetails.location,
          plantType,
          plantType.replace(/_/g, ' '),
          task.task_type,
        ];
        return searchableValues.some(
          (value) =>
            typeof value === 'string' && normalizeSearchText(value).includes(normalizedSearchQuery)
        );
      });
    },
    [normalizedSearchQuery, normalizeSearchText, getPlantDetails]
  );

  const sortTasks = React.useCallback(
    (taskList: TaskTemplate[]) => sortCareTasks(taskList, sortBy, careCtx),
    [sortBy, careCtx]
  );

  const groupTasks = React.useCallback(
    (taskList: TaskTemplate[]) => {
      const sorted = sortTasks(taskList);

      if (groupBy === 'none') return { '': sorted };

      // Main location only. The old key was the whole free-text
      // "Parent - Child" string, so every direction became its own header and a
      // farm with several sub-areas per plot fragmented into one-task sections;
      // bed-level tasks, having no plant, all fell into a single "General".
      // Seeded from `plotResolution.groups` so configured plots keep their
      // configured order, unrecognised parents follow, and Unassigned is last —
      // the same order the Today screen's plot cards use.
      if (groupBy === 'location') {
        const present = new Set(sorted.map((task) => plotResolution.resolveTaskPlotId(task)));
        const acc: Record<string, TaskTemplate[]> = {};
        for (const group of plotResolution.groups) {
          if (present.has(group.id)) acc[group.name] = [];
        }
        for (const task of sorted) {
          const name =
            plotNameById.get(plotResolution.resolveTaskPlotId(task)) ?? UNASSIGNED_PLOT_NAME;
          if (!acc[name]) acc[name] = [];
          acc[name].push(task);
        }
        return acc;
      }

      if (groupBy === 'type') {
        return sorted.reduce<Record<string, TaskTemplate[]>>((acc, task) => {
          const type = task.task_type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(task);
          return acc;
        }, {});
      }

      if (groupBy === 'plant') {
        return sorted.reduce<Record<string, TaskTemplate[]>>((acc, task) => {
          const plantName = getPlantDetails(task.plant_id).name || 'General';
          if (!acc[plantName]) acc[plantName] = [];
          acc[plantName].push(task);
          return acc;
        }, {});
      }

      if (groupBy === 'bed') {
        return sorted.reduce<Record<string, TaskTemplate[]>>((acc, task) => {
          const bedId = resolveBedId(task);
          const label = bedId ? bedNames.get(bedId) ?? 'Bed' : 'Unassigned';
          if (!acc[label]) acc[label] = [];
          acc[label].push(task);
          return acc;
        }, {});
      }

      return { '': sorted };
    },
    [sortTasks, getPlantDetails, groupBy, resolveBedId, bedNames, plotResolution, plotNameById]
  );

  const isSearching = normalizedSearchQuery.length > 0;

  // Tasks after search only — used for raw date lookups (ignores type/overdue filters)
  const searchFilteredTasks = useMemo(
    () => filterTasksBySearch(visibleTasks),
    [visibleTasks, filterTasksBySearch]
  );

  // The one segment rule, shared by the visible list and the chip counts so a
  // chip can never promise rows the segment will not show.
  const matchesSegment = React.useCallback(
    (task: TaskTemplate): boolean => matchesBedSegment(resolveBedId(task), bedSegment),
    [resolveBedId, bedSegment]
  );

  // Search + type/overdue/bed filters, before the All/Beds/Other segment is applied —
  // drives the segment counts so they reflect the active search and filters.
  const preSegmentTasks = useMemo(
    () => filterCareTasks(searchFilteredTasks, filters, careCtx),
    [searchFilteredTasks, filters, careCtx]
  );

  // Chip counts answer "how many would I get if I picked this?", so they run
  // against the search-filtered list rather than the already-filtered one — a
  // chip must not narrow its own count to zero.
  //
  // The segment *is* applied, because the two segments are separate lists rather
  // than two views of one: counting across both made a chip read "Watering (30)"
  // in Pots & Ground and then produce 12 rows. The week/month window stays
  // unapplied — a filter narrows the whole plan, not just the page on screen.
  const segmentScopedTasks = useMemo(
    () => searchFilteredTasks.filter(matchesSegment),
    [searchFilteredTasks, matchesSegment]
  );

  const facetCounts = useMemo(
    () => countCareFacets(segmentScopedTasks, filters, careCtx),
    [segmentScopedTasks, filters, careCtx]
  );

  // Tasks visible in the current view = overdue OR within the current week/month window
  // (mirrors overdueTasks + weekTasks below). Drives accurate, non-misleading segment counts.
  // When searching, the view isn't windowed, so count all matches (mirrors tasksForDisplay).
  const windowTasks = useMemo(() => {
    if (isSearching) return preSegmentTasks;
    const todayKey = farmDateKey(new Date());
    if (!todayKey) return [];

    let inWindow: (dueKey: string) => boolean;
    if (selectedView === 'week') {
      const weekStartKey = calendarDateKey(currentWeekStart);
      const weekEndKey = weekStartKey ? addDaysToDateKey(weekStartKey, 7) : null;
      inWindow = (dueKey) =>
        weekStartKey !== null &&
        weekEndKey !== null &&
        dueKey >= weekStartKey &&
        dueKey < weekEndKey;
    } else {
      const monthPrefix = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, '0')}`;
      inWindow = (dueKey) => dueKey.startsWith(monthPrefix);
    }

    return preSegmentTasks.filter((t) => {
      const dueKey = farmDateKey(t.next_due_at);
      return dueKey !== null && (dueKey < todayKey || inWindow(dueKey));
    });
  }, [isSearching, preSegmentTasks, selectedView, currentWeekStart, currentMonth]);

  // Templates already completed today — excluded from the segment badge so the
  // count visibly drops the moment a task is marked done (a completed recurring
  // task only reschedules forward and would otherwise stay inside the window).
  const completedTodayIds = useMemo(
    () => new Set(todayLogs.map((log) => log.template_id)),
    [todayLogs]
  );

  const segmentCounts = useMemo<BedSegmentCounts>(() => {
    let bed = 0;
    let other = 0;
    for (const t of windowTasks) {
      if (completedTodayIds.has(t.id)) continue;
      if (resolveBedId(t) != null) bed += 1;
      else other += 1;
    }
    return { bed, other };
  }, [windowTasks, resolveBedId, completedTodayIds]);

  const filteredTasks = useMemo(
    () => preSegmentTasks.filter(matchesSegment),
    [preSegmentTasks, matchesSegment]
  );

  // Pre-build a date→tasks map so calendar cells do O(1) lookups instead of O(tasks) per cell
  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, TaskTemplate[]>();
    for (const task of filteredTasks) {
      if (!task.next_due_at) continue;
      const key = farmDateKey(task.next_due_at);
      if (!key) continue;
      const arr = map.get(key);
      if (arr) {
        arr.push(task);
      } else {
        map.set(key, [task]);
      }
    }
    return map;
  }, [filteredTasks]);

  // Raw date map — search-filtered only, ignores type/overdue filters
  // Used to distinguish "no tasks exist" from "tasks hidden by filter"
  const rawTasksByDateKey = useMemo(() => {
    const map = new Map<string, TaskTemplate[]>();
    for (const task of searchFilteredTasks) {
      if (!task.next_due_at) continue;
      const key = farmDateKey(task.next_due_at);
      if (!key) continue;
      const arr = map.get(key);
      if (arr) {
        arr.push(task);
      } else {
        map.set(key, [task]);
      }
    }
    return map;
  }, [searchFilteredTasks]);

  const getTasksForDate = React.useCallback(
    (date: Date) => {
      const key = calendarDateKey(date);
      return key ? tasksByDateKey.get(key) || [] : [];
    },
    [tasksByDateKey]
  );

  const getRawTasksForDate = React.useCallback(
    (date: Date) => {
      const key = calendarDateKey(date);
      return key ? rawTasksByDateKey.get(key) || [] : [];
    },
    [rawTasksByDateKey]
  );

  const harvestsReady = useMemo(
    () => computeHarvestsReady(plants, harvestEntries, new Date(), visibleTasks),
    [plants, harvestEntries, visibleTasks]
  );

  // `calendarDaysOverdue` rather than a date comparison of its own: it is the
  // definition the rest of the schedule already uses, and the counts below have
  // to agree with this list exactly or they would send the plan to a section
  // that does not exist.
  const overdueTasks = useMemo(
    () => filteredTasks.filter((task) => calendarDaysOverdue(task) !== null),
    [filteredTasks]
  );

  // Counted off `preSegmentTasks` — filters applied, segment not — so this says
  // where the farm's late work is rather than what the open segment shows.
  const overdueSegmentCounts = useMemo<BedSegmentCounts>(
    () => countOverdueBySegment(preSegmentTasks, resolveBedId),
    [preSegmentTasks, resolveBedId]
  );

  const filteredHarvestsReady = useMemo(
    () =>
      normalizedSearchQuery
        ? harvestsReady.filter((item: HarvestReadyItem) => {
            const plantName = item.plant.name || '';
            const plantLocation = item.plant.location || '';
            const plantType = item.plant.plant_type || '';
            return [plantName, plantLocation, plantType, plantType.replace(/_/g, ' ')].some(
              (value) => normalizeSearchText(value).includes(normalizedSearchQuery)
            );
          })
        : harvestsReady,
    [harvestsReady, normalizedSearchQuery, normalizeSearchText]
  );

  // Split on `isReady` rather than handing the screen one list: only the ready
  // half is due or overdue, and only that half earns a section pinned above
  // Overdue. `computeHarvestsReady` already sorted both, so the first and last
  // entry of `harvestsSoon` are its day range.
  const harvestsReadyNow = useMemo(
    () => filteredHarvestsReady.filter((item: HarvestReadyItem) => item.isReady),
    [filteredHarvestsReady]
  );

  const harvestsSoon = useMemo(
    () => filteredHarvestsReady.filter((item: HarvestReadyItem) => !item.isReady),
    [filteredHarvestsReady]
  );

  const todayTasks = useMemo(() => {
    if (isSearching) return [];
    if (!filteredTasks || filteredTasks.length === 0) return [];
    const todayKey = calendarDateKey(farmToday());
    return filteredTasks.filter((task) => {
      if (!task || !task.next_due_at) return false;
      return farmDateKey(task.next_due_at) === todayKey;
    });
  }, [isSearching, filteredTasks]);

  const weekTasks = useMemo(() => {
    if (selectedView === 'week') {
      if (!filteredTasks || filteredTasks.length === 0) return [];
      const weekStartKey = calendarDateKey(currentWeekStart);
      const weekEndKey = weekStartKey ? addDaysToDateKey(weekStartKey, 7) : null;

      return filteredTasks.filter((task) => {
        if (!task || !task.next_due_at) return false;
        const dueKey = farmDateKey(task.next_due_at);
        return (
          dueKey !== null &&
          weekStartKey !== null &&
          weekEndKey !== null &&
          dueKey >= weekStartKey &&
          dueKey < weekEndKey
        );
      });
    } else {
      const monthPrefix = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, '0')}`;

      return filteredTasks.filter((task) => {
        const dueKey = farmDateKey(task.next_due_at);
        return dueKey !== null && dueKey.startsWith(monthPrefix);
      });
    }
  }, [selectedView, filteredTasks, currentWeekStart, currentMonth]);

  const tasksForDisplay = useMemo(() => {
    if (isSearching) return filteredTasks;
    if (!selectedDate) return weekTasks;
    const selectedKey = calendarDateKey(selectedDate);
    return weekTasks.filter((t) => {
      if (!t.next_due_at) return true;
      return farmDateKey(t.next_due_at) !== selectedKey;
    });
  }, [isSearching, filteredTasks, weekTasks, selectedDate]);

  const groupedTasks = useMemo(() => groupTasks(tasksForDisplay), [tasksForDisplay, groupTasks]);

  return {
    // Raw state — orphaned (deleted-bed) tasks excluded so they never surface
    tasks: visibleTasks,
    plants,
    initialLoading,
    refreshing,
    error,
    isStale,
    lastUpdatedAt,
    isMountedRef,
    // Data operations
    loadData,
    handleRefresh,
    // Derived data
    plantMap,
    filteredTasks,
    overdueTasks,
    tasksByDateKey,
    harvestsReadyNow,
    harvestsSoon,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    segmentCounts,
    overdueSegmentCounts,
    facetCounts,
    plotResolution,
    isSearching,
    // Helpers
    getTasksForDate,
    getRawTasksForDate,
    getPlantDetails,
    groupTasks,
    sortTasks,
  };
}
