/**
 * Pins what the profile normaliser keeps, drops and coerces — and the order it
 * sets keys in — so its structure can change without its output changing.
 * Reads go through `getPlantProfiles()`, the normaliser's only entry point. The
 * Firestore SDK is never mocked (per project rules); the app's storage wrapper
 * stands in for the device, and the auth stub keeps the remote sync from running.
 */

import {
  createEmptyProfiles,
  getPlantProfiles,
  toPlantCatalogShape,
} from '@/services/plantProfiles';
import { PLANT_CATEGORIES } from '@/utils/plantCategories';
import type { PlantProfile, PlantProfiles } from '@/types/database.types';

const mockMemoryStore = new Map<string, unknown[]>();

jest.mock('@/lib/storage', () => ({
  KEYS: {
    PLANT_PROFILES: '@garden_plant_profiles',
    PLANT_CATALOG: '@garden_plant_catalog',
    PLANT_CARE_PROFILES: '@garden_plant_care_profiles',
  },
  getData: jest.fn(async (key: string) => mockMemoryStore.get(key) ?? []),
  setData: jest.fn(async (key: string, value: unknown[]) => {
    mockMemoryStore.set(key, value);
    return true;
  }),
}));

// No signed-in user, so the background Firestore sync returns early.
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  refreshAuthToken: jest.fn(async () => true),
}));

jest.mock('@/utils/firestoreTimeout', () => ({
  withTimeoutAndRetry: jest.fn(async <T>(op: () => Promise<T>) => op()),
  FIRESTORE_READ_TIMEOUT_MS: 15000,
}));

const cache = new Map<string, unknown>();
jest.mock('@/lib/dataCache', () => ({
  getCached: jest.fn((key: string) => cache.get(key)),
  setCached: jest.fn((key: string, value: unknown) => cache.set(key, value)),
  invalidate: jest.fn(),
}));

const NAME = 'Long Pepper Local';

/** Store one raw herb entry and read it back through the normaliser. */
async function roundTrip(raw: Record<string, unknown>): Promise<PlantProfile | undefined> {
  const stored = createEmptyProfiles() as unknown as Record<string, Record<string, unknown>>;
  stored.herb = { [NAME]: raw };
  mockMemoryStore.set('@garden_plant_profiles', [stored]);
  return (await getPlantProfiles()).herb[NAME];
}

beforeEach(() => {
  mockMemoryStore.clear();
  cache.clear();
});

