/**
 * The plant catalog's browse taxonomy: the single source of truth for which
 * group, sub-group, growth habit, rotation family and tags a plant carries.
 *
 * Three axes, deliberately separate — conflating them is what made the old
 * eight `PlantType` pills read wrong (`shrub` is a habit, `coconut_tree` is one
 * species, and `vegetable` held 36% of the catalog):
 *
 *   1. `PlantType`    — the CARE model. Which growth-stage model, pest set and
 *                       task cadence apply. Persisted on every garden plant.
 *                       Untouched by this module.
 *   2. `CatalogGroup` — what you HARVEST it for. Owns the browse pills, because
 *                       purpose is the one axis a farmer and a cook agree on.
 *   3. `PlantHabit` + `PlantTag` — everything a single hierarchy cannot hold.
 *                       Drumstick is a tree harvested as a vegetable; Agathi is
 *                       green manure, keerai and fence at once.
 *
 * Keyed by `toLookupKey`/`getCanonicalPlantKey` (`@/utils/plantAliases`) rather
 * than stored as fields on `DEFAULT_PLANT_CATALOG`, so a 46-name `plants: string[]`
 * stays readable and every user spelling the alias table knows resolves for free.
 *
 * `cropFamily` is NOT listed per plant: it is derived at lookup from the care
 * profile's own `taxonomicFamily` through `BOTANICAL_TO_CROP_FAMILY`, so the
 * botanical fact is stated once and cannot drift from the rotation value.
 *
 * `catalogTaxonomy.test.ts` fails the build if any catalog plant is missing here,
 * if any key here is not a catalog plant, or if any sub-group is undeclared — the
 * same drift guard the alias table earned after three partial copies of it had to
 * be merged.
 */

import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import type {
  CatalogGroup,
  CatalogTaxonomyEntry,
  CropFamily,
  PlantHabit,
  PlantTag,
  PlantType,
} from '@/types/database.types';

/** Browse facts for one plant. `cropFamily` is composed in `getTaxonomy`. */
type TaxonomyRow = Omit<CatalogTaxonomyEntry, 'cropFamily'>;

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
 * ungrouped run — splitting five plants would add headers, not meaning.
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
 * Botanical family → rotation family.
 *
 * Only families holding crops grown in a rotated bed get their own value; an
 * orchard is never rotated, so tree and palm families map to `other` on purpose
 * rather than for lack of care. `flower` is the existing catch-all for
 * ornamentals, which the rotation rules already treat as a group.
 */
export const BOTANICAL_TO_CROP_FAMILY: Readonly<Record<string, CropFamily>> = {
  Solanaceae: 'solanaceae',
  Cucurbitaceae: 'cucurbit',
  Fabaceae: 'legume',
  Brassicaceae: 'brassica',
  Amaryllidaceae: 'allium',
  Apiaceae: 'apiaceae',
  Lamiaceae: 'lamiaceae',
  Amaranthaceae: 'amaranthaceae',
  Malvaceae: 'malvaceae',
  Convolvulaceae: 'convolvulaceae',
  Araceae: 'araceae',
  Zingiberaceae: 'zingiberaceae',
  Poaceae: 'poaceae',
  // Ornamentals — the rotation rules already bucket these together.
  Apocynaceae: 'flower',
  Asteraceae: 'flower',
  Nyctaginaceae: 'flower',
  Oleaceae: 'flower',
  Rosaceae: 'flower',
  Rubiaceae: 'flower',
};

