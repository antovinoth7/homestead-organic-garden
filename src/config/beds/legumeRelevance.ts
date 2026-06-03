import { BedType } from '@/types/database.types';

/**
 * Bed types whose design centers on nitrogen-fixing legumes. The legume-coverage
 * warning is only meaningful for these; other bed types (leafy, fruiting, spice,
 * medicinal_guild) contain no legumes by design, so the warning is hidden for them.
 */
export const LEGUME_RELEVANT_BED_TYPES: ReadonlySet<BedType> = new Set<BedType>([
  'root_legume',
  'three_sisters',
  'climber_trellis',
]);

/** Whether a low-legume warning is meaningful for the given bed type. */
export function bedExpectsLegumes(type: BedType): boolean {
  return LEGUME_RELEVANT_BED_TYPES.has(type);
}
