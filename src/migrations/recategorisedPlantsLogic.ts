import { CATEGORY_OPTIONS } from '@/utils/plantLabels';
import type { PlantProfiles, PlantType } from '@/types/database.types';

/**
 * Catalog entries whose category changed, and the category they moved to.
 *
 * Hibiscus, Ixora, Jasmine and Crossandra were each a row under both `flower`
 * and `shrub`, with separate care profiles that had already drifted apart —
 * Ixora carried a different Tamil name on each side. `flower` wins: those rows
 * came first, the reference images and `PLANT_NAME_ALIASES` targets already
 * resolve there, and every one of the four is grown for its blooms.
 *
 * Purslane, Amaranthus, Pasalai Keerai and Fenugreek moved for the other reason:
 * they are keerai that were filed under `vegetable` while every other keerai sat
 * in `spinach` — the category the UI now labels "Greens".
 *
 * Unlike `MERGED_PLANT_NAMES`, the name is unchanged here — it is the category
 * that moves, so this rewrites `plant_type` rather than `plant_variety`.
 */
export const RECATEGORISED_PLANTS: Record<string, { from: PlantType; to: PlantType }> = {
  Hibiscus: { from: 'shrub', to: 'flower' },
  Ixora: { from: 'shrub', to: 'flower' },
  Jasmine: { from: 'shrub', to: 'flower' },
  Crossandra: { from: 'shrub', to: 'flower' },
  Purslane: { from: 'vegetable', to: 'spinach' },
  Amaranthus: { from: 'vegetable', to: 'spinach' },
  'Pasalai Keerai': { from: 'vegetable', to: 'spinach' },
  Fenugreek: { from: 'vegetable', to: 'spinach' },
};

/** The category a garden plant should move to, or null if it needs no change. */
export function plannedTypeChange(
  plantVariety: string | null | undefined,
  plantType: string | null | undefined
): PlantType | null {
  if (!plantVariety || !plantType) return null;
  const move = RECATEGORISED_PLANTS[plantVariety.trim()];
  if (!move || move.from !== plantType) return null;
  return move.to;
}

/**
 * Moves stored catalog overrides onto the surviving category.
 *
 * When only the old category has an entry it is moved across with `plantType`
 * rewritten, preserving the user's edits. When both do, the surviving category
 * wins and the other is dropped — keeping it would leave an override for a
 * catalog row that no longer exists, and `getPlantNamesForType` would promote
 * that orphan to a "user-added" plant, re-creating the duplicate this migration
 * exists to remove. Returns null when nothing changed, so the caller can skip
 * the write.
 */
export function planProfileRecategorisation(profiles: PlantProfiles): PlantProfiles | null {
  let changed = false;
  const next = {} as PlantProfiles;

  for (const type of CATEGORY_OPTIONS.map((opt) => opt.value) as PlantType[]) {
    next[type] = { ...(profiles[type] ?? {}) };
  }

  for (const [name, { from, to }] of Object.entries(RECATEGORISED_PLANTS)) {
    const entry = next[from]?.[name];
    if (!entry) continue;

    // A tombstone on a category that no longer offers the plant means nothing;
    // drop it rather than hiding the row under its new category.
    if (!entry.isDeleted && !next[to]?.[name]) {
      next[to][name] = { ...entry, name, plantType: to };
    }
    delete next[from][name];
    changed = true;
  }

  return changed ? next : null;
}
