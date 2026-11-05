import type { Theme } from './colors';

/**
 * Wrap a `createStyles(theme)` factory so every component on the same theme
 * shares one sheet. For list rows: each mounted row otherwise builds its own
 * copy of the whole sheet, and rows mount continuously while a list scrolls.
 *
 * Themes are module-level constants (`themes[palette][mode]`), so the cache
 * holds at most one entry per palette and mode, and a palette switch simply
 * misses once.
 */
export function cacheStylesByTheme<S>(factory: (theme: Theme) => S): (theme: Theme) => S {
  const cache = new WeakMap<Theme, S>();
  return (theme) => {
    let styles = cache.get(theme);
    if (styles === undefined) {
      styles = factory(theme);
      cache.set(theme, styles);
    }
    return styles;
  };
}
