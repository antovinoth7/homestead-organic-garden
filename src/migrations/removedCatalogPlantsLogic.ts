import { applyProfileDeletion, applyProfileDismissal } from '@/utils/plantProfileMutations';
import { CATEGORY_OPTIONS } from '@/utils/plantLabels';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

/**
 * What a removed plant's bundled record last looked like, for the edit guard.
 *
 * `null` means the name has no recoverable seed — see the scaffold note on
 * `REMOVED_CATALOG_PLANTS_V13` — and falls back to the structural test in
 * `isSeedShaped`.
 */
export interface RemovedPlantSeed {
  tamilName?: string;
  description?: string;
  varieties?: string[];
}

/**
 * Plants dropped from the bundled catalog, and the record they last shipped as.
 *
 * A dropped name does not disappear from an existing install. Migration 003
 * wrote a full stored entry for every plant belonging to a user who had a
 * stored `plantCatalog`, so the whole catalog-as-it-then-stood lives in
 * `user_settings/{uid}.plantProfiles` — and `getPlantNamesForType` lists any
 * stored name that is *not* in the bundled defaults as a user addition. The
 * result is that Lettuce, Spinach and Broccoli went on browsing under
 * Vegetables → Other months after the catalog stopped offering them.
 *
 * Keyed by category, not by name: a stale `Coleus` is a `shrub`, and a user's
 * own "Coleus" filed under `flower` is a different plant and must not be
 * touched.
 *
 * `isUserAdded` cannot be used to tell the two apart, in either direction — the
 * add-entry form never sets it (`useCatalogEntryForm.ts`), while migration 003
 * *does* set it on names that came from a legacy care-override. Hence an
 * explicit list, audited against history rather than derived: see the two
 * `git show` commands in each provenance note below.
 *
 * Provenance:
 * - **`de74376`** — the Tamil Nadu relevance pass (Sep 2026) that cut the
 *   Mediterranean herbs, the glasshouse flowers and the cool-season crops that
 *   are not Kanyakumari homestead plants. Last seed:
 *   `git show 1ccfbd2:src/services/plantCatalog.ts`.
 * - **`8fe36e7`** — the Kanyakumari expansion, which replaced seven placeholder
 *   `spinach` rows (they were really Palak cultivars promoted to plants) with
 *   the real keerai. Last seed: `git show 1e9f77b:src/services/plantCatalog.ts`.
 * - **no repo-era seed** — Broccoli, Spinach, Lily and Tulip were never rows in
 *   this repo. They are inherited from the pre-git May scaffold, reached devices
 *   through migration 003's legacy-store consolidation, and are recorded in
 *   `docs/tamil-nadu-reference-audit.md` → "Still open".
 *
 * Deliberately NOT listed, each for its own reason:
 * - `Amaranth`, `Apple`, `Comfrey`, `Corn`, `Grape`, `Lime`, `Cashew Nut` —
 *   reference-image and alias spellings in `EXTRA_REFERENCE_PLANT_NAMES` that
 *   were never catalog rows.
 * - `Palak`, `Coconut`, `Taro`, `Sweet Potato`, `Cauliflower`, `Green Peas`,
 *   `Muskmelon` — still current rows, whatever the reference-key comment groups
 *   them with.
 * - `Elephant Foot Yam` — a valid alternate spelling of the `Elephant Yam` row
 *   (`plantAliases.ts`). Pruning it would delete a real plant's profile.
 * - `Methi`, `Eggplant`, `Moringa`, `Colocasia` (007), `Malabar Spinach`,
 *   `Amaranth Greens` (009), `Ash Plantain` (010) — already merged onto a
 *   surviving row by an earlier migration.
 * - `Pepper` — renamed, not removed. See `RENAMED_PLANT_NAMES_V13`.
 */
export const REMOVED_CATALOG_PLANTS_V13: Readonly<
  Partial<Record<PlantType, Readonly<Record<string, RemovedPlantSeed | null>>>>
