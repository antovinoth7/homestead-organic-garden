import { Bed, BedType, Plant } from '@/types/database.types';
import { cropFamilyFromName } from '@/utils/cropFamilyFromName';
import { LOW_LEGUME_THRESHOLD } from '@/utils/filterAndSortBeds';
import { bedExpectsLegumes } from './legumeRelevance';
import { validateCompanionPair } from './companionRules';

// Recommended plant names per bed type — matched against the app's plant catalog
export const BED_PLANT_CATALOG: Record<BedType, string[]> = {
  leafy: [
    // Catalog row names — `Amaranth` and `Spinach` were suggested here for a
    // long time and neither is a row, so the bed offered crops the user could
    // not then add.
    'Amaranthus',
    'Palak',
    'Fenugreek',
    'Coriander',
    'Mint',
    'Purslane',
    'Drumstick',
    'Curry Leaf',
    'Pasalai Keerai',
  ],
  fruiting: [
    'Tomato',
    'Brinjal',
    'Ladies Finger',
    'Capsicum',
    'Chilli',
    'Bitter Gourd',
    'Snake Gourd',
    'Ridge Gourd',
    'Bottle Gourd',
    'Marigold',
  ],
  spice: [
    'Chilli',
    'Ginger',
    'Turmeric',
    'Curry Leaf',
    'Capsicum',
    'Garlic',
    'Onion',
    'Cardamom',
    'Coriander',
    'Ajwain',
  ],
  root_legume: [
    'Cowpea',
    'Beans',
    'Black Gram',
    'Pigeon Pea',
    'Groundnut',
    'Carrot',
    'Radish',
    'Beetroot',
    'Sweet Potato',
    'Yam',
    'Cluster Beans',
  ],
  climber_trellis: [
    'Bitter Gourd',
    'Snake Gourd',
    // Yardlong beans are a Cowpea variety now; the pole type is the climber.
    'Cowpea',
    'Cucumber',
    'Bottle Gourd',
    'Ridge Gourd',
    'Passion Fruit',
    'Capsicum',
  ],
  three_sisters: ['Maize', 'Beans', 'Pumpkin', 'Cowpea'],
  medicinal_guild: [
    'Drumstick',
    'Tulsi',
    'Aloe Vera',
    'Lemongrass',
    'Neem',
    'Brahmi',
    'Ashwagandha',
    'Castor',
    'Agathi',
  ],
};

export function getRecommendedPlantsForBed(type: BedType): string[] {
  return BED_PLANT_CATALOG[type] ?? [];
}

/**
 * Rotation/companion-aware "next crop" suggestions for a bed. Starts from the bed-type catalog
 * and removes crops that are already planted, repeat last season's family (`prev_crop_family`),
 * or antagonise a current plant. When the bed expects legumes and coverage is low, legumes are
 * surfaced first. Per-crop calendar data doesn't exist, so this is rotation/companion/legume
 * aware rather than literal month filtering.
 */
export function getSmartNextCrops(bed: Bed, plants: Plant[]): string[] {
  const candidates = BED_PLANT_CATALOG[bed.type] ?? [];
  const currentNames = new Set(plants.map((p) => p.name));
  const prevFamily = bed.prev_crop_family ?? null;

  const filtered = candidates.filter((name) => {
    if (currentNames.has(name)) return false; // already in the bed
    if (prevFamily && cropFamilyFromName(name) === prevFamily) return false; // rotation
    // Drop antagonists of any current plant.
    return plants.every((p) => validateCompanionPair(name, p.name).valid);
  });

  const legumePct = plants.length
    ? Math.round((plants.filter((p) => p.crop_family === 'legume').length / plants.length) * 100)
    : 0;
  const legumesFirst = bedExpectsLegumes(bed.type) && legumePct < LOW_LEGUME_THRESHOLD;

  const ordered = legumesFirst
    ? [...filtered].sort(
        (a, b) =>
          (cropFamilyFromName(a) === 'legume' ? 0 : 1) -
          (cropFamilyFromName(b) === 'legume' ? 0 : 1)
      )
    : filtered;

  return ordered.slice(0, 5);
}
