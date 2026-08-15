import type { BedType } from '@/types/database.types';

/** Single source of truth for how each bed type is labelled across the app. */

/** Full display name — used in headers and filter chips. */
export const BED_TYPE_NAME: Record<BedType, string> = {
  leafy: 'Leafy Greens',
  fruiting: 'Veggie Bed',
  spice: 'Spice & Herb',
  root_legume: 'Root & Legume',
  climber_trellis: 'Climber Trellis',
  three_sisters: 'Three Sisters',
  medicinal_guild: 'Medicinal Guild',
};

/** Short name — used when composing generated bed names (e.g. "Leafy Bed …"). */
export const BED_TYPE_SHORT: Record<BedType, string> = {
  leafy: 'Leafy',
  fruiting: 'Veggie',
  spice: 'Spice',
  root_legume: 'Root',
  climber_trellis: 'Climber',
  three_sisters: 'Three Sisters',
  medicinal_guild: 'Medicinal',
};

/**
 * Build the bed wizard header title, e.g. "Leafy Greens - Create".
 */
export function bedTypeTitle(bedType: BedType, mode: 'create' | 'edit'): string {
  const action = mode === 'edit' ? 'Edit' : 'Create';
  return `${BED_TYPE_NAME[bedType]} - ${action}`;
}
