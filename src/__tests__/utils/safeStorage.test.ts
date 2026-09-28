/**
 * Covers the strict reader that the offline queue depends on. AsyncStorage is a
 * native module, so it is stood in for with an in-memory map whose behaviour
 * each test drives directly.
 */

const mockStore = new Map<string, string>();
/** When set, getItem rejects with this error instead of returning a value. */
let mockGetItemError: Error | null = null;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => {
      if (mockGetItemError) throw mockGetItemError;
      return mockStore.get(key) ?? null;
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
  },
}));

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// Imported after the mocks so the factories' closed-over mockStore is
// initialized before the module under test is evaluated.
// eslint-disable-next-line import/first
import AsyncStorage from '@react-native-async-storage/async-storage';
// eslint-disable-next-line import/first
import { safeReadData, safeGetData } from '@/utils/safeStorage';

const KEY = '@garden_offline_queue';

const quarantineKeys = (): string[] =>
  [...mockStore.keys()].filter((k) => k.startsWith(`${KEY}__`));

beforeEach(() => {
  mockStore.clear();
  mockGetItemError = null;
  jest.clearAllMocks();
});

describe('safeReadData', () => {
  it('returns the stored array', async () => {
    mockStore.set(KEY, JSON.stringify([{ id: 'a' }, { id: 'b' }]));
    const result = await safeReadData(KEY);
    expect(result).toEqual({ ok: true, data: [{ id: 'a' }, { id: 'b' }] });
  });

  it('treats a missing key as an empty array, not a failure', async () => {
    await expect(safeReadData(KEY)).resolves.toEqual({ ok: true, data: [] });
  });

  it('reports a non-array value as `shape` and quarantines it', async () => {
    mockStore.set(KEY, JSON.stringify({ notAnArray: true }));

    const result = await safeReadData(KEY);

    expect(result).toEqual({ ok: false, reason: 'shape' });
    // The original blob is kept under a quarantine key rather than dropped.
    expect(quarantineKeys()).toHaveLength(1);
    expect(mockStore.get(quarantineKeys()[0]!)).toBe(JSON.stringify({ notAnArray: true }));
    expect(mockStore.has(KEY)).toBe(false);
  });

  it('reports unparseable JSON as `corrupt` and quarantines it', async () => {
    mockStore.set(KEY, '{"half written');

    const result = await safeReadData(KEY);

    expect(result).toEqual({ ok: false, reason: 'corrupt' });
    expect(quarantineKeys()).toHaveLength(1);
    expect(mockStore.get(quarantineKeys()[0]!)).toBe('{"half written');
    expect(mockStore.has(KEY)).toBe(false);
  });

  it('reports `io` once the retries are exhausted, without discarding the key', async () => {
    mockStore.set(KEY, JSON.stringify([{ id: 'a' }]));
    mockGetItemError = new Error('SQLite disk I/O error');

    const result = await safeReadData(KEY, 1);

    expect(result).toEqual({ ok: false, reason: 'io' });
    // A transient read failure must never destroy the data behind it.
    expect(mockStore.get(KEY)).toBe(JSON.stringify([{ id: 'a' }]));
    expect(quarantineKeys()).toHaveLength(0);
  });

  it('retries a transient failure and succeeds', async () => {
    mockStore.set(KEY, JSON.stringify([{ id: 'a' }]));
    let calls = 0;
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      calls += 1;
      if (calls === 1) throw new Error('transient');
      return mockStore.get(key) ?? null;
    });

    await expect(safeReadData(KEY, 2)).resolves.toEqual({ ok: true, data: [{ id: 'a' }] });
    expect(calls).toBe(2);
  });
});

describe('safeGetData', () => {
  it('still flattens every failure to [] for cache callers', async () => {
    mockStore.set(KEY, JSON.stringify({ notAnArray: true }));
    await expect(safeGetData(KEY)).resolves.toEqual([]);

    mockGetItemError = new Error('SQLite disk I/O error');
    await expect(safeGetData(KEY, 0)).resolves.toEqual([]);
  });

  it('returns the array on success', async () => {
    mockStore.set(KEY, JSON.stringify([1, 2, 3]));
    await expect(safeGetData(KEY)).resolves.toEqual([1, 2, 3]);
  });
});
