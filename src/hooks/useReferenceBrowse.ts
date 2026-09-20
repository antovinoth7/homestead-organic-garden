import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  ALL_CATEGORIES,
  DEFAULT_REFERENCE_GROUP_MODE,
  EMPTY_REFERENCE_FILTERS,
  buildReferenceItems,
  countActiveReferenceFilters,
  countReferenceFacets,
  filterReferenceEntries,
} from '@/utils/referenceFilters';
import type {
  ReferenceFacetCounts,
  ReferenceFilters,
  ReferenceGroupMode,
  ReferenceListItem,
} from '@/utils/referenceFilters';
import type { ReferenceGroup } from '@/components/reference/types';

/** Keystrokes settle before the list re-filters; short enough to feel live. */
const DEBOUNCE_MS = 120;

export interface UseReferenceBrowseReturn {
  query: string;
  setQuery: (next: string) => void;
  clearQuery: () => void;
  searchActive: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  showFilters: boolean;
  toggleFilters: () => void;
  closeFilters: () => void;
  filters: ReferenceFilters;
  setFilter: <K extends keyof ReferenceFilters>(key: K, value: ReferenceFilters[K]) => void;
  groupMode: ReferenceGroupMode;
  setGroupMode: (next: ReferenceGroupMode) => void;
  /** Section headers and rows, ready for a flat `FlatList`. */
  items: ReferenceListItem[];
  facetCounts: ReferenceFacetCounts;
  /** Category ids in registry order, with their labels — drives the chips. */
  categoryLabels: ReadonlyMap<string, string>;
  activeFilterCount: number;
  isDefault: boolean;
  isFiltered: boolean;
  /** Facets and grouping back to default, leaving the query alone — the sheet's Reset. */
  resetFilters: () => void;
  /** Everything, including the search box — the empty state's Clear filters. */
  reset: () => void;
}

/**
 * Browse state for the pest and disease screens: the header's two modes, the
 * filter facets, and the sectioned list they produce.
 *
 * It takes the grouped registry bundle the screens already pass rather than a
 * flat list, because that bundle is the only thing carrying the registry's
 * canonical category order — which is what keeps Sap-Sucking at the top of the
 * list instead of Beetles. Flattening happens here so the screens need no
 * changes at all.
 */
export function useReferenceBrowse(groups: readonly ReferenceGroup[]): UseReferenceBrowseReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReferenceFilters>(EMPTY_REFERENCE_FILTERS);
  const [groupMode, setGroupMode] = useState<ReferenceGroupMode>(DEFAULT_REFERENCE_GROUP_MODE);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const entries = useMemo(() => groups.flatMap((group) => group.entries), [groups]);

  const categoryLabels = useMemo(
    () => new Map(groups.map((group) => [group.category, group.label])),
    [groups]
  );

  const facetCounts = useMemo(
    () => countReferenceFacets(entries, debouncedQuery, filters),
    [entries, debouncedQuery, filters]
  );

  /**
   * A category can empty out as the search narrows. Showing nothing under a
   * filter whose chip the user can no longer reach reads as a broken screen, so
   * the category falls back to All — the behaviour the old chip rail had.
   */
  const effectiveFilters = useMemo<ReferenceFilters>(
    () =>
      filters.category !== ALL_CATEGORIES && (facetCounts.category[filters.category] ?? 0) === 0
        ? { ...filters, category: ALL_CATEGORIES }
        : filters,
    [filters, facetCounts]
  );

  const visibleEntries = useMemo(
    () => filterReferenceEntries(entries, debouncedQuery, effectiveFilters),
    [entries, debouncedQuery, effectiveFilters]
  );

  const items = useMemo(
    () => buildReferenceItems(visibleEntries, groupMode, categoryLabels),
    [visibleEntries, groupMode, categoryLabels]
  );

  // Search and the filter sheet each take over the header, so only one is open
  // at a time; the query itself survives collapsing, marked by the dot.
  const openSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters(false);
    setSearchActive(true);
  }, []);

  const closeSearch = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchActive(false);
  }, []);

  const toggleFilters = useCallback(() => {
    setSearchActive(false);
    setShowFilters((prev) => !prev);
  }, []);

  const closeFilters = useCallback(() => setShowFilters(false), []);

  const clearQuery = useCallback(() => setQuery(''), []);

  const setFilter = useCallback(
    <K extends keyof ReferenceFilters>(key: K, value: ReferenceFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_REFERENCE_FILTERS);
    setGroupMode(DEFAULT_REFERENCE_GROUP_MODE);
  }, []);

  // The empty state's Clear filters has to take the query too, or a search
  // that matches nothing would survive the one control offered to escape it.
  const reset = useCallback(() => {
    resetFilters();
    setQuery('');
  }, [resetFilters]);

  const activeFilterCount = countActiveReferenceFilters(effectiveFilters, groupMode);
  const isDefault = activeFilterCount === 0;

  return {
    query,
    setQuery,
    clearQuery,
    searchActive,
    openSearch,
    closeSearch,
    showFilters,
    toggleFilters,
    closeFilters,
    filters: effectiveFilters,
    setFilter,
    groupMode,
    setGroupMode,
    items,
    facetCounts,
    categoryLabels,
    activeFilterCount,
    isDefault,
    isFiltered: !isDefault || query.trim().length > 0,
    resetFilters,
    reset,
  };
}
