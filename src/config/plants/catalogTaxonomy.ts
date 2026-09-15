/**
 * How the catalog is browsed, read off the catalog rows themselves.
 *
 * Three axes, deliberately separate — conflating them is what made the old
 * eight pills read wrong (`shrub` is a habit, `coconut_tree` is one species, and
 * `vegetable` held a third of the rows):
 *
 *   1. `PlantType`    — the CARE model. Which growth-stage model, pest set and
 *                       task cadence apply. Persisted on every garden plant.
 *   2. `CatalogGroup` — what you HARVEST it for. Owns the browse pills, because
 *                       purpose is the one axis a farmer and a cook agree on.
 *   3. `PlantHabit` + `PlantTag` — everything one hierarchy cannot hold.
 *
 * Castor is the clearest case of the split: `plantType: 'herb'` because that is
 * how it is cared for, `group: 'farm_support'` because it is grown to repel
 * pests around the vegetable beds.
 *
 * The fields live on `PlantCatalogEntry` rather than in a map here, so a row is
 * still declared in exactly one place — the property `plantCatalog/types.ts`
 * establishes. This module only indexes them and answers lookups.
 */

import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import type {
  CatalogGroup,
  CatalogTaxonomyEntry,
  PlantHabit,
  PlantTag,
  PlantType,
} from '@/types/database.types';

/** Pill order, left to right. Purpose-ordered: what a homestead grows most of first. */
export const CATALOG_GROUP_ORDER: readonly CatalogGroup[] = [
  'vegetables',
  'greens',
  'fruits',
  'spices',
  'herbs_medicinal',
  'flowers',
  'farm_support',
  'plantation_timber',
];

/**
 * Sub-group order within each group. A group with an empty list renders as one
 * ungrouped run — splitting five rows would add headers, not meaning.
 *
 * Sub-group notes worth keeping in view:
 * - `gourds_melons` holds Watermelon and Muskmelon: both are warm-season
 *   trailing cucurbits grown, trellised and rotated exactly like the gourds
 *   beside them. Tagged `fruit` so a fruit filter still finds them.
 * - `pulses_oilseeds_cereals` is the crops harvested DRY, unlike the fresh pods
 *   in `beans_pods`.
 * - `spinach` means the spinach-type greens as a cook uses the word. Only Palak
 *   is true spinach (Spinacia oleracea); Water Spinach is Ipomoea aquatica and
 *   Pasalai Keerai is Basella alba, i.e. Malabar spinach. Both carry "spinach"
 *   in their common name and cook the same way. A usage grouping, not a
 *   botanical claim — rotation reads `cropFamily`, which keeps them apart.
 * - `quick_fruits` crop in 1-2 years and are replanted or ratooned; none of the
 *   five is a tree. That distinction is what a farmer plans around.
 * - `farm_support` rows are not harvested as food at all — they fix nitrogen,
 *   hold bunds, fence the plot or go into a pest spray.
 */
export const SUB_GROUP_ORDER: Readonly<Record<CatalogGroup, readonly string[]>> = {
  vegetables: [
    'gourds_melons',
    'fruit_vegetables',
    'beans_pods',
    'pulses_oilseeds_cereals',
    'roots_tubers',
    'onion_family',
    'cabbage_family',
    'other',
  ],
  greens: ['spinach', 'keerai'],
  fruits: ['quick_fruits', 'orchard_trees'],
  spices: ['rhizome', 'vine_tree', 'seed_clump'],
  herbs_medicinal: ['kitchen_herbs', 'medicinal'],
  flowers: ['seasonal_flowers', 'flowering_shrubs'],
  farm_support: [],
  plantation_timber: ['plantation_crops', 'timber_utility'],
};

/**
 * Fallback group for a user-added plant, which has a `PlantType` but no catalog
 * row. `shrub` lands in `flowers` because that is where the bundled ornamental
 * shrubs go; `spices` has no type of its own, so `herb` resolves to
 * `herbs_medicinal` and the user can re-file it.
 */
export const PLANT_TYPE_TO_GROUP: Readonly<Record<PlantType, CatalogGroup>> = {
  vegetable: 'vegetables',
  spinach: 'greens',
  fruit_tree: 'fruits',
  herb: 'herbs_medicinal',
  flower: 'flowers',
  shrub: 'flowers',
  timber_tree: 'plantation_timber',
  coconut_tree: 'plantation_timber',
};

/**
 * The `PlantType` a plant created from a given group's tab should default to.
 * A group can span several care models (Fruits holds both `fruit_tree` trees and
 * herbaceous quick fruits), so this is only a starting value — the catalog entry
 * form lets it be corrected.
 */
export const CATALOG_GROUP_DEFAULT_TYPE: Readonly<Record<CatalogGroup, PlantType>> = {
  vegetables: 'vegetable',
  greens: 'spinach',
  fruits: 'fruit_tree',
  spices: 'herb',
  herbs_medicinal: 'herb',
  flowers: 'flower',
  farm_support: 'shrub',
  plantation_timber: 'timber_tree',
};

/** Habit fallback for a user-added plant with no catalog row. */
const HABIT_BY_PLANT_TYPE: Readonly<Record<PlantType, PlantHabit>> = {
  vegetable: 'annual_bed',
  spinach: 'annual_bed',
  fruit_tree: 'tree',
  herb: 'perennial',
  flower: 'annual_bed',
  shrub: 'shrub',
  timber_tree: 'tree',
  coconut_tree: 'palm',
};

/**
 * Canonical lookup key → the row's taxonomy. Built once off the catalog, so it
 * cannot drift from it; the alias table means "Okra" and "Methi" resolve too.
 */
const BY_KEY: ReadonlyMap<string, CatalogTaxonomyEntry> = new Map(
  PLANT_CATALOG_ENTRIES.flatMap((entry) => {
    const key = getCanonicalPlantKey(entry.name);
    if (!key) return [];
    return [
      [
        key,
        {
          group: entry.group,
          subGroup: entry.subGroup,
          habit: entry.habit,
          cropFamily: entry.cropFamily,
          tags: entry.tags,
        },
      ] as const,
    ];
  })
);

/**
 * Where a plant sits in the browse taxonomy.
 *
 * A bundled plant resolves through its catalog row. A plant the user added
 * themselves has none, so it falls back to its `PlantType` — landing in that
 * group's ungrouped run with no sub-group, rather than dropping off the list.
 */
export function getTaxonomy(plantName: string, plantType: PlantType): CatalogTaxonomyEntry {
  const key = getCanonicalPlantKey(plantName);
  const row = key ? BY_KEY.get(key) : undefined;
  if (row) return row;

  return {
    group: PLANT_TYPE_TO_GROUP[plantType],
    habit: HABIT_BY_PLANT_TYPE[plantType],
    // `other` is the honest answer for a plant the catalog does not know: the
    // rotation check treats it as "no signal" rather than as a shared family.
    cropFamily: 'other',
    tags: [],
  };
}

/** Every tag on a plant, for search to match on. */
export function getPlantTags(plantName: string, plantType: PlantType): readonly PlantTag[] {
  return getTaxonomy(plantName, plantType).tags;
}
