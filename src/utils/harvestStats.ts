/**
 * Pure harvest aggregation helpers (no Firebase/RN imports — unit-testable).
 *
 * Harvest data is captured as `JournalEntryType.Harvest` journal entries
 * (`harvest_quantity` / `harvest_unit` / `created_at`), not a dedicated
 * collection. These helpers summarize and bucket those entries for the
 * `HarvestHistorySection` stats + `HarvestYieldChart`.
 *
 * This module is also the single home for "has this harvest already happened?"
 * (`isHarvestSatisfied`), shared with `alertsLogic.ts` so the Care Plan and the
 * Today screen cannot drift apart about what counts as harvested. Both modules
 * are contractually free of React-Native imports — nothing here may reach
 * `journalEntryOptions.ts`, which pulls in `@expo/vector-icons`. That is why the
 * unit-conversion helpers live here and are re-exported from there.
 *
 * Regional scope: none of the constants below are zone-aware. `READY_WITHIN_DAYS`,
 * `HARVEST_HORIZON_DAYS` and `CUT_AND_COME_AGAIN_INTERVAL_DAYS` are fixed values
 * with no agronomic citation, and the harvest-date estimates these sit alongside
 * never see a district or sowing window — a Nilgiris and a Kanyakumari tomato
 * predict the same date. `TAMIL_NADU_PLANTING_RULES` already carries
 * source-reviewed `maturityDays` per crop per establishment window; wiring it in
 * is tracked as G5 in docs/IMPLEMENTATION_ROADMAP.md.
 */
import {
  HarvestMode,
  JournalEntry,
  JournalEntryType,
  Plant,
  TaskTemplate,
  TaskType,
} from '@/types/database.types';
import { getCurrentSeason } from '@/utils/seasonHelpers';
import { calendarDaysBetweenKeys, farmDateKey } from '@/utils/farmDate';

/**
 * Whether a journal entry records a harvest.
 *
 * The single definition shared by the Firestore query that fetches harvest
 * entries and the AsyncStorage fallback that filters them locally, so the two
 * can never disagree about what counts. Note an entry with no `entry_type` is
 * not a harvest — which is also how a Firestore `where('entry_type','==',...)`
 * behaves, since an equality filter never matches a document missing the field.
 * The server-side and client-side filters therefore return the same rows.
 */
export function isHarvestJournalEntry(entry: Pick<JournalEntry, 'entry_type'>): boolean {
  return entry.entry_type === JournalEntryType.Harvest;
}

/** Within this many days of a supported date, a crop needs a harvest check. */
export const READY_WITHIN_DAYS = 7;
/** How far ahead the Harvest Ready section looks before an entry is just noise. */
export const HARVEST_HORIZON_DAYS = 30;

/** Task types that record a harvest, as opposed to any other care work. */
export const HARVEST_TASK_TYPES: ReadonlySet<TaskType> = new Set<TaskType>([
  'harvest',
  'harvest_leaves',
]);

/**
 * Days before a cut-and-come-again crop is prompted for its next picking.
 * Mirrors the `harvest_leaves` template cadence in `tasks.ts` (currently 14).
 */
export const CUT_AND_COME_AGAIN_INTERVAL_DAYS = 14;

/**
 * Whether a recorded harvest has already satisfied a due/expected harvest date.
 *
 * The one definition shared by the Care Plan's Harvest Ready section and the
 * Today screen's `harvest_due` alert. Those two used to state the rule
 * separately and read different signals, so logging a harvest cleared one
 * surface while the other kept counting overdue days forever.
 *
 * Expressed in plain day offsets rather than dates so each caller keeps its own
 * day arithmetic: the alerts path measures from device-local midnight, the Care
 * Plan from farm-timezone date keys, and forcing either onto the other's clock
 * would shift results at the day boundary.
 *
 * @param harvestMode          The plant's harvest mode; only `cut_and_come_again` re-arms.
 * @param daysFromDueToHarvest Calendar days from the due date to the latest recorded
 *                             harvest. `>= 0` means harvested on or after it.
 *                             `null` when nothing has been harvested.
 * @param daysSinceHarvest     Calendar days from that harvest to today.
 */
