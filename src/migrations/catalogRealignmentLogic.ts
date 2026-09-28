import { CATEGORY_OPTIONS } from '@/utils/plantLabels';
import type { PlantProfiles, PlantType } from '@/types/database.types';
import type { PlantTypeMove } from './recategorisedPlantsLogic';

/**
 * The second half of the Tamil Nadu catalog pass, as data.
 *
 * Migration 008 moved eight rows and left two jobs undone, both of which this
 * migration finishes. These maps are separate from 007's `MERGED_PLANT_NAMES`
 * and 008's `RECATEGORISED_PLANTS` rather than appended to them: an account
 * already at schema v8 never runs those migrations again, so anything added to
 * their maps would silently never reach it.
 */

/**
 * Duplicate rows the catalog dropped, and the row that survived.
 *
 * Each pair is one plant that had two catalog entries. `Malabar Spinach` and
 * `Pasalai Keerai` are both Basella alba — the surviving row's own description
 * says "Malabar spinach". `Amaranth Greens` and `Amaranthus` are likewise one
 * plant; only their shared photo was ever wired up, so a user on the dropped
 * name kept a row that no longer existed and `plantTypeFromName` fell back to
 * `vegetable` for it.
 */
export const MERGED_PLANT_NAMES_V9: Record<string, string> = {
  'Malabar Spinach': 'Pasalai Keerai',
  'Amaranth Greens': 'Amaranthus',
};

/**
 * Rows that moved category, applying the rule the catalog states but had not
 * yet been held to: a plant is filed by what is harvested off it, not by its
 * growth habit.
 *
 * Nandiyavattai, Aavaram and Arali are cut for their flowers; Maruthani and
 * Nochi for their leaves; Agathi is agathi keerai. That is the same reasoning
 * that moved Hibiscus, Ixora, Jasmine and Crossandra out of `shrub` in
 * migration 008 — it simply was not applied to the rows added alongside them.
 */
export const RECATEGORISED_PLANTS_V9: Record<string, PlantTypeMove> = {
  Nandiyavattai: { from: 'shrub', to: 'flower' },
  Aavaram: { from: 'shrub', to: 'flower' },
  Arali: { from: 'shrub', to: 'flower' },
  Maruthani: { from: 'shrub', to: 'herb' },
  Nochi: { from: 'shrub', to: 'herb' },
  Agathi: { from: 'shrub', to: 'spinach' },
};

/**
 * The category each surviving row actually lives under.
 *
 * `planProfileMerge` renames an override in place — it moves `Malabar Spinach`
 * to `Pasalai Keerai` under whatever category it was stored on. That is right
 * for the ordinary case, where the dropped row and its survivor shared a
 * category. It is wrong for a user who added their own `Malabar Spinach` under
 * some other category: the merge would leave a `Pasalai Keerai` override on a
 * category the catalog does not offer it under, `getPlantNamesForType` would
 * promote it to a "user-added" plant, and the duplicate this migration exists
 * to remove would come straight back under a new name.
 */
export const MERGED_SURVIVOR_TYPE: Record<string, PlantType> = {
  'Pasalai Keerai': 'spinach',
  Amaranthus: 'spinach',
};

/**
 * Pulls a surviving row off any category but its own, after the merge has run.
 * Returns null when nothing moved, so the caller can skip the write.
 *
 * `survivorTypes` is passed in for the same reason `planProfileMerge` takes its
 * map: `MERGED_SURVIVOR_TYPE` belongs to migration 009 and must stay frozen, so
 * a later pass carries its own (see migration 010).
 */
export function planSurvivorRelocation(
  profiles: PlantProfiles,
  survivorTypes: Record<string, PlantType>
): PlantProfiles | null {
  let changed = false;
  const next = {} as PlantProfiles;

  for (const type of CATEGORY_OPTIONS.map((opt) => opt.value) as PlantType[]) {
    next[type] = { ...(profiles[type] ?? {}) };
  }

  for (const [name, home] of Object.entries(survivorTypes)) {
    for (const type of Object.keys(next) as PlantType[]) {
      if (type === home) continue;
      const entry = next[type]?.[name];
      if (!entry) continue;

      // Same rule as the merge itself: the row that is really there wins, and
      // a tombstone on a category that never offered the plant means nothing.
      if (!entry.isDeleted && !next[home]?.[name]) {
        next[home][name] = { ...entry, name, plantType: home };
      }
      delete next[type][name];
      changed = true;
    }
  }

  return changed ? next : null;
}
