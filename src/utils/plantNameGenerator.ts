import type { Plant } from '../types/database.types';

/**
 * Build the base for an auto-generated plant name from its metadata.
 * Format: `Variety-ShortPlace-YYYYMM`, e.g. "Mango-MNG-202601" for a Mango
 * planted Jan 2026 at a location whose short name is "MNG". The place and month
 * segments are omitted when their source data is missing, keeping the base
 * deterministic from stored plant data (so edit-load can still recognise it).
 */
export const buildGeneratedPlantNameBase = (
  plantVariety: string,
  variety: string,
  plantingDate?: string,
  parentLocation?: string,
  locationShortName?: string
): string => {
  const pv = plantVariety.trim();
  const v = variety.trim();
  if (!pv) return '';

  let namePart: string;
  if (!v) {
    namePart = pv;
  } else if (v.toLowerCase().includes(pv.toLowerCase())) {
    namePart = v;
  } else {
    namePart = `${pv} - ${v}`;
  }

  // Short place code (e.g. "MNG"): the configured short name, else the first
  // word of the location. Omitted when there is no location.
  let shortPlace = '';
  const loc = parentLocation?.trim();
  if (loc) {
    shortPlace = locationShortName?.trim() || (loc.split(/\s+/)[0] ?? '').slice(0, 10);
  }

  // YYYYMM from the planting date. Omitted (not defaulted) when absent so the
  // base is stable across renders and reconstructable on edit-load.
  let yyyymm = '';
  if (plantingDate) {
    const d = new Date(plantingDate);
    if (!isNaN(d.getTime())) {
      yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  return [namePart, shortPlace, yyyymm].filter(Boolean).join('-');
};

export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Check whether a plant name matches the auto-generated pattern for a given base.
 */
export const isGeneratedPlantName = (value: string, baseName: string): boolean => {
  const nv = value.trim();
  const nb = baseName.trim();
  if (!nv || !nb) return false;
  const pattern = new RegExp(`^${escapeRegExp(nb)}(?:-#(\\d+))?$`, 'i');
  return pattern.test(nv);
};

/**
 * Build a unique auto-generated plant name, appending "-#0N" (zero-padded,
 * starting at #02) when the base is already taken by another plant. The first
 * plant of a given base has no numeric suffix.
 */
export const buildGeneratedPlantName = (
  baseName: string,
  existingPlants: readonly Partial<Pick<Plant, 'id' | 'name'>>[],
  currentPlantId?: string,
  currentGeneratedName?: string
): string => {
  const normalizedBase = baseName.trim();
  if (!normalizedBase) return '';

  if (
    currentPlantId &&
    currentGeneratedName &&
    isGeneratedPlantName(currentGeneratedName, normalizedBase)
  ) {
    return currentGeneratedName;
  }

  const pattern = new RegExp(`^${escapeRegExp(normalizedBase)}(?:-#(\\d+))?$`, 'i');
  let baseTaken = false;
  const usedSuffixes = new Set<number>();

  existingPlants.forEach((plant) => {
    if (plant.id === currentPlantId) return;
    const match = plant.name?.trim().match(pattern);
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
  return `${normalizedBase}-#${String(next).padStart(2, '0')}`;
};