/**
 * Fallback group for a user-added plant, which has a `PlantType` but no row
 * here. `shrub` lands in `flowers` because that is where the bundled ornamental
 * shrubs went; `spices` has no type of its own, so `herb` resolves to
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

/** Habit fallback for a user-added plant with no row here. */
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
 * Every bundled catalog plant, keyed by canonical lookup key.
 *
 * Sub-group notes worth keeping in view:
 * - `gourds_melons` holds Watermelon and Muskmelon: both are warm-season
 *   trailing cucurbits grown and rotated exactly like the gourds beside them.
 *   Tagged `fruit` so a fruit filter still finds them.
 * - `pulses_oilseeds_cereals` is the crops harvested DRY — unlike the fresh pods
 *   in `beans_pods`. Four entries, so it earns a sub-group but not a pill.
 * - `spinach` means the spinach-type greens as a cook uses the word. Only Palak
 *   is true spinach (Spinacia oleracea); Water Spinach is Ipomoea aquatica and
 *   Pasalai Keerai is Basella alba, i.e. Malabar spinach. Both carry "spinach"
 *   in their common name and cook the same way. This is a usage grouping, not a
 *   botanical claim — rotation reads `cropFamily`, which keeps them apart.
 * - `quick_fruits` crop in 1-2 years and are replanted or ratooned; none of the
 *   five is a tree. That distinction is what a farmer plans around.
 * - `farm_support` plants are not harvested as food at all — they fix nitrogen,
 *   hold bunds, fence the plot or go into a pest spray.
 * - The four coconuts stay four entries. They look like varieties of one palm,
 *   but each already carries its own variety list (Dwarf Coconut → Chowghat
 *   Orange Dwarf, …), its own Tamil name, and materially different care: first
 *   harvest at 3 / 6 / 4 / 4 years and mature height 5-8 m / 15-30 m / 8-20 m /
 *   8-18 m. Choosing Dwarf over Tall is a real planting decision on a homestead,
 *   so collapsing them would hide it behind a label.
 */
