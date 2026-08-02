/**
 * Plot grouping — the single place plants, beds, tasks and alerts are resolved
 * to a plot (a `LocationConfig.parentLocations` entry).
 *
 * Nothing in the schema carries a plot id: `TaskTemplate` has only `plant_id`
 * and `bed_id`, `Plant.location` is free text, and `Bed.parent_location` is a
 * free string. So every consumer would otherwise re-derive the same join
 * slightly differently. One pass builds the maps; `resolveTaskPlotId` is handed
 * back so the forecast's per-day job counts use the exact same resolution the
 * cards did.
 *
 * Pure — no React Native, no Firestore — so it is directly unit-testable.
 */

import {
  Bed,
  FarmAlert,
  Plant,
  TaskLog,
  TaskTemplate,
  UNASSIGNED_PLOT_ID,
} from '@/types/database.types';
import { locationKey, parseLocation } from '@/utils/locationHelpers';
import { isPlantArchived } from '@/utils/plantHelpers';

/** Display name for the bucket holding anything with no parent location. */
export const UNASSIGNED_PLOT_NAME = 'Unassigned';

export interface PlotGroupInput {
  /** Configured plot names, in the order they should appear. */
  parentLocations: string[];
  /** Card name when no plots are configured — must match `useWeatherLocations`. */
  fallbackName: string;
  plants: Plant[];
  beds: Bed[];
  tasks: TaskTemplate[];
  logs: TaskLog[];
  alerts: FarmAlert[];
}

export interface PlotGroup {
  id: string;
  name: string;
  /** False for the unassigned bucket, unrecognised parents, and the fallback card. */
  isConfigured: boolean;
  plants: Plant[];
  bedIds: string[];
  tasks: TaskTemplate[];
  logs: TaskLog[];
  alerts: FarmAlert[];
}

/**
 * The minimum a record needs to be placed on a plot. Widened past
 * `Pick<TaskTemplate, …>` because `TaskLog` carries `plant_id` but no `bed_id`.
 */
export interface PlotAssignable {
  plant_id: string | null;
  bed_id?: string | null;
}

export interface PlotResolution {
  groups: PlotGroup[];
  /** Same resolution the groups used — share it, don't re-derive it. */
  resolveTaskPlotId: (task: PlotAssignable) => string;
}

/**
 * Does a plant belong to the plot a filtered list was opened for?
 *
 * The plot cards resolve membership with `parseLocation` + `locationKey`, so
 * anything that re-filters the same population — the plant list opened from a
 * health count — has to resolve it identically, or the list contradicts the
 * count that opened it. Substring matching on `Plant.location` does not: it is
 * case-sensitive and a child name can contain another plot's name.
 *
 * `plotFilter` is a parent-location name, or `UNASSIGNED_PLOT_ID` for the
 * blank-location bucket.
 */
export function matchesPlotFilter(plant: Pick<Plant, 'location'>, plotFilter: string): boolean {
  const { parent } = parseLocation(plant.location);
  if (plotFilter === UNASSIGNED_PLOT_ID) return parent.trim().length === 0;
  return parent.trim().length > 0 && locationKey(parent) === locationKey(plotFilter);
}

/** A plant counts towards a plot only if it counts towards the health triad. */
function isCountablePlant(plant: Plant): boolean {
  return !plant.is_deleted && !isPlantArchived(plant);
}

function emptyGroup(id: string, name: string, isConfigured: boolean): PlotGroup {
  return { id, name, isConfigured, plants: [], bedIds: [], tasks: [], logs: [], alerts: [] };
}

/**
 * Partitions every input by plot in one pass. Counting is left to the existing
 * summarisers (`summarizeTodayTasks`, `getPlantHealthSummary`) — this only
 * decides what belongs where.
 */
