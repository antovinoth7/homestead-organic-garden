import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

/**
 * Names that became bundled catalog rows after users had already added them as
 * their own entries.
 *
 * Lychee, Citron and Batoko Plum were reference-image names only; Broccoli was
 * a pre-git scaffold name that migration 013 would have pruned. Gardens grow all
 * four, so they are rows now. Keyed by category because only an entry filed
 * under the row's own type is the same plant — a user's "Citron" under `shrub`
 * is left alone.
 */
export const ADOPTED_CATALOG_ROWS_V18: Readonly<Partial<Record<PlantType, readonly string[]>>> = {
  fruit_tree: ['Lychee', 'Citron', 'Batoko Plum'],
  vegetable: ['Broccoli'],
};

/** The stored-entry pruning fields the entry form writes as one group. */
const PRUNING_KEYS = [
  'pruningTips',
  'shapePruningTip',
  'shapePruningMonths',
  'flowerPruningTip',
  'flowerPruningMonths',
] as const;

/**
 * Keys that identify the entry or hold the user's own lists, never a care
 * value the form seeded — they are never compared, so never dropped.
 */
const KEPT_KEYS: ReadonlySet<string> = new Set([
  'plantType',
  'name',
  'tamilName',
  'description',
  'varieties',
  'varietyDetails',
  'isUserAdded',
  'isDeleted',
  'isDismissed',
  'customPests',
  'customDiseases',
  'cropFamily',
  'layer',
  ...PRUNING_KEYS,
]);

/** Structural equality for the JSON-shaped values a stored profile holds. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => sameValue(item, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aRecord), ...Object.keys(bRecord)]);
    return [...keys].every((key) => sameValue(aRecord[key], bRecord[key]));
  }
  return false;
}

function isBlank(value: string | readonly string[] | undefined): boolean {
  if (value === undefined) return true;
  return typeof value === 'string' ? value.trim().length === 0 : value.length === 0;
}

/**
 * Lets a user's own entry for a newly bundled row show the row's data.
 *
 * A stored entry replaces the bundled one wholesale (`getProfileEntry`), and the
 * add-entry form saved every care field it showed — seeded, for a name with no
 * profile, from the type defaults. So without this the user's Lychee kept
 * saying "First harvest in 4 years", the fruit-tree default, over the row's own
 * figures, and showed no Tamil name.
 *
 * Per entry:
 * - Tamil name, description and varieties are filled from the bundled record
 *   where the stored copy has none. The user's own values win.
 * - A care value equal to what the form seeded (`seeded(type)`) is dropped, so
 *   the bundled value shows through the field-level care override. The pruning
 *   fields go as a group, and only when every one still matches, because the
 *   form reads them as a set. A value the user typed that happens to equal the
 *   type default is indistinguishable from an untouched one — the same trade
 *   `isSeedShaped` makes in `removedCatalogPlantsLogic.ts` — and losing it only
 *   swaps a generic figure for the plant's own.
 * - A tombstoned entry is left alone. `isDismissed` is set both by migration 013
 *   and by the user's own dismissal, so it cannot say who hid the plant.
 *
 * `bundled` and `seeded` are passed in to keep this pure. Returns null when
 * nothing changes, so a second run writes nothing.
 */
export function planAdoptedRows(
  profiles: PlantProfiles,
  rows: typeof ADOPTED_CATALOG_ROWS_V18,
  bundled: (type: PlantType, name: string) => PlantProfile | undefined,
  seeded: (type: PlantType) => Partial<PlantProfile>
): PlantProfiles | null {
  let next = profiles;
  let changed = false;

  for (const [type, names] of Object.entries(rows) as [PlantType, readonly string[]][]) {
    const seed = seeded(type) as Record<string, unknown>;

    for (const name of names) {
      const entry = profiles[type]?.[name];
      if (!entry || entry.isDeleted) continue;

      const adopted: Record<string, unknown> = { ...entry };
      let entryChanged = false;

      const row = bundled(type, name);
      if (row) {
        if (isBlank(entry.tamilName) && row.tamilName) {
          adopted.tamilName = row.tamilName;
          entryChanged = true;
        }
        if (isBlank(entry.description) && row.description) {
          adopted.description = row.description;
          entryChanged = true;
        }
        if (isBlank(entry.varieties) && row.varieties && row.varieties.length > 0) {
          adopted.varieties = [...row.varieties];
          entryChanged = true;
        }
      }

      for (const [key, value] of Object.entries(entry)) {
        if (KEPT_KEYS.has(key) || !(key in seed)) continue;
        if (sameValue(value, seed[key])) {
          delete adopted[key];
          entryChanged = true;
        }
      }

      const storedPruning = PRUNING_KEYS.filter((key) => entry[key] !== undefined);
      if (
        storedPruning.length > 0 &&
        PRUNING_KEYS.every((key) => sameValue(entry[key], seed[key]))
      ) {
        for (const key of storedPruning) delete adopted[key];
        entryChanged = true;
      }

      if (!entryChanged) continue;
      next = { ...next, [type]: { ...next[type], [name]: adopted as unknown as PlantProfile } };
      changed = true;
    }
  }

  return changed ? next : null;
}