export const PLANT_TAXONOMY: Readonly<Record<string, TaxonomyRow>> = {
  // ── vegetables ─────────────────────────────────────────────────────────────
  // gourds_melons
  'ash gourd': { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd'] },
  'bitter gourd': { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'needs_trellis'] },
  'bottle gourd': { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'needs_trellis'] },
  cucumber: { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'needs_trellis'] },
  muskmelon: { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'fruit'] },
  pumpkin: { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd'] },
  'ridge gourd': { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'needs_trellis'] },
  'snake gourd': { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'needs_trellis'] },
  watermelon: { group: 'vegetables', subGroup: 'gourds_melons', habit: 'vine', tags: ['gourd', 'fruit'] },
  // fruit_vegetables
  brinjal: { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: ['container_ok'] },
  capsicum: { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: ['container_ok'] },
  chilli: { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: ['spice', 'container_ok'] },
  'ladies finger': { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: [] },
  'long brinjal': { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: ['container_ok'] },
  tomato: { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed', tags: ['container_ok'] },
  // beans_pods
  beans: { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  'cluster beans': { group: 'vegetables', subGroup: 'beans_pods', habit: 'annual_bed', tags: ['pulse'] },
  cowpea: { group: 'vegetables', subGroup: 'beans_pods', habit: 'annual_bed', tags: ['pulse'] },
  'french beans': { group: 'vegetables', subGroup: 'beans_pods', habit: 'annual_bed', tags: ['pulse'] },
  'green peas': { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  'lablab bean': { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  'sword bean': { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  'winged bean': { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  'yardlong beans': { group: 'vegetables', subGroup: 'beans_pods', habit: 'vine', tags: ['pulse', 'needs_trellis'] },
  // pulses_oilseeds_cereals
  'black gram': { group: 'vegetables', subGroup: 'pulses_oilseeds_cereals', habit: 'annual_bed', tags: ['pulse'] },
  groundnut: { group: 'vegetables', subGroup: 'pulses_oilseeds_cereals', habit: 'annual_bed', tags: ['pulse', 'oilseed'] },
  maize: { group: 'vegetables', subGroup: 'pulses_oilseeds_cereals', habit: 'annual_bed', tags: ['cereal', 'companion'] },
  'pigeon pea': { group: 'vegetables', subGroup: 'pulses_oilseeds_cereals', habit: 'perennial', tags: ['pulse', 'companion'] },
  // roots_tubers
  beetroot: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'annual_bed', tags: [] },
  carrot: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'annual_bed', tags: [] },
  'elephant yam': { group: 'vegetables', subGroup: 'roots_tubers', habit: 'perennial', tags: ['tuber'] },
  'lotus stem': { group: 'vegetables', subGroup: 'roots_tubers', habit: 'aquatic', tags: ['tuber'] },
  potato: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'annual_bed', tags: ['tuber'] },
  radish: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'annual_bed', tags: [] },
  'sweet potato': { group: 'vegetables', subGroup: 'roots_tubers', habit: 'vine', tags: ['tuber'] },
  tapioca: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'shrub', tags: ['tuber'] },
  taro: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'perennial', tags: ['tuber'] },
  yam: { group: 'vegetables', subGroup: 'roots_tubers', habit: 'vine', tags: ['tuber'] },
  // onion_family
  garlic: { group: 'vegetables', subGroup: 'onion_family', habit: 'annual_bed', tags: ['spice'] },
  onion: { group: 'vegetables', subGroup: 'onion_family', habit: 'annual_bed', tags: [] },
  shallot: { group: 'vegetables', subGroup: 'onion_family', habit: 'annual_bed', tags: [] },
  // cabbage_family
  cabbage: { group: 'vegetables', subGroup: 'cabbage_family', habit: 'annual_bed', tags: [] },
  cauliflower: { group: 'vegetables', subGroup: 'cabbage_family', habit: 'annual_bed', tags: [] },
  'knol khol': { group: 'vegetables', subGroup: 'cabbage_family', habit: 'annual_bed', tags: [] },
  // other
  'ash plantain': { group: 'vegetables', subGroup: 'other', habit: 'clump', tags: [] },
  drumstick: { group: 'vegetables', subGroup: 'other', habit: 'tree', tags: ['keerai', 'companion'] },

  // ── greens ─────────────────────────────────────────────────────────────
  // spinach
  palak: { group: 'greens', subGroup: 'spinach', habit: 'annual_bed', tags: [] },
  'pasalai keerai': { group: 'greens', subGroup: 'spinach', habit: 'vine', tags: ['keerai'] },
  'water spinach': { group: 'greens', subGroup: 'spinach', habit: 'aquatic', tags: ['keerai'] },
  // keerai
  amaranthus: { group: 'greens', subGroup: 'keerai', habit: 'annual_bed', tags: ['keerai'] },
  fenugreek: { group: 'greens', subGroup: 'keerai', habit: 'annual_bed', tags: ['keerai', 'spice'] },
  'manathakkali keerai': { group: 'greens', subGroup: 'keerai', habit: 'annual_bed', tags: ['keerai', 'medicinal'] },
  'mustard greens': { group: 'greens', subGroup: 'keerai', habit: 'annual_bed', tags: [] },
  'ponnanganni keerai': { group: 'greens', subGroup: 'keerai', habit: 'perennial', tags: ['keerai', 'medicinal'] },
  purslane: { group: 'greens', subGroup: 'keerai', habit: 'annual_bed', tags: ['keerai'] },
  'vallarai keerai': { group: 'greens', subGroup: 'keerai', habit: 'perennial', tags: ['keerai', 'medicinal'] },

  // ── fruits ─────────────────────────────────────────────────────────────
  // quick_fruits
  banana: { group: 'fruits', subGroup: 'quick_fruits', habit: 'clump', tags: ['coconut_intercrop'] },
  papaya: { group: 'fruits', subGroup: 'quick_fruits', habit: 'perennial', tags: [] },
  'passion fruit': { group: 'fruits', subGroup: 'quick_fruits', habit: 'vine', tags: ['needs_trellis'] },
  pineapple: { group: 'fruits', subGroup: 'quick_fruits', habit: 'perennial', tags: ['coconut_intercrop'] },
  'red banana': { group: 'fruits', subGroup: 'quick_fruits', habit: 'clump', tags: ['coconut_intercrop'] },
  // orchard_trees
  amla: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: ['medicinal'] },
  avocado: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  breadfruit: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  chikoo: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  'custard apple': { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  fig: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  guava: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  jackfruit: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  lemon: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  mango: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  mangosteen: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  orange: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  pomegranate: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  rambutan: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  soursop: { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  'star fruit': { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },
  'water apple': { group: 'fruits', subGroup: 'orchard_trees', habit: 'tree', tags: [] },

  // ── spices ─────────────────────────────────────────────────────────────
  // rhizome
  ginger: { group: 'spices', subGroup: 'rhizome', habit: 'perennial', tags: ['spice', 'medicinal'] },
  turmeric: { group: 'spices', subGroup: 'rhizome', habit: 'perennial', tags: ['spice', 'medicinal'] },
  // vine_tree
  'black pepper': { group: 'spices', subGroup: 'vine_tree', habit: 'vine', tags: ['spice', 'coconut_intercrop', 'needs_trellis'] },
  nutmeg: { group: 'spices', subGroup: 'vine_tree', habit: 'tree', tags: ['spice', 'coconut_intercrop'] },
  // seed_clump
  ajwain: { group: 'spices', subGroup: 'seed_clump', habit: 'annual_bed', tags: ['spice', 'medicinal'] },
  cardamom: { group: 'spices', subGroup: 'seed_clump', habit: 'clump', tags: ['spice'] },
  fennel: { group: 'spices', subGroup: 'seed_clump', habit: 'annual_bed', tags: ['spice'] },

  // ── herbs_medicinal ─────────────────────────────────────────────────────────────
  // kitchen_herbs
  basil: { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'annual_bed', tags: ['container_ok'] },
  coriander: { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'annual_bed', tags: ['spice'] },
  'curry leaf': { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'tree', tags: [] },
  dill: { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'annual_bed', tags: [] },
  lemongrass: { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'clump', tags: ['medicinal'] },
  mint: { group: 'herbs_medicinal', subGroup: 'kitchen_herbs', habit: 'perennial', tags: ['container_ok'] },
  // medicinal
  adathodai: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'shrub', tags: ['medicinal'] },
  'aloe vera': { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'perennial', tags: ['medicinal'] },
  ashwagandha: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'shrub', tags: ['medicinal'] },
  'betel leaf': { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'vine', tags: ['masticatory', 'medicinal'] },
  brahmi: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'perennial', tags: ['medicinal'] },
  karpooravalli: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'perennial', tags: ['medicinal'] },
  nithyakalyani: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'shrub', tags: ['medicinal', 'puja'] },
  thoothuvalai: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'vine', tags: ['medicinal'] },
  tulsi: { group: 'herbs_medicinal', subGroup: 'medicinal', habit: 'shrub', tags: ['medicinal', 'puja'] },

  // ── flowers ─────────────────────────────────────────────────────────────
  // seasonal_flowers
  chrysanthemum: { group: 'flowers', subGroup: 'seasonal_flowers', habit: 'annual_bed', tags: ['puja'] },
  marigold: { group: 'flowers', subGroup: 'seasonal_flowers', habit: 'annual_bed', tags: ['puja', 'companion', 'pest_repellent'] },
  sunflower: { group: 'flowers', subGroup: 'seasonal_flowers', habit: 'annual_bed', tags: [] },
  // flowering_shrubs
  arali: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja'] },
  bougainvillea: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'vine', tags: [] },
  crossandra: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'perennial', tags: ['puja'] },
  hibiscus: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja', 'medicinal'] },
  ixora: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja'] },
  jasmine: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja'] },
  nandiyavattai: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja'] },
  rose: { group: 'flowers', subGroup: 'flowering_shrubs', habit: 'shrub', tags: ['puja'] },

  // ── farm_support ─────────────────────────────────────────────────────────────
  aavaram: { group: 'farm_support', habit: 'shrub', tags: ['green_manure', 'living_fence'] },
  agathi: { group: 'farm_support', habit: 'tree', tags: ['green_manure', 'keerai', 'living_fence', 'companion'] },
  castor: { group: 'farm_support', habit: 'shrub', tags: ['pest_repellent', 'companion', 'oilseed'] },
  maruthani: { group: 'farm_support', habit: 'shrub', tags: ['living_fence'] },
  nochi: { group: 'farm_support', habit: 'shrub', tags: ['pest_repellent', 'medicinal'] },

  // ── plantation_timber ─────────────────────────────────────────────────────────────
  // plantation_crops
  arecanut: { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'palm', tags: ['plantation', 'masticatory', 'coconut_intercrop'] },
  cocoa: { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'tree', tags: ['plantation', 'coconut_intercrop'] },
  'dwarf coconut': { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'palm', tags: ['plantation'] },
  'hybrid coconut': { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'palm', tags: ['plantation'] },
  'king coconut': { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'palm', tags: ['plantation'] },
  'tall coconut': { group: 'plantation_timber', subGroup: 'plantation_crops', habit: 'palm', tags: ['plantation'] },
  // timber_utility
  bamboo: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'clump', tags: ['timber'] },
  mahogany: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber'] },
  neem: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber', 'pest_repellent', 'companion', 'medicinal'] },
  rosewood: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber'] },
  sandalwood: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber'] },
  teak: { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber'] },
  'wild jack': { group: 'plantation_timber', subGroup: 'timber_utility', habit: 'tree', tags: ['timber'] },
};

