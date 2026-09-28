import type { PlantType } from '@/types/database.types';

/**
 * Pure constants for migration 014, the Palmyra → Palm Tree rename.
 *
 * Carries its own map, per the note on `MERGED_PLANT_NAMES`: an account already
 * past schema v13 never runs 013 again, so this pass declares what it renames.
 */
export const RENAMED_PLANT_NAMES_V14: Readonly<Record<string, string>> = {
  Palmyra: 'Palm Tree',
};

/** The category each survivor belongs to, since a rename may cross one. */
export const MERGED_SURVIVOR_TYPE_V14: Readonly<Record<string, PlantType>> = {
  'Palm Tree': 'fruit_tree',
};
