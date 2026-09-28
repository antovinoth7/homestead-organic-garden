/**
 * The rules behind removing a name from the catalog. These are pure map
 * transforms, but the assertions run them through the service's own read
 * helpers, so the Firebase module is stubbed to keep that import graph loadable
 * — the Firestore SDK itself is never mocked, per project rules.
 */
/* eslint-disable import/first */
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
  refreshAuthToken: jest.fn(async () => true),
}));
// Cuts the chain into NetInfo, which the Node preset cannot transform.
jest.mock('@/utils/firestoreTimeout', () => ({
  withTimeoutAndRetry: jest.fn(async <T>(op: () => Promise<T>) => op()),
  FIRESTORE_READ_TIMEOUT_MS: 15000,
  FIRESTORE_WRITE_TIMEOUT_MS: 15000,
}));
jest.mock('@/lib/offlineWrite', () => ({ writeOrQueue: jest.fn(async () => ({ queued: false })) }));
jest.mock('@/lib/offlineQueue', () => ({ getQueue: jest.fn(async () => []) }));
jest.mock('@/lib/storage', () => ({
  KEYS: { PLANT_PROFILES: '@garden_plant_profiles' },
  getData: jest.fn(async () => []),
  setData: jest.fn(async () => true),
}));
jest.mock('@/lib/dataCache', () => ({
  getCached: jest.fn(() => undefined),
  setCached: jest.fn(),
  invalidate: jest.fn(),
}));

import {
  applyProfileDeletion,
  applyProfileDismissal,
  applyProfileRename,
  applyProfileRestore,
} from '@/utils/plantProfileMutations';
import {
  createEmptyProfiles,
  getHiddenPlantNames,
  getMergedProfiles,
  getPlantNamesForType,
  getProfileEntry,
} from '@/services/plantProfiles';
import type { PlantProfiles } from '@/types/database.types';

/**
 * Models `setDoc(..., { merge: true })` over nested maps: a key named in the
 * payload is written, a key absent from it is left exactly as the server had
 * it — never removed. This is the rule the whole module exists to satisfy, so
 * the tests assert against a model of it rather than against the old code.
 */
function simulateMergeWrite(remote: PlantProfiles, payload: PlantProfiles): PlantProfiles {
  const merged = createEmptyProfiles();
  for (const type of Object.keys(merged) as (keyof PlantProfiles)[]) {
    merged[type] = { ...(remote[type] ?? {}), ...(payload[type] ?? {}) };
  }
  return merged;
}

const withUserPlant = (): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles.vegetable['Backyard Gourd'] = {
    plantType: 'vegetable',
    name: 'Backyard Gourd',
    isUserAdded: true,
  };
  return profiles;
};

describe('applyProfileDeletion', () => {
  it('tombstones a user-added entry rather than dropping the key', () => {
    const after = applyProfileDeletion(withUserPlant(), 'vegetable', 'Backyard Gourd', 1700000000);

    expect(after.vegetable['Backyard Gourd']).toEqual({
      plantType: 'vegetable',
      name: 'Backyard Gourd',
      isDeleted: true,
      deletedAt: 1700000000,
    });
  });

  it('survives the merged write the app actually performs', () => {
    // The regression this module exists for: the server still holds the live
    // entry, and the payload has to be able to say "this one is gone".
    const remote = withUserPlant();
    const payload = applyProfileDeletion(remote, 'vegetable', 'Backyard Gourd');

    const remoteAfter = simulateMergeWrite(remote, payload);

    expect(getPlantNamesForType(remoteAfter, 'vegetable')).not.toContain('Backyard Gourd');
  });

  it('would not have survived it as a removed key', () => {
    // The counter-example, constructed here rather than taken from the old
    // code: dropping the key leaves the payload silent about that name, so the
    // server keeps it and the next sync hands it straight back.
    const remote = withUserPlant();
    const payload = createEmptyProfiles();

    const remoteAfter = simulateMergeWrite(remote, payload);

    expect(getPlantNamesForType(remoteAfter, 'vegetable')).toContain('Backyard Gourd');
  });

  it('hides a tombstoned user entry from every read path', () => {
    const after = applyProfileDeletion(withUserPlant(), 'vegetable', 'Backyard Gourd');

    expect(getPlantNamesForType(after, 'vegetable')).not.toContain('Backyard Gourd');
    expect(getProfileEntry(after, 'vegetable', 'Backyard Gourd')).toBeUndefined();
    expect(getMergedProfiles(after).vegetable['Backyard Gourd']).toBeUndefined();
  });

  it('offers no restore row for a user-added entry, so it reads as gone', () => {
    const after = applyProfileDeletion(withUserPlant(), 'vegetable', 'Backyard Gourd');

    expect(getHiddenPlantNames(after).vegetable).toEqual([]);
  });

  it('tombstones a bundled entry too, which is what hides it', () => {
    const after = applyProfileDeletion(createEmptyProfiles(), 'vegetable', 'Tomato');

    expect(after.vegetable.Tomato?.isDeleted).toBe(true);
    expect(getPlantNamesForType(after, 'vegetable')).not.toContain('Tomato');
    expect(getHiddenPlantNames(after).vegetable).toContain('Tomato');
  });
});

