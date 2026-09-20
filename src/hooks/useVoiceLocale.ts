import { useCallback, useSyncExternalStore } from 'react';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';
import { logStorageError } from '@/utils/errorLogging';

/**
 * App-wide dictation language, shared by every mounted `VoiceDictation` and
 * persisted across restarts.
 *
 * A module-level store rather than a Context provider: the value is consumed by
 * a handful of leaf nodes (four on a single catalog detail page), so a provider
 * at the `App.tsx` root would re-render the whole tree for a leaf concern, and
 * every call site — including the ones inside a bottom sheet — would need the
 * provider above it. Same shape as `src/utils/networkState.ts`, with React's
 * subscription primitive on top.
 */

export type VoiceLocaleCode = 'ta-IN' | 'en-IN';

export interface VoiceLocaleOption {
  code: VoiceLocaleCode;
  /** Full name in its own script — used by the stacked control and every a11y label. */
  label: string;
  /** Single token for the compact pill, where the full name would not fit legibly. */
  shortLabel: string;
}

const TAMIL: VoiceLocaleOption = { code: 'ta-IN', label: 'தமிழ்', shortLabel: 'த' };
const ENGLISH: VoiceLocaleOption = { code: 'en-IN', label: 'English', shortLabel: 'EN' };

/** Voice locales offered per field — Tamil (default) and Indian English. */
export const VOICE_LOCALES: readonly VoiceLocaleOption[] = [TAMIL, ENGLISH];

const DEFAULT_LOCALE: VoiceLocaleCode = TAMIL.code;

/** With exactly two locales these stay exhaustive without any indexed access. */
const optionFor = (code: VoiceLocaleCode): VoiceLocaleOption =>
  code === ENGLISH.code ? ENGLISH : TAMIL;
const nextOptionFor = (code: VoiceLocaleCode): VoiceLocaleOption =>
  code === ENGLISH.code ? TAMIL : ENGLISH;

/**
 * Deliberately not in `STORAGE_KEYS`: `clearAllData` writes `[]` into every key
 * it finds there, which would leave the literal "[]" behind for the next read —
 * the same corruption already documented for LAST_SYNC in src/lib/storage.ts.
 * This is a device preference, not a re-fetchable cache, so it stays local here,
 * following THEME_STORAGE_KEY's precedent in src/theme/index.tsx.
 */
const VOICE_LOCALE_STORAGE_KEY = '@garden_voice_locale';

let current: VoiceLocaleCode = DEFAULT_LOCALE;
let hydrationStarted = false;
/** A tap that lands before hydration resolves must win over the stored value. */
let userChose = false;

const listeners = new Set<() => void>();

const notify = (): void => {
  listeners.forEach((listener) => listener());
};

const isVoiceLocaleCode = (value: unknown): value is VoiceLocaleCode =>
  VOICE_LOCALES.some((option) => option.code === value);

/**
 * Reads the stored preference once, on first subscribe rather than on import,
 * so merely importing a component that uses this hook touches no storage.
 */
const ensureHydrated = (): void => {
  if (hydrationStarted) return;
  hydrationStarted = true;

  void (async (): Promise<void> => {
    try {
      const stored = await safeGetItem(VOICE_LOCALE_STORAGE_KEY);
      if (userChose) return; // the user already picked; their tap outranks the disk
      if (!isVoiceLocaleCode(stored) || stored === current) return;
      current = stored;
      notify();
    } catch (error) {
      logStorageError('Error loading voice language preference', error as Error);
    }
  })();
};

const persist = (next: VoiceLocaleCode): void => {
  void (async (): Promise<void> => {
    try {
      await safeSetItem(VOICE_LOCALE_STORAGE_KEY, next);
    } catch (error) {
      logStorageError('Error saving voice language preference', error as Error);
    }
  })();
};

/**
 * Subscribe to dictation-language changes. Exported (like
 * `subscribeToNetworkChanges`) so non-React callers and tests can observe the
 * store without a renderer; `useVoiceLocale` hands it to useSyncExternalStore.
 */
export const subscribeToVoiceLocale = (listener: () => void): (() => void) => {
  listeners.add(listener);
  ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
};

/** Primitive snapshot, so `useSyncExternalStore` needs no memoization. */
export const getVoiceLocale = (): VoiceLocaleCode => current;

/**
 * Sets the app-wide dictation language. Exported as a plain function so
 * non-React callers (and tests resetting module state) need no renderer.
 */
export const setVoiceLocale = (next: VoiceLocaleCode): void => {
  userChose = true;
  if (next === current) return;
  current = next;
  notify();
  persist(next);
};

export interface UseVoiceLocaleResult {
  locale: VoiceLocaleCode;
  /** The active option, so callers never re-look-up its labels. */
  option: VoiceLocaleOption;
  /** Where a toggle would land — drives the compact control's a11y hint. */
  nextOption: VoiceLocaleOption;
  setLocale: (next: VoiceLocaleCode) => void;
  toggleLocale: () => void;
}

export const useVoiceLocale = (): UseVoiceLocaleResult => {
  const locale = useSyncExternalStore(subscribeToVoiceLocale, getVoiceLocale, getVoiceLocale);
  const nextOption = nextOptionFor(locale);

  const toggleLocale = useCallback(() => {
    setVoiceLocale(nextOptionFor(getVoiceLocale()).code);
  }, []);

  return {
    locale,
    option: optionFor(locale),
    nextOption,
    setLocale: setVoiceLocale,
    toggleLocale,
  };
};
