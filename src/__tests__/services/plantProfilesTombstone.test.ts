/**
 * Deleting a bundled catalog entry has to survive a round trip through storage.
 * The Firestore SDK is never mocked (per project rules); the app's storage
 * wrapper stands in for the device, and the auth stub keeps the remote write
 * path from running at all.
 */

import {
  DEFAULT_PLANT_PROFILES,
  deletePlantProfile,
  getHiddenPlantNames,
  getMergedProfiles,
  getPlantNamesForType,
  getPlantProfiles,
  getProfileEntry,
  restorePlantProfile,
  savePlantProfile,
  createEmptyProfiles,
} from '@/services/plantProfiles';
import type { PlantProfiles } from '@/types/database.types';

const mockMemoryStore = new Map<string, unknown[]>();

jest.mock('@/lib/storage', () => ({
  KEYS: { PLANT_PROFILES: '@garden_plant_profiles', PLANT_CATALOG: '@garden_plant_catalog', PLANT_CARE_PROFILES: '@garden_plant_care_profiles' },
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

/** A bundled vegetable that every install ships with. */
const BUNDLED = 'Tomato';

beforeEach(() => {
  mockMemoryStore.clear();
  cache.clear();
  mockMemoryStore.set('@garden_plant_profiles', [createEmptyProfiles()]);
});

describe('deleting a bundled catalog entry', () => {
  it('hides the plant instead of letting the default re-appear', async () => {
    expect(getPlantNamesForType(await getPlantProfiles(), 'vegetable')).toContain(BUNDLED);

    const after = await deletePlantProfile('vegetable', BUNDLED);
    expect(getPlantNamesForType(after, 'vegetable')).not.toContain(BUNDLED);

    // The critical case: re-reading must not resurrect it.
    cache.clear();
    const reread = await getPlantProfiles();
    expect(getPlantNamesForType(reread, 'vegetable')).not.toContain(BUNDLED);
  });

  it('keeps the tombstone through a save/load round trip', async () => {
    await deletePlantProfile('vegetable', BUNDLED);
    cache.clear();

    const stored = (mockMemoryStore.get('@garden_plant_profiles') as PlantProfiles[])[0];
    expect(stored?.vegetable?.[BUNDLED]?.isDeleted).toBe(true);
    expect((await getPlantProfiles()).vegetable[BUNDLED]?.isDeleted).toBe(true);
  });

  it('reports the hidden name so the restore UI can offer it back', async () => {
    const after = await deletePlantProfile('vegetable', BUNDLED);
    expect(getHiddenPlantNames(after).vegetable).toEqual([BUNDLED]);
  });

  it('treats a hidden entry as absent, not as an entry', async () => {
    const after = await deletePlantProfile('vegetable', BUNDLED);
    expect(getProfileEntry(after, 'vegetable', BUNDLED)).toBeUndefined();
    expect(getMergedProfiles(after).vegetable[BUNDLED]).toBeUndefined();
  });

  it('restores the bundled entry on request', async () => {
    await deletePlantProfile('vegetable', BUNDLED);
    const after = await restorePlantProfile('vegetable', BUNDLED);

    expect(getPlantNamesForType(after, 'vegetable')).toContain(BUNDLED);
    expect(getHiddenPlantNames(after).vegetable).toEqual([]);
    expect(getProfileEntry(after, 'vegetable', BUNDLED)).toMatchObject({ name: BUNDLED });
  });

  it('resurrects the entry when the same name is saved again', async () => {
    await deletePlantProfile('vegetable', BUNDLED);
    const after = await savePlantProfile('vegetable', BUNDLED, { wateringFrequencyDays: 3 });

    expect(after.vegetable[BUNDLED]?.isDeleted).toBeUndefined();
    expect(getPlantNamesForType(after, 'vegetable')).toContain(BUNDLED);
  });
});

describe('deleting a user-added entry', () => {
  it('removes it outright rather than tombstoning it', async () => {
    const added = await savePlantProfile('vegetable', 'Backyard Gourd', { isUserAdded: true });
    expect(getPlantNamesForType(added, 'vegetable')).toContain('Backyard Gourd');

    const after = await deletePlantProfile('vegetable', 'Backyard Gourd');
    expect(after.vegetable['Backyard Gourd']).toBeUndefined();
    expect(getHiddenPlantNames(after).vegetable).toEqual([]);
  });
});

describe('getMergedProfiles', () => {
  it('exposes the bundled catalog even when nothing has been edited', () => {
    const empty = createEmptyProfiles();
    const merged = getMergedProfiles(empty);

    // The bug this guards: `profiles` is empty on a fresh install, so anything
    // reading it directly (search) saw no plants at all.
    expect(Object.keys(empty.vegetable)).toHaveLength(0);
    expect(Object.keys(merged.vegetable).length).toBe(
      Object.keys(DEFAULT_PLANT_PROFILES.vegetable).length
    );
    expect(merged.vegetable[BUNDLED]).toMatchObject({ name: BUNDLED });
  });
});
