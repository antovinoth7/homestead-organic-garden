import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, Theme } from '@/theme/colors';
import { DEFAULT_PALETTE, isThemePalette, themes } from '@/theme/themes';
import type { ThemePalette } from '@/theme/themeStyle';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';
import { logStorageError } from '@/utils/errorLogging';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
  theme: Theme;
}

const THEME_STORAGE_KEY = '@garden_theme_mode';
export const PALETTE_STORAGE_KEY = '@garden_theme_palette';

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => undefined,
  resolvedMode: 'light',
  palette: DEFAULT_PALETTE,
  setPalette: () => undefined,
  theme: lightTheme,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [palette, setPalette] = useState<ThemePalette>(DEFAULT_PALETTE);
  // Writes wait until the stored values are read, so the defaults never
  // overwrite a saved choice during the first render.
  const [hydrated, setHydrated] = useState(false);
  const systemScheme = useColorScheme();
  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    let isMounted = true;
    const loadTheme = async (): Promise<void> => {
      try {
        const [storedMode, storedPalette] = await Promise.all([
          safeGetItem(THEME_STORAGE_KEY),
          safeGetItem(PALETTE_STORAGE_KEY),
        ]);
        if (!isMounted) return;
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setMode(storedMode);
        }
        if (isThemePalette(storedPalette)) setPalette(storedPalette);
      } catch (error) {
        logStorageError('Error loading theme preference', error as Error);
      } finally {
        if (isMounted) setHydrated(true);
      }
    };
    loadTheme();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const saveTheme = async (): Promise<void> => {
      try {
        await Promise.all([
          safeSetItem(THEME_STORAGE_KEY, mode),
          safeSetItem(PALETTE_STORAGE_KEY, palette),
        ]);
      } catch (error) {
        logStorageError('Error saving theme preference', error as Error);
      }
    };
    saveTheme();
  }, [hydrated, mode, palette]);

  const theme = themes[palette][resolvedMode];

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedMode,
      palette,
      setPalette,
      theme,
    }),
    [mode, resolvedMode, palette, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): Theme => {
  return useContext(ThemeContext).theme;
};

export const useThemeMode = (): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
} => {
  const { mode, setMode, resolvedMode } = useContext(ThemeContext);
  return { mode, setMode, resolvedMode };
};

export const usePalette = (): {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
} => {
  const { palette, setPalette } = useContext(ThemeContext);
  return { palette, setPalette };
};
