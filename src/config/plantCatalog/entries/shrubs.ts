import type { PlantCatalogEntry } from '../types';

/**
 * Woody perennials grown for the plant itself — nothing is harvested off them.
 * Anything grown for a leaf, flower or seed harvest is filed by that harvest
 * instead: Hibiscus, Ixora, Jasmine, Crossandra, Nandiyavattai, Aavaram and
 * Arali under `flower`, Maruthani, Nochi and Castor under `herb`, and Agathi
 * under `spinach` with the other keerai. That leaves the one row where the
 * plant itself is the point: an ornamental hedge.
 */
export const SHRUB_ENTRIES: PlantCatalogEntry[] = [
  {
    name: 'Bougainvillea',
    group: 'flowers',
    subGroup: 'flowering_shrubs',
    habit: 'vine',
    tags: [],
    plantType: 'shrub',
    cropFamily: 'flower',
    tamilName: 'காகிதப்பூ',
    shortDescription: 'Vigorous thorny shrub-vine smothered in papery bracts',
  },
];
