import { mergePlantHistory, filterHistoryItems } from '@/utils/plantHistory';
import {
  JournalEntryType,
  type PestDiseaseRecord,
  type GrowthStageHistoryEntry,
} from '@/types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';
import { makeTaskLog } from '../fixtures/task.fixtures';

const pest = (overrides: Partial<PestDiseaseRecord> = {}): PestDiseaseRecord => ({
  type: 'pest',
  name: 'Aphids',
  occurredAt: '2026-01-01T00:00:00.000Z',
  resolved: false,
  ...overrides,
});

const stage = (overrides: Partial<GrowthStageHistoryEntry> = {}): GrowthStageHistoryEntry => ({
  stage: 'flowering',
  pinnedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('mergePlantHistory', () => {
  it('returns an empty list when all sources are empty', () => {
    expect(mergePlantHistory([], [], [], [])).toEqual([]);
  });

  it('merges all four sources sorted newest-first', () => {
    const items = mergePlantHistory(
      [makeJournalEntry({ id: 'j1', created_at: '2026-03-01T00:00:00.000Z' })],
      [pest({ id: 'p1', occurredAt: '2026-02-01T00:00:00.000Z' })],
      [stage({ stage: 'seedling', pinnedAt: '2026-04-01T00:00:00.000Z' })],
      [makeTaskLog({ id: 't1', done_at: '2026-01-01T00:00:00.000Z' })]
    );

    expect(items.map((i) => i.kind)).toEqual([
      'growth_stage',
      'journal',
      'pest_disease',
      'task_log',
    ]);
  });

  it('assigns stable, unique ids per source', () => {
    const items = mergePlantHistory(
      [makeJournalEntry({ id: 'j1' })],
      [pest({ id: 'p1' })],
      [stage()],
      [makeTaskLog({ id: 't1' })]
    );
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('journal-j1');
    expect(ids).toContain('pest-p1');
    expect(ids).toContain('task-t1');
  });

  it('derives a stable pest id when the record has no id', () => {
    const items = mergePlantHistory(
      [],
      [pest({ id: undefined, name: 'Mites', occurredAt: '2026-01-02T00:00:00.000Z' })],
      [],
      []
    );
    expect(items[0]?.id).toBe('pest-Mites-2026-01-02T00:00:00.000Z-0');
  });

  it('sorts items with invalid dates to the end', () => {
    const items = mergePlantHistory(
      [
        makeJournalEntry({ id: 'valid', created_at: '2026-01-01T00:00:00.000Z' }),
        makeJournalEntry({ id: 'invalid', created_at: 'not-a-date' }),
      ],
      [],
      [],
      []
    );
    expect(items.at(-1)?.id).toBe('journal-invalid');
  });
});

describe('filterHistoryItems', () => {
  const items = mergePlantHistory(
    [makeJournalEntry({ id: 'j1' })],
    [pest({ id: 'p1' })],
    [stage()],
    [makeTaskLog({ id: 't1' })]
  );

  it('returns everything for the "all" filter', () => {
    expect(filterHistoryItems(items, 'all')).toHaveLength(4);
  });

  it('filters to a single kind', () => {
    const pests = filterHistoryItems(items, 'pest_disease');
    expect(pests).toHaveLength(1);
    expect(pests[0]?.kind).toBe('pest_disease');
  });

  it('includes journal pest_disease entries under the pest_disease filter', () => {
    const withJournalPest = mergePlantHistory(
      [
        makeJournalEntry({ id: 'obs', entry_type: JournalEntryType.Observation }),
        makeJournalEntry({ id: 'jpest', entry_type: JournalEntryType.PestDisease }),
      ],
      [pest({ id: 'p1' })],
      [],
      []
    );
    const pests = filterHistoryItems(withJournalPest, 'pest_disease');
    expect(pests).toHaveLength(2);
    expect(pests.map((i) => i.id).sort()).toEqual(['journal-jpest', 'pest-p1']);
  });

  it('still shows journal pest entries under the plain journal filter', () => {
    const withJournalPest = mergePlantHistory(
      [makeJournalEntry({ id: 'jpest', entry_type: JournalEntryType.PestDisease })],
      [],
      [],
      []
    );
    // The journal filter still shows all journal entries, pest ones included.
    expect(filterHistoryItems(withJournalPest, 'journal')).toHaveLength(1);
  });

  it('includes both harvest journal entries and harvest task logs under the harvest filter', () => {
    const withHarvests = mergePlantHistory(
      [
        makeJournalEntry({ id: 'obs', entry_type: JournalEntryType.Observation }),
        makeJournalEntry({ id: 'jharvest', entry_type: JournalEntryType.Harvest }),
      ],
      [],
      [],
      [
        makeTaskLog({ id: 'tharvest', task_type: 'harvest' }),
        makeTaskLog({ id: 'tleaves', task_type: 'harvest_leaves' }),
        makeTaskLog({ id: 'twater', task_type: 'water' }),
      ]
    );
    const harvests = filterHistoryItems(withHarvests, 'harvest');
    expect(harvests.map((i) => i.id).sort()).toEqual([
      'journal-jharvest',
      'task-tharvest',
      'task-tleaves',
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterHistoryItems([], 'journal')).toEqual([]);
  });
});
