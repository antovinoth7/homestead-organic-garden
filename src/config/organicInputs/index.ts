/**
 * Organic Input reference registry.
 * Exposes fertilizers, amendments, and growth promoters with zone-specific guidance.
 */

import type { OrganicInputEntry, OrganicInputCategory } from '@/types/database.types';
export type { OrganicInputRecipe, RecipeIngredient, RecipeId } from './recipes';
export { ORGANIC_RECIPES, getRecipeById } from './recipes';

// ─── Data ────────────────────────────────────────────────────────────────────

const ALL_ORGANIC_INPUTS: OrganicInputEntry[] = [
  {
    id: 'compost_basic',
    name: 'Compost',
    tamilName: 'உரமாக்கிய கழிவு',
    category: 'fertilizers',
    emoji: '🌱',
    description: 'Decomposed organic matter rich in nutrients and beneficial microbes',
    ingredients: ['plant residues', 'animal manure', 'kitchen waste'],
    applicationRate: '2-4 tonnes per hectare',
    applicationTiming: 'Before planting or as side dressing',
    benefits: [
      'Improves soil structure',
      'Increases water retention',
      'Enhances microbial activity',
    ],
    precautions: ['Must be fully decomposed', 'Avoid fresh/hot compost near plants'],
    storageTips: 'Keep in covered heap away from rain',
    plantsIdeal: ['leafy', 'herbs', 'vegetables'],
  },
  {
    id: 'farmyard_manure',
    name: 'Farmyard Manure',
    tamilName: 'கால்நடை உரம்',
    category: 'fertilizers',
    emoji: '🐄',
    description: 'Aged animal waste mixed with bedding material',
    ingredients: ['cattle dung', 'poultry waste', 'straw'],
    applicationRate: '5-10 tonnes per hectare',
    applicationTiming: '3-4 weeks before planting',
    benefits: ['Slow nutrient release', 'Improves soil texture', 'Cost-effective'],
    precautions: ['Must be aged 4-6 weeks', 'Check for weed seeds'],
    storageTips: 'Stack in shade to prevent nutrient loss',
    plantsIdeal: ['root crops', 'tubers', 'greens'],
  },
  {
    id: 'vermicompost',
    name: 'Vermicompost',
    tamilName: 'புழு உரம்',
    category: 'fertilizers',
    emoji: '🪱',
    description: 'Nutrient-rich castings from earthworm decomposition',
    ingredients: ['plant waste', 'earthworm excreta'],
    applicationRate: '1-2 tonnes per hectare',
    applicationTiming: 'Anytime during growing season',
    benefits: ['High bioavailability', 'Gentle on plants', 'Rich in beneficial organisms'],
    precautions: ['Expensive but efficient', 'Keep moist'],
    storageTips: 'Store in cool, moist conditions',
    plantsIdeal: ['all crops'],
  },
  {
    id: 'seaweed_extract',
    name: 'Seaweed Extract',
    tamilName: 'கடல் புற்கள் சாற்று',
    category: 'growth_promoters',
    emoji: '🌊',
    description: 'Natural growth hormone and micronutrient extract from seaweed',
    applicationRate: '5-10 litres per hectare (diluted)',
    applicationTiming: 'Foliar spray every 2-3 weeks',
    benefits: ['Enhances growth', 'Stress tolerance', 'Rich in trace minerals'],
    precautions: ['Always dilute', 'Apply in early morning or late afternoon'],
    storageTips: 'Refrigerate concentrate after opening',
    plantsIdeal: ['fruiting', 'herbs', 'flowers'],
  },
  {
    id: 'jeevamrutha',
    name: 'Jeevamrutha',
    tamilName: 'ஜீவ அம்ருத',
    category: 'growth_promoters',
    emoji: '🌾',
    description: 'Ancient Indian biofertilizer promoting microbial soil life',
    ingredients: ['cow dung', 'cow urine', 'jaggery', 'flour', 'soil', 'water'],
    applicationRate: '200 litres per hectare',
    applicationTiming: 'Once every 2 weeks during monsoon',
    benefits: ['Boosts beneficial microbes', 'Free to prepare', 'Culturally significant'],
    precautions: ['Use within 7 days of preparation', 'Stir before use'],
    storageTips: 'Prepare fresh in earthen pot',
    plantsIdeal: ['all crops'],
    recipeId: 'jeevamrutha',
  },
  {
    id: 'panchagavya',
    name: 'Panchagavya',
    tamilName: 'பஞ்சகவ்யா',
    category: 'growth_promoters',
    emoji: '🥛',
    description: 'Fermented blend of five cow products that boosts immunity and fruiting',
    ingredients: ['cow dung', 'cow urine', 'milk', 'curd', 'ghee', 'jaggery', 'banana'],
    applicationRate: '3% foliar spray (30 mL per litre) or 5% soil drench',
    applicationTiming: 'Every 15 days during active growth',
    benefits: [
      'Improves flowering and fruit set',
      'Strengthens plant immunity',
      'Keeps for up to 6 months once fermented',
    ],
    precautions: ['Needs 21 days to ferment', 'Always dilute before spraying'],
    storageTips: 'Filter and store in a shaded, wide-mouthed container',
    plantsIdeal: ['fruiting', 'vegetables', 'all crops'],
    recipeId: 'panchagavya',
  },
  {
    id: 'beejamrutha',
    name: 'Beejamrutha',
    tamilName: 'பீஜாமிருதம்',
    category: 'growth_promoters',
    emoji: '🌰',
    description: 'Seed treatment that shields seeds and seedlings from soil-borne disease',
    ingredients: ['cow dung', 'cow urine', 'lime powder', 'bund soil', 'water'],
    applicationRate: 'Enough to submerge one sowing batch of seed',
    applicationTiming: 'Overnight soak before sowing or a 20-minute root dip before transplanting',
    benefits: [
      'Protects against damping-off and seed rot',
      'Improves germination rate',
      'Cheap to prepare from farm materials',
    ],
    precautions: ['Prepare fresh for every sowing batch', 'Dry treated seed in shade, not sun'],
    storageTips: 'Do not store — use the same day it is mixed',
    plantsIdeal: ['all crops'],
    recipeId: 'beejamrutha',
  },
  {
    id: 'vermiwash',
    name: 'Vermiwash',
    tamilName: 'மண்புழு கரைசல்',
    category: 'growth_promoters',
    emoji: '💧',
    description: 'Liquid extract drained from vermicompost beds, rich in growth hormones',
    ingredients: ['active vermicompost', 'cow dung', 'water'],
    applicationRate: 'Dilute 1:5 for soil drench, 1:10 for foliar spray',
    applicationTiming: 'Soil drench weekly or foliar spray fortnightly in the vegetative phase',
    benefits: [
      'Rich in micronutrients and growth hormones',
      'Gentle enough for seedlings',
      'Collection column can be reused indefinitely',
    ],
    precautions: ['Always dilute before use', 'Keep the compost column moist, never flooded'],
    storageTips: 'Use within 3 days of collection; keep in a shaded closed container',
    plantsIdeal: ['leafy', 'vegetables', 'herbs'],
    recipeId: 'vermiwash',
  },
  {
    id: 'lime',
    name: 'Agricultural Lime',
    tamilName: 'சுண்ணாம்பு',
    category: 'soil_amendments',
    emoji: '⚪',
    description: 'Calcium carbonate to neutralize acidic soils',
    applicationRate: '1-5 tonnes per hectare (based on soil pH)',
    applicationTiming: 'Before planting (3-4 weeks)',
    benefits: ['Raises soil pH', 'Adds calcium', 'Improves structure'],
    precautions: ['Get soil test first', 'Avoid over-application', 'Work into topsoil'],
    storageTips: 'Keep dry and covered',
    plantsIdeal: ['brassicas', 'legumes', 'leafy greens'],
  },
  {
    id: 'sulfur',
    name: 'Powdered Sulfur',
    tamilName: 'சல்ஃபர் பொடி',
    category: 'soil_amendments',
    emoji: '💛',
    description: 'Elemental sulfur to acidify alkaline soils and control pests',
    applicationRate: '500 kg to 2 tonnes per hectare',
    applicationTiming: 'Before planting or during growing season',
    benefits: ['Lowers soil pH', 'Adds sulfur nutrient', 'Pest deterrent'],
    precautions: ['Test soil before use', 'Work into soil thoroughly'],
    storageTips: 'Store in cool, dry place',
    plantsIdeal: ['blueberries', 'acid-loving plants', 'root crops'],
  },
  {
    id: 'neem',
    name: 'Neem Extract',
    tamilName: 'வேப்பு எண்ணெய்',
    category: 'biopesticides',
    emoji: '🌿',
    description: 'Natural insecticide from neem tree leaves/seeds',
    applicationRate: '3-5% concentrate',
    applicationTiming: 'Weekly or as needed for pests',
    benefits: ['Controls multiple pests', 'Non-toxic to humans', 'Sustainable'],
    precautions: ['Apply in evening', "Don't mix with alkaline soaps", 'Wear gloves'],
    storageTips: 'Keep in dark bottle away from light',
    plantsIdeal: ['all crops'],
  },
  {
    id: 'pongamia',
    name: 'Pongamia Oil',
    tamilName: 'ஊமத்தை எண்ணெய்',
    category: 'biopesticides',
    emoji: '🌳',
    description: 'Traditional insecticide from pongamia tree seeds',
    applicationRate: '5-10% solution',
    applicationTiming: 'Weekly spray during pest season',
    benefits: ['Controls sap-sucking insects', 'Regional availability', 'Cost-effective'],
    precautions: ['Always dilute', 'Test on small area first'],
    storageTips: 'Store at room temperature',
    plantsIdeal: ['vegetables', 'greens', 'fruits'],
  },
];

