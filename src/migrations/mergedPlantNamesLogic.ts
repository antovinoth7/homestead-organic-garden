import { CATEGORY_OPTIONS } from '@/utils/plantLabels';
import type { PlantProfiles, PlantType } from '@/types/database.types';

/**
 * Catalog entries that were two names for one crop, and the name that survived.
 *
 * The kept name is the one the rest of the config already referenced — pest and
 * disease `plantsAffected` lists, the Tamil Nadu planting calendar, guild
 * templates and `REQUIRED_LOCAL_PLANTS` — so nothing outside the catalog had to
 * move. Both halves stay resolvable through `PLANT_NAME_ALIASES`.
 */
export const MERGED_PLANT_NAMES: Record<string, string> = {
  Methi: 'Fenugreek',
  Eggplant: 'Brinjal',
  Moringa: 'Drumstick',
  Colocasia: 'Taro',
};

/** The removed name a garden plant is still on, or null if it needs no change. */
export function plannedVarietyRename(plantVariety: string | null | undefined): string | null {
  if (!plantVariety) return null;
  return MERGED_PLANT_NAMES[plantVariety.trim()] ?? null;
}

/**
 * Rewrites stored catalog overrides off the removed names.
 *
 * When only the removed name has an entry it is moved across, preserving the
 * user's edits. When both do, the surviving name wins and the other is dropped
 * — keeping it would leave an override for a catalog entry that no longer
 * exists. Returns null when nothing needed to change, so the caller can skip
 * the write.
 */
export function planProfileMerge(profiles: PlantProfiles): PlantProfiles | null {
  let changed = false;
  const next = {} as PlantProfiles;

  for (const type of CATEGORY_OPTIONS.map((opt) => opt.value) as PlantType[]) {
    const byName = { ...(profiles[type] ?? {}) };

    for (const [removed, kept] of Object.entries(MERGED_PLANT_NAMES)) {
      const entry = byName[removed];
      if (!entry) continue;

      // A tombstone on a name that no longer exists means nothing; drop it.
      if (!entry.isDeleted && !byName[kept]) {
        byName[kept] = { ...entry, name: kept, plantType: type };
      }
      delete byName[removed];
      changed = true;
    }

    next[type] = byName;
  }

  return changed ? next : null;
}
