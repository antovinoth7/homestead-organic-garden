import { JournalEntry } from '../types/database.types';

/**
 * Day headings for the Journal list.
 *
 * The list stays a flat FlatList (scroll-to-top, tab-bar scroll hiding and the
 * stats header all hang off it), so headings are interleaved as rows rather
 * than moving to a SectionList.
 */
export type JournalRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'entry'; key: string; entry: JournalEntry };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole calendar days from `date` back to `now` (0 = same day), in local time. */
function daysAgo(date: Date, now: Date): number {
  const startOf = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(now) - startOf(date)) / MS_PER_DAY);
}

/**
 * Bucket title for one entry. "Earlier this week" is the rest of the rolling
 * 7 days — the same window as the "This Week" filter — and anything older is
 * grouped by month.
 */
export function journalDayBucket(createdAt: string, now: Date = new Date()): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Undated';
  const diff = daysAgo(date, now);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Earlier this week';
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/**
 * Interleave a heading before each run of entries that share a bucket.
 * Expects `entries` already sorted newest-first; order is preserved.
 */
export function buildJournalRows(entries: JournalEntry[], now: Date = new Date()): JournalRow[] {
  const rows: JournalRow[] = [];
  let current: string | null = null;
  for (const entry of entries) {
    const title = journalDayBucket(entry.created_at, now);
    if (title !== current) {
      rows.push({ kind: 'header', key: `header-${title}-${rows.length}`, title });
      current = title;
    }
    rows.push({ kind: 'entry', key: entry.id, entry });
  }
  return rows;
}
