import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getTaskTemplates, deleteTasksForPlantIds } from '../services/tasks';
import { getAllPlants, plantExists } from '../services/plants';
import { getJournalMetadata } from '../services/journal';
import { TaskTemplate, Plant, JournalEntryType, JournalEntry } from '../types/database.types';
import { isNetworkAvailable } from '../utils/networkState';
import { resolveTaskBedId } from '../utils/taskBed';
import { logger } from '../utils/logger';

type GroupBy = 'none' | 'location' | 'type' | 'plant' | 'bed';

export type BedSegment = 'bed' | 'other';

export interface BedSegmentCounts {
  bed: number;
  other: number;
}

export interface HarvestReadyItem {
  plant: Plant;
  nextDate: Date;
  daysUntil: number;
  isReady: boolean;
}

export interface UseCalendarDataReturn {
  tasks: TaskTemplate[];
  plants: Plant[];
  initialLoading: boolean;
  refreshing: boolean;
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
  filterBedId?: string;
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
  filterBedId,
  bedSegment = 'other',
  bedNames,
}: UseCalendarDataOptions): UseCalendarDataReturn {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const lastLoadTimeRef = useRef(0);

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
      const [tasksData, plantsData, journalData] = await Promise.all([
        getTaskTemplates(),
        getAllPlants(),
        getJournalMetadata(),
      ]);

      if (!isMountedRef.current) return;

      const plantIds = new Set(plantsData.map((plant) => plant.id));
      const filteredTasks = tasksData.filter(
        (task) => task.enabled && (!task.plant_id || plantIds.has(task.plant_id))
      );
      const orphanPlantIds = Array.from(
        new Set(
          tasksData
            .filter((task) => task.plant_id && !plantIds.has(task.plant_id))
            .map((task) => task.plant_id as string)
        )
      );

      setTasks(filteredTasks);
      setPlants(plantsData);
      setHarvestEntries(journalData.filter((e) => e.entry_type === JournalEntryType.Harvest));

      if (orphanPlantIds.length > 0 && isNetworkAvailable()) {
        const confirmedOrphans = (
          await Promise.all(
            orphanPlantIds.map(async (plantId) => {
              try {
                const exists = await plantExists(plantId);
                return exists ? null : plantId;
              } catch (error) {
                const errorCode = (error as { code?: string })?.code;
                if (errorCode !== 'permission-denied' && errorCode !== 'unauthenticated') {
                  logger.warn(`Failed to verify plant ${plantId}:`, error as Error);
                }
                return null;
              }
            })
          )
        ).filter((plantId): plantId is string => Boolean(plantId));

        if (confirmedOrphans.length > 0) {
          await deleteTasksForPlantIds(confirmedOrphans);
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      logger.error('Failed to load calendar data', error as Error);
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

  // Tasks after search only — used for raw date lookups (ignores type/overdue filters)
  const searchFilteredTasks = useMemo(
    () => filterTasksBySearch(tasks),
    [tasks, filterTasksBySearch]
  );

  // Search + type/overdue/bed filters, before the All/Beds/Other segment is applied —
  // drives the segment counts so they reflect the active search and filters.
  const preSegmentTasks = useMemo(() => {
    let result = searchFilteredTasks;
    if (filterTaskTypes.size > 0) {
      result = result.filter((t) => filterTaskTypes.has(t.task_type));
    }
    if (filterOverdueOnly) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      result = result.filter((t) => t.next_due_at && new Date(t.next_due_at) < todayStart);
    }
    if (filterBedId) {
      result = result.filter((t) => t.bed_id === filterBedId);
    }
    return result;
  }, [searchFilteredTasks, filterTaskTypes, filterOverdueOnly, filterBedId]);

  // Tasks visible in the current view = overdue OR within the current week/month window
  // (mirrors overdueTasks + weekTasks below). Drives accurate, non-misleading segment counts.
  // When searching, the view isn't windowed, so count all matches (mirrors tasksForDisplay).
  const windowTasks = useMemo(() => {
    if (isSearching) return preSegmentTasks;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let inWindow: (due: Date) => boolean;
    if (selectedView === 'week') {
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);
      inWindow = (due) => {
        const d = new Date(due);
        d.setHours(0, 0, 0, 0);
        return d >= weekStart && d < weekEnd;
      };
    } else {
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      inWindow = (due) => due >= monthStart && due <= monthEnd;
    }

    return preSegmentTasks.filter((t) => {
      if (!t.next_due_at) return false;
      const due = new Date(t.next_due_at);
      return due < todayStart || inWindow(due);
    });
  }, [isSearching, preSegmentTasks, selectedView, currentWeekStart, currentMonth]);

  const segmentCounts = useMemo<BedSegmentCounts>(() => {
    let bed = 0;
    let other = 0;
    for (const t of windowTasks) {
      if (resolveBedId(t) != null) bed += 1;
      else other += 1;
    }
    return { bed, other };
  }, [windowTasks, resolveBedId]);

  const filteredTasks = useMemo(() => {
    if (bedSegment === 'bed') return preSegmentTasks.filter((t) => resolveBedId(t) != null);
    return preSegmentTasks.filter((t) => resolveBedId(t) == null);
  }, [preSegmentTasks, bedSegment, resolveBedId]);

  // Pre-build a date→tasks map so calendar cells do O(1) lookups instead of O(tasks) per cell
  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, TaskTemplate[]>();
    for (const task of filteredTasks) {
      if (!task.next_due_at) continue;
      const key = new Date(task.next_due_at).toDateString();
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
      const key = new Date(task.next_due_at).toDateString();
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
      return tasksByDateKey.get(date.toDateString()) || [];
    },
    [tasksByDateKey]
  );

  const getRawTasksForDate = React.useCallback(
    (date: Date) => {
      return rawTasksByDateKey.get(date.toDateString()) || [];
    },
    [rawTasksByDateKey]
  );

  const getHarvestsReady = React.useCallback(() => {
    if (!plants || plants.length === 0 || !harvestEntries) return [];
    const fruitTrees = plants.filter(
      (p) => p.plant_type === 'fruit_tree' || p.plant_type === 'coconut_tree'
    );

    return fruitTrees
      .map((plant) => {
        const plantHarvests = harvestEntries.filter((e) => e.plant_id === plant.id);
        if (plantHarvests.length === 0) return null;

        const lastHarvest = plantHarvests[0]!;
        const lastDate = new Date(lastHarvest.created_at);
        const nextDate = new Date(lastDate);

        if (plant.plant_type === 'coconut_tree') {
          nextDate.setMonth(nextDate.getMonth() + 2);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 6);
        }

        const daysUntil = Math.ceil(
          (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          plant,
          nextDate,
          daysUntil,
          isReady: daysUntil <= 7 && daysUntil >= 0,
        };
      })
      .filter((item): item is HarvestReadyItem => item !== null);
  }, [plants, harvestEntries]);

  const harvestsReady = useMemo(() => getHarvestsReady(), [getHarvestsReady]);

  const overdueTasks = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return filteredTasks.filter((t) => t.next_due_at && new Date(t.next_due_at) < todayStart);
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
    const today = new Date();
    return filteredTasks.filter((task) => {
      if (!task || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate.toDateString() === today.toDateString();
    });
  }, [isSearching, filteredTasks]);

  const weekTasks = useMemo(() => {
    if (selectedView === 'week') {
      if (!filteredTasks || filteredTasks.length === 0) return [];
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);

      return filteredTasks.filter((task) => {
        if (!task || !task.next_due_at) return false;
        const dueDate = new Date(task.next_due_at);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= weekStart && dueDate < weekEnd;
      });
    } else {
      // month
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      return filteredTasks.filter((task) => {
        const dueDate = new Date(task.next_due_at);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });
    }
  }, [selectedView, filteredTasks, currentWeekStart, currentMonth]);

  const tasksForDisplay = useMemo(() => {
    if (isSearching) return filteredTasks;
    if (!selectedDate) return weekTasks;
    const selectedKey = selectedDate.toDateString();
    return weekTasks.filter((t) => {
      if (!t.next_due_at) return true;
      return new Date(t.next_due_at).toDateString() !== selectedKey;
    });
  }, [isSearching, filteredTasks, weekTasks, selectedDate]);

  const groupedTasks = useMemo(() => groupTasks(tasksForDisplay), [tasksForDisplay, groupTasks]);

  return {
    // Raw state
    tasks,
    plants,
    initialLoading,
    refreshing,
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
