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

  // Rebuilt only when the catalog reloads — not on every keystroke.
  const index = useMemo(
    () => buildCatalogSearchIndex(profiles, plantCountsByType),
    [profiles, plantCountsByType]
  );

  const results = useMemo(() => searchCatalog(index, debouncedQuery), [index, debouncedQuery]);

  const clearQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const commitSearch = useCallback((next: string) => {
    setRecentSearches((prev) => {
      const updated = pushRecentSearch(prev, next);
      void setData(KEYS.CATALOG_RECENT_SEARCHES, updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    void setData<string>(KEYS.CATALOG_RECENT_SEARCHES, []);
  }, []);

  return {
    query,
    setQuery,
    clearQuery,
    isSearching: query.trim().length > 0,
    results,
    recentSearches,
    commitSearch,
    clearRecentSearches,
  };
}
