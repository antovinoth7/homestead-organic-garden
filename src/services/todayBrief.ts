/**
 * Today briefing sources — every read the Today screen needs, in one place.
 *
 * Gathering only: no counting, no grouping, no wording. Those live in the pure
 * utils (`plotGrouping`, `taskSummary`, `plantHealth`, `seasonProgress`) so they
 * stay unit-testable, and `useTodayBrief` composes them. The screen talks to the
 * hook and never to a service.
 *
 * Two readers, matching the dashboard's cache-first paint: `getStored…` returns
 * whatever the local caches already hold, `get…` revalidates.
 */

import {
  Bed,
  FarmConfig,
  LocationConfig,
  Plant,
  TaskLog,
  TaskTemplate,
} from '@/types/database.types';
import { getBeds } from '@/services/beds';
import { getFarmConfig } from '@/services/farmCapacity';
import { getLocationConfig } from '@/services/locations';
import { getAllPlants, getStoredPlants } from '@/services/plants';
import {
  getStoredTodayTaskLogs,
  getStoredTodayTasks,
  getTaskTemplates,
  getTodayTaskLogs,
  getTodayTasks,
} from '@/services/tasks';
import { filterToKnownPlants } from '@/utils/taskSummary';

export interface TodayBriefSources {
  /** Today's due + overdue templates, already filtered to known plants. */
  tasks: TaskTemplate[];
  /** Today's completion logs, filtered the same way. */
  logs: TaskLog[];
  /** Every template — the forecast overlay counts jobs beyond today from these. */
  allTemplates: TaskTemplate[];
  plants: Plant[];
  beds: Bed[];
  locationConfig: LocationConfig;
  farmConfig: FarmConfig;
}

/**
 * The Today screen renders no plant photos, so prefer the image-free,
 * offline-first reader and fall back to the paginating `getAllPlants` only on a
 * cold cache — the same trade-off `useBedData` documents.
 */
async function readPlants(): Promise<Plant[]> {
  const stored = await getStoredPlants();
  return stored.length > 0 ? stored : getAllPlants();
}

/** Drops tasks and logs pointing at plants we don't know about. */
function scopeToKnownPlants(
  plants: Plant[],
  tasks: TaskTemplate[],
  logs: TaskLog[]
): { tasks: TaskTemplate[]; logs: TaskLog[] } {
  const plantIds = new Set(plants.map((plant) => plant.id));
  return {
    tasks: filterToKnownPlants(tasks, plantIds),
    logs: filterToKnownPlants(logs, plantIds),
  };
}

export async function getTodayBriefSources(): Promise<TodayBriefSources> {
  const [rawTasks, rawLogs, allTemplates, plants, beds, locationConfig, farmConfig] =
    await Promise.all([
      getTodayTasks(),
      getTodayTaskLogs(),
      getTaskTemplates(),
      readPlants(),
      getBeds(),
      getLocationConfig(),
      getFarmConfig(),
    ]);

  const { tasks, logs } = scopeToKnownPlants(plants, rawTasks, rawLogs);
  return { tasks, logs, allTemplates, plants, beds, locationConfig, farmConfig };
}

/**
 * Cold-start paint from the local caches. Returns `null` when there is nothing
 * worth painting, so the caller can show its skeleton instead of a screen of
 * zeroes. `getBeds`/`getLocationConfig`/`getFarmConfig` already fall back to
 * AsyncStorage themselves, so they are safe to call here.
 */
export async function getStoredTodayBriefSources(): Promise<TodayBriefSources | null> {
  const [rawTasks, rawLogs, plants, beds, locationConfig, farmConfig] = await Promise.all([
    getStoredTodayTasks(),
    getStoredTodayTaskLogs(),
    getStoredPlants(),
    getBeds(),
    getLocationConfig(),
    getFarmConfig(),
  ]);

  if (rawTasks.length === 0 && plants.length === 0) return null;

  const { tasks, logs } = scopeToKnownPlants(plants, rawTasks, rawLogs);
  // The overlay's job counts need every template; the cached today-tasks are the
  // best available stand-in until the revalidate lands.
  return { tasks, logs, allTemplates: tasks, plants, beds, locationConfig, farmConfig };
}
