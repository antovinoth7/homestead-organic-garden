import {
  CatalogGroup,
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  HealthStatus,
  PlantHabit,
  PlantLifecycle,
  PlantTag,
  PlantType,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
  WaterRequirement,
} from '../types/database.types';
import { PLANT_CATEGORIES } from './plantCategories';
// Type-only — erased at build time, so this cannot create an import cycle.
import type { GrowthStageSource } from './plantHelpers';

/** The shared order — see `plantCategories.ts`. Aliased for the call sites below. */
const CATEGORY_ORDER = PLANT_CATEGORIES;

export const CATEGORY_LABELS: Record<PlantType, string> = {
  vegetable: 'Vegetable',
  fruit_tree: 'Fruit',
  spinach: 'Greens',
  coconut_tree: 'Coconut Tree',
  herb: 'Herb',
  flower: 'Flower',
  timber_tree: 'Timber Tree',
  shrub: 'Shrub',
};

/** Clean, emoji-free category names for headings (e.g. the detail hero). */
export const CATEGORY_FULL_LABELS: Record<PlantType, string> = {
  vegetable: 'Vegetable',
  fruit_tree: 'Fruit Tree',
  spinach: 'Greens',
  coconut_tree: 'Coconut Tree',
  herb: 'Herb',
  timber_tree: 'Timber Tree',
  flower: 'Flower',
  shrub: 'Shrub',
};

/**
 * Browse-group labels — the catalog pills and the Add Plant picker headers.
 *
 * Separate from `CATEGORY_LABELS`, which names a `PlantType` (the care model).
 * Both exist on purpose: a plant is browsed under "Fruits" while its care model
 * is still `fruit_tree`.
 */
export const CATALOG_GROUP_LABELS: Record<CatalogGroup, string> = {
  vegetables: 'Vegetables',
  greens: 'Greens',
  fruits: 'Fruits',
  spices: 'Spices',
  herbs_medicinal: 'Herbs & Medicinal',
  flowers: 'Flowers',
  farm_support: 'Support & Input Plants',
  plantation_timber: 'Plantation & Timber',
};

/**
 * Sub-group headers inside a group. Keyed by the sub-group ids in
 * `SUB_GROUP_ORDER`; `catalogTaxonomy.test.ts` checks the two agree.
 */
export const SUB_GROUP_LABELS: Record<string, string> = {
  // vegetables
  gourds_melons: 'Gourds & Melons',
  fruit_vegetables: 'Fruit Vegetables',
  beans_pods: 'Beans & Pods',
  pulses_oilseeds_cereals: 'Pulses, Oilseeds & Cereals',
  roots_tubers: 'Roots & Tubers',
  onion_family: 'Onion Family',
  cabbage_family: 'Cabbage Family',
  other: 'Other',
  // greens
  spinach: 'Spinach',
  keerai: 'Keerai & Leafy Greens',
  // fruits
  quick_fruits: 'Quick Fruits',
  orchard_trees: 'Orchard Trees',
  // spices
  rhizome: 'Rhizome Spices',
  vine_tree: 'Vine & Tree Spices',
  seed_clump: 'Seed & Clump Spices',
  // herbs_medicinal
  kitchen_herbs: 'Kitchen Herbs',
  medicinal: 'Medicinal',
  // flowers
  seasonal_flowers: 'Seasonal Flowers',
  flowering_shrubs: 'Flowering Shrubs & Climbers',
  // plantation_timber
  plantation_crops: 'Plantation Crops',
  timber_utility: 'Timber & Utility Trees',
};

/** Growth-habit badge text on a catalog row. */
export const HABIT_LABELS: Record<PlantHabit, string> = {
  annual_bed: 'Annual',
  perennial: 'Perennial',
  shrub: 'Shrub',
  tree: 'Tree',
  vine: 'Vine',
  palm: 'Palm',
  clump: 'Clump',
  aquatic: 'Aquatic',
};