describe('profile normaliser', () => {
  it('keeps every known field, coerced, in a fixed key order', async () => {
    const entry = await roundTrip({
      plantType: 'flower', // overridden by the category the entry is filed under
      name: 'ignored', // overridden by the entry's key
      tamilName: '  திப்பிலி ',
      description: 'Climbing spice',
      varieties: [' Local ', '', 42, 'Hybrid'],
      isUserAdded: true,
      isDeleted: true,
      isDismissed: true,
      deletedAt: 1700000000000.4,
      varietyDetails: { Local: { notes: 'Shade-loving' } },
      waterRequirement: 'medium',
      sunlight: 'partial_sun',
      soilType: 'red_laterite',
      preferredFertiliser: 'neem_cake',
      initialGrowthStage: 'seedling',
      lifecycle: 'perennial',
      heatTolerance: 'high',
      droughtTolerance: 'low',
      waterloggingTolerance: 'medium',
      feedingIntensity: 'light',
      wateringFrequencyDays: '3',
      wateringEnabled: false,
      fertilisingFrequencyDays: 14.6,
      fertilisingEnabled: false,
      pruningFrequencyDays: 30,
      pruningEnabled: false,
      pruningTips: ['Pinch tips'],
      shapePruningTip: 'Shape after rains',
      shapePruningMonths: 'Jun-Jul',
      flowerPruningTip: 'Deadhead',
      flowerPruningMonths: 'Mar',
      scientificName: 'Piper longum',
      taxonomicFamily: 'Piperaceae',
      daysToHarvest: { min: 150, max: 180 },
      heightCm: { min: 30, max: 60 },
      germinationDays: { min: 10, max: 20 },
      germinationTempC: { min: 20, max: 30 },
      soilPhRange: { min: 5.5, max: 6.5 },
      spacingCm: 45,
      plantingDepthCm: 2,
      yearsToFirstHarvest: 1,
      chopDropIntervalDays: 60,
      floweringStartMonth: 12,
      growingSeason: 'Monsoon',
      seedSource: 'Saved',
      guild: 'Shade layer',
      isPermanent: true,
      isDynamicAccumulator: true,
      petToxicity: false,
      vitamins: ['C'],
      minerals: ['Iron'],
      customPests: ['Mealybug'],
      customDiseases: ['Leaf spot'],
      customBeneficials: ['Ladybird'],
      growthStageDurations: { seedling: 20 },
      annualCycleDurations: { flowering: 30 },
      cropFamily: 'piperaceae',
      layer: 'shrub',
      group: 'spices',
      unknownKey: 'dropped',
    });

    const expected = {
      plantType: 'herb',
      name: NAME,
      tamilName: 'திப்பிலி',
      description: 'Climbing spice',
      varieties: ['Local', 'Hybrid'],
      isUserAdded: true,
      isDeleted: true,
      isDismissed: true,
      deletedAt: 1700000000000,
      varietyDetails: { Local: { notes: 'Shade-loving' } },
      waterRequirement: 'medium',
      sunlight: 'partial_sun',
      soilType: 'red_laterite',
      preferredFertiliser: 'neem_cake',
      initialGrowthStage: 'seedling',
      lifecycle: 'perennial',
      heatTolerance: 'high',
      droughtTolerance: 'low',
      waterloggingTolerance: 'medium',
      feedingIntensity: 'light',
      wateringFrequencyDays: 3,
      wateringEnabled: false,
      fertilisingFrequencyDays: 15,
      fertilisingEnabled: false,
      pruningFrequencyDays: 30,
      pruningEnabled: false,
      pruningTips: ['Pinch tips'],
      shapePruningTip: 'Shape after rains',
      shapePruningMonths: 'Jun-Jul',
      flowerPruningTip: 'Deadhead',
      flowerPruningMonths: 'Mar',
      scientificName: 'Piper longum',
      taxonomicFamily: 'Piperaceae',
      daysToHarvest: { min: 150, max: 180 },
      heightCm: { min: 30, max: 60 },
      germinationDays: { min: 10, max: 20 },
      germinationTempC: { min: 20, max: 30 },
      soilPhRange: { min: 5.5, max: 6.5 },
      spacingCm: 45,
      plantingDepthCm: 2,
      yearsToFirstHarvest: 1,
      chopDropIntervalDays: 60,
      floweringStartMonth: 12,
      growingSeason: 'Monsoon',
      seedSource: 'Saved',
      guild: 'Shade layer',
      isPermanent: true,
      isDynamicAccumulator: true,
      petToxicity: false,
      vitamins: ['C'],
      minerals: ['Iron'],
      customPests: ['Mealybug'],
      customDiseases: ['Leaf spot'],
      customBeneficials: ['Ladybird'],
      growthStageDurations: { seedling: 20 },
      annualCycleDurations: { flowering: 30 },
      cropFamily: 'piperaceae',
      layer: 'shrub',
      group: 'spices',
    };

    expect(entry).toEqual(expected);
    expect(Object.keys(entry ?? {})).toEqual(Object.keys(expected));
  });

  it('drops every value that is blank, out of range or of the wrong type', async () => {
    const entry = await roundTrip({
      tamilName: '   ',
      description: 42,
      varieties: ['', '  '],
      isUserAdded: 'yes',
      isDeleted: false,
      isDismissed: true, // only kept on a deleted entry
      deletedAt: 5, // only kept on a deleted entry
      varietyDetails: 'not an object',
      waterRequirement: 'lots',
      sunlight: 'moonlight',
      soilType: 'clay',
      preferredFertiliser: 'urea',
      initialGrowthStage: 'sprouting',
      lifecycle: 'forever',
      heatTolerance: 'extreme',
      droughtTolerance: 'none',
      waterloggingTolerance: 1,
      feedingIntensity: 'ravenous',
      wateringFrequencyDays: 0,
      wateringEnabled: true, // only `false` is recorded
      fertilisingFrequencyDays: 0.4, // rounds to 0
      fertilisingEnabled: 'no',
      pruningFrequencyDays: -3,
      pruningTips: [],
      shapePruningTip: '',
      daysToHarvest: { min: 10, max: 5 },
      heightCm: { min: -1, max: 5 },
      germinationDays: 'two weeks',
      germinationTempC: null,
      soilPhRange: { min: 'acid', max: 7 },
      spacingCm: '',
      plantingDepthCm: null,
      yearsToFirstHarvest: 'soon',
      floweringStartMonth: 13,
      growingSeason: '  ',
      isPermanent: 1,
      isDynamicAccumulator: 'true',
      petToxicity: 'no',
      vitamins: 'C',
      growthStageDurations: null,
      annualCycleDurations: 7,
      cropFamily: '',
      layer: 0,
      group: 'herb', // a plant type, not a catalog group
    });

    expect(entry).toEqual({ plantType: 'herb', name: NAME });
  });

  it('rounds a sub-unit flowering month to zero and drops it', async () => {
    expect(await roundTrip({ floweringStartMonth: 0.4 })).not.toHaveProperty('floweringStartMonth');
  });

  it('keeps a true pet-toxicity flag', async () => {
    expect((await roundTrip({ petToxicity: true }))?.petToxicity).toBe(true);
  });
});

