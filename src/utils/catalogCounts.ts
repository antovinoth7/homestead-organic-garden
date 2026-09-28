import type { Plant, PlantType } from '@/types/database.types';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import { isPlantArchived } from '@/utils/plantHelpers';

const PLANT_TYPES: readonly PlantType[] = [
  'vegetable',
  'herb',
  'flower',
  'fruit_tree',
  'timber_tree',
  'coconut_tree',
  'shrub',
  'spinach',
];

/**
 * "Growing in your garden" per catalog plant, keyed by the catalog's own name.
 *
 * Two rules the old exact-name tally missed:
 * - archived plants (a bed cleared after its last harvest) are not growing, so
 *   they no longer count;
 * - a plant saved under an alias counts toward its catalog row — plants saved
 *   as "Pepper" before the rename are Capsicum, and read 0 there otherwise.
 */
export function countGardenPlantsByCatalogName(
  plants: readonly Plant[],
  catalogNamesByType: Readonly<Partial<Record<PlantType, readonly string[]>>>
): Record<PlantType, Record<string, number>> {
  const byCanonical = new Map<string, number>();
  for (const plant of plants) {
    const type = plant.plant_type;
    const key = getCanonicalPlantKey(plant.plant_variety);
    if (!type || !key || isPlantArchived(plant)) continue;
    const k = `${type}|${key}`;
    byCanonical.set(k, (byCanonical.get(k) ?? 0) + 1);
  }

  const counts = {} as Record<PlantType, Record<string, number>>;
  for (const type of PLANT_TYPES) {
    counts[type] = {};
    for (const name of catalogNamesByType[type] ?? []) {
      const n = byCanonical.get(`${type}|${getCanonicalPlantKey(name)}`);
      if (n) counts[type][name] = n;
    }
  }
  return counts;
}

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
 * Mirrors the guards in `countGardenPlantsByCatalogName`: a plant with no type,
 * no variety, or archived contributes to no count, so it must not move the
 * signature either. Keys are
 * sorted, so two reads of the same garden in a different order sign the same.
 */
export function signPlantVarietyCounts(plants: readonly Plant[]): string {
  const counts = new Map<string, number>();

  for (const plant of plants) {
    const type = plant.plant_type;
    const variety = plant.plant_variety ?? '';
    // Archiving changes the count, so it must change the signature too.
    if (!type || !variety || isPlantArchived(plant)) continue;
    const key = `${type}|${variety}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.keys()]
    .sort()
    .map((key) => `${key}=${counts.get(key)}`)
    .join(';');
}
