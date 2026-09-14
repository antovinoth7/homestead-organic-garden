import { toPlantCareProfilesShape } from '@/services/plantProfiles';
import { makePlantProfiles } from '../fixtures/plant.fixtures';
import type { PlantCareProfile, PlantProfile } from '@/types/database.types';

// `toPlantCareProfilesShape` is pure, but its module reaches Firestore init,
// which throws on missing env at import. Nothing here touches the SDK.
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  refreshAuthToken: jest.fn(async () => true),
}));

// Short-circuits the netinfo native module the retry helper pulls in.
jest.mock('@/utils/firestoreTimeout', () => ({
  withTimeoutAndRetry: jest.fn(async <T,>(op: () => Promise<T>) => op()),
  FIRESTORE_READ_TIMEOUT_MS: 15000,
}));

/**
 * Every care field, with a value that is distinguishable from a default.
 *
 * Typed `Required<PlantCareProfile>` on purpose: add a field to
 * `PlantCareProfile` and this object stops compiling until it is listed here,
 * so the bridge's coverage cannot quietly fall behind the type. Bundled data
 * would not do — it exercises only 30 of the 48, and the 18 it misses are the
 * user-editable ones (`customPests`, `pruningTips`, `guild`, `vitamins` …)
 * that the old hand-written copy was most likely to drop.
 */
const EVERY_CARE_FIELD: Required<PlantCareProfile> = {
  waterRequirement: 'high',
  wateringFrequencyDays: 3,
  wateringEnabled: true,
  fertilisingFrequencyDays: 14,
  fertilisingEnabled: false,
  pruningFrequencyDays: 21,
  pruningEnabled: true,
  sunlight: 'partial_sun',
  soilType: 'red_laterite',
  preferredFertiliser: 'vermicompost',
  initialGrowthStage: 'seedling',
  pruningTips: ['Pinch the leader'],
  shapePruningTip: 'Open the centre',
  shapePruningMonths: 'Jan–Feb',
  flowerPruningTip: 'Leave the spikes',
  flowerPruningMonths: 'Mar–Apr',
  scientificName: 'Testus plantus',
  taxonomicFamily: 'Testaceae',
  lifecycle: 'perennial',
  tamilName: 'சோதனை',
  description: 'A profile that sets every care field.',
  daysToHarvest: { min: 30, max: 60 },
  yearsToFirstHarvest: 2,
  heightCm: { min: 40, max: 120 },
  spacingCm: 45,
  plantingDepthCm: 4,
  growingSeason: 'Year Round',
  germinationDays: { min: 5, max: 9 },
  germinationTempC: { min: 21, max: 33 },
  soilPhRange: { min: 6, max: 7.5 },
  heatTolerance: 'high',
  droughtTolerance: 'low',
  waterloggingTolerance: 'medium',
  petToxicity: true,
  feedingIntensity: 'heavy',
  customPests: ['Test borer'],
  customDiseases: ['Test wilt'],
  customBeneficials: ['Test wasp'],
  growthStageDurations: { seedling: 10, vegetative: 20, mature: 30 },
  annualCycleDurations: { flowering: 15, fruiting: 25 },
  floweringStartMonth: 6,
  seedSource: 'Saved from last season',
  isPermanent: true,
  isDynamicAccumulator: true,
  chopDropIntervalDays: 40,
  guild: 'Test guild',
  vitamins: ['C'],
  minerals: ['Iron'],
};

/** The keys a profile carries that are not care overrides and must not leak. */
const PROFILE_ONLY_KEYS = [
  'plantType',
  'name',
  'varieties',
  'varietyDetails',
  'isUserAdded',
  'isDeleted',
  'cropFamily',
  'layer',
] as const;

const profileWithEveryField = (): PlantProfile => ({
  plantType: 'vegetable',
  name: 'Tomato',
  varieties: ['Country Tomato'],
  varietyDetails: { 'Country Tomato': { notes: 'local' } },
  isUserAdded: true,
  cropFamily: 'solanaceae',
  layer: 'ground_cover',
  ...EVERY_CARE_FIELD,
});

describe('toPlantCareProfilesShape', () => {
  it('carries every care field through to the override', () => {
    const result = toPlantCareProfilesShape(makePlantProfiles([profileWithEveryField()]));
    expect(result.vegetable.Tomato).toEqual(EVERY_CARE_FIELD);
  });

  it('leaves the profile-only keys behind', () => {
    const result = toPlantCareProfilesShape(makePlantProfiles([profileWithEveryField()]));
    for (const key of PROFILE_ONLY_KEYS) {
      expect(result.vegetable.Tomato).not.toHaveProperty(key);
    }
  });

  // An override is a delta. An explicit `undefined` still counts as an own key,
  // so it would shadow the bundled default with nothing rather than defer to it.
  it('drops keys whose value is undefined', () => {
    const profiles = makePlantProfiles([
      {
        plantType: 'vegetable',
        name: 'Tomato',
        wateringFrequencyDays: 3,
        spacingCm: undefined,
      },
    ]);

    const override = toPlantCareProfilesShape(profiles).vegetable.Tomato;

    expect(override).toEqual({ wateringFrequencyDays: 3 });
    expect(Object.keys(override ?? {})).not.toContain('spacingCm');
  });

  it('omits a plant whose profile overrides nothing', () => {
    const profiles = makePlantProfiles([{ plantType: 'vegetable', name: 'Tomato' }]);
    expect(toPlantCareProfilesShape(profiles).vegetable).toEqual({});
  });

  it('omits a tombstoned entry entirely', () => {
    const profiles = makePlantProfiles([
      { plantType: 'vegetable', name: 'Tomato', isDeleted: true, wateringFrequencyDays: 3 },
    ]);
    expect(toPlantCareProfilesShape(profiles).vegetable).toEqual({});
  });
});
