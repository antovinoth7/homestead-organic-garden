import { buildJournalRows, journalDayBucket } from '@/utils/journalSections';
import { makeJournalEntry } from '../fixtures/journal.fixtures';

// Local-time constructors so the buckets don't depend on the machine's zone.
const now = new Date(2026, 8, 27, 10, 0); // 27 Sep 2026, 10:00
const at = (y: number, m: number, d: number, h = 9): string =>
  new Date(y, m, d, h).toISOString();

describe('journalDayBucket', () => {
  it('names today and yesterday by calendar day, not 24h windows', () => {
    expect(journalDayBucket(at(2026, 8, 27, 0), now)).toBe('Today');
    expect(journalDayBucket(at(2026, 8, 26, 23), now)).toBe('Yesterday');
  });

  it('groups the rest of the rolling week', () => {
    expect(journalDayBucket(at(2026, 8, 25), now)).toBe('Earlier this week');
    expect(journalDayBucket(at(2026, 8, 21), now)).toBe('Earlier this week');
  });

  it('falls back to month and year', () => {
    expect(journalDayBucket(at(2026, 8, 20), now)).toBe('September 2026');
    expect(journalDayBucket(at(2025, 11, 31), now)).toBe('December 2025');
  });

  it('treats a future timestamp as today and an invalid one as undated', () => {
    expect(journalDayBucket(at(2026, 8, 28), now)).toBe('Today');
    expect(journalDayBucket('not a date', now)).toBe('Undated');
  });
});

describe('buildJournalRows', () => {
  it('returns no rows for no entries', () => {
    expect(buildJournalRows([], now)).toEqual([]);
  });

  it('inserts one heading per run and preserves entry order', () => {
    const entries = [
      makeJournalEntry({ id: 'a', created_at: at(2026, 8, 27) }),
      makeJournalEntry({ id: 'b', created_at: at(2026, 8, 27, 7) }),
      makeJournalEntry({ id: 'c', created_at: at(2026, 8, 26) }),
      makeJournalEntry({ id: 'd', created_at: at(2026, 7, 3) }),
    ];
    const rows = buildJournalRows(entries, now);
    expect(rows.map((r) => (r.kind === 'header' ? `# ${r.title}` : r.entry.id))).toEqual([
      '# Today',
      'a',
      'b',
      '# Yesterday',
      'c',
      '# August 2026',
      'd',
    ]);
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
  });
});
