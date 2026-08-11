import type {
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  NumericRange,
  PlantCareProfile,
  PlantLifecycle,
  PlantProfiles,
  PlantType,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
  VarietyDetail,
  WaterRequirement,
} from '@/types/database.types';
import { getPlantCareProfile, getStaticPruningDefaults } from '@/utils/plantCareDefaults';
import { sanitizeLandmarkText } from '@/utils/textSanitizer';

/**
 * Editable mirror of a `PlantProfile`. Every numeric field is held as a string
 * because the form binds directly to text inputs; conversion happens once, on
 * save, via `toRange` / `toOptNum`.
 */
export type CareFormState = {
  // Core care
  waterRequirement: WaterRequirement;
  wateringFrequencyDays: string;
  fertilisingFrequencyDays: string;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
  // Pruning
  pruningFrequencyDays: string;
  pruningTips: string;
  shapePruningTip: string;
  shapePruningMonths: string;
  flowerPruningTip: string;
  flowerPruningMonths: string;
  // Botanical identity
  scientificName: string;
  taxonomicFamily: string;
  lifecycle: PlantLifecycle | '';
  description: string;
  tamilName: string;
  // Growing parameters
  growingSeason: string;
  daysToHarvestMin: string;
  daysToHarvestMax: string;
  yearsToFirstHarvest: string;
  heightCmMin: string;
  heightCmMax: string;
  spacingCm: string;
  plantingDepthCm: string;
  germinationDaysMin: string;
  germinationDaysMax: string;
  germinationTempMin: string;
  germinationTempMax: string;
  soilPhMin: string;
  soilPhMax: string;
  // Tolerances
  heatTolerance: ToleranceLevel | '';
  droughtTolerance: ToleranceLevel | '';
  feedingIntensity: FeedingIntensity | '';
  // Custom pests & diseases
  customPests: string[];
  customDiseases: string[];
};

/** Everything the user can change on the catalog detail screen. */
export interface CatalogDraft {
  name: string;
  careForm: CareFormState;
  varieties: string[];
  varietyDetails: Record<string, VarietyDetail>;
}

export const sanitizeName = (v: string): string => sanitizeLandmarkText(v).trim();
export const sanitizeNum = (v: string): string => v.replace(/[^0-9]/g, '');
export const sanitizeDecimal = (v: string): string => v.replace(/[^0-9.]/g, '');

export function rangeStr(val?: NumericRange): [string, string] {
  if (!val) return ['', ''];
  return [String(val.min), String(val.max)];
}

export function toRange(min: string, max: string): NumericRange | undefined {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (Number.isNaN(mn) || Number.isNaN(mx)) return undefined;
  return { min: mn, max: mx };
}

