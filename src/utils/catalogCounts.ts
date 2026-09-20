import type { Plant } from '@/types/database.types';

/**
 * Signs the only thing the plant catalog reads out of the garden's plants:
 * which (type, variety) pairs exist, and how many of each.
 *
 * `getStoredPlants()` hands back a freshly allocated array once its cache TTL
 * lapses, and re-applying that to state rebuilds every browse entry — ~150
 * taxonomy and care-profile lookups — for data that did not actually change.
 * This signature is what lets the catalog hook tell the two apart. `Plant`
 * carries no `updated_at`, so there is no mutation stamp to hash instead.
 *
 * Mirrors the guards in `plantCountsByType`: a plant with no type or no variety
 * contributes to no count, so it must not move the signature either. Keys are
 * sorted, so two reads of the same garden in a different order sign the same.
 */
export function signPlantVarietyCounts(plants: readonly Plant[]): string {
  const counts = new Map<string, number>();

  for (const plant of plants) {
    const type = plant.plant_type;
    const variety = plant.plant_variety ?? '';
    if (!type || !variety) continue;
    const key = `${type}|${variety}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.keys()]
    .sort()
    .map((key) => `${key}=${counts.get(key)}`)
    .join(';');
}
