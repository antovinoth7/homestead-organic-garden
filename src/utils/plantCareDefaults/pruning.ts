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
  // A pepper vine is trained more than it is cut, and the twice-yearly lopping
  // of the shade standard is what its `pruningFrequencyDays: 180` tracks.
  // De-spiking applies to years 1–2 only, so it carries that qualifier: the
  // generic herb fallback ('Remove flower buds to extend leaf growth') would
  // tell the owner of a bearing vine to destroy the crop.
  [buildProfileKey('herb', 'Black Pepper')]: {
    tips: [
      'Tie runner shoots to the standard every 2–3 weeks',
      'Cut off runner shoots trailing on the ground monthly',
      'Remove dead and diseased laterals after harvest',
    ],
    shapePruning: {
      tip: 'Top the vine at the head of the standard; lop the shade tree',
      months: 'May–Jun & Sep–Oct',
    },
    flowerPruning: {
      tip: 'Remove spikes to build the frame — first two years only',
      months: 'May–Jul, years 1–2 only',
    },
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

  // Tamil Nadu medicinals, hedge and temple plants. These are woody, but each
  // is filed under the harvest it is cut for, and neither type-level default
  // then fits: the herb tip ("remove flower buds to extend leaf growth") is
  // wrong for Nithyakalyani, Aavaram and Arali, which are grown for the
  // flowers, and the flower tip is wrong for Maruthani and Nochi, which are
  // stripped for leaf. Arali needs its own tips for a third reason — the
  // generic advice is actively unsafe around its sap, and Castor for a
  // fourth — the herb tip would have the grower pinch off the spikes its
  // seed, and so its pest cake, comes from.
  [buildProfileKey('herb', 'Adathodai')]: {
    tips: ['Cut leafy shoots above a node; the stump reshoots readily'],
    shapePruning: { tip: 'Cut back to knee height to renew a leggy bush', months: 'Jan–Feb' },
  },
  [buildProfileKey('herb', 'Nithyakalyani')]: {
    tips: ['Pinch tips on young plants to stop it going lanky'],
    flowerPruning: { tip: 'Shear spent blooms to limit self-seeding', months: 'Year-round' },
  },
  [buildProfileKey('herb', 'Maruthani')]: {
    tips: ['Harvest by clipping whole leafy shoots, not single leaves'],
    shapePruning: { tip: 'Clip the hedge to shape; it tolerates hard cuts', months: 'Feb–Mar' },
  },
  [buildProfileKey('flower', 'Aavaram')]: {
    tips: ['Pick flowers in the morning as they open', 'Cut back spent flowering wood'],
    shapePruning: { tip: 'Cut back by a third to keep it bushy', months: 'Jan–Feb' },
  },
  [buildProfileKey('herb', 'Nochi')]: {
    tips: ['Cut leafy branches for grain storage and leaf-extract sprays'],
    shapePruning: { tip: 'Coppice hard to keep it a shrub, not a small tree', months: 'Jan–Feb' },
  },
  [buildProfileKey('herb', 'Castor')]: {
    tips: [
      'Cut leafy branches for chop-and-drop and leaf-extract sprays',
      'Leave the flower spikes to set — the seed is what the cake is pressed from',
      'Keep the spiny seed capsules away from children and livestock; the seed is toxic',
    ],
    shapePruning: {
      tip: 'Cut back hard after the seed harvest to force fresh low growth',
      months: 'Jan–Feb',
    },
  },
  [buildProfileKey('herb', 'Thoothuvalai')]: {
    tips: ['Wear gloves — the stems and leaf veins are thorny', 'Trim to keep it on its support'],
    shapePruning: { tip: 'Cut back sprawling growth after the rains', months: 'Jan–Feb' },
  },
  [buildProfileKey('flower', 'Nandiyavattai')]: {
    tips: ['Wear gloves — the cut stems bleed a milky sap that irritates skin'],
    shapePruning: {
      tip: 'Cut back after the rains; it flowers hard on new wood',
      months: 'Oct–Nov',
    },
  },
  // The `spinach` default would have this pinched back at the first flower
  // bud. Agathi poo is a harvest in its own right, so that tip is dropped.
  [buildProfileKey('spinach', 'Agathi')]: {
    tips: [
      'Strip leafy side shoots for keerai; the stem reshoots from the cut',
      'Leave the flower buds — agathi poo is picked and cooked like the leaves',
    ],
    shapePruning: {
      tip: 'Pollard at shoulder height to keep the leaves and flowers in reach',
      months: 'Jan–Feb',
    },
  },
  [buildProfileKey('flower', 'Arali')]: {
    tips: [
      'Wear gloves and long sleeves — the milky sap irritates skin',
      'Never burn the prunings; the smoke is toxic',
      'Bag the trimmings for disposal rather than composting them',
    ],
    shapePruning: { tip: 'Thin old stems at the base to renew the bush', months: 'Jan–Feb' },
  },
  [buildProfileKey('herb', 'Karpooravalli')]: {
    tips: ['Pick outer leaves and pinch tips to keep the plant compact'],
    flowerPruning: { tip: 'Remove flower spikes to keep the leaves thick', months: 'Year-round' },
  },

  // Tamil Nadu edibles. Written per variety because the type-level defaults are
  // wrong for most of these: the generic herb tip "remove flower buds to extend
  // leaf growth" would cost a spice tree its crop, and "thin crowded inner
  // branches" is meaningless on a palm that has no branches to thin.
  [buildProfileKey('vegetable', 'Ivy Gourd')]: {
    tips: [
      'Train the leaders along the pandal and let laterals hang',
      'Cut back the whole vine to a short framework after the main flush',
      'Clear old woody growth from the pandal so light reaches new shoots',
    ],
    shapePruning: {
      tip: 'Hard-prune to a 1 m framework to force new fruiting wood',
      months: 'Feb–Mar',
    },
  },
  [buildProfileKey('vegetable', 'Turkey Berry')]: {
    tips: [
      'Head the bush back annually to keep berries within reach',
      'Remove old grey wood — berries come on newer shoots',
      'Take out suckers crowding the base',
    ],
    shapePruning: { tip: 'Cut back to knee height after the main crop', months: 'Feb–Mar' },
  },
  [buildProfileKey('herb', 'Mango Ginger')]: {
    tips: [
      'No pruning — the crop is the rhizome, so let the leaves feed it',
      'Remove yellowing leaves only late in the season',
      'Cut the foliage back once it dies down, then lift',
    ],
  },
  [buildProfileKey('vegetable', 'Chinese Potato')]: {
    tips: [
      'Pinch running tips once to push side shoots',
      'Earth up around the base as the tubers bulk — that matters more than cutting',
      'Leave the foliage alone until it yellows, then lift',
    ],
  },
  [buildProfileKey('vegetable', 'Sesame')]: {
    tips: [
      'No pruning — the crop is a short annual cut whole at maturity',
      'Pinch the tip once at about 30 days if you want more branches',
      'Cut and stook the plants when the lowest capsules yellow, before they shatter',
    ],
  },
  [buildProfileKey('herb', 'Adamant Creeper')]: {
    tips: [
      'Wear gloves — the raw sap irritates skin and mouth',
      'Harvest by cutting tender square tips, not by stripping the vine',
      'Keep the vine off the ground so the nodes do not root everywhere',
    ],
  },
  [buildProfileKey('herb', 'Clove')]: {
    tips: [
      'Prune lightly — a clove tree resents hard cutting',
      'Remove only dead, crossing, or storm-damaged wood',
      'Never remove flower buds: they are the crop',
    ],
    shapePruning: { tip: 'Keep a single clear leader while young', months: 'Jun–Jul' },
  },
  [buildProfileKey('herb', 'Cinnamon')]: {
    tips: [
      'Coppice the stool to about 15 cm once the plant is established',
      'Peel bark from straight re-shoots at pencil-to-thumb thickness',
      'Keep four to six shoots per stool and cut the rest out',
    ],
    shapePruning: {
      tip: 'Cut the stool back after the rains to force new shoots',
      months: 'Sep–Oct',
    },
  },
  [buildProfileKey('fruit_tree', 'Tamarind')]: {
    tips: [
      'Remove dead and crossing wood only — the canopy is the point',
      'Lift the lower branches for clearance beneath',
      'Avoid heavy cuts on an old tree; large wounds rot slowly',
    ],
    shapePruning: { tip: 'Train a clear trunk for the first three years', months: 'Feb–Mar' },
  },
  [buildProfileKey('fruit_tree', 'Jamun')]: {
    tips: [
      'Thin the canopy for airflow after fruiting',
      'Remove water shoots from the trunk and main limbs',
      'Keep the head low enough to pick without climbing',
    ],
    shapePruning: { tip: 'Open the centre once the framework is set', months: 'Aug–Sep' },
  },
  [buildProfileKey('fruit_tree', 'Cashew')]: {
    tips: [
      'Remove dead wood and criss-crossing branches after harvest',
      'Cut out shoots growing into the centre of the canopy',
      'Keep the trunk clear to about a metre',
    ],
    shapePruning: { tip: 'Shape to three or four main limbs while young', months: 'Jun–Jul' },
  },
  [buildProfileKey('fruit_tree', 'Wood Apple')]: {
    tips: [
      'Prune sparingly — growth is slow and wounds close slowly',
      'Watch for spines when working in the canopy',
      'Remove dead and rubbing wood only',
    ],
  },
  [buildProfileKey('fruit_tree', 'Indian Jujube')]: {
    tips: [
      'Cut back hard each year — fruit comes on the current season’s growth',
      'Leave a short framework of main limbs after the cutback',
      'Remove suckers from the rootstock of a grafted tree',
    ],
    shapePruning: { tip: 'Cut back to a low framework once the crop is off', months: 'Apr–May' },
  },
  [buildProfileKey('fruit_tree', 'Palmyra')]: {
    tips: [
      'Remove only fully dried fronds — never cut green ones',
      'Never top a palm: the single growing point does not regrow',
      'Leave the crown alone entirely during tapping season',
    ],
  },
  [buildProfileKey('fruit_tree', 'Sweet Lime')]: {
    tips: [
      'Remove thorny water shoots and any growth below the graft union',
      'Open the centre so light reaches the inner fruit',
      'Cut out dead twigs after each harvest',
    ],
    shapePruning: { tip: 'Keep an open vase of three or four limbs', months: 'Feb–Mar' },
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