> = {
  vegetable: {
    Lettuce: {
      tamilName: 'லெட்டுஸ்',
      description: 'Cool-season leafy green ideal for salads and fresh garnishes',
      varieties: ['Iceberg', 'Butterhead', 'Romaine', 'Loose Leaf'],
    },
    Squash: {
      tamilName: 'ஸ்குவாஷ்',
      description:
        'Fast-growing cucurbit producing tender fruits; ideal ground cover in polycultures',
      varieties: ['Yellow Crookneck', 'Zucchini', 'Pattypan'],
    },
    Turnip: {
      tamilName: 'டர்னிப்',
      description: 'Fast cool-season root crop best scheduled for Kanyakumari’s milder months',
      varieties: ['Purple Top White Globe', 'Pusa Sweti', 'Local'],
    },
    Strawberry: {
      tamilName: 'ஸ்ட்ராபெர்ரி',
      description:
        'Low-growing fruiting plant producing sweet red berries; companion to spinach',
      varieties: ['Sweet Charlie', 'Festival', 'Local Hill'],
    },
    Broccoli: null,
  },
  herb: {
    Parsley: {
      tamilName: 'பார்சிலி',
      description: 'Slow-germinating biennial herb used as a garnish and flavouring',
    },
    Rosemary: {
      tamilName: 'ரோஸ்மேரி',
      description: 'Woody Mediterranean perennial with needle-like leaves and a piney fragrance',
    },
    Thyme: {
      tamilName: 'தைம்',
      description: 'Low-growing perennial herb with tiny aromatic leaves',
    },
    Oregano: {
      tamilName: 'ஓரிகானோ',
      description: 'Hardy perennial with peppery, slightly bitter leaves',
    },
    Sage: {
      tamilName: 'சேஜ்',
      description:
        'Woody perennial herb with grey-green aromatic leaves; used in companion planting to repel pests',
    },
  },
  flower: {
    Dahlia: {
      tamilName: 'டேலியா',
      description: 'Tuberous perennial producing spectacular multi-petalled blooms',
    },
    Orchid: {
      tamilName: 'ஆர்க்கிட்',
      description: 'Exotic epiphytic perennial grown for elegant long-lasting blooms',
    },
    Lily: null,
    Tulip: null,
  },
  shrub: {
    Lantana: {
      tamilName: 'உன்னிச்செடி',
      description:
        'Extremely hardy flowering shrub that thrives on neglect and attracts butterflies',
    },
    Gardenia: {
      tamilName: 'கொண்டை கத்தரி',
      description: 'Compact evergreen shrub with waxy, intensely fragrant white blooms',
    },
    Coleus: {
      tamilName: 'கொல்லியஸ்',
      description:
        'Ornamental shade-tolerant shrub used as living mulch in coconut intercrop systems',
    },
  },
  spinach: {
    Spinach: null,
    Saag: {
      tamilName: 'சாக்',
      description:
        'Leafy green blend used in traditional Tamil and North Indian cooking for its earthy, nutritious profile',
      varieties: ['Palak Saag', 'Mustard Saag', 'Mixed Saag', 'Traditional Saag'],
    },
    'Pusa Jyoti': {
      tamilName: 'புஷா ஜோதி',
      description:
        'High-yielding bold-leaved variety suited to cool and moderate climates across South India',
      varieties: ['CO 1', 'CO 2', 'Standard'],
    },
    'Hybrid Leafy': {
      tamilName: 'கலப்பின பசலை',
      description:
        'Modern hybrid combining fast growth, disease resistance, and tender leaf texture',
      varieties: ['Hybrid A', 'Hybrid B', 'Hybrid Premium'],
    },
    'Local Green': {
      tamilName: 'தமிழ்நாடு பசலை',
      description: 'Heritage variety adapted to Tamil Nadu climate with superior bolt resistance',
      varieties: ['Kanyakumari Local', 'Tamil Nadu Local', 'Traditional'],
    },
    'Pusa Green': {
      tamilName: 'புஷா பசலை',
      description: 'Cold-tolerant variety bred for winter gardens in tropical regions',
      varieties: ['PB 47', 'PB 51', 'Early Pusa'],
    },
    'Winter Spinach': {
      tamilName: 'குளிர்காலப் பசலை',
      description:
        'Frost-hardy variety optimised for December–March growing season in Kanyakumari',
      varieties: ['Winter Green', 'Cool Season', 'Frost Hardy'],
    },
    'Red Stem': {
      tamilName: 'சிவப்பு கிழங்கு பசலை',
      description:
        'Ornamental-edible variety with striking red veins and purple stems for aesthetic vegetable gardens',
      varieties: ['Red Veined', 'Purple Stem', 'Ornamental Red'],
    },
  },
};

/**
 * Catalog rows renamed with no migration behind them, and the name that won.
 *
 * `Pepper` became `Capsicum` at `6b67b53` — the Tamil name settled it, குடைமிளகாய்
 * is capsicum and மிளகாய் is chilli, so the two were never the same crop. Nothing
 * moved the data: `PLANT_NAME_ALIASES` keeps the old name *searchable*, which is
 * not the same as a stored profile or a garden plant finding its row. This is a
 * rename rather than a prune precisely because the plant still exists.
 *
 * Carries its own map, per the note on `MERGED_PLANT_NAMES`: an account already
 * past schema v7 never runs 007 again, so each pass declares what it merges.
 */
export const RENAMED_PLANT_NAMES_V13: Readonly<Record<string, string>> = {
  Pepper: 'Capsicum',
};

