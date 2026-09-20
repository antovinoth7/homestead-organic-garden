/**
 * Comprehensive plant care defaults database
 * Provides intelligent recommendations based on plant variety
 */

import { PlantType, PlantCareProfile, PlantCareProfiles } from '@/types/database.types';
import type { PlantingCandidate } from '@/utils/plantingNow';

import { PLANT_CARE_OVERRIDES } from './overrides';
import { buildProfileKey } from './profileKey';
import { DEFAULT_PROFILES_BY_TYPE } from './typeDefaults';
import { PLANT_VARIETIES_BY_TYPE } from './varieties';

const PLANT_CARE_PROFILES: Record<string, PlantCareProfile> = {};

Object.entries(PLANT_VARIETIES_BY_TYPE).forEach(([type, varieties]) => {
  const plantType = type as PlantType;
  const defaults = DEFAULT_PROFILES_BY_TYPE[plantType];
  varieties.forEach((variety) => {
    PLANT_CARE_PROFILES[buildProfileKey(plantType, variety)] = {
      ...defaults,
    };
  });
});

Object.assign(PLANT_CARE_PROFILES, PLANT_CARE_OVERRIDES);

const findProfileByVariety = (plantVariety: string): PlantCareProfile | null => {
  const key = Object.keys(PLANT_CARE_PROFILES).find((profileKey) =>
    profileKey.endsWith(`:${plantVariety}`)
  );
  return key ? (PLANT_CARE_PROFILES[key] ?? null) : null;
};

const applyOverrides = (
  base: PlantCareProfile,
  overrides?: Partial<PlantCareProfiles>,
  plantType?: PlantType,
  plantVariety?: string
): PlantCareProfile => {
  if (!plantType || !plantVariety || !overrides) {
    return base;
  }

  const override = overrides[plantType]?.[plantVariety];
  if (!override) return base;

  return {
    ...base,
    ...override,
  };
};

/**
 * Get care profile for a specific plant variety
 */
export function getPlantCareProfile(
  plantVariety: string,
  plantType?: PlantType,
  overrides?: Partial<PlantCareProfiles>
): PlantCareProfile | null {
  if (plantType) {
    const key = buildProfileKey(plantType, plantVariety);
    const base = PLANT_CARE_PROFILES[key] || DEFAULT_PROFILES_BY_TYPE[plantType] || null;
    return base ? applyOverrides(base, overrides, plantType, plantVariety) : null;
  }

  if (!plantVariety) return null;

  const base = findProfileByVariety(plantVariety);
  return base ? applyOverrides(base, overrides) : null;
}

/**
 * Enumerate every known variety with its growing season, for the dashboard
 * "What to Plant Now" section (Phase C, C.1). Structurally a `PlantingCandidate`.
 */
export function getPlantingCandidates(): PlantingCandidate[] {
  return Object.entries(PLANT_CARE_PROFILES).map(([key, profile]) => {
    const sep = key.indexOf(':');
    const plantType = key.slice(0, sep) as PlantType;
    const variety = key.slice(sep + 1);
    return {
      plantType,
      variety,
      growingSeason: profile.growingSeason,
      daysToHarvest: profile.daysToHarvest,
    };
  });
}

/**
 * Whether this exact variety has its own profile, as opposed to falling back to
 * `DEFAULT_PROFILES_BY_TYPE`.
 *
 * `getPlantCareProfile` deliberately degrades to the type default, which is
 * right for care cadences but wrong for anything presented as a fact about the
 * crop: the `fruit_tree` default carries `yearsToFirstHarvest: 4`, so every
 * unrecognised tree would otherwise be given a confident harvest date that is
 * really a guess about the whole category. Callers that would state a date use
 * this to stay silent instead.
 */
export function hasVarietyCareProfile(
  plantVariety: string | null | undefined,
  plantType?: PlantType | null,
  overrides?: Partial<PlantCareProfiles>
): boolean {
  if (!plantVariety) return false;
  if (plantType) {
    if (overrides?.[plantType]?.[plantVariety]) return true;
    return Boolean(PLANT_CARE_PROFILES[buildProfileKey(plantType, plantVariety)]);
  }
  return Boolean(findProfileByVariety(plantVariety));
}

export function hasPlantCareProfile(
  plantVariety: string,
  plantType?: PlantType,
  overrides?: Partial<PlantCareProfiles>
): boolean {
  if (plantType) {
    const key = buildProfileKey(plantType, plantVariety);
    if (overrides?.[plantType]?.[plantVariety]) {
      return true;
    }
    return Boolean(PLANT_CARE_PROFILES[key]) || Boolean(DEFAULT_PROFILES_BY_TYPE[plantType]);
  }

  if (!plantVariety) return false;

  return Boolean(findProfileByVariety(plantVariety));
}

export { getPruningTechniques, getStaticPruningDefaults } from './pruning';
export type { PruningInfo } from './pruning';
