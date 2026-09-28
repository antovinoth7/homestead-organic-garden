/**
 * A user-added catalog entry records the Category it was created under, so it
 * is filed there rather than by its care model. The field has to survive the
 * normaliser, which keeps only the keys it knows. The Firestore SDK is never
 * mocked (per project rules); the app's storage wrapper stands in for the
 * device, and the auth stub keeps the remote write path from running at all.
 */

import {
  createEmptyProfiles,
  getPlantProfiles,
  savePlantProfile,
  toPlantCareProfilesShape,
} from '@/services/plantProfiles';
import type { PlantProfiles } from '@/types/database.types';

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

// No signed-in user, so the Firestore branch of savePlantProfiles returns early.
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

beforeEach(() => {
  mockMemoryStore.clear();
  cache.clear();
  mockMemoryStore.set('@garden_plant_profiles', [createEmptyProfiles()]);
});

describe('a user-added entry’s Category', () => {
  it('survives a save/load round trip', async () => {
    await savePlantProfile('herb', NAME, { group: 'spices' });
    cache.clear();

    expect((await getPlantProfiles()).herb[NAME]?.group).toBe('spices');
  });

  it('drops a value that is not a catalog group', async () => {
    const raw = createEmptyProfiles() as unknown as Record<string, Record<string, unknown>>;
    raw.herb = { [NAME]: { plantType: 'herb', name: NAME, group: 'herb' } };
    mockMemoryStore.set('@garden_plant_profiles', [raw]);

    expect((await getPlantProfiles()).herb[NAME]).not.toHaveProperty('group');
  });

  it('is not passed on as a care override', async () => {
    const profiles: PlantProfiles = await savePlantProfile('herb', NAME, {
      group: 'spices',
      wateringFrequencyDays: 4,
    });

    const care = toPlantCareProfilesShape(profiles).herb[NAME];
    expect(care).toEqual({ wateringFrequencyDays: 4 });
  });
});
