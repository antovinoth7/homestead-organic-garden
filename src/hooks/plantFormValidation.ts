/**
 * Pure validation helpers for the plant form (create wizard + edit form).
 * Extracted from usePlantFormState so they are unit-testable, mirroring
 * bedWizardValidation.ts.
 */

export interface CareScheduleInput {
  wateringEnabled: boolean;
  wateringFrequency: string;
  fertilisingEnabled: boolean;
  fertilisingFrequency: string;
  pruningEnabled: boolean;
  pruningFrequency: string;
}

const isValidFrequency = (value: string): boolean => {
  const n = parseInt(value, 10);
  return value.trim() !== '' && !isNaN(n) && n >= 1;
};

/**
 * Care-schedule errors, toggle-aware: a frequency is only required while its
 * task toggle is on. Pruning frequency may stay empty (= no scheduled
 * frequency) but must be valid when provided.
 */
export function careScheduleErrors(input: CareScheduleInput): string[] {
  const errors: string[] = [];
  if (input.wateringEnabled && !isValidFrequency(input.wateringFrequency))
    errors.push('Please enter a valid watering frequency (number of days)');
  if (input.fertilisingEnabled && !isValidFrequency(input.fertilisingFrequency))
    errors.push('Please enter a valid fertilising frequency (number of days)');
  if (
    input.pruningEnabled &&
    input.pruningFrequency.trim() !== '' &&
    !isValidFrequency(input.pruningFrequency)
  )
    errors.push('Please enter a valid pruning frequency (number of days)');
  return errors;
}

export interface PlantFormGateInput {
  plantVariety: string;
  parentLocation: string;
  childLocation: string;
  careProfilesLoaded: boolean;
  care: CareScheduleInput;
}

/**
 * Reason the add-plant form's Save is blocked, or null when clear. Evaluated
 * in visual order: plant → location → care plan readiness/validity.
 */
export function plantFormBlockReason(input: PlantFormGateInput): string | null {
  if (!input.plantVariety.trim()) return 'Please select a plant';
  if (!input.parentLocation.trim()) return 'Please select a main location';
  if (!input.childLocation.trim()) return 'Please select a direction or section';
  if (!input.careProfilesLoaded) return 'Loading care plan…';
  const careErrors = careScheduleErrors(input.care);
  if (careErrors.length > 0) return careErrors[0] ?? null;
  return null;
}