/**
 * Lookup key → the catalog's own spelling of the name.
 *
 * Care-profile keys are built from the display name (`vegetable:Tomato`), so a
 * caller passing "tomato", "  TOMATO  " or an alias like "Okra" needs resolving
 * to the catalog spelling first. `cropFamilyFromName` is called with names typed
 * by the user, so this is not a nicety.
 */
const CANONICAL_DISPLAY_NAME: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const category of Object.values(DEFAULT_PLANT_CATALOG.categories)) {
    for (const name of category.plants) {
      const key = getCanonicalPlantKey(name);
      if (key) map[key] = name;
    }
  }
  return map;
})();

/** The catalog's spelling of a name, resolving case and aliases. */
export function getCanonicalPlantName(plantName: string): string {
  const key = getCanonicalPlantKey(plantName);
  return (key && CANONICAL_DISPLAY_NAME[key]) || plantName;
}

/**
 * Rotation family for a plant, from its care profile's botanical family.
 *
 * Returns `other` when the family is unmapped or the plant has no profile —
 * which is also the right answer for trees and palms, since an orchard is not
 * rotated.
 */
export function getCropFamily(plantName: string, plantType: PlantType): CropFamily {
  const family = getPlantCareProfile(
    getCanonicalPlantName(plantName),
    plantType
  )?.taxonomicFamily;
  if (!family) return 'other';
  return BOTANICAL_TO_CROP_FAMILY[family] ?? 'other';
}