// ─── Registry ────────────────────────────────────────────────────────────────

const INPUT_BY_ID = new Map<string, OrganicInputEntry>(ALL_ORGANIC_INPUTS.map((i) => [i.id, i]));

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getAllOrganicInputs(): OrganicInputEntry[] {
  return ALL_ORGANIC_INPUTS;
}

export function getOrganicInputById(id: string): OrganicInputEntry | undefined {
  return INPUT_BY_ID.get(id);
}

export function getOrganicInputByName(name: string): OrganicInputEntry | undefined {
  const normalised = name.trim().toLowerCase();
  return ALL_ORGANIC_INPUTS.find((i) => i.name.toLowerCase() === normalised);
}

export function getOrganicInputsByCategory(category: OrganicInputCategory): OrganicInputEntry[] {
  return ALL_ORGANIC_INPUTS.filter((i) => i.category === category);
}

export interface OrganicInputCategoryGroup {
  category: OrganicInputCategory;
  label: string;
  inputs: OrganicInputEntry[];
}

const CATEGORY_LABELS: Record<OrganicInputCategory, string> = {
  fertilizers: 'Fertilizers',
  growth_promoters: 'Growth Promoters',
  soil_amendments: 'Soil Amendments',
  biopesticides: 'Biopesticides',
  other: 'Other Inputs',
};

