import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getData, setData, KEYS } from '@/lib/storage';
import {
  buildCatalogSearchIndex,
  pushRecentSearch,
  searchCatalog,
} from '@/utils/catalogSearch';
import type { CatalogSearchResult } from '@/utils/catalogSearch';
import type { PlantProfiles, PlantType } from '@/types/database.types';

/** Keystrokes settle before the index is queried; short enough to feel live. */
const DEBOUNCE_MS = 120;

interface Args {
  profiles: PlantProfiles;
  plantCountsByType: Record<PlantType, Record<string, number>>;
}

export interface UseCatalogSearchReturn {
  query: string;
  setQuery: (next: string) => void;
  clearQuery: () => void;
  /** True once a non-empty query has settled — drives the results view. */
  isSearching: boolean;
  results: CatalogSearchResult[];
  /** Matches before the display limit — the header shows "N of total". */
  totalMatches: number;
  recentSearches: string[];
  /** Records a query as recent. Called when a search is acted on, not per keystroke. */
  commitSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

/**
 * Cross-category catalog search. Owns the query, its debounced results, and the
 * recent-search list; the catalog data itself stays with `usePlantCatalogManager`.
 */
export function useCatalogSearch({
  profiles,
  plantCountsByType,
}: Args): UseCatalogSearchReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Recents are persisted by an effect rather than inside the state updater:
  // React double-invokes updaters under StrictMode, so a write in there fires
  // twice. The flag keeps the first render from clobbering stored recents
  // with the empty initial state before the load below resolves.
  const hydratedRef = useRef(false);

  // Load persisted recents once.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    void (async () => {
      const stored = await getData<string>(KEYS.CATALOG_RECENT_SEARCHES);
      if (mountedRef.current && stored.length > 0) {
        setRecentSearches(stored);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    void setData(KEYS.CATALOG_RECENT_SEARCHES, recentSearches);
  }, [recentSearches]);

  // Rebuilt only when the catalog reloads — not on every keystroke.
  const index = useMemo(
    () => buildCatalogSearchIndex(profiles, plantCountsByType),
    [profiles, plantCountsByType]
  );

  const outcome = useMemo(() => searchCatalog(index, debouncedQuery), [index, debouncedQuery]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const commitSearch = useCallback((next: string) => {
    setRecentSearches((prev) => pushRecentSearch(prev, next));
  }, []);

  const clearRecentSearches = useCallback(() => setRecentSearches([]), []);

  return {
    query,
    setQuery,
    clearQuery,
    isSearching: debouncedQuery.trim().length > 0,
    results: outcome.results,
    totalMatches: outcome.totalMatches,
    recentSearches,
    commitSearch,
    clearRecentSearches,
  };
}
