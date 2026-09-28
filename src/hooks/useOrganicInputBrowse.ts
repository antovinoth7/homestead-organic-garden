import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import {
  ALL_CATEGORIES,
  DEFAULT_ORGANIC_INPUT_GROUP_MODE,
  EMPTY_ORGANIC_INPUT_FILTERS,
  buildOrganicInputItems,
  countActiveOrganicInputFilters,
  countOrganicInputFacets,
  filterOrganicInputs,
} from '@/utils/organicInputFilters';
import type {
  OrganicInputFacetCounts,
  OrganicInputFilters,
  OrganicInputGroupMode,
  OrganicInputListItem,
} from '@/utils/organicInputFilters';
import type { OrganicInputGroup } from '@/components/organicInput/OrganicInputListView';

/** Keystrokes settle before the list re-filters; short enough to feel live. */
const DEBOUNCE_MS = 120;

export interface UseOrganicInputBrowseReturn {
  query: string;
  setQuery: (next: string) => void;
  clearQuery: () => void;
  searchActive: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  showFilters: boolean;
  toggleFilters: () => void;
  closeFilters: () => void;
  filters: OrganicInputFilters;
  setFilter: <K extends keyof OrganicInputFilters>(
    key: K,
    value: OrganicInputFilters[K]
  ) => void;
  groupMode: OrganicInputGroupMode;
  setGroupMode: (next: OrganicInputGroupMode) => void;
  items: OrganicInputListItem[];
  facetCounts: OrganicInputFacetCounts;
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
 * Browse state for the organic-input screen — the sibling of
 * `useReferenceBrowse`, with the DIY facet in place of risk and effort.
 */
export function useOrganicInputBrowse(
  groups: readonly OrganicInputGroup[]
): UseOrganicInputBrowseReturn {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OrganicInputFilters>(EMPTY_ORGANIC_INPUT_FILTERS);
  const [groupMode, setGroupMode] = useState<OrganicInputGroupMode>(
    DEFAULT_ORGANIC_INPUT_GROUP_MODE
  );

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
    () => countOrganicInputFacets(entries, debouncedQuery, filters),
    [entries, debouncedQuery, filters]
  );

  // A category can empty out as the search narrows; fall back to All rather
  // than showing nothing under a filter the user can no longer reach.
  const effectiveFilters = useMemo<OrganicInputFilters>(
    () =>
      filters.category !== ALL_CATEGORIES && (facetCounts.category[filters.category] ?? 0) === 0
        ? { ...filters, category: ALL_CATEGORIES }
        : filters,
    [filters, facetCounts]
  );

  const visibleEntries = useMemo(
    () => filterOrganicInputs(entries, debouncedQuery, effectiveFilters),
    [entries, debouncedQuery, effectiveFilters]
  );

  const items = useMemo(
    () => buildOrganicInputItems(visibleEntries, groupMode, categoryLabels),
    [visibleEntries, groupMode, categoryLabels]
  );

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
    <K extends keyof OrganicInputFilters>(key: K, value: OrganicInputFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_ORGANIC_INPUT_FILTERS);
    setGroupMode(DEFAULT_ORGANIC_INPUT_GROUP_MODE);
  }, []);

  // The empty state's Clear filters has to take the query too, or a search
  // that matches nothing would survive the one control offered to escape it.
  const reset = useCallback(() => {
    resetFilters();
    setQuery('');
  }, [resetFilters]);

  const activeFilterCount = countActiveOrganicInputFilters(effectiveFilters, groupMode);
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
