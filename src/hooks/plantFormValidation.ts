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
