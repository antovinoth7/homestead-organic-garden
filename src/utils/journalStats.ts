import { JournalEntry, JournalEntryType } from '../types/database.types';
import { isActiveProblem } from './journalEntryOptions';
import { summarizeHarvests, type HarvestBasis } from './harvestStats';

export type JournalDateFilter = 'all' | 'week' | 'month' | 'year';

/**
 * Start of the window a date filter selects, or null for 'all'. Week is a
 * rolling 7 days; month/year are calendar-to-date.
 */
export function getDateFilterStart(
  filter: JournalDateFilter,
  now: Date = new Date()
): Date | null {
  if (filter === 'all') return null;
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return start;
  }
  if (filter === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

export interface JournalStats {
  /** Entries within the selected window. */
  entries: number;
  /** Harvest entries within the window, whatever unit they were recorded in. */
  harvestCount: number;
  /** Amount harvested within the window, on `harvestUnit`'s basis. */
  harvestTotal: number;
  /** `'kg'` if any harvest in the window was weighed, else `'pcs'` (a count). */
  harvestUnit: HarvestBasis;
  /** Unresolved pest/disease entries — a current-state count, ignores the window. */
  activeProblems: number;
}

/**
 * Journal summary tiles. Entries and harvest figures are scoped to
 * `filterStart` (null = all time); activeProblems always reflects all entries
 * so the count of open issues doesn't shrink just because an older date filter
 * is applied.
 *
 * The harvest amount uses `summarizeHarvests`, the same basis rule as the
 * plant-detail harvest history: kg if anything was weighed, otherwise a count.
 * So a week of coconuts reads "40 pcs" rather than "0 kg". A window mixing
 * weighed and counted harvests shows the kg total only — the counted ones are
 * still in `harvestCount`.
 */
export function computeJournalStats(
  allEntries: JournalEntry[],
  filterStart: Date | null
): JournalStats {
  const startMs = filterStart ? filterStart.getTime() : null;
  const inWindow = (entry: JournalEntry): boolean =>
    startMs === null || new Date(entry.created_at).getTime() >= startMs;

  let entries = 0;
  let activeProblems = 0;
  const harvests: JournalEntry[] = [];

  for (const entry of allEntries) {
    if (isActiveProblem(entry)) activeProblems++;
    if (!inWindow(entry)) continue;
    entries++;
    if (entry.entry_type === JournalEntryType.Harvest) harvests.push(entry);
  }

  const harvest = summarizeHarvests(harvests);
  const harvestTotal =
    harvest.unit === 'kg' ? Math.round(harvest.total * 10) / 10 : Math.round(harvest.total);

  return {
    entries,
    harvestCount: harvest.count,
    harvestTotal,
    harvestUnit: harvest.unit,
    activeProblems,
  };
}
