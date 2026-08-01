/**
 * Covers clearAllData's data-safety invariants with an in-memory stand-in for
 * the safeStorage wrapper (AsyncStorage itself is a native module).
 */

const mockStore = new Map<string, unknown>();
let mockSetDataFails = false;

jest.mock('@/utils/safeStorage', () => ({
  safeGetData: jest.fn(async (key: string) => mockStore.get(key) ?? []),
  safeSetData: jest.fn(async (key: string, value: unknown[]) => {
    if (mockSetDataFails) return false;
    mockStore.set(key, value);
    return true;
  }),
  safeRemoveItem: jest.fn(async (key: string) => {
    mockStore.delete(key);
    return true;
  }),
}));

jest.mock('@/lib/dataCache', () => ({
  invalidateAll: jest.fn(),
}));

jest.mock('@/utils/errorLogging', () => ({
  logStorageError: jest.fn(),
}));

// Imported after the mocks so the factories' closed-over mockStore is
// initialized before @/lib/storage is evaluated.
// eslint-disable-next-line import/first
import { KEYS, clearAllData, setData, getData, getLocationStorageKey } from '@/lib/storage';

beforeEach(() => {
  mockStore.clear();
  mockSetDataFails = false;
});

describe('setData durability', () => {
  it('reports whether the value actually reached storage', async () => {
    expect(await setData(KEYS.PLANTS, [{ id: 'p1' }])).toBe(true);

    mockSetDataFails = true;
    expect(await setData(KEYS.PLANTS, [{ id: 'p2' }])).toBe(false);
  });
});

describe('clearAllData', () => {
  it('preserves the offline queue — its entries never reached Firestore', async () => {
    const queued = [{ id: 'om1', collection: 'plants', docId: 'p1' }];
    mockStore.set(KEYS.OFFLINE_QUEUE, queued);
    mockStore.set(KEYS.PLANTS, [{ id: 'p1' }]);

    await clearAllData();

    expect(mockStore.get(KEYS.OFFLINE_QUEUE)).toEqual(queued);
    expect(await getData(KEYS.PLANTS)).toEqual([]);
  });

  it('preserves the onboarding flag rather than corrupting it with an array', async () => {
    // Written as a plain string by useOnboardingStatus; an array write would
    // leave the literal "[]" behind and re-trigger onboarding.
    mockStore.set(KEYS.ONBOARDING_COMPLETE, 'true');

    await clearAllData();

    expect(mockStore.get(KEYS.ONBOARDING_COMPLETE)).toBe('true');
  });

  it('removes the scalar last-sync key instead of writing an array to it', async () => {
    mockStore.set(KEYS.LAST_SYNC, '2026-08-01T00:00:00.000Z');

    await clearAllData();

    expect(mockStore.has(KEYS.LAST_SYNC)).toBe(false);
  });

  it('clears the re-fetchable caches', async () => {
    for (const key of [KEYS.PLANTS, KEYS.TASKS, KEYS.BEDS, KEYS.JOURNAL, KEYS.FARM_CONFIG]) {
      mockStore.set(key, [{ id: 'x' }]);
    }

    await clearAllData();

    for (const key of [KEYS.PLANTS, KEYS.TASKS, KEYS.BEDS, KEYS.JOURNAL, KEYS.FARM_CONFIG]) {
      expect(mockStore.get(key)).toEqual([]);
    }
  });

  it('clears the uid-scoped locations key when a uid is supplied', async () => {
    const scoped = getLocationStorageKey('user-1');
    mockStore.set(scoped, [{ id: 'loc-1' }]);

    await clearAllData('user-1');

    expect(mockStore.get(scoped)).toEqual([]);
  });
});
