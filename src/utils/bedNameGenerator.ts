import type { BedType } from '@/types/database.types';

export const BED_TYPE_LABEL: Partial<Record<BedType, string>> = {
  leafy: 'Leafy',
  fruiting: 'Veggie',
  spice: 'Spice',
  root_legume: 'Root',
  climber_trellis: 'Climber',
  three_sisters: 'Three Sisters',
  medicinal_guild: 'Medicinal',
};

export function buildGeneratedBedNameBase(
  parentLocation: string | null | undefined,
  bedType: BedType | null | undefined,
  childLocation?: string | null
): string {
  const parent = parentLocation?.trim();
  const typeLabel = bedType ? BED_TYPE_LABEL[bedType] : undefined;
  if (!parent || !typeLabel) return '';
  const child = childLocation?.trim();
  const locPart = child ? `${parent} ${child}` : parent;
  return `${locPart} ${typeLabel} Bed`;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function isGeneratedBedName(name: string, base: string): boolean {
  const nv = name.trim();
  const nb = base.trim();
  if (!nv || !nb) return false;
  const pattern = new RegExp(`^${escapeRegExp(nb)}(?: #(\\d+))?$`, 'i');
  return pattern.test(nv);
}
