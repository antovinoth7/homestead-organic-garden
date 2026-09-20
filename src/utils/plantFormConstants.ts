/**
 * Constants and pure helpers shared between PlantAddForm, PlantEditForm,
 * and usePlantFormState.
 *
 * Note: CATEGORY_OPTIONS is generated from CATEGORY_LABELS in plantLabels.ts to
 * maintain a single source of truth. Health and growth-stage labels live there
 * too (HEALTH_STATUS_LABELS / GROWTH_STAGE_LABELS).
 */

import { CATEGORY_OPTIONS } from './plantLabels';

export { CATEGORY_OPTIONS };

export const NOTES_MAX_LENGTH = 500;

export const sanitizeNumberText = (value: string): string => value.replace(/[^0-9]/g, '');

export type FormSectionKey =
  | 'basic'
  | 'location'
  | 'care'
  | 'health'
  | 'harvest'
  | 'coconut'
  | 'notesHistory'
  | 'pestDisease';

export const getFrequencyLabel = (days: string): string => {
  const n = parseInt(days, 10);
  if (isNaN(n) || n < 1) return '';
  if (n === 1) return 'Daily';
  if (n === 7) return 'Weekly';
  if (n === 14) return 'Fortnightly';
  if (n === 30) return 'Monthly';
  return `Every ${n} days`;
};

export const adjustFrequency = (
  current: string,
  delta: number,
  setter: (value: string) => void
): void => {
  const n = parseInt(current, 10);
  const next = Math.max(1, (isNaN(n) ? 0 : n) + delta);
  setter(next.toString());
};
