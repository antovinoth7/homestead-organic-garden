import type { PlantType } from '@/types/database.types';

/**
 * Pure constants for migration 017: catalog rows that were the same crop as
 * another row become varieties of it.
 *
 * - Long Brinjal → Brinjal, French Beans → Beans, Red Banana → Banana and
 *   Yardlong Beans → Cowpea: one species each, listed twice.
 * - Dwarf, Tall, Hybrid and King Coconut → one Coconut row; the palm type is
 *   the variety.
 *
 * Carries its own maps, per the note on `MERGED_PLANT_NAMES`.
 */
export const MERGED_PLANT_NAMES_V17: Readonly<Record<string, string>> = {
  'Long Brinjal': 'Brinjal',
  'French Beans': 'Beans',
  'Red Banana': 'Banana',
  'Yardlong Beans': 'Cowpea',
  'Dwarf Coconut': 'Coconut',
  'Tall Coconut': 'Coconut',
  'Hybrid Coconut': 'Coconut',
  'King Coconut': 'Coconut',
};

/** The category each survivor belongs to. */
export const MERGED_SURVIVOR_TYPE_V17: Readonly<Record<string, PlantType>> = {
  Brinjal: 'vegetable',
  Beans: 'vegetable',
  Banana: 'fruit_tree',
  Cowpea: 'vegetable',
  Coconut: 'coconut_tree',
};

/**
 * The variety a retired row becomes: added to the survivor's list, and set on
 * a moved garden plant that has no variety of its own yet, so nothing about
 * what the farmer planted is lost in the move.
 */
export const MERGED_VARIETY_LABELS_V17: Readonly<Record<string, string>> = {
  'Long Brinjal': 'Long Brinjal',
  'French Beans': 'French Beans',
  'Red Banana': 'Red Banana',
  'Yardlong Beans': 'Yardlong Beans',
  'Dwarf Coconut': 'Dwarf',
  'Tall Coconut': 'Tall',
  'Hybrid Coconut': 'Hybrid',
  'King Coconut': 'King Coconut',
};

/**
 * The fields a moved garden plant gets, or null when it is not on a retired
 * name. Keeps a variety the farmer already set.
 */
export function plannedGardenPlantMerge(plant: {
  plant_variety?: string | null;
  variety?: string | null;
}): { plant_variety: string; plant_type: PlantType; variety?: string } | null {
  const from = plant.plant_variety?.trim();
  if (!from) return null;
  const to = MERGED_PLANT_NAMES_V17[from];
  if (!to) return null;
  const type = MERGED_SURVIVOR_TYPE_V17[to];
  if (!type) return null;
  const label = MERGED_VARIETY_LABELS_V17[from];
  return {
    plant_variety: to,
    plant_type: type,
    ...(!plant.variety?.trim() && label ? { variety: label } : {}),
  };
}
