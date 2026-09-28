import { Bed, JournalEntry, JournalEntryType, Plant } from '@/types/database.types';
import {
  entryMatchesLocation,
  entryMatchesPlot,
  isActiveProblem,
  journalTypeLabel,
  normalizeHarvestUnit,
} from '@/utils/journalEntryOptions';
import { getDateFilterStart, type JournalDateFilter } from '@/utils/journalStats';

/** Period labels shared by the caption above the stats, the sheet and the chips. */
export const JOURNAL_PERIOD_LABELS: Record<JournalDateFilter, string> = {
  all: 'All time',
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

export const JOURNAL_PERIODS: readonly JournalDateFilter[] = ['all', 'week', 'month', 'year'];

/** Everything the journal list can be narrowed by. */
export interface JournalFilters {
  query: string;
  period: JournalDateFilter;
  type: JournalEntryType | null;
  /** Open problems only — meaningful with type Pest/Disease. */
  openOnly: boolean;
  /** Plot (parent location) name. */
  plot: string | null;
  /** A single bed or plant, as a `journalLocationKey`. */
  location: string | null;
  tag: string | null;
}

export const EMPTY_JOURNAL_FILTERS: JournalFilters = {
  query: '',
  period: 'all',
  type: null,
  openOnly: false,
  plot: null,
  location: null,
  tag: null,
};

export interface JournalFilterContext {
  plantById: ReadonlyMap<string, Pick<Plant, 'id' | 'name' | 'location' | 'bed_id'>>;
  bedById: ReadonlyMap<string, Pick<Bed, 'id' | 'parent_location'>>;
  /** The card's place label, so search matches what the farmer sees. */
  placeLabel: (entry: JournalEntry) => string | null;
}

/** A filter section left out, so its chips can count what picking them would show. */
export type JournalFilterSkip = 'type' | 'plot' | 'tag';

/**
 * Entries passing every active filter, newest first. `skip` leaves one section
 * out — the filter sheet counts each chip against everything else.
 */
export function filterJournalEntries(
  entries: readonly JournalEntry[],
  filters: JournalFilters,
  context: JournalFilterContext,
  skip?: JournalFilterSkip,
  now: Date = new Date()
): JournalEntry[] {
  const query = filters.query.trim().toLowerCase();
  const start = getDateFilterStart(filters.period, now);
  const startMs = start ? start.getTime() : null;
  return entries
    .filter((entry) => {
      if (query) {
        const haystack = [context.placeLabel(entry), entry.content, entry.pest_name];
        if (!haystack.some((value) => value?.toLowerCase().includes(query))) return false;
      }
      if (skip !== 'type') {
        if (filters.type && entry.entry_type !== filters.type) return false;
        if (filters.openOnly && !isActiveProblem(entry)) return false;
      }
      if (
        skip !== 'plot' &&
        filters.plot &&
        !entryMatchesPlot(entry, filters.plot, context.plantById, context.bedById)
      ) {
        return false;
      }
      if (filters.location && !entryMatchesLocation(entry, filters.location, context.plantById)) {
        return false;
      }
      if (skip !== 'tag' && filters.tag && !(entry.tags ?? []).includes(filters.tag)) {
        return false;
      }
      if (startMs !== null && new Date(entry.created_at).getTime() < startMs) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/** Filters counted on the funnel badge. Search shows in the header, not the badge. */
export function countActiveJournalFilters(filters: JournalFilters): number {
  return (
    Number(filters.period !== 'all') +
    Number(!!filters.type) +
    Number(filters.openOnly) +
    Number(!!filters.plot) +
    Number(!!filters.location) +
    Number(!!filters.tag)
  );
}

/**
 * Label for the Entries stat tile. With no period row above the tiles, the
 * tile itself says which window its count covers: "Entries this week".
 */
export function journalEntriesTileLabel(period: JournalDateFilter): string {
  return period === 'all' ? 'Entries' : `Entries ${JOURNAL_PERIOD_LABELS[period].toLowerCase()}`;
}

/** Empty-state subtext naming why nothing matched. */
export function journalEmptySubtext(filters: JournalFilters): string {
  if (filters.query.trim()) return `No results for "${filters.query.trim()}"`;
  if (filters.openOnly) return 'No open problems — nothing needs follow-up';
  if (filters.period !== 'all') {
    return `No entries ${JOURNAL_PERIOD_LABELS[filters.period].toLowerCase()}`;
  }
  if (filters.type) return `No ${journalTypeLabel(filters.type)} entries found`;
  return 'Try adjusting your filters';
}

/**
 * Toast text after the form saves: "Harvest saved: 120 pcs, Coconut grove",
 * "Aphids logged on Bed 1", "Milestone saved", "Entry updated".
 */
export function journalSaveMessage(
  entry: Pick<
    JournalEntry,
    'entry_type' | 'harvest_quantity' | 'harvest_unit' | 'pest_name' | 'pest_kind'
  >,
  placeName: string | null,
  isEdit: boolean
): string {
  if (isEdit) return 'Entry updated';
  switch (entry.entry_type) {
    case JournalEntryType.Harvest: {
      const amount = entry.harvest_quantity
        ? `: ${entry.harvest_quantity} ${normalizeHarvestUnit(entry.harvest_unit)}`
        : '';
      return `Harvest saved${amount}${placeName ? `, ${placeName}` : ''}`;
    }
    case JournalEntryType.PestDisease: {
      const name = entry.pest_name?.trim() || (entry.pest_kind === 'disease' ? 'Disease' : 'Pest');
      return `${name} logged${placeName ? ` on ${placeName}` : ''}`;
    }
    case JournalEntryType.Milestone:
      return 'Milestone saved';
    case JournalEntryType.Observation:
      return 'Observation saved';
    default:
      return 'Entry saved';
  }
}
