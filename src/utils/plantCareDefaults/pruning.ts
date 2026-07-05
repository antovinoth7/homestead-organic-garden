import { PlantType } from '@/types/database.types';

import { buildProfileKey } from './profileKey';

// ---------------------------------------------------------------------------
// Pruning Techniques — static, plant-aware tips; user overrides take priority
// ---------------------------------------------------------------------------

export interface PruningInfo {
  tips: string[];
  shapePruning?: { tip: string; months: string };
  flowerPruning?: { tip: string; months: string };
}

const PRUNING_INFO_BY_TYPE: Record<PlantType, PruningInfo> = {
  vegetable: {
    tips: [
      'Remove yellowing lower leaves',
      'Pinch tips to encourage branching',
      'Cut diseased stems at the base',
    ],
  },
  herb: {
    tips: [
      'Harvest from the top, not the base',
      'Cut above a leaf node',
      'Remove flower buds to extend leaf growth',
    ],
  },
  flower: {
    tips: ['Deadhead spent blooms regularly', 'Remove crossing branches for airflow'],
  },
  fruit_tree: {
    tips: ['Thin crowded inner branches', 'Remove dead or crossing wood'],
  },
  timber_tree: {
    tips: [
      'Remove lower side branches early',
      'Prune dead wood only',
      'Avoid topping — prune for clear trunk',
    ],
  },
  coconut_tree: {
    tips: [
      'Remove only dried fronds',
      'Never cut green fronds',
      'Inspect crown for pests during climbing',
    ],
  },
  shrub: {
    tips: ['Remove dead or weak inner branches'],
  },
  spinach: {
    tips: [
      'Harvest leaves regularly to encourage growth',
      'Remove yellow or damaged leaves',
      'Pinch flowering tips to extend leaf harvest',
    ],
  },
};