export function isHarvestSatisfied(
  harvestMode: HarvestMode | null | undefined,
  daysFromDueToHarvest: number | null,
  daysSinceHarvest: number | null
): boolean {
  // Nothing recorded, or the only harvest predates the date being checked —
  // this window is still open.
  if (daysFromDueToHarvest === null || daysFromDueToHarvest < 0) return false;
  // Cut-and-come-again crops keep producing, so the prompt re-arms one picking
  // cycle after the last harvest. Every other mode, `null` included, stays
  // satisfied: those either finish for the season or are re-prompted by a task.
  const readyAgain =
    harvestMode === 'cut_and_come_again' &&
    daysSinceHarvest !== null &&
    daysSinceHarvest >= CUT_AND_COME_AGAIN_INTERVAL_DAYS;
  return !readyAgain;
}

export interface HarvestReadyItem {
  plant: Plant;
  nextDate: Date;
  daysUntil: number;
  isReady: boolean;
  source: 'farmer_date' | 'scheduled_task';
}

/**
 * Crops whose next harvest check is due or nearly due. A supported date must
 * come from the farmer's expected date or an enabled harvest task; journal
 * history alone never invents a generic crop cycle.
 *
 * `daysUntil` may be negative: a harvest window that opened in the past has not
 * closed, so those count as ready rather than falling through to a "ready in
 * N days" branch that would then render a negative countdown.
 *
 * Returned most-urgent-first. Callers are expected to split on `isReady`: only
 * that half is due or overdue and earns a pinned "Harvest Ready" section, while
 * the rest (8–`HARVEST_HORIZON_DAYS` days out) is a look-ahead that belongs
 * behind a disclosure, below the work that is actually due. Rendering the whole
 * list under one "ready" heading is what put "Check in 12 days" above overdue
 * tasks.
 */
