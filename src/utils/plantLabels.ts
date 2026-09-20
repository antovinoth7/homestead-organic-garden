import {
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  HealthStatus,
  PlantLifecycle,
  PlantType,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
  WaterRequirement,
} from '../types/database.types';
// Type-only — erased at build time, so this cannot create an import cycle.
import type { GrowthStageSource } from './plantHelpers';

const CATEGORY_ORDER: PlantType[] = [
  'vegetable',
  'fruit_tree',
  'spinach',
  'coconut_tree',
  'herb',
  'timber_tree',
  'flower',
  'shrub',
];

export const CATEGORY_LABELS: Record<PlantType, string> = {
  vegetable: 'Vegetable',
  fruit_tree: 'Fruit',
  spinach: 'Spinach',
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
  spinach: 'Spinach',
  coconut_tree: 'Coconut Tree',
  herb: 'Herb',
  timber_tree: 'Timber Tree',
  flower: 'Flower',
  shrub: 'Shrub',
};

export const CATEGORY_SHORT_LABELS: Record<PlantType, string> = {
  vegetable: 'Veg',
  herb: 'Herb',
  flower: 'Flwr',
  fruit_tree: 'Fruit',
  timber_tree: 'Tmbr',
  coconut_tree: 'Coco',
  shrub: 'Shrb',
  spinach: 'Spinach',
};

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
