import type {
  JournalEntry,
  PestDiseaseRecord,
  GrowthStageHistoryEntry,
  TaskLog,
} from '@/types/database.types';
import { JournalEntryType } from '@/types/database.types';

export type PlantHistoryKind = 'journal' | 'pest_disease' | 'growth_stage' | 'task_log';

/**
 * A single entry in the merged, chronological plant history. This is a derived
 * view assembled from several stored sources — it is intentionally not part of
 * the persisted schema in `database.types.ts`.
 */
export type PlantHistoryItem =
  | { kind: 'journal'; id: string; date: string; entry: JournalEntry }
  | { kind: 'pest_disease'; id: string; date: string; record: PestDiseaseRecord }
  | { kind: 'growth_stage'; id: string; date: string; entry: GrowthStageHistoryEntry }
  | { kind: 'task_log'; id: string; date: string; log: TaskLog };

export type HistoryFilter = PlantHistoryKind | 'all';

function timeOf(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Merges the four plant-history sources into one list sorted newest-first.
 * Items with unparseable dates are pushed to the end. Ids are stable across
 * renders so they can be used as list keys.
 */
export function mergePlantHistory(
  journalEntries: JournalEntry[],
  pestRecords: PestDiseaseRecord[],
  stageHistory: GrowthStageHistoryEntry[],
  taskLogs: TaskLog[]
): PlantHistoryItem[] {
  const items: PlantHistoryItem[] = [];

  for (const entry of journalEntries) {
    items.push({ kind: 'journal', id: `journal-${entry.id}`, date: entry.created_at, entry });
  }

  pestRecords.forEach((record, index) => {
    const id = `pest-${record.id ?? `${record.name}-${record.occurredAt}-${index}`}`;
    items.push({ kind: 'pest_disease', id, date: record.occurredAt, record });
  });

  stageHistory.forEach((entry, index) => {
    items.push({
      kind: 'growth_stage',
      id: `stage-${entry.stage}-${entry.pinnedAt}-${index}`,
      date: entry.pinnedAt,
      entry,
    });
  });

  for (const log of taskLogs) {
    items.push({ kind: 'task_log', id: `task-${log.id}`, date: log.done_at, log });
  }

  return items.sort((a, b) => timeOf(b.date) - timeOf(a.date));
}

/**
 * Filters merged history items by kind; `'all'` returns the list unchanged.
 * The `'pest_disease'` filter also surfaces journal entries of type
 * pest_disease (the new home for pest logging) alongside legacy plant-doc
 * records, so both appear under the plant's "Pests & Disease" view.
 */
export function filterHistoryItems(
  items: PlantHistoryItem[],
  filter: HistoryFilter
): PlantHistoryItem[] {
  if (filter === 'all') return items;
  if (filter === 'pest_disease') {
    return items.filter(
      (item) =>
        item.kind === 'pest_disease' ||
        (item.kind === 'journal' && item.entry.entry_type === JournalEntryType.PestDisease)
    );
  }
  return items.filter((item) => item.kind === filter);
}