export function toOptNum(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Seeds used when creating a brand-new catalog entry, where there is no static
 * profile to merge against.
 */
const CREATE_DEFAULTS: PlantCareProfile = {
  waterRequirement: 'medium',
  sunlight: 'full_sun',
  soilType: 'garden_soil',
  preferredFertiliser: 'compost',
  initialGrowthStage: 'seedling',
};

/**
 * Merges the static care defaults for a plant with any saved profile overrides
 * into the flat, all-strings form state.
 *
 * Pruning is the one field group that does not merge field-by-field: if the
 * user has saved *any* pruning value the saved set wins wholesale, otherwise
 * the static defaults are shown. Mixing the two would silently blend a user's
 * tips with bundled ones.
 */
export function buildCareForm(
  profiles: PlantProfiles,
  plantName: string,
  plantType: PlantType,
  isCreating: boolean
): CareFormState | null {
  const base = isCreating ? null : getPlantCareProfile(plantName, plantType);
  if (!base && !isCreating) return null;

  const profileEntry = isCreating ? undefined : profiles[plantType]?.[plantName];
  const merged: PlantCareProfile = base ? { ...base, ...(profileEntry ?? {}) } : CREATE_DEFAULTS;

  const hasUserPruning =
    profileEntry?.pruningTips || profileEntry?.shapePruningTip || profileEntry?.flowerPruningTip;
  const staticPruning = getStaticPruningDefaults(plantType, plantName);

  const [dthMin, dthMax] = rangeStr(merged.daysToHarvest);
  const [htMin, htMax] = rangeStr(merged.heightCm);
  const [gdMin, gdMax] = rangeStr(merged.germinationDays);
  const [gtMin, gtMax] = rangeStr(merged.germinationTempC);
  const [phMin, phMax] = rangeStr(merged.soilPhRange);

  return {
    waterRequirement: merged.waterRequirement,
    wateringFrequencyDays: merged.wateringFrequencyDays?.toString() ?? '',
    fertilisingFrequencyDays: merged.fertilisingFrequencyDays?.toString() ?? '',
    pruningFrequencyDays: merged.pruningFrequencyDays?.toString() ?? '',
    sunlight: merged.sunlight,
    soilType: merged.soilType,
    preferredFertiliser: merged.preferredFertiliser,
    initialGrowthStage: merged.initialGrowthStage,
    pruningTips: hasUserPruning
      ? (profileEntry?.pruningTips ?? []).join('\n')
      : staticPruning.tips.join('\n'),
    shapePruningTip: hasUserPruning
      ? profileEntry?.shapePruningTip ?? ''
      : staticPruning.shapePruning?.tip ?? '',
    shapePruningMonths: hasUserPruning
      ? profileEntry?.shapePruningMonths ?? ''
      : staticPruning.shapePruning?.months ?? '',
    flowerPruningTip: hasUserPruning
      ? profileEntry?.flowerPruningTip ?? ''
      : staticPruning.flowerPruning?.tip ?? '',
    flowerPruningMonths: hasUserPruning
      ? profileEntry?.flowerPruningMonths ?? ''
      : staticPruning.flowerPruning?.months ?? '',
    // Botanical identity
    scientificName: merged.scientificName ?? '',
    taxonomicFamily: merged.taxonomicFamily ?? '',
    lifecycle: merged.lifecycle ?? '',
    description: merged.description ?? '',
    tamilName: merged.tamilName ?? '',
    // Growing parameters
    growingSeason: merged.growingSeason ?? '',
    daysToHarvestMin: dthMin,
    daysToHarvestMax: dthMax,
    yearsToFirstHarvest: merged.yearsToFirstHarvest?.toString() ?? '',
    heightCmMin: htMin,
    heightCmMax: htMax,
    spacingCm: merged.spacingCm?.toString() ?? '',
    plantingDepthCm: merged.plantingDepthCm?.toString() ?? '',
    germinationDaysMin: gdMin,
    germinationDaysMax: gdMax,
    germinationTempMin: gtMin,
    germinationTempMax: gtMax,
    soilPhMin: phMin,
    soilPhMax: phMax,
    // Tolerances
    heatTolerance: merged.heatTolerance ?? '',
    droughtTolerance: merged.droughtTolerance ?? '',
    feedingIntensity: merged.feedingIntensity ?? '',
    // Custom pests & diseases
    customPests: profileEntry?.customPests ?? [],
    customDiseases: profileEntry?.customDiseases ?? [],
  };
}

/** Deep-copies a draft so a captured baseline cannot alias into live state. */
export function cloneDraft(draft: CatalogDraft): CatalogDraft {
  const varietyDetails: Record<string, VarietyDetail> = {};
  for (const [key, detail] of Object.entries(draft.varietyDetails)) {
    varietyDetails[key] = {
      ...detail,
      seasonSuitability: detail.seasonSuitability ? [...detail.seasonSuitability] : undefined,
    };
  }
  return {
    name: draft.name,
    careForm: {
      ...draft.careForm,
      customPests: [...draft.careForm.customPests],
      customDiseases: [...draft.careForm.customDiseases],
    },
    varieties: [...draft.varieties],
    varietyDetails,
  };
}

function stringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function varietyDetailsEqual(
  a: Record<string, VarietyDetail>,
  b: Record<string, VarietyDetail>
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => {
    const left = a[key];
    const right = b[key];
    if (!left || !right) return false;
    if (left.daysToMaturity !== right.daysToMaturity) return false;
    if (left.seedSource !== right.seedSource) return false;
    if (left.notes !== right.notes) return false;
    return stringArraysEqual(left.seasonSuitability ?? [], right.seasonSuitability ?? []);
  });
}

/**
 * True when the user has changed anything since the entry loaded.
 *
 * Compared key-by-key rather than by serializing: `varietyDetails` key order
 * follows insertion, so a stringify-based diff reports a change after any
 * edit-then-revert.
 */
export function isCatalogDraftDirty(
  baseline: CatalogDraft | null,
  current: CatalogDraft
): boolean {
  if (!baseline) return false;

  if (sanitizeName(baseline.name) !== sanitizeName(current.name)) return true;

  const keys = Object.keys(current.careForm) as (keyof CareFormState)[];
  for (const key of keys) {
    const currentValue = current.careForm[key];
    const baselineValue = baseline.careForm[key];
    if (Array.isArray(currentValue) || Array.isArray(baselineValue)) {
      const a = Array.isArray(baselineValue) ? baselineValue : [];
      const b = Array.isArray(currentValue) ? currentValue : [];
      if (!stringArraysEqual(a, b)) return true;
    } else if (currentValue !== baselineValue) {
      return true;
    }
  }

  if (!stringArraysEqual(baseline.varieties, current.varieties)) return true;
  return !varietyDetailsEqual(baseline.varietyDetails, current.varietyDetails);
}