/**
 * Where a plant sits in the browse taxonomy.
 *
 * A bundled plant resolves through `PLANT_TAXONOMY` (via the alias table, so
 * "Okra" finds Ladies Finger). A plant the user added themselves has no row, so
 * it falls back to its `PlantType` — landing in that group's ungrouped run with
 * no sub-group, rather than being dropped from the list.
 */
export function getTaxonomy(plantName: string, plantType: PlantType): CatalogTaxonomyEntry {
  const key = getCanonicalPlantKey(plantName);
  const row = key ? PLANT_TAXONOMY[key] : undefined;
  const cropFamily = getCropFamily(plantName, plantType);

  if (!row) {
    return {
      group: PLANT_TYPE_TO_GROUP[plantType],
      habit: HABIT_BY_PLANT_TYPE[plantType],
      cropFamily,
      tags: [],
    };
  }

  return { ...row, cropFamily };
}

/** Every tag on a plant, for search to match on. */
export function getPlantTags(plantName: string, plantType: PlantType): readonly PlantTag[] {
  return getTaxonomy(plantName, plantType).tags;
}

/**
 * Names the taxonomy knows, for the drift test. Kept here rather than in the
 * test so the test cannot quietly diverge from what the module exposes.
 */
export function getTaxonomyKeys(): string[] {
  return Object.keys(PLANT_TAXONOMY);
}

/** Every catalog plant name, across every `PlantType`. For the drift test. */
export function getAllCatalogPlantNames(): string[] {
  return Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap((category) => category.plants);
}
