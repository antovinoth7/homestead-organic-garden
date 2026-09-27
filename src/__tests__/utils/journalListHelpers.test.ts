import {
  EMPTY_JOURNAL_FILTERS,
  countActiveJournalFilters,
  filterJournalEntries,
  journalEntriesTileLabel,
  journalEmptySubtext,
  journalSaveMessage,
  type JournalFilters,
} from '@/utils/journalListHelpers';
import { JournalEntry, JournalEntryType } from '@/types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeBed } from '../fixtures/bed.fixtures';

const filters = (overrides: Partial<JournalFilters> = {}): JournalFilters => ({
  ...EMPTY_JOURNAL_FILTERS,
  ...overrides,
});

describe('countActiveJournalFilters', () => {
  it('counts nothing for the defaults, and ignores the search query', () => {
    expect(countActiveJournalFilters(filters())).toBe(0);
    expect(countActiveJournalFilters(filters({ query: 'neem' }))).toBe(0);
  });

  it('counts every narrowing filter once', () => {
    expect(
      countActiveJournalFilters(
        filters({
          period: 'month',
          type: JournalEntryType.PestDisease,
          openOnly: true,
          plot: 'Kitchen garden',
          location: 'bed:b1',
          tag: 'experiment',
        })
      )
    ).toBe(6);
  });
});

describe('journalEntriesTileLabel', () => {
  it('names the period only when it narrows the count', () => {
    expect(journalEntriesTileLabel('all')).toBe('Entries');
    expect(journalEntriesTileLabel('week')).toBe('Entries this week');
    expect(journalEntriesTileLabel('month')).toBe('Entries this month');
    expect(journalEntriesTileLabel('year')).toBe('Entries this year');
  });
});

describe('journalEmptySubtext', () => {
  it('explains the most specific reason first', () => {
    expect(journalEmptySubtext(filters({ query: 'okra', period: 'week' }))).toBe(
      'No results for "okra"'
    );
    expect(
      journalEmptySubtext(filters({ type: JournalEntryType.PestDisease, openOnly: true }))
    ).toBe('No open problems — nothing needs follow-up');
    expect(journalEmptySubtext(filters({ period: 'month' }))).toBe('No entries this month');
    expect(journalEmptySubtext(filters({ type: JournalEntryType.Milestone }))).toBe(
      'No Milestone entries found'
    );
    expect(journalEmptySubtext(filters({ tag: 'experiment' }))).toBe('Try adjusting your filters');
  });
});

describe('filterJournalEntries', () => {
  const now = new Date(2026, 8, 27, 9, 41);
  const pot = makePlant({ id: 'plum', name: 'Plum 01', location: 'Terrace - Rail', bed_id: null });
  const context = {
    plantById: new Map([[pot.id, pot]]),
    bedById: new Map([['bed-1', makeBed({ id: 'bed-1', parent_location: 'Kitchen garden' })]]),
    placeLabel: (entry: JournalEntry) =>
      entry.plant_id === 'plum' ? 'Plum 01' : entry.bed_id === 'bed-1' ? 'Bed 1' : null,
  };
  const entries = [
    makeJournalEntry({
      id: 'old-aphids',
      entry_type: JournalEntryType.PestDisease,
      pest_name: 'Aphids',
      pest_status: 'active',
      bed_id: 'bed-1',
      created_at: new Date(2026, 5, 1).toISOString(),
    }),
    makeJournalEntry({
      id: 'plum-note',
      content: 'Fruit set',
      plant_id: 'plum',
      tags: ['growth_update'],
      created_at: new Date(2026, 8, 26).toISOString(),
    }),
    makeJournalEntry({
      id: 'bed-harvest',
      entry_type: JournalEntryType.Harvest,
      content: '',
      bed_id: 'bed-1',
      created_at: new Date(2026, 8, 25).toISOString(),
    }),
  ];
  const ids = (list: JournalEntry[]): string[] => list.map((e) => e.id);

  it('returns everything newest first with no filters', () => {
    expect(ids(filterJournalEntries(entries, filters(), context, undefined, now))).toEqual([
      'plum-note',
      'bed-harvest',
      'old-aphids',
    ]);
  });

  it('searches the place label, notes and pest name', () => {
    const run = (query: string): string[] =>
      ids(filterJournalEntries(entries, filters({ query }), context, undefined, now));
    expect(run('plum')).toEqual(['plum-note']);
    expect(run('APHID')).toEqual(['old-aphids']);
    expect(run('bed 1')).toEqual(['bed-harvest', 'old-aphids']);
  });

  it('combines period, plot, type and open-only', () => {
    expect(
      ids(filterJournalEntries(entries, filters({ period: 'month' }), context, undefined, now))
    ).toEqual(['plum-note', 'bed-harvest']);
    expect(
      ids(
        filterJournalEntries(entries, filters({ plot: 'kitchen garden' }), context, undefined, now)
      )
    ).toEqual(['bed-harvest', 'old-aphids']);
    expect(
      ids(
        filterJournalEntries(
          entries,
          filters({ type: JournalEntryType.PestDisease, openOnly: true }),
          context,
          undefined,
          now
        )
      )
    ).toEqual(['old-aphids']);
  });

  it('leaves one section out for chip counts', () => {
    const narrowed = filters({ type: JournalEntryType.Harvest, tag: 'growth_update' });
    expect(filterJournalEntries(entries, narrowed, context, undefined, now)).toEqual([]);
    expect(ids(filterJournalEntries(entries, narrowed, context, 'type', now))).toEqual([
      'plum-note',
    ]);
    expect(ids(filterJournalEntries(entries, narrowed, context, 'tag', now))).toEqual([
      'bed-harvest',
    ]);
  });
});

describe('journalSaveMessage', () => {
  const harvest = {
    entry_type: JournalEntryType.Harvest,
    harvest_quantity: 120,
    harvest_unit: 'pcs',
  };

  it('reads back a harvest amount and place', () => {
    expect(journalSaveMessage(harvest, 'Coconut grove', false)).toBe(
      'Harvest saved: 120 pcs, Coconut grove'
    );
    expect(journalSaveMessage({ ...harvest, harvest_unit: 'pieces' }, null, false)).toBe(
      'Harvest saved: 120 pcs'
    );
  });

  it('names the pest and where it was logged', () => {
    expect(
      journalSaveMessage(
        { entry_type: JournalEntryType.PestDisease, pest_name: 'Aphids' },
        'Bed 1',
        false
      )
    ).toBe('Aphids logged on Bed 1');
    expect(
      journalSaveMessage(
        { entry_type: JournalEntryType.PestDisease, pest_name: ' ', pest_kind: 'disease' },
        null,
        false
      )
    ).toBe('Disease logged');
  });

  it('keeps other types short, and edits generic', () => {
    expect(journalSaveMessage({ entry_type: JournalEntryType.Milestone }, 'Bed 2', false)).toBe(
      'Milestone saved'
    );
    expect(journalSaveMessage({ entry_type: JournalEntryType.Observation }, null, false)).toBe(
      'Observation saved'
    );
    expect(journalSaveMessage(harvest, 'Coconut grove', true)).toBe('Entry updated');
  });
});