export function computeHarvestsReady(
  plants: Plant[],
  harvestEntries: JournalEntry[],
  now: Date = new Date(),
  tasks: TaskTemplate[] = []
): HarvestReadyItem[] {
  if (plants.length === 0) return [];

  const todayKey = farmDateKey(now);
  if (!todayKey) return [];

  // Both lookups below were previously full scans inside the plant loop, which
  // made this O(plants × tasks) and O(plants × harvestEntries) — the latter with
  // an Intl call in its inner loop. One pass each, up front, instead.

  // Earliest valid enabled harvest task per plant.
  //
  // The emptiness check on `next_due_at` is deliberate and is a small behaviour
  // fix, not just a move: `farmDateKey` alone does not reject a missing date,
  // because `new Date(null)` is the epoch rather than an invalid date. A task
  // with no due date therefore used to pass this filter, claim `source:
  // 'scheduled_task'` while silently falling back to the farmer's date, and
  // throw on `null.localeCompare` as soon as the plant had a second harvest
  // task. Now it is skipped, which is what the filter always meant.
  const scheduledByPlant = new Map<string, TaskTemplate>();
  for (const task of tasks) {
    if (!task.enabled || !task.plant_id || !task.next_due_at) continue;
    if (task.task_type !== 'harvest' && task.task_type !== 'harvest_leaves') continue;
    if (farmDateKey(task.next_due_at) === null) continue;
    const current = scheduledByPlant.get(task.plant_id);
    if (!current || task.next_due_at.localeCompare(current.next_due_at) < 0) {
      scheduledByPlant.set(task.plant_id, task);
    }
  }

  // Latest harvest date key per plant. Asking "is the newest harvest on or after
  // the expected date" is equivalent to the old "does any harvest fall on or
  // after it": if the maximum qualifies some entry does, and if it doesn't none
  // do. Entries with an unparseable date or no plant never matched before and
  // are skipped here for the same result.
  const latestHarvestKeyByPlant = new Map<string, string>();
  for (const entry of harvestEntries) {
    if (!entry.plant_id) continue;
    const key = farmDateKey(entry.created_at);
    if (key === null) continue;
    const current = latestHarvestKeyByPlant.get(entry.plant_id);
    if (current === undefined || key > current) {
      latestHarvestKeyByPlant.set(entry.plant_id, key);
    }
  }

  const items: HarvestReadyItem[] = [];
  for (const plant of plants) {
    const scheduled = scheduledByPlant.get(plant.id);
    const rawDate = scheduled?.next_due_at ?? plant.expected_harvest_date;
    const source = scheduled ? 'scheduled_task' : 'farmer_date';
    if (!rawDate) continue;

    const nextDate = new Date(rawDate);
    // Keyed from the raw string, not the Date: farmDateKey only caches string
    // inputs, and this is the one call in here that runs per plant.
    const nextKey = farmDateKey(rawDate);
    if (!nextKey || Number.isNaN(nextDate.getTime())) continue;

    // A harvest reaches this from either write path: the journal entry the
    // farmer logs, or `last_harvest_date` stamped when a harvest task is
    // completed. Reading only one of them is what let a completed task and a
    // logged harvest each clear a different surface.
    //
    // Compare against the newest of them explicitly rather than trusting the
    // caller's sort — an out-of-order list would otherwise silently predict
    // from an old harvest.
    const journalKey = latestHarvestKeyByPlant.get(plant.id) ?? null;
    const stampedKey = plant.last_harvest_date ? farmDateKey(plant.last_harvest_date) : null;
    const latestHarvestKey =
      journalKey !== null && stampedKey !== null
        ? journalKey > stampedKey
          ? journalKey
          : stampedKey
        : journalKey ?? stampedKey;

    // Applies to a scheduled task too, not just a farmer's date. A task that
    // did advance has a later `nextKey` and stays visible on its own; this is
    // the backstop for one whose advance is still queued offline.
    if (
      latestHarvestKey !== null &&
      isHarvestSatisfied(
        plant.harvest_mode,
        calendarDaysBetweenKeys(nextKey, latestHarvestKey),
        calendarDaysBetweenKeys(latestHarvestKey, todayKey)
      )
    ) {
      continue;
    }

    const daysUntil = calendarDaysBetweenKeys(todayKey, nextKey);
    if (daysUntil === null) continue;
    // "Harvest Ready" is a do-it-now section; a tree six months out belongs on
    // the plant record, not here.
    if (daysUntil > HARVEST_HORIZON_DAYS) continue;

    items.push({ plant, nextDate, daysUntil, isReady: daysUntil <= READY_WITHIN_DAYS, source });
  }
  // Ordered here rather than at each call site: the list came back in `plants`
  // order, so a crop 28 days out could print above one overdue by 3. Name
  // breaks the tie so a re-render can't reshuffle two crops due the same day.
  return items.sort(
    (a, b) => a.daysUntil - b.daysUntil || (a.plant.name || '').localeCompare(b.plant.name || '')
  );
}

// ─── Unit handling ──────────────────────────────────────────────────────────
// These live here rather than in `journalEntryOptions.ts` (which imports
// `@expo/vector-icons`) so this module stays RN-free; that file re-exports them.

/** Weight units contribute to the kg total; count units (pcs/bunches) do not. */
export function isWeightUnit(unit: string | null | undefined): boolean {
  return unit === 'kg' || unit === 'g' || unit === 'lbs';
}

/**
 * Convert a harvest quantity to kilograms. Returns null for count-based units
 * (pcs, pieces, bunches) so they are never summed into a weight total.
 */
export function harvestWeightKg(
  quantity: number | null | undefined,
  unit: string | null | undefined
): number | null {
  if (quantity == null || Number.isNaN(quantity)) return null;
  switch (unit) {
    case 'kg':
      return quantity;
    case 'g':
      return quantity / 1000;
    case 'lbs':
      return quantity * 0.453592;
    default:
      return null;
  }
}

