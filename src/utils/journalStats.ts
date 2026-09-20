import { JournalEntry, JournalEntryType } from '../types/database.types';
import { harvestWeightKg, isActiveProblem } from './journalEntryOptions';

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
  /** Harvest entries within the window. */
  harvests: number;
  /** Kilograms harvested within the window (weight units only). */
  weightKg: number;
  /** Unresolved pest/disease entries — a current-state count, ignores the window. */
  activeProblems: number;
}

/**
 * Journal summary tiles. Entries/harvests/weight are scoped to `filterStart`
 * (null = all time); activeProblems always reflects all entries so the count
 * of open issues doesn't shrink just because an older date filter is applied.
 */
export function computeJournalStats(
  allEntries: JournalEntry[],
  filterStart: Date | null
): JournalStats {
  const startMs = filterStart ? filterStart.getTime() : null;
  const inWindow = (entry: JournalEntry): boolean =>
    startMs === null || new Date(entry.created_at).getTime() >= startMs;

  let entries = 0;
  let harvests = 0;
  let weightKg = 0;
  let activeProblems = 0;

  for (const entry of allEntries) {
    if (isActiveProblem(entry)) activeProblems++;
    if (!inWindow(entry)) continue;
    entries++;
    if (entry.entry_type === JournalEntryType.Harvest) {
      harvests++;
      const kg = harvestWeightKg(entry.harvest_quantity, entry.harvest_unit);
      if (kg !== null) weightKg += kg;
    }
  }

  return {
    entries,
    harvests,
    weightKg: Math.round(weightKg * 10) / 10,
    activeProblems,
  };
}
