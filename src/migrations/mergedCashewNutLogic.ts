import type { PlantProfile, PlantProfiles, PlantType, VarietyDetail } from '@/types/database.types';
import { applyProfileDeletion } from '@/utils/plantProfileMutations';

/**
 * Pure logic for migration 016: folds a user-added `Cashew Nut` catalog entry
 * into the bundled `Cashew` row.
 *
 * `Cashew Nut` was never a bundled row. An account could still hold one as its
 * own addition, typed in before `Cashew` joined the catalog (63537ff), and the
 * save-time duplicate check only compared case, not aliases, so nothing
 * stopped it. The two then sat side by side in the catalog.
 *
 * Carries its own map, per the note on `MERGED_PLANT_NAMES`.
 */
export const MERGED_PLANT_NAMES_V16: Readonly<Record<string, string>> = {
  'Cashew Nut': 'Cashew',
};

/** The category each survivor belongs to. */
export const MERGED_SURVIVOR_TYPE_V16: Readonly<Record<string, PlantType>> = {
  Cashew: 'fruit_tree',
};

const ALL_TYPES: readonly PlantType[] = [
  'vegetable',
  'herb',
  'flower',
  'fruit_tree',
  'timber_tree',
  'coconut_tree',
  'shrub',
  'spinach',
];

/** Case-insensitive union, keeping the first spelling seen. */
function unionNames(
  kept: readonly string[] | undefined,
  added: readonly string[] | undefined
): string[] | undefined {
  if (!kept?.length && !added?.length) return undefined;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const name of [...(kept ?? []), ...(added ?? [])]) {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/**
 * The survivor with the user's own additions from the retired entry folded in:
 * varieties and their details, and custom pests and diseases.
 *
 * Nothing else crosses. A user-added entry is a full record whose care fields
 * were prefilled from the generic category default when it was created, so
 * copying them would overwrite the curated Cashew profile with a guess.
 */
function foldInto(survivor: PlantProfile, retired: PlantProfile): PlantProfile {
  const next: PlantProfile = { ...survivor };

  const varieties = unionNames(survivor.varieties, retired.varieties);
  if (varieties) next.varieties = varieties;

  if (retired.varietyDetails && Object.keys(retired.varietyDetails).length > 0) {
    // The survivor's own detail wins where both describe the same variety.
    const details: Record<string, VarietyDetail> = { ...retired.varietyDetails };
    Object.assign(details, survivor.varietyDetails ?? {});
    next.varietyDetails = details;
  }

  const customPests = unionNames(survivor.customPests, retired.customPests);
  if (customPests) next.customPests = customPests;
  const customDiseases = unionNames(survivor.customDiseases, retired.customDiseases);
  if (customDiseases) next.customDiseases = customDiseases;

  return next;
}

/**
 * Moves each retired entry onto its survivor and tombstones it — the shared
 * engine behind migrations 016 and 017.
 *
 * `bundled` is the survivor's bundled record, passed in to keep this pure. It
 * seeds the survivor's stored entry when the user never edited it — a stored
 * entry replaces the bundled one wholesale, so it has to start complete.
 * `varietyLabels` names the variety a retired row becomes on its survivor
 * (Long Brinjal on Brinjal), added to a stored survivor's list too.
 *
 * Leaves an entry alone when the user deleted its survivor: folding their
 * plant into a row they chose to hide would make it vanish.
 *
 * Returns null when nothing changes, so a second run writes nothing.
 */
export function planFoldMerge(
  profiles: PlantProfiles,
  renames: Readonly<Record<string, string>>,
  survivorTypes: Readonly<Record<string, PlantType>>,
  bundled: (type: PlantType, name: string) => PlantProfile | undefined,
  now?: number,
  varietyLabels: Readonly<Record<string, string>> = {}
): PlantProfiles | null {
  let next = profiles;
  let changed = false;

  for (const [from, to] of Object.entries(renames)) {
    const target = survivorTypes[to];
    if (!target) continue;

    for (const type of ALL_TYPES) {
      const retired = next[type]?.[from];
      if (!retired || retired.isDeleted) continue;

      const stored = next[target]?.[to];
      if (stored?.isDeleted) continue;
      const survivor = stored ?? bundled(target, to);
      if (!survivor) continue;

      let folded = foldInto(survivor, retired);
      const label = varietyLabels[from];
      if (label) {
        folded = { ...folded, varieties: unionNames(folded.varieties, [label]) ?? [label] };
      }

      next = { ...next, [target]: { ...next[target], [to]: folded } };
      next = applyProfileDeletion(next, type, from, now);
      changed = true;
    }
  }

  return changed ? next : null;
}

/** Migration 016's plan: `Cashew Nut` into `Cashew`. */
export function planCashewNutMerge(
  profiles: PlantProfiles,
  bundled: (type: PlantType, name: string) => PlantProfile | undefined,
  now?: number
): PlantProfiles | null {
  return planFoldMerge(profiles, MERGED_PLANT_NAMES_V16, MERGED_SURVIVOR_TYPE_V16, bundled, now);
}
