import { Plant, PlantEntry } from '@/types/database.types';

/**
 * Convert a persisted Plant doc into a wizard PlantEntry that is already linked
 * to its bed. Used to prefill the bed wizard's plant steps when editing.
 *
 * One entry per Plant doc — a `record_kind: 'row'` doc stays a single entry, and
 * its `plant_count` is preserved on save because the 'link' resolution path uses
 * a partial `updatePlant` that never touches `record_kind` / `plant_count`.
 */
export function plantToEntry(plant: Plant): PlantEntry {
  return {
    id: plant.id,
    name: plant.plant_variety ?? plant.name,
    layer: plant.bed_layer ?? 'understory',
    spacingCm: plant.spacing_cm ?? 30,
    sortOrder: plant.sort_order ?? 0,
    resolution: { kind: 'link', plantId: plant.id },
  };
}

/**
 * Expand a persisted Plant doc into one PlantEntry per physical plant, for
 * layout recomputation only. A `record_kind: 'row'` doc holding `plant_count`
 * plants yields that many entries (suffixed ids keep them unique) so the
 * recomputed layout shows every plant in the row, matching what the wizard
 * preview showed at save time. NOT for edit prefill — the wizard's link/save
 * contract needs exactly one entry per doc (see `plantToEntry`).
 */
export function plantToLayoutEntries(plant: Plant): PlantEntry[] {
  const base = plantToEntry(plant);
  const count =
    plant.record_kind === 'row' ? Math.max(1, Math.round(plant.plant_count ?? 1)) : 1;
  if (count === 1) return [base];
  return Array.from({ length: count }, (_, i) => ({ ...base, id: `${base.id}-${i}` }));
}

/**
 * Given the plants originally on a bed and the wizard's current plant entries,
 * return the original plants that are no longer linked — i.e. the user removed
 * them, so they should be soft-deleted on save. Kept link entries and freshly
 * added entries (placeholder/create) never appear here. In create mode the
 * original list is empty, so this is a safe no-op.
 */
export function computeRemovedPlants(originalPlants: Plant[], entries: PlantEntry[]): Plant[] {
  const linkedIds = new Set<string>();
  for (const entry of entries) {
    if (entry.resolution?.kind === 'link') linkedIds.add(entry.resolution.plantId);
  }
  return originalPlants.filter((plant) => !linkedIds.has(plant.id));
}
