/**
 * Organic input recipes for Kanyakumari / Tamil Nadu organic farming.
 * Each recipe scales by land_cents via baseQtyPerCent.
 */

export interface RecipeIngredient {
  name: string;
  /** Base quantity per 1 cent of land */
  baseQtyPerCent: number;
  unit: string;
  notes?: string;
}

export type RecipeId = 'jeevamrutha' | 'beejamrutha' | 'panchagavya' | 'vermiwash';

export interface OrganicInputRecipe {
  id: RecipeId;
  name: string;
  tamilName: string;
  description: string;
  ingredients: RecipeIngredient[];
  preparationSteps: string[];
  whenToApply: string;
  seasonMapping: string[];
  frequencyDays: number;
}

export const ORGANIC_RECIPES: OrganicInputRecipe[] = [
  {
    id: 'jeevamrutha',
    name: 'Jeevamrutha',
    tamilName: 'ஜீவாமிருதம்',
    description:
      'A fermented microbial culture that activates soil biology and provides balanced nutrition.',
    ingredients: [
      { name: 'Desi cow dung', baseQtyPerCent: 2, unit: 'kg', notes: 'Fresh, from local breed' },
      { name: 'Desi cow urine', baseQtyPerCent: 2, unit: 'L', notes: 'Aged 3–5 days preferred' },
      { name: 'Jaggery', baseQtyPerCent: 0.4, unit: 'kg', notes: 'Or palm jaggery' },
      { name: 'Pulse flour (besan)', baseQtyPerCent: 0.4, unit: 'kg' },
      {
        name: 'Handful of soil',
        baseQtyPerCent: 0.1,
        unit: 'kg',
        notes: 'From under a live tree (bund soil)',
      },
      { name: 'Water', baseQtyPerCent: 40, unit: 'L' },
    ],
    preparationSteps: [
      'Mix cow dung and cow urine in a large barrel or drum.',
      'Add jaggery and pulse flour, stir well.',
      'Add a handful of soil from under a living tree (contains native microbes).',
      'Add water and stir clockwise for 2–3 minutes.',
      'Cover with a cloth (not airtight) and keep in shade.',
      'Stir once daily for 3 days. Ready to use on day 4.',
      'Apply by diluting: 200 L Jeevamrutha per acre, or use directly per bed.',
    ],
    whenToApply: 'Apply to soil around plant roots in the evening. Avoid midday application.',
    seasonMapping: ['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry'],
    frequencyDays: 14,
  },
  {
    id: 'beejamrutha',
    name: 'Beejamrutha',
    tamilName: 'பீஜாமிருதம்',
    description:
      'A seed treatment solution that protects seeds and seedlings from soil-borne diseases.',
    ingredients: [
      { name: 'Desi cow dung', baseQtyPerCent: 1, unit: 'kg' },
      { name: 'Desi cow urine', baseQtyPerCent: 1, unit: 'L' },
      { name: 'Lime powder', baseQtyPerCent: 0.1, unit: 'kg', notes: 'Calcium hydroxide' },
      { name: 'Water', baseQtyPerCent: 4, unit: 'L' },
      { name: 'Handful of soil', baseQtyPerCent: 0.05, unit: 'kg', notes: 'From bund area' },
    ],
    preparationSteps: [
      'Mix cow dung and cow urine in a bucket.',
      'Add lime powder and bund soil, stir well.',
      'Add water and mix into a thin paste consistency.',
      'Soak seeds in this solution overnight (8–12 hours).',
      'Remove seeds and dry in shade before sowing.',
      'For seedling root dip: immerse roots for 20 minutes before transplanting.',
    ],
    whenToApply: 'Apply before sowing or transplanting. Prepare fresh for each sowing batch.',
    seasonMapping: ['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry'],
    frequencyDays: 0, // Per-event, not recurring
  },
  {
    id: 'panchagavya',
    name: 'Panchagavya',
    tamilName: 'பஞ்சகவ்யா',
    description:
      'A potent growth promoter made from five cow products. Enhances immunity and fruiting.',
    ingredients: [
      { name: 'Desi cow dung', baseQtyPerCent: 1.4, unit: 'kg' },
      { name: 'Desi cow urine', baseQtyPerCent: 0.6, unit: 'L' },
      { name: 'Cow milk', baseQtyPerCent: 0.4, unit: 'L' },
      { name: 'Cow curd', baseQtyPerCent: 0.4, unit: 'L' },
      { name: 'Cow ghee', baseQtyPerCent: 0.2, unit: 'L' },
      {
        name: 'Sugarcane juice',
        baseQtyPerCent: 0.6,
        unit: 'L',
        notes: 'Or jaggery dissolved in water',
      },
      { name: 'Tender coconut water', baseQtyPerCent: 0.6, unit: 'L' },
      { name: 'Ripe banana', baseQtyPerCent: 0.2, unit: 'kg', notes: 'Mashed' },
      { name: 'Toddy or grape juice', baseQtyPerCent: 0.4, unit: 'L', notes: 'For fermentation' },
    ],
    preparationSteps: [
      'Day 1: Mix cow dung and cow ghee in a wide-mouthed container. Stir twice daily.',
      'Day 3: Add cow urine and water. Continue stirring twice daily.',
      'Day 8: Add cow milk, curd, sugarcane juice, coconut water, banana, and toddy.',
      'Day 15: Stir daily. Solution is ready when it develops a sweet fermented smell.',
      'Day 21: Filter and store. Use within 6 months.',
      'Dilute 3% for foliar spray (30 mL per litre of water) or 5% for soil drench.',
    ],
    whenToApply:
      'Foliar spray early morning or evening. Soil drench anytime. Apply every 15 days during active growth.',
    seasonMapping: ['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry'],
    frequencyDays: 15,
  },
  {
    id: 'vermiwash',
    name: 'Vermiwash',
    tamilName: 'மண்புழு கரைசல்',
    description:
      'A liquid extract collected from vermicompost beds. Rich in plant growth hormones and micronutrients.',
    ingredients: [
      { name: 'Active vermicompost', baseQtyPerCent: 2, unit: 'kg', notes: 'With live earthworms' },
      {
        name: 'Cow dung layer',
        baseQtyPerCent: 0.5,
        unit: 'kg',
        notes: 'Top layer in collection unit',
      },
      {
        name: 'Water (drip supply)',
        baseQtyPerCent: 4,
        unit: 'L',
        notes: 'Slow drip through compost column',
      },
      {
        name: 'Collection container',
        baseQtyPerCent: 0,
        unit: 'pcs',
        notes: '1 per setup (reusable)',
      },
    ],
    preparationSteps: [
      'Set up a vertical column (barrel or drum) with drainage hole at bottom.',
      'Layer: gravel at bottom (5 cm) → dry leaves (5 cm) → active vermicompost (30 cm) → cow dung (5 cm).',
      'Place a collection container below the drainage hole.',
      'Drip water slowly over the top layer (use a drip can or bottle with pin-hole).',
      'Collect the dark brown liquid that drains out over 24–48 hours.',
      'Dilute 1:5 with water for soil application, 1:10 for foliar spray.',
    ],
    whenToApply:
      'Apply as soil drench weekly or foliar spray fortnightly during vegetative growth phase.',
    seasonMapping: ['summer', 'cool_dry', 'ne_monsoon'],
    frequencyDays: 7,
  },
];

/**
 * Look up a recipe by its ID.
 */
export function getRecipeById(id: RecipeId): OrganicInputRecipe | undefined {
  return ORGANIC_RECIPES.find((r) => r.id === id);
}