describe('applyProfileRestore', () => {
  it('writes the bundled record back instead of removing the tombstone', () => {
    const defaults = getMergedProfiles(createEmptyProfiles());
    const hidden = applyProfileDeletion(createEmptyProfiles(), 'vegetable', 'Tomato');

    const after = applyProfileRestore(hidden, defaults, 'vegetable', 'Tomato');

    // Removing the key would leave the server's `isDeleted: true` untouched and
    // the next sync would re-hide it, so the key has to stay and say otherwise.
    expect(after.vegetable.Tomato).toBeDefined();
    expect(after.vegetable.Tomato?.isDeleted).toBeUndefined();
    expect(getPlantNamesForType(after, 'vegetable')).toContain('Tomato');
  });

  it('un-hides through the merged write', () => {
    const defaults = getMergedProfiles(createEmptyProfiles());
    const remote = applyProfileDeletion(createEmptyProfiles(), 'vegetable', 'Tomato');
    const payload = applyProfileRestore(remote, defaults, 'vegetable', 'Tomato');

    const remoteAfter = simulateMergeWrite(remote, payload);

    expect(getHiddenPlantNames(remoteAfter).vegetable).not.toContain('Tomato');
    expect(getPlantNamesForType(remoteAfter, 'vegetable')).toContain('Tomato');
  });
});

describe('applyProfileRename', () => {
  it('writes the new name and tombstones the old one', () => {
    const after = applyProfileRename(
      withUserPlant(),
      'vegetable',
      'Backyard Gourd',
      'Snake Gourd',
      { isUserAdded: true }
    );

    expect(after.vegetable['Snake Gourd']?.name).toBe('Snake Gourd');
    expect(after.vegetable['Backyard Gourd']?.isDeleted).toBe(true);
    expect(getPlantNamesForType(after, 'vegetable')).toContain('Snake Gourd');
    expect(getPlantNamesForType(after, 'vegetable')).not.toContain('Backyard Gourd');
  });

  it('does not leave a bundled name behind under both spellings', () => {
    // Dropping the key was worse than a sync problem here: the bundled catalog
    // re-injected the old name immediately, with no Firestore involved at all.
    const after = applyProfileRename(createEmptyProfiles(), 'vegetable', 'Tomato', 'Tomatoes', {});

    const names = getPlantNamesForType(after, 'vegetable');
    expect(names).toContain('Tomatoes');
    expect(names).not.toContain('Tomato');
  });

  it('leaves no tombstone when the name is unchanged', () => {
    const after = applyProfileRename(withUserPlant(), 'vegetable', 'Okra', 'Okra', {});

    expect(after.vegetable.Okra?.isDeleted).toBeUndefined();
  });
});

describe('applyProfileDismissal', () => {
  it('drops a hidden entry from the restore list without un-hiding it', () => {
    const hidden = applyProfileDeletion(createEmptyProfiles(), 'vegetable', 'Tomato');

    const after = applyProfileDismissal(hidden, 'vegetable', 'Tomato');

    expect(getHiddenPlantNames(after).vegetable).not.toContain('Tomato');
    expect(getPlantNamesForType(after, 'vegetable')).not.toContain('Tomato');
  });

  it('ignores a name that was never deleted', () => {
    const profiles = withUserPlant();

    expect(applyProfileDismissal(profiles, 'vegetable', 'Backyard Gourd')).toBe(profiles);
  });
});