describe('toPlantCatalogShape', () => {
  const withHerbs = (herbs: Record<string, PlantProfile>): PlantProfiles => {
    const profiles = createEmptyProfiles();
    profiles.herb = herbs;
    return profiles;
  };

  it('builds one category per plant type', () => {
    const shape = toPlantCatalogShape(createEmptyProfiles());
    expect(Object.keys(shape.categories)).toEqual(PLANT_CATEGORIES);
  });

  it('fills all four maps for a fully described entry', () => {
    const shape = toPlantCatalogShape(
      withHerbs({
        [NAME]: {
          plantType: 'herb',
          name: NAME,
          isUserAdded: true,
          varieties: ['Local'],
          tamilName: 'திப்பிலி',
          description: 'Climbing spice',
          varietyDetails: { Local: {} },
        },
      })
    );
    const herb = shape.categories.herb;
    expect(herb.plants).toContain(NAME);
    expect(herb.varieties[NAME]).toEqual(['Local']);
    expect(herb.tamilNames?.[NAME]).toBe('திப்பிலி');
    expect(herb.descriptions?.[NAME]).toBe('Climbing spice');
    expect(herb.varietyDetails?.[NAME]).toEqual({ Local: {} });
  });

  it('lists a bare entry without adding it to any map', () => {
    const shape = toPlantCatalogShape(
      withHerbs({
        [NAME]: { plantType: 'herb', name: NAME, isUserAdded: true, varieties: [] },
      })
    );
    const herb = shape.categories.herb;
    expect(herb.plants).toContain(NAME);
    expect(herb.varieties).not.toHaveProperty(NAME);
    expect(herb.tamilNames).not.toHaveProperty(NAME);
    expect(herb.descriptions).not.toHaveProperty(NAME);
    expect(herb.varietyDetails).not.toHaveProperty(NAME);
  });

  it('leaves a deleted entry out entirely', () => {
    const shape = toPlantCatalogShape(
      withHerbs({
        [NAME]: {
          plantType: 'herb',
          name: NAME,
          isUserAdded: true,
          isDeleted: true,
          tamilName: 'திப்பிலி',
        },
      })
    );
    expect(shape.categories.herb.plants).not.toContain(NAME);
    expect(shape.categories.herb.tamilNames).not.toHaveProperty(NAME);
  });
});
