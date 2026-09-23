import type { PlantProfile, PlantProfiles, PlantType, VarietyDetail } from '@/types/database.types';

/**
 * Pure logic for migration 015: retires the Kharif/Rabi season vocabulary,
 * which Tamil Nadu farmers do not use, for the zone model's English season
 * names (the picker shows each one's pattam alongside).
 *
 * Carries its own map, per the note on `MERGED_PLANT_NAMES`: `plantLabels`'
 * `LEGACY_SEASON_VALUES` may grow later, and an account already past v15
 * never runs this pass again, so it declares exactly what it renames.
 */
export const RENAMED_SEASONS_V15: Readonly<Record<string, string>> = {
  'Kharif (Jun–Sep)': 'SW Monsoon (Jun–Sep)',
  'Rabi (Oct–Jan)': 'NE Monsoon + Winter (Oct–Feb)',
  'Summer (Feb–May)': 'Summer (Mar–May)',
  'Summer (Mar-May)': 'Summer (Mar–May)',
  'Northeast Monsoon (Oct–Dec)': 'NE Monsoon (Oct–Dec)',
  'Kharif + Rabi': 'SW + NE Monsoon (Jun–Dec)',
  'Rabi + Summer': 'Winter + Summer (Jan–May)',
};

function renameSeason(value: string): string {
  return RENAMED_SEASONS_V15[value.trim()] ?? value;
}

/** Renamed and de-duplicated list, or null when nothing in it changes. */
function planSuitability(list: readonly string[]): string[] | null {
  const next: string[] = [];
  for (const value of list) {
    const renamed = renameSeason(value);
    if (!next.includes(renamed)) next.push(renamed);
  }
  const unchanged = next.length === list.length && next.every((value, i) => value === list[i]);
  return unchanged ? null : next;
}

function planProfile(profile: PlantProfile): PlantProfile | null {
  let next: PlantProfile | null = null;

  if (typeof profile.growingSeason === 'string') {
    const renamed = renameSeason(profile.growingSeason);
    if (renamed !== profile.growingSeason) next = { ...profile, growingSeason: renamed };
  }

  const details = profile.varietyDetails;
  if (details) {
    let nextDetails: Record<string, VarietyDetail> | null = null;
    for (const [variety, detail] of Object.entries(details)) {
      const suitability = detail?.seasonSuitability;
      if (!Array.isArray(suitability)) continue;
      const planned = planSuitability(suitability);
      if (!planned) continue;
      nextDetails ??= { ...details };
      nextDetails[variety] = { ...detail, seasonSuitability: planned };
    }
    if (nextDetails) next = { ...(next ?? profile), varietyDetails: nextDetails };
  }

  return next;
}

/**
 * Rewrites retired season values in every stored profile's `growingSeason`
 * and variety `seasonSuitability`. Free-text seasons are left as written.
 *
 * Returns null when nothing changes, so a second run writes nothing.
 */
export function planSeasonRename(profiles: PlantProfiles): PlantProfiles | null {
  let next: PlantProfiles | null = null;

  for (const [plantType, byName] of Object.entries(profiles) as [
    PlantType,
    Record<string, PlantProfile> | undefined,
  ][]) {
    if (!byName) continue;
    for (const [name, profile] of Object.entries(byName)) {
      if (!profile) continue;
      const planned = planProfile(profile);
      if (!planned) continue;
      next ??= { ...profiles };
      if (next[plantType] === profiles[plantType]) next[plantType] = { ...byName };
      next[plantType][name] = planned;
    }
  }

  return next;
}
