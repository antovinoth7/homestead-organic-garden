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
  PlantProfiles,
  TaskLog,
  TaskTemplate,
} from '@/types/database.types';
import { getBeds } from '@/services/beds';
import { getFarmConfig } from '@/services/farmCapacity';
import { getLocationConfig } from '@/services/locations';
import { getAllPlants, getStoredPlants } from '@/services/plants';
import { getPlantProfiles } from '@/services/plantProfiles';
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
  /**
   * Catalog metadata for the season card's crop tiles — spacing and days to
   * harvest. Cache-first and offline-backed like the rest, so it costs no
   * Firestore read on a warm start.
   */
  profiles: PlantProfiles;
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

/**
 * Drops tasks, logs and templates pointing at plants we don't know about.
 *
 * `allTemplates` is scoped too: an unscoped template for a deleted plant still
 * resolves to a plot (`resolveTaskPlotId` falls back), so it inflated the
 * forecast overlay's per-day job counts against a plant that no longer exists.
 */
function scopeToKnownPlants(
  plants: Plant[],
  tasks: TaskTemplate[],
  logs: TaskLog[],
  allTemplates: TaskTemplate[]
): { tasks: TaskTemplate[]; logs: TaskLog[]; allTemplates: TaskTemplate[] } {
  const plantIds = new Set(plants.map((plant) => plant.id));
  return {
    tasks: filterToKnownPlants(tasks, plantIds),
    logs: filterToKnownPlants(logs, plantIds),
    allTemplates: filterToKnownPlants(allTemplates, plantIds),
  };
}

export async function getTodayBriefSources(): Promise<TodayBriefSources> {
  const [rawTasks, rawLogs, rawTemplates, plants, beds, locationConfig, farmConfig, profiles] =
    await Promise.all([
      getTodayTasks(),
      getTodayTaskLogs(),
      getTaskTemplates(),
      readPlants(),
      getBeds(),
      getLocationConfig(),
      getFarmConfig(),
      getPlantProfiles(),
    ]);

  const { tasks, logs, allTemplates } = scopeToKnownPlants(
    plants,
    rawTasks,
    rawLogs,
    rawTemplates
  );
  return { tasks, logs, allTemplates, plants, beds, locationConfig, farmConfig, profiles };
}

/**
 * Cold-start paint from the local caches. Returns `null` when there is nothing
 * worth painting, so the caller can show its skeleton instead of a screen of
 * zeroes. `getBeds`/`getLocationConfig`/`getFarmConfig` already fall back to
 * AsyncStorage themselves, so they are safe to call here. `getPlantProfiles` is
 * the same shape again — cache, then AsyncStorage, with the Firestore sync fired
 * in the background rather than awaited.
 */
export async function getStoredTodayBriefSources(): Promise<TodayBriefSources | null> {
  const [rawTasks, rawLogs, plants, beds, locationConfig, farmConfig, profiles] =
    await Promise.all([
      getStoredTodayTasks(),
      getStoredTodayTaskLogs(),
      getStoredPlants(),
      getBeds(),
      getLocationConfig(),
      getFarmConfig(),
      getPlantProfiles(),
    ]);

  if (rawTasks.length === 0 && plants.length === 0) return null;

  // The overlay's job counts need every template; the cached today-tasks are the
  // best available stand-in until the revalidate lands.
  const { tasks, logs, allTemplates } = scopeToKnownPlants(plants, rawTasks, rawLogs, rawTasks);
  return { tasks, logs, allTemplates, plants, beds, locationConfig, farmConfig, profiles };
}