export function groupByPlot(input: PlotGroupInput): PlotResolution {
  const { parentLocations, fallbackName, plants, beds, tasks, logs, alerts } = input;

  const configured = parentLocations.filter((name) => name.trim().length > 0);
  const hasConfiguredPlots = configured.length > 0;

  // With no plots configured, everything belongs to one card named after the
  // district — the same fallback `useWeatherLocations` builds, so the card and
  // its weather chip key identically.
  const fallbackId = hasConfiguredPlots ? UNASSIGNED_PLOT_ID : fallbackName;

  const byId = new Map<string, PlotGroup>();
  /** Comparison key → group id, so free-text casing/whitespace still matches. */
  const idByKey = new Map<string, string>();

  const register = (id: string, name: string, isConfigured: boolean): PlotGroup => {
    const existing = byId.get(id);
    if (existing) return existing;
    const group = emptyGroup(id, name, isConfigured);
    byId.set(id, group);
    idByKey.set(locationKey(id), id);
    return group;
  };

  if (hasConfiguredPlots) {
    for (const name of configured) register(name.trim(), name.trim(), true);
  } else {
    register(fallbackId, fallbackName, false);
  }

  /**
   * Resolves a free-text parent to a group id, creating an "unrecognised
   * parent" group when it matches no configured plot. Those get their own card
   * rather than folding into Unassigned, so a renamed plot's crops stay visible
   * and the per-plot counts still sum to the account-wide total.
   */
  const resolveParentName = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return fallbackId;
    if (!hasConfiguredPlots) return fallbackId;
    const hit = idByKey.get(locationKey(trimmed));
    if (hit) return hit;
    return register(trimmed, trimmed, false).id;
  };

  // ─── Beds ──────────────────────────────────────────────────────────────────
  const plotIdByBedId = new Map<string, string>();
  for (const bed of beds) {
    if (bed.is_deleted) continue;
    const plotId = resolveParentName(bed.parent_location ?? '');
    plotIdByBedId.set(bed.id, plotId);
  }

  // ─── Plants ────────────────────────────────────────────────────────────────
  // The plant's own location wins; a plant with none inherits its bed's plot.
  const plotIdByPlantId = new Map<string, string>();
  for (const plant of plants) {
    if (!isCountablePlant(plant)) continue;
    const { parent } = parseLocation(plant.location);
    const plotId = parent.trim()
      ? resolveParentName(parent)
      : (plant.bed_id ? plotIdByBedId.get(plant.bed_id) : undefined) ?? fallbackId;
    plotIdByPlantId.set(plant.id, plotId);
  }

  const resolveTaskPlotId = (task: PlotAssignable): string => {
    if (task.plant_id) {
      const viaPlant = plotIdByPlantId.get(task.plant_id);
      if (viaPlant) return viaPlant;
    }
    if (task.bed_id) {
      const viaBed = plotIdByBedId.get(task.bed_id);
      if (viaBed) return viaBed;
    }
    return fallbackId;
  };

  // Created lazily so an empty Unassigned bucket never renders a card.
  const groupFor = (plotId: string): PlotGroup =>
    byId.get(plotId) ?? register(plotId, UNASSIGNED_PLOT_NAME, false);

  for (const plant of plants) {
    const plotId = plotIdByPlantId.get(plant.id);
    if (plotId) groupFor(plotId).plants.push(plant);
  }
  for (const [bedId, plotId] of plotIdByBedId) groupFor(plotId).bedIds.push(bedId);
  for (const task of tasks) groupFor(resolveTaskPlotId(task)).tasks.push(task);
  for (const log of logs) groupFor(resolveTaskPlotId(log)).logs.push(log);
  for (const alert of alerts) {
    const plotId =
      (alert.plantId ? plotIdByPlantId.get(alert.plantId) : undefined) ??
      (alert.bedId ? plotIdByBedId.get(alert.bedId) : undefined) ??
      fallbackId;
    groupFor(plotId).alerts.push(alert);
  }

  // Configured plots in their configured order, then unrecognised parents
  // alphabetically, then Unassigned last — the card order the screen renders.
  const all = [...byId.values()];
  const configuredGroups = all.filter((g) => g.isConfigured);
  const unrecognised = all
    .filter((g) => !g.isConfigured && g.id !== UNASSIGNED_PLOT_ID)
    .sort((a, b) => a.name.localeCompare(b.name));
  const unassigned = byId.get(UNASSIGNED_PLOT_ID);
  const keepUnassigned =
    unassigned !== undefined &&
    (unassigned.plants.length > 0 ||
      unassigned.bedIds.length > 0 ||
      unassigned.tasks.length > 0 ||
      unassigned.alerts.length > 0);

  return {
    groups: [...configuredGroups, ...unrecognised, ...(keepUnassigned ? [unassigned] : [])],
    resolveTaskPlotId,
  };
}
