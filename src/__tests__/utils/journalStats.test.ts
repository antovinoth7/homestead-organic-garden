import { computeJournalStats, getDateFilterStart } from '../../utils/journalStats';
import { JournalEntry, JournalEntryType } from '../../types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';

describe('getDateFilterStart', () => {
  const now = new Date('2026-07-18T12:00:00.000Z');

  it('returns null for all-time', () => {
    expect(getDateFilterStart('all', now)).toBeNull();
  });

  it('returns 7 days back for week', () => {
    const start = getDateFilterStart('week', now)!;
    expect(start.getDate()).toBe(11);
  });

  it('returns first of month for month', () => {
    const start = getDateFilterStart('month', now)!;
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6); // July
    expect(start.getDate()).toBe(1);
  });

  it('returns first of year for year', () => {
    const start = getDateFilterStart('year', now)!;
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
  });
});

describe('computeJournalStats', () => {
  const harvest = (quantity: number, unit: string, createdAt: string): JournalEntry =>
    makeJournalEntry({
      entry_type: JournalEntryType.Harvest,
      harvest_quantity: quantity,
      harvest_unit: unit,
      created_at: createdAt,
    });

  it('sums only weight units into kg, ignoring pcs/bunches/pieces', () => {
    const entries = [
      harvest(2, 'kg', '2026-07-10T00:00:00.000Z'),
      harvest(500, 'g', '2026-07-10T00:00:00.000Z'), // 0.5 kg
      harvest(10, 'pcs', '2026-07-10T00:00:00.000Z'), // ignored
      harvest(3, 'bunches', '2026-07-10T00:00:00.000Z'), // ignored
      harvest(4, 'pieces', '2026-07-10T00:00:00.000Z'), // legacy count, ignored
    ];
    const stats = computeJournalStats(entries, null);
    expect(stats.weightKg).toBe(2.5);
    expect(stats.harvests).toBe(5);
  });

  it('converts legacy lbs into kg', () => {
    const stats = computeJournalStats([harvest(1, 'lbs', '2026-07-10T00:00:00.000Z')], null);
    expect(stats.weightKg).toBeCloseTo(0.5, 1);
  });

  it('scopes entries/harvests/weight to the window but not active problems', () => {
    const entries = [
      harvest(5, 'kg', '2026-07-17T00:00:00.000Z'), // in week
      harvest(5, 'kg', '2026-01-01T00:00:00.000Z'), // out of week
      makeJournalEntry({
        entry_type: JournalEntryType.PestDisease,
        pest_status: 'active',
        created_at: '2026-01-01T00:00:00.000Z', // old but still active
      }),
    ];
    const start = getDateFilterStart('week', new Date('2026-07-18T12:00:00.000Z'));
    const stats = computeJournalStats(entries, start);
    expect(stats.entries).toBe(1);
    expect(stats.harvests).toBe(1);
    expect(stats.weightKg).toBe(5);
    expect(stats.activeProblems).toBe(1);
  });

  it('counts a pest entry with null status as active', () => {
    const stats = computeJournalStats(
      [
        makeJournalEntry({
          entry_type: JournalEntryType.PestDisease,
          pest_status: null,
        }),
      ],
      null
    );
    expect(stats.activeProblems).toBe(1);
  });

  it('does not count resolved pest entries as active', () => {
    const stats = computeJournalStats(
      [
        makeJournalEntry({
          entry_type: JournalEntryType.PestDisease,
          pest_status: 'resolved',
        }),
      ],
      null
    );
    expect(stats.activeProblems).toBe(0);
  });
});
