import type { PlantCatalog, PlantCatalogCategory, PlantType } from '@/types/database.types';
import type { PlantCatalogEntry } from './types';

const emptyCategory = (): PlantCatalogCategory => ({
  plants: [],
  varieties: {},
  tamilNames: {},
  descriptions: {},
});

/**
 * Fans the entry list back out into the four per-category parallel maps.
 *
 * Entry order is preserved verbatim: `plants` drives the A–Z browse sections,
 * the picker and `getItemLayout`, so a derivation that reordered them would
 * move the UI without touching a single row. Categories appear in the order
 * their first entry does, which is why `index.ts` concatenates the shards in
 * the order the old literal declared them.
 */
export function buildPlantCatalog(entries: readonly PlantCatalogEntry[]): PlantCatalog {
  const categories = {} as Record<PlantType, PlantCatalogCategory>;

  for (const entry of entries) {
    const category = (categories[entry.plantType] ??= emptyCategory());
    category.plants.push(entry.name);
    category.tamilNames![entry.name] = entry.tamilName;
    category.descriptions![entry.name] = entry.shortDescription;
    // Left absent, not empty: the old literal omitted the key entirely for
    // rows grown as a single unnamed type, and callers check for undefined.
    if (entry.varieties) category.varieties[entry.name] = [...entry.varieties];
  }

  return { categories };
}

/**
 * The per-category name list the care registry and the reference-image tooling
 * read. Despite the name it holds plant names, not variety names.
 */
export function buildVarietiesByType(
  entries: readonly PlantCatalogEntry[]
): Record<PlantType, string[]> {
  const byType = {} as Record<PlantType, string[]>;
  for (const entry of entries) (byType[entry.plantType] ??= []).push(entry.name);
  return byType;
}
