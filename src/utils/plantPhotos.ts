import type { Plant, JournalEntry } from '@/types/database.types';

export type PlantPhotoSource = 'plant' | 'journal' | 'pest_disease';

/**
 * A single photo in a plant's aggregated timeline. `uri` is a displayable local
 * URI when already resolved (plant + journal photos), or `null` for photos that
 * are only known by `filename` (pest records) and must be resolved by the hook.
 */
export interface PlantPhotoItem {
  id: string;
  uri: string | null;
  filename?: string;
  date: string;
  source: PlantPhotoSource;
}

function timeOf(date: string): number {
  const t = new Date(date).getTime();
  return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Collects every photo associated with a plant — its own photo, photos attached
 * to its journal entries, and pest/disease record photos — into one list sorted
 * newest-first, de-duplicated by resolved URI (or filename when unresolved).
 * Pest photos carry only a `filename`; the caller resolves them to URIs.
 */
export function collectPlantPhotos(
  plant: Plant | null,
  journalEntries: JournalEntry[]
): PlantPhotoItem[] {
  if (!plant) return [];

  const items: PlantPhotoItem[] = [];

  if (plant.photo_url) {
    items.push({
      id: `plant-${plant.id}`,
      uri: plant.photo_url,
      filename: plant.photo_filename ?? undefined,
      date: plant.planting_date ?? plant.created_at,
      source: 'plant',
    });
  }

  for (const entry of journalEntries) {
    entry.photo_urls.forEach((uri, index) => {
      if (!uri) return;
      items.push({
        id: `journal-${entry.id}-${index}`,
        uri,
        filename: entry.photo_filenames?.[index],
        date: entry.created_at,
        source: 'journal',
      });
    });
  }

  (plant.pest_disease_history ?? []).forEach((record, index) => {
    if (!record.photo_filename) return;
    items.push({
      id: `pest-${record.id ?? index}`,
      uri: null,
      filename: record.photo_filename,
      date: record.occurredAt,
      source: 'pest_disease',
    });
  });

  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    const key = item.uri ?? item.filename ?? item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => timeOf(b.date) - timeOf(a.date));
}
