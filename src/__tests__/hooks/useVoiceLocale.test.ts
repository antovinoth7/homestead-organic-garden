/**
 * Covers the module-level dictation-language store: hydration, validation of
 * whatever is on disk, the tap-beats-hydration race, and persistence. The store
 * is module state, so every case loads a fresh copy via `jest.resetModules()`.
 */
/* Each case loads a fresh copy of the module under test, so the imports are
 * deliberately deferred past the mocks and use require(). */
/* eslint-disable import/first, @typescript-eslint/no-require-imports */

const mockStore = new Map<string, string>();
let mockGetFails = false;
let mockSetFails = false;
/** When set, the hydration read parks here until the test releases it. */
let mockHoldGet: Promise<void> | null = null;

jest.mock('@/utils/safeStorage', () => ({
  safeGetItem: jest.fn(async (key: string) => {
    if (mockHoldGet) await mockHoldGet;
    if (mockGetFails) throw new Error('read failed');
    return mockStore.get(key) ?? null;
  }),
  safeSetItem: jest.fn(async (key: string, value: string) => {
    if (mockSetFails) return false;
    mockStore.set(key, value);
    return true;
  }),
}));

jest.mock('@/utils/errorLogging', () => ({ logStorageError: jest.fn() }));

import type * as VoiceLocaleModule from '@/hooks/useVoiceLocale';

const KEY = '@garden_voice_locale';

/** A pristine copy of the store — module state must not leak between cases. */
const loadStore = (): typeof VoiceLocaleModule =>
  require('@/hooks/useVoiceLocale') as typeof VoiceLocaleModule;

/** Lets the hydration promise chain settle. */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
};

describe('useVoiceLocale store', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockStore.clear();
    mockGetFails = false;
    mockSetFails = false;
    mockHoldGet = null;
  });

  it('hydrates a stored locale and notifies subscribers', async () => {
    mockStore.set(KEY, 'en-IN');
    const store = loadStore();

    let notified = 0;
    const unsubscribe = store.subscribeToVoiceLocale(() => {
      notified += 1;
    });

    expect(store.getVoiceLocale()).toBe('ta-IN'); // synchronous default, no flicker of layout
    await flush();

    expect(store.getVoiceLocale()).toBe('en-IN');
    expect(notified).toBe(1);
    unsubscribe();
  });

  it('does not touch storage until something subscribes', () => {
    mockStore.set(KEY, 'en-IN');
    const store = loadStore();
    const { safeGetItem } = require('@/utils/safeStorage') as {
      safeGetItem: jest.Mock;
    };

    expect(safeGetItem).not.toHaveBeenCalled();
    store.subscribeToVoiceLocale(() => undefined)();
    expect(safeGetItem).toHaveBeenCalledWith(KEY);
  });

  it('keeps Tamil when nothing is stored', async () => {
    const store = loadStore();
    const unsubscribe = store.subscribeToVoiceLocale(() => undefined);
    await flush();

    expect(store.getVoiceLocale()).toBe('ta-IN');
    unsubscribe();
  });

  // '[]' is what clearAllData would leave behind if this key ever moved into
  // STORAGE_KEYS — it must read as "nothing stored", not as a corrupt locale.
  it.each(['fr-FR', '[]', ''])('ignores the unusable stored value %p', async (stored) => {
    mockStore.set(KEY, stored);
    const store = loadStore();
    const unsubscribe = store.subscribeToVoiceLocale(() => undefined);
    await flush();

    expect(store.getVoiceLocale()).toBe('ta-IN');
    unsubscribe();
  });

  it('lets a tap made before hydration resolves win over the stored value', async () => {
    mockStore.set(KEY, 'ta-IN');
    let release!: () => void;
    mockHoldGet = new Promise<void>((resolve) => {
      release = resolve;
    });

    const store = loadStore();
    const unsubscribe = store.subscribeToVoiceLocale(() => undefined);

    store.setVoiceLocale('en-IN');
    expect(store.getVoiceLocale()).toBe('en-IN');

    release();
    await flush();

    expect(store.getVoiceLocale()).toBe('en-IN');
    unsubscribe();
  });

  it('persists the chosen locale', async () => {
    const store = loadStore();
    store.setVoiceLocale('en-IN');
    await flush();

    expect(mockStore.get(KEY)).toBe('en-IN');
  });

  it('notifies every subscriber once per change and stops after unsubscribe', () => {
    const store = loadStore();
    let a = 0;
    let b = 0;
    const stopA = store.subscribeToVoiceLocale(() => {
      a += 1;
    });
    const stopB = store.subscribeToVoiceLocale(() => {
      b += 1;
    });

    store.setVoiceLocale('en-IN');
    expect([a, b]).toEqual([1, 1]);

    store.setVoiceLocale('en-IN'); // unchanged — no notification
    expect([a, b]).toEqual([1, 1]);

    stopB();
    store.setVoiceLocale('ta-IN');
    expect([a, b]).toEqual([2, 1]);
    stopA();
  });

  it('survives storage failures without throwing or losing the chosen locale', async () => {
    mockGetFails = true;
    mockSetFails = true;
    const store = loadStore();
    const unsubscribe = store.subscribeToVoiceLocale(() => undefined);
    await flush();

    expect(store.getVoiceLocale()).toBe('ta-IN');

    expect(() => store.setVoiceLocale('en-IN')).not.toThrow();
    await flush();
    expect(store.getVoiceLocale()).toBe('en-IN');
    unsubscribe();
  });

  it('exposes Tamil first with a single-glyph short label', () => {
    const store = loadStore();
    expect(store.VOICE_LOCALES.map((o) => o.code)).toEqual(['ta-IN', 'en-IN']);
    expect(store.VOICE_LOCALES.map((o) => o.shortLabel)).toEqual(['த', 'EN']);
    expect(store.VOICE_LOCALES.map((o) => o.label)).toEqual(['தமிழ்', 'English']);
  });
});