const PRUNING_INFO_BY_VARIETY: Record<string, PruningInfo> = {
  // Vegetables
  [buildProfileKey('vegetable', 'Tomato')]: {
    tips: [
      'Remove suckers below first flower cluster',
      'Pinch growing tip after 5–6 clusters',
      'Prune lower leaves touching soil',
    ],
    flowerPruning: {
      tip: "Remove late flowers that won't set fruit",
      months: 'When plant is mature',
    },
  },
  [buildProfileKey('vegetable', 'Brinjal')]: {
    tips: [
      'Remove suckers below main fork',
      'Cut off wilting lower leaves',
      'Thin fruits — keep 3–4 per branch',
    ],
    shapePruning: { tip: 'Keep 3–4 main branches from fork', months: 'After 45 days' },
  },
  [buildProfileKey('vegetable', 'Long Brinjal')]: {
    tips: [
      'Remove suckers below main fork',
      'Cut off wilting lower leaves',
      'Thin fruits — keep 3–4 per branch',
    ],
    shapePruning: { tip: 'Keep 3–4 main branches from fork', months: 'After 45 days' },
  },
  [buildProfileKey('vegetable', 'Chilli')]: {
    tips: [
      'Pinch growing tip at 6 inches for bushiness',
      'Remove leaves below first fork',
      'Pick ripe fruits to encourage new ones',
    ],
    shapePruning: { tip: 'Pinch top for bushy shape', months: 'When 6 inches tall' },
  },
  [buildProfileKey('vegetable', 'Ladies Finger')]: {
    tips: [
      'Remove lower leaves as plant grows tall',
      'Cut off damaged or pest-affected leaves',
      'No heavy pruning — harvest regularly',
    ],
  },
  [buildProfileKey('vegetable', 'Drumstick')]: {
    tips: ['Cut back to 3–4 ft after fruiting season', 'Remove weak inner branches'],
    shapePruning: { tip: 'Hard prune to 3–4 ft for rejuvenation', months: 'May–Jun' },
  },
  [buildProfileKey('vegetable', 'Tapioca')]: {
    tips: [
      'Remove lower leaves as stem grows',
      'No heavy pruning needed',
      'Cut back to ground after harvest',
    ],
  },
  [buildProfileKey('vegetable', 'Bitter Gourd')]: {
    tips: [
      'Pinch lateral shoots to control spread',
      'Remove yellowing leaves from vine base',
      'Train main vine on trellis',
    ],
    flowerPruning: { tip: 'Remove excess male flowers', months: 'During flowering' },
  },
  [buildProfileKey('vegetable', 'Snake Gourd')]: {
    tips: [
      'Train on overhead pandal/trellis',
      'Remove side shoots below 4 ft',
      'Tie hanging fruits with cloth sling if heavy',
    ],
  },
  [buildProfileKey('vegetable', 'Cucumber')]: {
    tips: [
      'Pinch laterals after 2 leaves',
      'Remove lower leaves for airflow',
      'Train main stem on vertical support',
    ],
    flowerPruning: {
      tip: 'Remove early female flowers for stronger vine',
      months: 'First 2 weeks',
    },
  },
  [buildProfileKey('vegetable', 'Cowpea')]: {
    tips: [
      'Pinch tips after 4–5 leaf nodes',
      'Harvest pods young to keep producing',
      'Remove dried lower leaves',
    ],
  },
  [buildProfileKey('vegetable', 'Pumpkin')]: {
    tips: [
      'Pinch vine tips after 3–4 fruits set',
      'Remove small late-forming fruits',
      'Trim dead leaves to prevent fungus',
    ],
    flowerPruning: {
      tip: 'Remove excess male flowers after pollination',
      months: 'During fruiting',
    },
  },

  // Herbs
  [buildProfileKey('herb', 'Curry Leaf')]: {
    tips: ['Pinch tips monthly for bushy growth', 'Remove flowers to boost leaf production'],
    shapePruning: { tip: 'Hard prune for compact bushy shape', months: 'Jun–Jul' },
    flowerPruning: { tip: 'Remove flower clusters to boost leaves', months: 'Apr–May' },
  },
  [buildProfileKey('herb', 'Tulsi')]: {
    tips: ['Harvest top 2 pairs of leaves often', 'Cut back to 6 inches if leggy'],
    flowerPruning: { tip: 'Pinch flower spikes weekly', months: 'Year-round' },
  },
  [buildProfileKey('herb', 'Mint')]: {
    tips: ['Cut stems to ground level monthly', 'Thin runners to prevent overcrowding'],
    flowerPruning: { tip: 'Remove flower buds immediately', months: 'Year-round' },
  },
  [buildProfileKey('herb', 'Coriander')]: {
    tips: ['Harvest outer leaves first', 'No heavy pruning — short-lived crop'],
    flowerPruning: { tip: 'Pinch flower stalks to delay bolting', months: 'When bolting starts' },
  },
  [buildProfileKey('herb', 'Basil')]: {
    tips: ['Pinch above 3rd leaf node regularly', 'Harvest from top to keep compact'],
    shapePruning: { tip: 'Pinch top for bushy dome shape', months: 'Every 2 weeks' },
    flowerPruning: { tip: 'Remove all flower spikes', months: 'Year-round' },
  },
  [buildProfileKey('herb', 'Lemongrass')]: {
    tips: [
      'Cut stalks at ground level when harvesting',
      'Remove dead outer leaves',
      'Divide clumps every 2 years',
    ],
  },
  [buildProfileKey('herb', 'Turmeric')]: {
    tips: [
      'No pruning — let leaves grow fully',
      'Remove yellowing leaves late in season',
      'Cut foliage after it dies back naturally',
    ],
  },
  [buildProfileKey('herb', 'Ginger')]: {
    tips: [
      'No pruning needed during growth',
      'Remove yellowing stems in late season',
      'Cut back all foliage after harvest',
    ],
  },

  // Flowers
  [buildProfileKey('flower', 'Rose')]: {
    tips: ['Cut above outward-facing 5-leaf node', 'Remove dead/crossing canes yearly'],
    shapePruning: { tip: 'Shape to open vase form', months: 'Dec–Jan' },
    flowerPruning: { tip: 'Deadhead after each bloom cycle', months: 'Year-round' },
  },
  [buildProfileKey('flower', 'Hibiscus')]: {
    tips: ['Remove inward-growing branches', 'Pinch tips for more blooms'],
    shapePruning: { tip: 'Prune 1/3 of growth for compact shape', months: 'Jan–Feb' },
    flowerPruning: { tip: 'Remove faded flowers to promote new buds', months: 'Year-round' },
  },
  [buildProfileKey('flower', 'Jasmine')]: {
    tips: ['Trim new shoots to encourage branching', 'Remove dead wood and tangles'],
    shapePruning: { tip: 'Hard prune after main flowering flush', months: 'Sep–Oct' },
    flowerPruning: { tip: 'Trim spent flower clusters', months: 'After each flush' },
  },
  [buildProfileKey('flower', 'Marigold')]: {
    tips: ['Pinch growing tip at 6 inches', 'Remove entire plant after season ends'],
    shapePruning: { tip: 'Pinch early for bushy mound', months: 'At 6 inches height' },
    flowerPruning: { tip: 'Deadhead spent flowers weekly', months: 'During bloom season' },
  },
  [buildProfileKey('flower', 'Crossandra')]: {
    tips: ['Pinch tips for bushy growth'],
    shapePruning: { tip: 'Light trim to maintain shape', months: 'Oct–Nov' },
    flowerPruning: { tip: 'Remove faded flower spikes at base', months: 'Year-round' },
  },
  [buildProfileKey('flower', 'Chrysanthemum')]: {
    tips: ['Remove side buds for large single bloom', 'Cut back after flowering ends'],
    shapePruning: { tip: 'Pinch tips 3 times before bud stage', months: 'Aug–Sep' },
    flowerPruning: { tip: 'Disbud side buds for show blooms', months: 'Oct–Nov' },
  },

  // Fruit trees
  [buildProfileKey('fruit_tree', 'Mango')]: {
    tips: ['Remove water sprouts and dead wood', 'Tip-prune after harvest for new flush'],
    shapePruning: { tip: 'Shape young tree to 3–4 main branches', months: 'Jan–Feb' },
    flowerPruning: { tip: 'Thin excess flower panicles for bigger fruits', months: 'Jan–Mar' },
  },
  [buildProfileKey('fruit_tree', 'Guava')]: {
    tips: ['Remove crossing branches inside canopy', 'Tip-prune for new fruit-bearing shoots'],
    shapePruning: { tip: 'Prune to control height after harvest', months: 'Jun–Jul' },
    flowerPruning: {
      tip: 'Remove Apr–May flowers to target Mrig-bahar (monsoon) crop',
      months: 'Apr–May',
    },
  },
  [buildProfileKey('fruit_tree', 'Papaya')]: {
    tips: [
      'Remove lower dried leaves only',
      'No branch pruning — single trunk',
      'Cut off deformed or excess fruits early',
    ],
    flowerPruning: { tip: 'Thin excess flower/fruit clusters', months: 'Year-round' },
  },
  [buildProfileKey('fruit_tree', 'Banana')]: {
    tips: ['Remove dried outer leaf sheaths', 'Cut off suckers — keep only 1 follower'],
    flowerPruning: { tip: 'Remove male flower bud after last hand opens', months: 'When fruiting' },
  },
  [buildProfileKey('fruit_tree', 'Lemon')]: {
    tips: ['Remove thorny water sprouts', 'Thin dense inner canopy for sunlight'],
    shapePruning: { tip: 'Shape after main harvest', months: 'Feb–Mar' },
    flowerPruning: { tip: 'Thin excess blooms for larger fruits', months: 'Mar–Apr' },
  },
  [buildProfileKey('fruit_tree', 'Pomegranate')]: {
    tips: [
      'Remove suckers from rootstock',
      'Prune after harvest for new wood',
      'Choose one bahar (flowering season) and remove flowers in other seasons',
    ],
    shapePruning: { tip: 'Train to 3–4 main stems from base', months: 'Jan–Feb' },
    flowerPruning: {
      tip: 'Keep Mrig-bahar (Jun–Jul) or Ambe-bahar (Jan–Feb) flowers; remove the rest',
      months: 'Year-round',
    },
  },
  [buildProfileKey('fruit_tree', 'Jackfruit')]: {
    tips: ['Minimal pruning — remove dead branches', 'Thin fruits if overloaded on trunk'],
    shapePruning: { tip: 'Shape young tree to open canopy', months: 'Jan–Feb' },
  },
  [buildProfileKey('fruit_tree', 'Amla')]: {
    tips: ['Remove dead/crossing branches', 'No heavy pruning — slow to recover'],
    shapePruning: { tip: 'Light shape pruning only', months: 'Jan–Feb' },
  },

  // Coconut
  [buildProfileKey('coconut_tree', 'Dwarf Coconut')]: {
    tips: [
      'Remove dried fronds carefully',
      'Keep 25–30 green fronds on crown',
      'Clean inflorescence area during harvest',
    ],
  },
  [buildProfileKey('coconut_tree', 'Tall Coconut')]: {
    tips: [
      'Remove only fully dried fronds',
      'Never cut green or yellowing fronds',
      'Inspect for rhinoceros beetle during climbing',
    ],
  },
  [buildProfileKey('coconut_tree', 'Hybrid Coconut')]: {
    tips: [
      'Remove dried fronds every 3–4 months',
      'Keep crown clean for better light',
      'Watch for bud rot during monsoon',
    ],
  },

  // Shrubs
  [buildProfileKey('shrub', 'Bougainvillea')]: {
    tips: ['Remove green reversions at base'],
    shapePruning: { tip: 'Hard prune for compact form', months: 'Jan–Feb' },
    flowerPruning: { tip: 'Tip-prune new growth for more blooms', months: 'After each flush' },
  },
  [buildProfileKey('shrub', 'Ixora')]: {
    tips: ['Avoid heavy cuts — slow to recover'],
    shapePruning: { tip: 'Shape into hedge or ball form', months: 'Jan–Feb' },
    flowerPruning: { tip: 'Light trim after each flowering cycle', months: 'After bloom' },
  },
  [buildProfileKey('shrub', 'Jasmine')]: {
    tips: ['Remove dead wood and tangles'],
    shapePruning: { tip: 'Hard prune after main flowering', months: 'Sep–Oct' },
    flowerPruning: { tip: 'Trim spent flower clusters', months: 'After each flush' },
  },
  [buildProfileKey('shrub', 'Hibiscus')]: {
    tips: ['Remove inward-growing branches'],
    shapePruning: { tip: 'Prune 1/3 of growth for compact shape', months: 'Jan–Feb' },
    flowerPruning: { tip: 'Remove faded flowers daily', months: 'Year-round' },
  },
};

