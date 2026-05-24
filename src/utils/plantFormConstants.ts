/**
 * Constants and pure helpers shared between PlantAddWizard, PlantEditForm,
 * and usePlantFormState.
 *
 * Note: CATEGORY_OPTIONS and GROWTH_STAGE_OPTIONS are generated from
 * CATEGORY_LABELS and GROWTH_STAGE_LABELS in plantLabels.ts to maintain
 * a single source of truth.
 */

import { CATEGORY_OPTIONS, GROWTH_STAGE_OPTIONS } from './plantLabels';

export { CATEGORY_OPTIONS, GROWTH_STAGE_OPTIONS };

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

export const HEALTH_OPTIONS = [
  { label: '✅ Healthy', value: 'healthy' },
  { label: '⚠️ Stressed', value: 'stressed' },
  { label: '🔄 Recovering', value: 'recovering' },
  { label: '❌ Sick', value: 'sick' },
] as const;

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
