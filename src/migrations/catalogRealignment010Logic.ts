import type { PlantType } from '@/types/database.types';
import type { PlantTypeMove } from './recategorisedPlantsLogic';

/**
 * Migration 010's maps, as data.
 *
 * Separate from 009's `MERGED_PLANT_NAMES_V9` / `RECATEGORISED_PLANTS_V9` for
 * the reason that file records: an account already at schema v9 never runs 009
 * again, so anything appended to its maps would silently never reach it. Every
 * catalog pass carries its own.
 */

/**
 * Duplicate rows the catalog dropped, and the row that survived.
 *
 * `Ash Plantain` and `Banana` were two rows for one plant. The giveaway was the
 * dropped row's own Tamil name — நேந்திரம் வாழை is Nendran, which was already
 * listed as a variety of `Banana`, whose variety list also carries the cooking
 * cultivar Monthan. `Banana` wins: it is the row the pest and disease
 * `plantsAffected` lists, the planting calendar and the guild templates already
 * reference, so nothing outside the catalog had to move.
 */
export const MERGED_PLANT_NAMES_V10: Record<string, string> = {
  'Ash Plantain': 'Banana',
};

/**
 * The category the surviving row actually lives under.
 *
 * This merge crosses categories — `Ash Plantain` sat under `vegetable` while
 * `Banana` is a `fruit_tree` — so unlike 009's pairs the rename cannot leave
 * `plant_type` alone. Without this, a merged plant would keep `vegetable` and
 * `getPlantNamesForType` would promote the stray override to a "user-added"
 * plant, re-creating the duplicate this migration exists to remove.
 */
export const MERGED_SURVIVOR_TYPE_V10: Record<string, PlantType> = {
  Banana: 'fruit_tree',
};

/**
 * Rows that moved category, applying the same rule as 008 and 009: a plant is
 * filed by what is harvested off it, not by its growth habit.
 *
 * Castor is grown for its leaves and its seed cake, both used medicinally and
 * as a pest input, so it belongs with the other Tamil Nadu homestead medicinals
 * under `herb` — the same reasoning that moved Maruthani and Nochi there in
 * migration 009. That leaves `shrub` holding only Bougainvillea, the one row
 * where the plant itself really is the point.
 */
export const RECATEGORISED_PLANTS_V10: Record<string, PlantTypeMove> = {
  Castor: { from: 'shrub', to: 'herb' },
};
