/**
 * Pure harvest aggregation helpers (no Firebase/RN imports — unit-testable).
 *
 * Harvest data is captured as `JournalEntryType.Harvest` journal entries
 * (`harvest_quantity` / `harvest_unit` / `created_at`), not a dedicated
 * collection. These helpers summarize and bucket those entries for the
 * `HarvestHistorySection` stats + `HarvestYieldChart`.
 */
import { JournalEntry, JournalEntryType, Plant, TaskTemplate } from '@/types/database.types';
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

    if (!scheduled) {
      // Compare against the newest harvest explicitly rather than trusting the
      // caller's sort — an out-of-order list would otherwise silently predict
      // from an old harvest.
      const latestHarvestKey = latestHarvestKeyByPlant.get(plant.id);
      if (latestHarvestKey !== undefined && latestHarvestKey >= nextKey) continue;
    }

    const daysUntil = calendarDaysBetweenKeys(todayKey, nextKey);
    if (daysUntil === null) continue;
    // "Harvest Ready" is a do-it-now section; a tree six months out belongs on
    // the plant record, not here.
    if (daysUntil > HARVEST_HORIZON_DAYS) continue;

    items.push({ plant, nextDate, daysUntil, isReady: daysUntil <= READY_WITHIN_DAYS, source });
  }
  return items;
}

export interface HarvestSummary {
  count: number;
  total: number;
  average: number;
  unit: string;
}

export function summarizeHarvests(entries: JournalEntry[]): HarvestSummary {
  const count = entries.length;
  const total = entries.reduce((sum, e) => sum + (e.harvest_quantity ?? 0), 0);
  const average = count > 0 ? total / count : 0;
  const unit = entries.find((e) => e.harvest_unit)?.harvest_unit ?? 'units';
  return { count, total, average, unit };
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
 * in calendar order, for the yield chart.
 */
export function groupHarvestsBySeason(entries: JournalEntry[]): YieldBucket[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const season = getCurrentSeason(new Date(e.created_at));
    totals.set(season, (totals.get(season) ?? 0) + (e.harvest_quantity ?? 0));
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
 * without a `harvest_tree_number` are ignored.
 */
export function groupHarvestsByTree(entries: JournalEntry[]): TreeYield[] {
  const map = new Map<number, { total: number; count: number }>();
  for (const e of entries) {
    if (e.harvest_tree_number == null) continue;
    const cur = map.get(e.harvest_tree_number) ?? { total: 0, count: 0 };
    cur.total += e.harvest_quantity ?? 0;
    cur.count += 1;
    map.set(e.harvest_tree_number, cur);
  }
  return [...map.entries()]
    .map(([treeNumber, v]) => ({ treeNumber, total: v.total, count: v.count }))
    .sort((a, b) => a.treeNumber - b.treeNumber);
}