/** The category each survivor belongs to, since a rename may cross one. */
export const MERGED_SURVIVOR_TYPE_V13: Readonly<Record<string, PlantType>> = {
  Capsicum: 'vegetable',
};

const ALL_TYPES = CATEGORY_OPTIONS.map((opt) => opt.value) as PlantType[];

/**
 * The keys a seed-shaped entry may carry — the shape `buildDefaultProfiles`
 * produces, plus the two migration 003 adds. Anything else is the user's.
 */
const SEED_SHAPED_KEYS: ReadonlySet<string> = new Set([
  'plantType',
  'name',
  'tamilName',
  'description',
  'varieties',
  'isUserAdded',
  'cropFamily',
]);

/** Ordered comparison — a reordered variety list is still the user's edit. */
function sameVarieties(a: string[] | undefined, b: string[] | undefined): boolean {
  return (a ?? []).join(' ') === (b ?? []).join(' ');
}

/** Whether the stored entry is still exactly what the app last shipped. */
function matchesSeed(entry: PlantProfile, seed: RemovedPlantSeed): boolean {
  return (
    entry.tamilName === seed.tamilName &&
    entry.description === seed.description &&
    sameVarieties(entry.varieties, seed.varieties)
  );
}

/**
 * Fallback for the four scaffold names, which have no seed to compare against.
 *
 * An entry carrying nothing but the identity keys has never been opened in the
 * entry form — every care field the form writes falls outside the set, as does
 * `varietyDetails`. It is a weaker guard than a fingerprint, and the trade is
 * deliberate: the name it could misread is one a user created themselves,
 * spelled exactly like a dropped scaffold plant, and never edited. Such an
 * entry is still protected if any garden plant uses it, and the tombstone is
 * reversible in any case.
 */
function isSeedShaped(entry: PlantProfile): boolean {
  return Object.keys(entry).every((key) => SEED_SHAPED_KEYS.has(key));
}

/**
 * Tombstones stored entries for plants the bundled catalog no longer offers.
 *
 * Returns `null` when there is nothing to do, so the caller can skip the write.
 * Three things are left alone: an entry the user has edited away from its seed,
 * a name some garden plant is still planted as (its detail screen has to keep
 * resolving), and an entry already tombstoned — which is what makes a second
 * run a no-op.
 *
 * A tombstone, never a `delete`: the stored map reaches Firestore through a
 * merge, which cannot express a removed key, so a deleted name comes straight
 * back on the next sync. `plantProfileMutations.ts` sets that out in full.
 * `isDismissed` goes on top because the removal is permanent — these names have
 * no bundled record to restore, and `getHiddenPlantNames` already declines to
 * offer them.
 */
export function planRemovedCatalogPrune(
  profiles: PlantProfiles,
  removed: typeof REMOVED_CATALOG_PLANTS_V13,
  inUse: ReadonlySet<string>,
  now?: number
): PlantProfiles | null {
  let next = profiles;
  let changed = false;

  for (const [type, names] of Object.entries(removed) as [
    PlantType,
    Record<string, RemovedPlantSeed | null>,
  ][]) {
    for (const [name, seed] of Object.entries(names)) {
      const entry = profiles[type]?.[name];
      if (!entry || entry.isDeleted) continue;
      if (inUse.has(name)) continue;
      if (seed ? !matchesSeed(entry, seed) : !isSeedShaped(entry)) continue;

      next = applyProfileDismissal(applyProfileDeletion(next, type, name, now), type, name);
      changed = true;
    }
  }

  return changed ? next : null;
}

/**
 * Moves stored entries off a renamed catalog name and onto the surviving one.
 *
 * The user's edits travel with the entry. When the survivor already has an
 * entry of its own it wins and the old name is only tombstoned — overwriting it
 * would discard edits made under the name that is staying. Returns `null` when
 * nothing needed to change.
 */
export function planStrandedRename(
  profiles: PlantProfiles,
  renames: Readonly<Record<string, string>>,
  survivorTypes: Readonly<Record<string, PlantType>>,
  now?: number
): PlantProfiles | null {
  let next = profiles;
  let changed = false;

  for (const type of ALL_TYPES) {
    for (const [from, to] of Object.entries(renames)) {
      const entry = profiles[type]?.[from];
      if (!entry || entry.isDeleted) continue;

      const target = survivorTypes[to] ?? type;
      const existing = next[target]?.[to];
      if (!existing || existing.isDeleted) {
        next = {
          ...next,
          [target]: { ...next[target], [to]: { ...entry, name: to, plantType: target } },
        };
      }
      next = applyProfileDeletion(next, type, from, now);
      changed = true;
    }
  }

  return changed ? next : null;
}
