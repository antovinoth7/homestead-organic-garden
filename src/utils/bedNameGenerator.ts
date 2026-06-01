import type { BedType, Bed } from '@/types/database.types';

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
  return `${typeLabel} Bed ${locPart} `;
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function isGeneratedBedName(name: string, base: string): boolean {
  const nv = name.trim();
  const nb = base.trim();
  if (!nv || !nb) return false;
  const pattern = new RegExp(`^${escapeRegExp(nb)}(?: #(\\d+))?$`, 'i');
  return pattern.test(nv);
}

/**
 * Build a unique auto-generated bed name, appending " #N" when the base is
 * already taken by another bed. Mirrors buildGeneratedPlantName so beds in the
 * same location/type don't collide (e.g. "Backyard North Veggie Bed #2").
 */
export function buildGeneratedBedName(
  baseName: string,
  existingBeds: Bed[],
  currentBedId?: string,
  currentGeneratedName?: string
): string {
  const normalizedBase = baseName.trim();
  if (!normalizedBase) return '';

  if (
    currentBedId &&
    currentGeneratedName &&
    isGeneratedBedName(currentGeneratedName, normalizedBase)
  ) {
    return currentGeneratedName;
  }

  const pattern = new RegExp(`^${escapeRegExp(normalizedBase)}(?: #(\\d+))?$`, 'i');
  let baseTaken = false;
  const usedSuffixes = new Set<number>();

  existingBeds.forEach((bed) => {
    if (bed.id === currentBedId) return;
    const match = bed.name?.trim().match(pattern);
    if (!match) return;
    if (!match[1]) {
      baseTaken = true;
    } else {
      const suffix = parseInt(match[1], 10);
      if (!Number.isNaN(suffix)) usedSuffixes.add(suffix);
    }
  });

  if (!baseTaken) return normalizedBase;
  let next = 2;
  while (usedSuffixes.has(next)) next++;
  return `${normalizedBase} #${next}`;
}
