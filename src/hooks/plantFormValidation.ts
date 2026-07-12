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

export interface WizardGateInput {
  plantVariety: string;
  parentLocation: string;
  childLocation: string;
  careProfilesLoaded: boolean;
  care: CareScheduleInput;
}

/**
 * Reason the wizard's Next/Save is blocked on a step, or null when clear.
 * Step 3 is the read-only Review step: it only needs the care profile to have
 * loaded and the seeded schedule to be valid.
 */
export function wizardStepBlockReason(step: 1 | 2 | 3, input: WizardGateInput): string | null {
  if (step === 1 && !input.plantVariety.trim()) return 'Please select a plant';
  if (step === 2 && !input.parentLocation.trim()) return 'Please select a main location';
  if (step === 2 && !input.childLocation.trim()) return 'Please select a direction or section';
  if (step === 3) {
    if (!input.careProfilesLoaded) return 'Loading care plan…';
    const careErrors = careScheduleErrors(input.care);
    if (careErrors.length > 0) return careErrors[0] ?? null;
  }
  return null;
}