export const CATEGORY_DESCRIPTIONS: Record<OrganicInputCategory, string> = {
  fertilizers:
    'Nutrient sources including compost, manures, and plant-based amendments that improve soil fertility and plant nutrition.',
  growth_promoters:
    'Bioactive extracts and microbial preparations that stimulate plant growth, hormone production, and stress tolerance.',
  soil_amendments:
    'Materials that modify soil structure, pH, or water retention to create optimal growing conditions.',
  biopesticides:
    'Natural pest and disease control agents derived from plants, minerals, or microorganisms — safe for organic farming.',
  other: "Specialized inputs that support organic agriculture but don't fit primary categories.",
};

const CATEGORY_ORDER: OrganicInputCategory[] = [
  'fertilizers',
  'growth_promoters',
  'soil_amendments',
  'biopesticides',
  'other',
];

export function getGroupedOrganicInputs(): OrganicInputCategoryGroup[] {
  const groups: Partial<Record<OrganicInputCategory, OrganicInputEntry[]>> = {};

  for (const input of ALL_ORGANIC_INPUTS) {
    const list = groups[input.category] ?? [];
    list.push(input);
    groups[input.category] = list;
  }

  return CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat]!.length > 0).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    inputs: groups[cat]!,
  }));
}

export function getCategoryLabel(category: OrganicInputCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

/**
 * `plantsIdeal` holds terse slugs ("leafy", "root crops"). Map the known ones
 * to reader-facing labels for the detail-screen chips; anything unmapped falls
 * back to sentence case so a new slug never renders raw.
 */
const IDEAL_FOR_LABELS: Record<string, string> = {
  leafy: 'Leafy greens',
  greens: 'Greens',
  herbs: 'Herbs',
  vegetables: 'Vegetables',
  fruiting: 'Fruiting crops',
  fruits: 'Fruits',
  flowers: 'Flowers',
  legumes: 'Legumes',
  brassicas: 'Brassicas',
  tubers: 'Tubers',
  'root crops': 'Root crops',
  'leafy greens': 'Leafy greens',
  'all crops': 'All crops',
  'acid-loving plants': 'Acid-loving plants',
  blueberries: 'Blueberries',
};

export function formatIdealFor(slug: string): string {
  const normalised = slug.trim().toLowerCase();
  const mapped = IDEAL_FOR_LABELS[normalised];
  if (mapped) return mapped;
  return normalised.charAt(0).toUpperCase() + normalised.slice(1);
}