/** Tag chip text. Also what catalog search matches on. */
export const TAG_LABELS: Record<PlantTag, string> = {
  keerai: 'Keerai',
  gourd: 'Gourd',
  pulse: 'Pulse',
  oilseed: 'Oilseed',
  cereal: 'Cereal',
  spice: 'Spice',
  medicinal: 'Medicinal',
  puja: 'Puja',
  companion: 'Companion',
  pest_repellent: 'Pest Repellent',
  green_manure: 'Green Manure',
  living_fence: 'Living Fence',
  coconut_intercrop: 'Coconut Intercrop',
  masticatory: 'Betel & Nut',
  container_ok: 'Grows in Pots',
  needs_trellis: 'Needs Trellis',
  tuber: 'Tuber',
  plantation: 'Plantation',
  timber: 'Timber',
  fruit: 'Fruit',
};

/**
 * Section headers for the catalog's Season grouping mode. Worded for what the
 * farmer does about it, not just the botanical term — rotation is the point.
 */
export const LIFECYCLE_SECTION_LABELS: Record<PlantLifecycle, string> = {
  annual: 'Annual — sow each season',
  biennial: 'Biennial — two seasons',
  perennial: 'Perennial — stays in the bed',
  permanent: 'Permanent — never cleared',
};

/** The order Season-mode sections appear in: shortest-lived first. */
export const LIFECYCLE_SECTION_ORDER: readonly PlantLifecycle[] = [
  'annual',
  'biennial',
  'perennial',
  'permanent',
];

export const WATER_REQUIREMENT_LABELS: Record<WaterRequirement, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const SUNLIGHT_LABELS: Record<SunlightLevel, string> = {
  full_sun: 'Full Sun',
  partial_sun: 'Partial Sun',
  shade: 'Shade',
};

export const SOIL_LABELS: Record<SoilType, string> = {
  garden_soil: 'Garden Soil',
  potting_mix: 'Potting Mix',
  coco_peat: 'Coco Peat',
  red_laterite: 'Red Laterite (Seivaal)',
  laterite: 'Laterite',
  coastal_sandy: 'Coastal Sandy',
  black_cotton: 'Black Cotton',
  alluvial: 'Alluvial',
  red_loam: 'Red Loam',
  clay_loam: 'Clay Loam',
  sandy_loam: 'Sandy Loam',
  custom: 'Custom',
};

export const FERTILISER_LABELS: Record<FertiliserType, string> = {
  compost: 'Compost',
  vermicompost: 'Vermicompost',
  cow_dung_slurry: 'Cow Dung Slurry',
  neem_cake: 'Neem Cake',
  panchagavya: 'Panchagavya',
  jeevamrutham: 'Jeevamrutham',
  groundnut_cake: 'Groundnut Cake',
  fish_emulsion: 'Fish Emulsion',
  seaweed: 'Seaweed',
  other: 'Other',
};

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seedling: 'Seedling',
  vegetative: 'Vegetative',
  flowering: 'Flowering',
  fruiting: 'Fruiting',
  dormant: 'Dormant',
  mature: 'Mature',
};

export const GROWTH_STAGE_DESCRIPTIONS: Record<GrowthStage, string> = {
  seedling:
    'Just germinated or transplanted — tender roots and first true leaves. Water lightly but often, and shade from harsh afternoon sun.',
  vegetative:
    'Putting on leaves, stems and roots. The main growth push — feed nitrogen-rich compost and keep the soil evenly moist.',
  flowering:
    'Buds and blooms have set. Ease off nitrogen, keep watering steady, and avoid disturbing the plant so pollination succeeds.',
  fruiting:
    'Fruit or pods are forming and filling out. Needs steady water and potassium-rich feeding; support any heavy branches.',
  dormant:
    'Resting between seasons with little visible growth. Cut watering back sharply and hold off on feeding until it wakes.',
  mature:
    'Fully grown and cropping steadily. Keep up routine care and harvest regularly to keep the yield coming.',
};

