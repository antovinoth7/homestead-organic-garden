import type { CareFormState } from '@/utils/catalogDraft';
import { sanitizeName } from '@/utils/catalogDraft';

/** Section cards on the catalog detail screen, in document order. */
export type CatalogSectionKey =
  | 'plantInfo'
  | 'coreCare'
  | 'pruning'
  | 'growingInfo'
  | 'planting'
  | 'tolerances'
  | 'pests'
  | 'diseases'
  | 'varieties';

/** Sticky tabs above the section cards. */
export type CatalogTabKey = 'basics' | 'care' | 'growing' | 'health' | 'varieties';

export type CatalogFieldKey =
  | 'name'
  | 'wateringFrequencyDays'
  | 'fertilisingFrequencyDays'
  | 'daysToHarvest'
  | 'heightCm'
  | 'germinationDays'
  | 'germinationTempC'
  | 'soilPhRange';

export type CatalogErrors = Partial<Record<CatalogFieldKey, string>>;

/**
 * Pruning sits under Care because its frequency is the third recurring-reminder
 * interval alongside watering and fertilising. Planting sits under Growing
 * because its one field is the start of the timeline Growing Info describes.
 */
export const SECTION_TO_TAB: Record<CatalogSectionKey, CatalogTabKey> = {
  plantInfo: 'basics',
  coreCare: 'care',
  pruning: 'care',
  growingInfo: 'growing',
  planting: 'growing',
  tolerances: 'health',
  pests: 'health',
  diseases: 'health',
  varieties: 'varieties',
};

export const FIELD_TO_SECTION: Record<CatalogFieldKey, CatalogSectionKey> = {
  name: 'plantInfo',
  wateringFrequencyDays: 'coreCare',
  fertilisingFrequencyDays: 'coreCare',
  daysToHarvest: 'growingInfo',
  heightCm: 'growingInfo',
  germinationDays: 'growingInfo',
  germinationTempC: 'growingInfo',
  soilPhRange: 'growingInfo',
};

/** Document order — drives which error the save button jumps to first. */
export const ERROR_FIELD_ORDER: readonly CatalogFieldKey[] = [
  'name',
  'wateringFrequencyDays',
  'fertilisingFrequencyDays',
  'daysToHarvest',
  'heightCm',
  'germinationDays',
  'germinationTempC',
  'soilPhRange',
];

const FREQUENCY_MESSAGE = 'Enter a whole number of days (1 or more).';
const RANGE_MESSAGE = 'Minimum must not exceed maximum.';

function frequencyError(value: string): string | undefined {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? FREQUENCY_MESSAGE : undefined;
}

/**
 * Flags an inverted range. A half-filled range is fine — `toRange` drops it —
 * so only complain when both sides parse and are the wrong way round.
 */
function rangeError(min: string, max: string): string | undefined {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (Number.isNaN(mn) || Number.isNaN(mx)) return undefined;
  return mn > mx ? RANGE_MESSAGE : undefined;
}

export function validateCatalogDraft(name: string, careForm: CareFormState): CatalogErrors {
  const errors: CatalogErrors = {};

  if (!sanitizeName(name)) {
    errors.name = 'Enter a plant name.';
  }

  const watering = frequencyError(careForm.wateringFrequencyDays);
  if (watering) errors.wateringFrequencyDays = watering;

  const fertilising = frequencyError(careForm.fertilisingFrequencyDays);
  if (fertilising) errors.fertilisingFrequencyDays = fertilising;

  const daysToHarvest = rangeError(careForm.daysToHarvestMin, careForm.daysToHarvestMax);
  if (daysToHarvest) errors.daysToHarvest = daysToHarvest;

  const heightCm = rangeError(careForm.heightCmMin, careForm.heightCmMax);
  if (heightCm) errors.heightCm = heightCm;

  const germinationDays = rangeError(careForm.germinationDaysMin, careForm.germinationDaysMax);
  if (germinationDays) errors.germinationDays = germinationDays;

  const germinationTempC = rangeError(careForm.germinationTempMin, careForm.germinationTempMax);
  if (germinationTempC) errors.germinationTempC = germinationTempC;

  const soilPhRange = rangeError(careForm.soilPhMin, careForm.soilPhMax);
  if (soilPhRange) errors.soilPhRange = soilPhRange;

  return errors;
}

export function firstErroredField(errors: CatalogErrors): CatalogFieldKey | null {
  return ERROR_FIELD_ORDER.find((field) => errors[field] !== undefined) ?? null;
}

/** True when any field owned by `section` currently has an error. */
export function sectionHasError(errors: CatalogErrors, section: CatalogSectionKey): boolean {
  return ERROR_FIELD_ORDER.some(
    (field) => errors[field] !== undefined && FIELD_TO_SECTION[field] === section
  );
}