/**
 * Which scale a set of harvests is totalled on.
 *
 * Quantities are recorded in kg, g, pcs or bunches, and adding those together
 * produces a number that means nothing — 2 kg of beans plus 3 bunches of keerai
 * was previously reported as "5 kg", taking its unit from whichever entry
 * happened to come first. So one basis is chosen for the whole set: weights if
 * any were weighed, counts otherwise. Entries off that basis are excluded from
 * the total and reported as `excludedCount` rather than silently folded in.
 */
export type HarvestBasis = 'kg' | 'pcs';

export function getHarvestBasis(entries: JournalEntry[]): HarvestBasis {
  return entries.some((e) => isWeightUnit(e.harvest_unit)) ? 'kg' : 'pcs';
}

/** An entry's contribution to a total on `basis`, or null if it is off-basis. */
function contribution(entry: JournalEntry, basis: HarvestBasis): number | null {
  if (basis === 'kg') return harvestWeightKg(entry.harvest_quantity, entry.harvest_unit);
  return isWeightUnit(entry.harvest_unit) ? null : entry.harvest_quantity ?? null;
}

export interface HarvestSummary {
  /** Every harvest entry, on-basis or not. */
  count: number;
  /** Total of the on-basis entries, expressed in `unit`. */
  total: number;
  /** Mean per on-basis harvest. */
  average: number;
  unit: HarvestBasis;
  /** Entries recorded in the other kind of unit, left out of `total`. */
  excludedCount: number;
}

export function summarizeHarvests(entries: JournalEntry[]): HarvestSummary {
  const basis = getHarvestBasis(entries);
  let total = 0;
  let counted = 0;
  for (const entry of entries) {
    const value = contribution(entry, basis);
    if (value === null) continue;
    total += value;
    counted += 1;
  }
  return {
    count: entries.length,
    total,
    average: counted > 0 ? total / counted : 0,
    unit: basis,
    excludedCount: entries.length - counted,
  };
}

const SEASON_ORDER = ['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry'] as const;
const SEASON_LABELS: Record<string, string> = {
  summer: 'Summer',
  sw_monsoon: 'SW Mon',
  ne_monsoon: 'NE Mon',
  cool_dry: 'Cool Dry',
};

export interface YieldBucket {
  key: string;
  label: string;
  total: number;
}

/**
 * Sum harvest quantity per agro-climatic season (only seasons with harvests),
 * in calendar order, for the yield chart. Totals are on the set's `basis`, so
 * the chart and the summary stat above it always express the same scale.
 */
export function groupHarvestsBySeason(
  entries: JournalEntry[],
  basis: HarvestBasis = getHarvestBasis(entries)
): YieldBucket[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const value = contribution(e, basis);
    if (value === null) continue;
    const season = getCurrentSeason(new Date(e.created_at));
    totals.set(season, (totals.get(season) ?? 0) + value);
  }
  return SEASON_ORDER.filter((s) => (totals.get(s) ?? 0) > 0).map((s) => ({
    key: s,
    label: SEASON_LABELS[s] ?? s,
    total: totals.get(s) ?? 0,
  }));
}

export interface TreeYield {
  treeNumber: number;
  total: number;
  count: number;
}

/**
 * Per-tree harvest totals for coconut groves, ordered by tree number. Entries
 * without a `harvest_tree_number`, or recorded off the set's `basis`, are
 * ignored — a grove logged in nuts must not have kilograms added to it.
 */
export function groupHarvestsByTree(
  entries: JournalEntry[],
  basis: HarvestBasis = getHarvestBasis(entries)
): TreeYield[] {
  const map = new Map<number, { total: number; count: number }>();
  for (const e of entries) {
    if (e.harvest_tree_number == null) continue;
    const value = contribution(e, basis);
    if (value === null) continue;
    const cur = map.get(e.harvest_tree_number) ?? { total: 0, count: 0 };
    cur.total += value;
    cur.count += 1;
    map.set(e.harvest_tree_number, cur);
  }
  return [...map.entries()]
    .map(([treeNumber, v]) => ({ treeNumber, total: v.total, count: v.count }))
    .sort((a, b) => a.treeNumber - b.treeNumber);
}
