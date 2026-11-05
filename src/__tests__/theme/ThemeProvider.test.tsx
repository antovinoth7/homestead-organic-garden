/* The repository's Jest preset is Node-only, so this test stubs the native
 * boundaries and drives the provider through a probe component. */
/* eslint-disable import/first */
const mockScheme = { current: 'light' as 'light' | 'dark' };
jest.mock('react-native', () => ({
  useColorScheme: () => mockScheme.current,
}));

const mockStore = new Map<string, string>();
jest.mock('@/utils/safeStorage', () => ({
  safeGetItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  safeSetItem: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
}));
jest.mock('@/utils/errorLogging', () => ({ logStorageError: jest.fn() }));

import React from 'react';
import { PALETTE_STORAGE_KEY, ThemeProvider, usePalette, useTheme, useThemeMode } from '@/theme';
import type { Theme } from '@/theme/colors';
import type { ThemePalette } from '@/theme/themeStyle';
import { themes } from '@/theme/themes';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => { unmount: () => void };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

interface Snapshot {
  theme: Theme;
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
}

let latest: Snapshot;

function Probe(): null {
  const theme = useTheme();
  const { palette, setPalette } = usePalette();
  const { setMode } = useThemeMode();
  React.useEffect(() => {
    latest = { theme, palette, setPalette, setMode };
  });
  return null;
}

async function mount(): Promise<{ unmount: () => void }> {
  let tree!: { unmount: () => void };
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
  });
  return tree;
}

describe('ThemeProvider palette', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    mockStore.clear();
    mockScheme.current = 'light';
  });

  it('defaults to Meadow when nothing is stored', async () => {
    const tree = await mount();
    expect(latest.palette).toBe('meadow');
    expect(latest.theme).toBe(themes.meadow.light);
    tree.unmount();
  });

  it('follows the system scheme within the palette', async () => {
    mockScheme.current = 'dark';
    const tree = await mount();
    expect(latest.theme).toBe(themes.meadow.dark);
    tree.unmount();
  });

  it('restores a stored Garden choice', async () => {
    mockStore.set(PALETTE_STORAGE_KEY, 'garden');
    const tree = await mount();
    expect(latest.palette).toBe('garden');
    expect(latest.theme).toBe(themes.garden.light);
    tree.unmount();
  });

  it('ignores an unknown stored palette', async () => {
    mockStore.set(PALETTE_STORAGE_KEY, 'terracotta');
    const tree = await mount();
    expect(latest.palette).toBe('meadow');
    tree.unmount();
  });

  it('applies and persists a new palette and mode at once', async () => {
    const tree = await mount();
    await TestRenderer.act(async () => {
      latest.setPalette('garden');
      latest.setMode('dark');
    });
    expect(latest.theme).toBe(themes.garden.dark);
    expect(mockStore.get(PALETTE_STORAGE_KEY)).toBe('garden');
    expect(mockStore.get('@garden_theme_mode')).toBe('dark');
    tree.unmount();
  });

  it('does not overwrite a stored choice with the defaults before it loads', async () => {
    mockStore.set(PALETTE_STORAGE_KEY, 'garden');
    const tree = await mount();
    expect(mockStore.get(PALETTE_STORAGE_KEY)).toBe('garden');
    tree.unmount();
  });
});
