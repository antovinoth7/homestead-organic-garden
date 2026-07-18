/**
 * Flattened, cross-category plant list for the add-plant picker sheet.
 *
 * The picker inverts the old category-first flow: the user picks a plant and
 * the category (plantType) is derived from the selected item. Season badges
 * are derived from profile data since there is no first-class per-plant
 * season field for every entry.
 */

import { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';
import { PLANT_CATEGORIES, getPlantNamesForType, getProfileEntry } from '@/services/plantProfiles';
import { mapSeasonTextToIds, KKSeasonId } from '@/utils/plantingNow';

export interface PlantPickerItem {
  plantType: PlantType;
  name: string;
  /** Badge text, or null when no season data exists for the plant. */
  seasonLabel: string | null;
  hasVarieties: boolean;
}

const ALL_SEASON_COUNT = 4;

/**
 * Derive a plant-level season badge. Plant-level `growingSeason` wins; else
 * the union of variety `seasonSuitability` phrases is collapsed: one distinct
 * phrase is shown as-is, full-year coverage becomes "Year Round", and mixed
 * partial coverage becomes "Multi-season". No data → null (badge omitted).
 */
export function derivePlantSeasonLabel(profile: PlantProfile): string | null {
  const growingSeason = profile.growingSeason?.trim();
  if (growingSeason) return growingSeason;

  const phrases = new Set<string>();
  for (const detail of Object.values(profile.varietyDetails ?? {})) {
    for (const phrase of detail.seasonSuitability ?? []) {
      const trimmed = phrase.trim();
      if (trimmed) phrases.add(trimmed);
    }
  }
  if (phrases.size === 0) return null;

  const seasonIds = new Set<KKSeasonId>();
  for (const phrase of phrases) {
    for (const id of mapSeasonTextToIds(phrase)) seasonIds.add(id);
  }
  if (seasonIds.size === ALL_SEASON_COUNT) return 'Year Round';
  if (phrases.size === 1) return [...phrases][0] ?? null;
  return 'Multi-season';
}

/**
 * Flatten all profiles into picker items, preserving category display order
 * and the default/user merge behavior of the per-category dropdowns.
 */
export function buildPlantPickerItems(profiles: PlantProfiles): PlantPickerItem[] {
  const items: PlantPickerItem[] = [];
  for (const plantType of PLANT_CATEGORIES) {
    for (const name of getPlantNamesForType(profiles, plantType)) {
      const profile = getProfileEntry(profiles, plantType, name);
      items.push({
        plantType,
        name,
        seasonLabel: profile ? derivePlantSeasonLabel(profile) : null,
        hasVarieties: (profile?.varieties?.length ?? 0) > 0,
      });
    }
  }
  return items;
}
