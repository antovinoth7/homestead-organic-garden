/**
 * Pure harvest aggregation helpers (no Firebase/RN imports — unit-testable).
 *
 * Harvest data is captured as `JournalEntryType.Harvest` journal entries
 * (`harvest_quantity` / `harvest_unit` / `created_at`), not a dedicated
 * collection. These helpers summarize and bucket those entries for the
 * `HarvestHistorySection` stats + `HarvestYieldChart`.
 */
import { JournalEntry } from '@/types/database.types';
import { getCurrentSeason } from '@/utils/seasonHelpers';

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
