import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getTaskTemplates, getTodayTaskLogs } from '../services/tasks';
import { getAllPlants } from '../services/plants';
import { getBeds } from '../services/beds';
import { getHarvestJournalMetadata } from '../services/journal';
import { TaskTemplate, Plant, JournalEntry, TaskLog } from '../types/database.types';
import { computeHarvestsReady, type HarvestReadyItem } from '../utils/harvestStats';
import { isNetworkAvailable } from '../utils/networkState';
import { resolveTaskBedId, isBedLevelOrphanTask } from '../utils/taskBed';
import { logger } from '../utils/logger';
import { addDaysToDateKey, calendarDateKey, farmDateKey, farmToday } from '@/utils/farmDate';
import { getErrorMessage } from '@/utils/errorLogging';

type GroupBy = 'none' | 'location' | 'type' | 'plant' | 'bed';

export type BedSegment = 'bed' | 'other';

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
  filteredHarvestsReady: HarvestReadyItem[];
  todayTasks: TaskTemplate[];
  weekTasks: TaskTemplate[];
  tasksForDisplay: TaskTemplate[];
  groupedTasks: Record<string, TaskTemplate[]>;
  segmentCounts: BedSegmentCounts;
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
  filterTaskTypes: Set<string>;
  filterOverdueOnly: boolean;
  bedSegment?: BedSegment;
  bedNames?: Map<string, string>;
}

export function useCalendarData({
  normalizedSearchQuery,
  normalizeSearchText,
  selectedView,
  currentWeekStart,
  currentMonth,
  selectedDate,
  groupBy,
  filterTaskTypes,
  filterOverdueOnly,
  bedSegment = 'other',
  bedNames,
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

  const sortTasks = React.useCallback((taskList: TaskTemplate[]) => {
    return [...taskList].sort((a, b) => {
      const dateA = new Date(a.next_due_at).getTime();
      const dateB = new Date(b.next_due_at).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.task_type.localeCompare(b.task_type);
    });
  }, []);

  const groupTasks = React.useCallback(
    (taskList: TaskTemplate[]) => {
      const sorted = sortTasks(taskList);

      if (groupBy === 'none') return { '': sorted };

      if (groupBy === 'location') {
        return sorted.reduce<Record<string, TaskTemplate[]>>((acc, task) => {
          const location = getPlantDetails(task.plant_id).location || 'General';
          if (!acc[location]) acc[location] = [];
          acc[location].push(task);
          return acc;
        }, {});
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
          const label = bedId ? bedNames?.get(bedId) ?? 'Bed' : 'Unassigned';
          if (!acc[label]) acc[label] = [];
          acc[label].push(task);
          return acc;
        }, {});
      }

      return { '': sorted };
    },
    [sortTasks, getPlantDetails, groupBy, resolveBedId, bedNames]
  );

  const isSearching = normalizedSearchQuery.length > 0;

  // Drop bed-level tasks whose bed was deleted so they never surface in the
  // lists, calendar cells, or segment counts (they're also being self-healed).
  const visibleTasks = useMemo(
    () => (orphanBedTaskIds.size > 0 ? tasks.filter((t) => !orphanBedTaskIds.has(t.id)) : tasks),
    [tasks, orphanBedTaskIds]
  );

  // Tasks after search only — used for raw date lookups (ignores type/overdue filters)
  const searchFilteredTasks = useMemo(
    () => filterTasksBySearch(visibleTasks),
    [visibleTasks, filterTasksBySearch]
  );

  // Search + type/overdue/bed filters, before the All/Beds/Other segment is applied —
  // drives the segment counts so they reflect the active search and filters.
  const preSegmentTasks = useMemo(() => {
    let result = searchFilteredTasks;
    if (filterTaskTypes.size > 0) {
      result = result.filter((t) => filterTaskTypes.has(t.task_type));
    }
    if (filterOverdueOnly) {
      const todayKey = farmDateKey(new Date());
      result = result.filter((task) => {
        const dueKey = farmDateKey(task.next_due_at);
        return dueKey !== null && todayKey !== null && dueKey < todayKey;
      });
    }
    return result;
  }, [searchFilteredTasks, filterTaskTypes, filterOverdueOnly]);

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

  const filteredTasks = useMemo(() => {
    if (bedSegment === 'bed') return preSegmentTasks.filter((t) => resolveBedId(t) != null);
    return preSegmentTasks.filter((t) => resolveBedId(t) == null);
  }, [preSegmentTasks, bedSegment, resolveBedId]);

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

  const overdueTasks = useMemo(() => {
    const todayKey = farmDateKey(new Date());
    return filteredTasks.filter((task) => {
      const dueKey = farmDateKey(task.next_due_at);
      return dueKey !== null && todayKey !== null && dueKey < todayKey;
    });
  }, [filteredTasks]);

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
    filteredHarvestsReady,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    segmentCounts,
    isSearching,
    // Helpers
    getTasksForDate,
    getRawTasksForDate,
    getPlantDetails,
    groupTasks,
    sortTasks,
  };
}