/**
 * Get pruning info for a plant.
 * Priority: user override → variety-specific static → type-level static.
 */
export function getPruningTechniques(
  plantType: PlantType,
  plantVariety?: string,
  userOverride?: {
    pruningTips?: string[];
    shapePruningTip?: string;
    shapePruningMonths?: string;
    flowerPruningTip?: string;
    flowerPruningMonths?: string;
  }
): PruningInfo {
  // If user has any pruning overrides, build PruningInfo from them
  if (userOverride) {
    const hasTips = userOverride.pruningTips && userOverride.pruningTips.length > 0;
    const hasShape = userOverride.shapePruningTip;
    const hasFlower = userOverride.flowerPruningTip;

    if (hasTips || hasShape || hasFlower) {
      const info: PruningInfo = {
        tips: userOverride.pruningTips ?? [],
      };
      if (userOverride.shapePruningTip) {
        info.shapePruning = {
          tip: userOverride.shapePruningTip,
          months: userOverride.shapePruningMonths ?? '',
        };
      }
      if (userOverride.flowerPruningTip) {
        info.flowerPruning = {
          tip: userOverride.flowerPruningTip,
          months: userOverride.flowerPruningMonths ?? '',
        };
      }
      return info;
    }
  }

  // Fall back to static data
  if (plantVariety) {
    const key = buildProfileKey(plantType, plantVariety);
    if (PRUNING_INFO_BY_VARIETY[key]) {
      return PRUNING_INFO_BY_VARIETY[key];
    }
  }
  return PRUNING_INFO_BY_TYPE[plantType] || { tips: [] };
}

/**
 * Get static pruning defaults (ignores user overrides).
 * Used to pre-fill the editing form in the catalog screen.
 */
export function getStaticPruningDefaults(plantType: PlantType, plantVariety?: string): PruningInfo {
  if (plantVariety) {
    const key = buildProfileKey(plantType, plantVariety);
    if (PRUNING_INFO_BY_VARIETY[key]) {
      return PRUNING_INFO_BY_VARIETY[key];
    }
  }
  return PRUNING_INFO_BY_TYPE[plantType] || { tips: [] };
}