export const HEALTH_STATUS_DESCRIPTIONS: Record<HealthStatus, string> = {
  healthy: 'Plant looks good — no visible stress, pests, or disease. Growing normally.',
  stressed:
    'Early warning signs like wilting, yellowing tips, or slow growth — usually from environment.',
  recovering:
    'Previously stressed or sick, now improving. May still show some damage but new growth looks healthy.',
  sick: 'Active disease, fungal infection, rot, or heavy pest infestation. Needs treatment.',
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  stressed: 'Stressed',
  recovering: 'Recovering',
  sick: 'Sick',
};

/** Semantic tone per health status — maps onto the theme's colour quartets. */
export type StatusTone = 'success' | 'warning' | 'info' | 'error';

export const HEALTH_STATUS_TONE: Record<HealthStatus, StatusTone> = {
  healthy: 'success',
  stressed: 'warning',
  recovering: 'info',
  sick: 'error',
};

/**
 * Badge text for how a plant's growth stage was determined. Shared by the plant
 * detail screen and the edit form so both name the same source identically.
 */
export const GROWTH_STAGE_SOURCE_LABELS: Record<GrowthStageSource, string> = {
  pinned: 'Pinned',
  coconut: 'Age-based',
  annual_cycle: 'Annual cycle',
  computed: 'Auto',
  manual: 'Manual',
};

/**
 * Explains how the stage was arrived at. `manual` is absent — it depends on
 * *why* nothing could be derived, so the caller words that one itself.
 */
export const GROWTH_STAGE_SOURCE_HINTS: Record<
  Exclude<GrowthStageSource, 'manual'>,
  string
> = {
  pinned: 'You set this stage yourself — it overrides the automatic one.',
  coconut: 'Worked out from the age of the tree.',
  annual_cycle: "Follows this tree's yearly flowering and fruiting cycle.",
  computed: "Worked out from the planting date and this plant's care profile.",
};

export const LIFECYCLE_LABELS: Record<PlantLifecycle, string> = {
  annual: 'Annual',
  biennial: 'Biennial',
  perennial: 'Perennial',
  permanent: 'Permanent',
};

export const LIFECYCLE_DESCRIPTIONS: Record<PlantLifecycle, string> = {
  annual: 'Completes its full life cycle in one growing season — sow, grow, harvest, then dies',
  biennial: 'Takes two growing seasons to flower and complete its life cycle',
  perennial: 'Lives for many years and regrows each season without replanting',
  permanent: 'A permanent farm asset — never rotated or cleared from the land',
};

export const GROWING_SEASON_OPTIONS: { label: string; value: string }[] = [
  { label: 'Year Round', value: 'Year Round' },
  { label: 'Kharif — Southwest Monsoon (Jun–Sep)', value: 'Kharif (Jun–Sep)' },
  { label: 'Rabi — Winter (Oct–Jan)', value: 'Rabi (Oct–Jan)' },
  { label: 'Summer (Feb–May)', value: 'Summer (Feb–May)' },
  { label: 'Northeast Monsoon (Oct–Dec)', value: 'Northeast Monsoon (Oct–Dec)' },
  { label: 'Kharif + Rabi', value: 'Kharif + Rabi' },
  { label: 'Rabi + Summer', value: 'Rabi + Summer' },
];

export const TOLERANCE_LABELS: Record<ToleranceLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const FEEDING_INTENSITY_LABELS: Record<FeedingIntensity, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export const FEEDING_INTENSITY_SUGGESTED_DAYS: Record<FeedingIntensity, number> = {
  light: 60,
  medium: 30,
  heavy: 14,
};

export const LOCATION_SOIL_TYPES: SoilType[] = [
  'red_laterite',
  'black_cotton',
  'coastal_sandy',
  'alluvial',
  'garden_soil',
];

// ─── Form option generators (derive from labels to avoid duplication) ───────

export const CATEGORY_OPTIONS = CATEGORY_ORDER.map((value) => ({
  label: CATEGORY_LABELS[value],
  value,
}));
