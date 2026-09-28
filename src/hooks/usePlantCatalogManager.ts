import { useState, useCallback, useDeferredValue, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { CACHE_KEYS, invalidate } from '@/lib/dataCache';
import { useFocusEffect } from '@react-navigation/native';
import {
  DEFAULT_PLANT_PROFILES,
  PLANT_CATEGORIES,
  getPlantProfiles,
  getPlantNamesForType,
  getMergedProfiles,
  getHiddenPlantNames,
  restorePlantProfile,
} from '@/services/plantProfiles';
import { getAllPlants, getStoredPlants } from '@/services/plants';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { buildCatalogMetaLine } from '@/utils/catalogSummaries';
import { countGardenPlantsByCatalogName, signPlantVarietyCounts } from '@/utils/catalogCounts';
import { deriveInstanceLifecycle } from '@/utils/plantHelpers';
import { HABIT_LABELS, LIFECYCLE_LABELS } from '@/utils/plantLabels';
import { ALL_GROUPS } from '@/utils/catalogListItems';
import type {
  CatalogBrowseEntry,
  CatalogGroupFilter,
  CatalogGroupMode,
} from '@/utils/catalogListItems';
import { CatalogGroup, Plant, PlantProfiles, PlantType } from '@/types/database.types';
import { CATALOG_GROUP_ORDER, getTaxonomy } from '@/config/plants/catalogTaxonomy';
import { getErrorMessage, logError } from '@/utils/errorLogging';

/** Trees bear years after planting; their `daysToHarvest` is fruit development. */
const TREE_LIKE_TYPES: ReadonlySet<PlantType> = new Set<PlantType>([
  'fruit_tree',
  'coconut_tree',
  'timber_tree',
]);

export interface GroupData {
  /**
   * The group and mode these entries were built for. Deferred, so they can lag
   * the chip the user just tapped by a frame — carrying them alongside the
   * entries is what stops the screen pairing a new group with old rows.
   */
  group: CatalogGroupFilter;
  mode: CatalogGroupMode;
  entries: CatalogBrowseEntry[];
}

export interface UsePlantCatalogManagerReturn {
  /**
   * Bundled defaults with the user's edits, additions and deletions applied.
   * Search indexes this — `profiles` alone holds only the overrides, and is
   * empty on an install where nothing has been edited.
   */
  mergedProfiles: PlantProfiles;
  /** The selected browse group, or `all`. Urgent — it marks the chosen chip. */
  activeGroup: CatalogGroupFilter;
  setActiveGroup: (group: CatalogGroupFilter) => void;
  /** How the browse list sections itself: by sub-group, by season, or A–Z. */
  groupMode: CatalogGroupMode;
  setGroupMode: (mode: CatalogGroupMode) => void;
  loading: boolean;
  /**
   * Why the last load failed, or null. The screen shows this with a retry —
   * without it a failed load fell through to the empty state and told the user
   * their catalog was empty.
   */
  error: string | null;
  /** True while a pull-to-refresh is in flight — drives the RefreshControl. */
  refreshing: boolean;
  groupData: GroupData;
  /**
   * Re-reads the catalog. `silent` keeps the current list on screen instead of
   * swapping it for the full-screen spinner — used for every revalidate after
   * the first load, so returning to the screen doesn't flash.
   */
  reload: (options?: { silent?: boolean }) => Promise<void>;
  /** Pull-to-refresh: revalidates silently while showing the RefreshControl. */
  refresh: () => Promise<void>;
  /** Catalog plant count per group, plus an `all` total — drives the chip counts. */
  groupCounts: Record<CatalogGroupFilter, number>;
  /** Garden-plant counts keyed by category then variety name — feeds search. */
  plantCountsByType: Record<PlantType, Record<string, number>>;
  /** Bundled entries the user deleted, narrowed to the selected group unless `all`. */
  hiddenPlantNames: { name: string; plantType: PlantType }[];
  /** Un-hides a deleted bundled entry, then reloads the catalog. */
  restore: (name: string, plantType: PlantType) => Promise<void>;
}

export function usePlantCatalogManager(): UsePlantCatalogManagerReturn {
  const [profiles, setProfiles] = useState<PlantProfiles>(DEFAULT_PLANT_PROFILES);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<CatalogGroupFilter>(ALL_GROUPS);
  const [groupMode, setGroupMode] = useState<CatalogGroupMode>('type');

  /**
   * What the heavy derivations run on. React paints the newly tapped chip from
   * `activeGroup` first and rebuilds the ~150-row list at low priority after,
   * so re-sectioning never blocks the tap's own feedback.
   */
  const deferredGroup = useDeferredValue(activeGroup);
  const deferredMode = useDeferredValue(groupMode);

  /** False until the first load resolves, so only that one shows the spinner. */
  const hasLoadedRef = useRef(false);

  /**
   * Signatures of the last applied fetch, so a revalidate that found nothing
   * new doesn't replace state with structurally-identical objects. `null` (not
   * `''`) because an empty catalog signs as `''`, which would make the first
   * load look like a no-op.
   */
  const plantsSigRef = useRef<string | null>(null);
  const profilesSigRef = useRef<string | null>(null);
  /**
   * The exact object the last signature was taken from. Inside the cache's TTL
   * `getPlantProfiles` hands back that same object, so identity settles the
   * common case and the full stringify below is reached only when the store was
   * actually re-read or rewritten.
   */
  const profilesObjRef = useRef<PlantProfiles | null>(null);

  const reload = useCallback(async (options?: { silent?: boolean }): Promise<void> => {
    if (!options?.silent) setLoading(true);
    try {
      // The catalog list renders no plant photos — `plants` feeds only the
      // per-variety count badges below. So use the image-free, offline-first
      // reader (as useBedData does) rather than getAllPlants, which paginates
      // Firestore a page at a time and resolves every plant's local image.
      // Fall back to the full fetch only on a cold cache, so counts stay right.
      const [profilesData, storedPlants] = await Promise.all([
        getPlantProfiles(),
        getStoredPlants(),
      ]);

      // Only adopt what actually changed. A revalidate that found the same data
      // would otherwise hand down new identities and re-resolve every browse
      // entry — the background work that made switching categories feel stuck.
      if (profilesObjRef.current !== profilesData) {
        const profilesSig = JSON.stringify(profilesData);
        profilesObjRef.current = profilesData;
        if (profilesSigRef.current !== profilesSig) {
          profilesSigRef.current = profilesSig;
          setProfiles(profilesData);
        }
      }

      const applyPlants = (loaded: Plant[]): void => {
        const plantsSig = signPlantVarietyCounts(loaded);
        if (plantsSigRef.current !== plantsSig) {
          plantsSigRef.current = plantsSig;
          setPlants(loaded);
        }
      };

      if (storedPlants.length > 0) {
        applyPlants(storedPlants);
      } else {
        // Nothing cached: the full fetch paginates Firestore and resolves every
        // plant's local image, which is far too slow to hold the catalog behind
        // — `plants` only feeds the count badges. Let the list render now and
        // fill the counts in when it lands.
        void getAllPlants()
          .then(applyPlants)
          .catch((err: unknown) => {
            logError('network', 'usePlantCatalogManager: plant counts unavailable', err);
          });
      }

      hasLoadedRef.current = true;
      setError(null);
    } catch (err: unknown) {
      logError('network', 'usePlantCatalogManager: catalog load failed', err);
      // Shown as a banner above the list, never as an alert: the bundled
      // catalog still renders, so the list is never empty, and an alert on
      // every focus was the only thing the user got.
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      // A pull must reach past the 30 s cache, or it re-reads what is on screen.
      invalidate('plantProfiles');
      invalidate(CACHE_KEYS.ALL_PLANTS);
      await reload({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      // Revalidate on every focus, but only tear the list down for the spinner
      // on the very first one — a return trip from the detail screen is usually
      // a warm cache hit and shouldn't flash.
      void reload({ silent: hasLoadedRef.current });
    }, [reload])
  );

  // Garden plants growing per catalog row: archived ones out, aliases folded in.
  const plantCountsByType = useMemo(() => {
    const namesByType: Partial<Record<PlantType, string[]>> = {};
    for (const type of PLANT_CATEGORIES) namesByType[type] = getPlantNamesForType(profiles, type);
    return countGardenPlantsByCatalogName(plants, namesByType);
  }, [plants, profiles]);

  const mergedProfiles = useMemo(() => getMergedProfiles(profiles), [profiles]);

  /**
   * Every catalog plant as a browse entry, bucketed by group.
   *
   * Memoised on `profiles` and the garden counts only — deliberately not on
   * `activeGroup` or `groupMode`, so switching a category or a grouping re-sections
   * an already-built list instead of re-resolving 129 care profiles.
   */
  const entriesByGroup = useMemo(() => {
    const buckets = CATALOG_GROUP_ORDER.reduce(
      (acc, group) => {
        acc[group] = [];
        return acc;
      },
      {} as Record<CatalogGroup, CatalogBrowseEntry[]>
    );

    for (const plantType of PLANT_CATEGORIES) {
      const counts = plantCountsByType[plantType] ?? {};
      for (const name of getPlantNamesForType(profiles, plantType)) {
        const entry = mergedProfiles[plantType]?.[name];
        const taxonomy = getTaxonomy(name, plantType, entry?.group);
        const profile = getPlantCareProfile(name, plantType);
        // The same derivation the plant record uses, so a plant is filed under
        // the same season heading here as on its own detail screen — and the
        // meta line names that same lifecycle.
        // The entry first: it carries the user's own edits, which the bundled
        // care profile knows nothing about.
        const lifecycle = deriveInstanceLifecycle(
          entry?.lifecycle ?? profile?.lifecycle,
          plantType
        );
        buckets[taxonomy.group].push({
          name,
          tamilName: entry?.tamilName,
          plantType,
          group: taxonomy.group,
          subGroup: taxonomy.subGroup,
          habit: taxonomy.habit,
          lifecycle,
          count: counts[name] ?? 0,
          // A fact the grower can compare between rows, rather than a
          // description they cannot finish reading in one truncated line.
          subtitle: buildCatalogMetaLine({
            daysToHarvest: entry?.daysToHarvest ?? profile?.daysToHarvest,
            yearsToFirstHarvest: entry?.yearsToFirstHarvest ?? profile?.yearsToFirstHarvest,
            treeLike: TREE_LIKE_TYPES.has(plantType),
            lifecycleLabel: LIFECYCLE_LABELS[lifecycle],
            habitLabel: taxonomy.habit ? HABIT_LABELS[taxonomy.habit] : undefined,
            description: entry?.description,
            varietyCount: entry?.varieties?.length ?? 0,
          }),
        });
      }
    }
    return buckets;
  }, [profiles, mergedProfiles, plantCountsByType]);

  /**
   * Every entry in one flat list, for the `all` filter. Memoised on the buckets
   * alone so it is built once per catalog load rather than per category change,
   * and only read when `all` is selected.
   */
  const allEntries = useMemo(
    () => CATALOG_GROUP_ORDER.flatMap((group) => entriesByGroup[group] ?? []),
    [entriesByGroup]
  );

  const groupData = useMemo((): GroupData => {
    const entries =
      deferredGroup === ALL_GROUPS ? allEntries : (entriesByGroup[deferredGroup] ?? []);
    return { group: deferredGroup, mode: deferredMode, entries };
  }, [entriesByGroup, allEntries, deferredGroup, deferredMode]);

  /** Catalog count per group, plus the `all` total — drives the sheet chip counts. */
  const groupCounts = useMemo(() => {
    const counts = CATALOG_GROUP_ORDER.reduce(
      (acc, group) => {
        acc[group] = entriesByGroup[group]?.length ?? 0;
        return acc;
      },
      {} as Record<CatalogGroupFilter, number>
    );
    counts[ALL_GROUPS] = allEntries.length;
    return counts;
  }, [entriesByGroup, allEntries]);

  /**
   * Deleted bundled entries whose group is the selected one — or every one of
   * them under `all`, so nothing a user deleted becomes unrestorable just
   * because no single category is in force.
   *
   * A group can span several `PlantType`s, so each name carries its own:
   * `restorePlantProfile` needs the type, and the chosen category can no longer
   * supply it.
   */
  const hiddenPlantNames = useMemo(() => {
    const hidden = getHiddenPlantNames(profiles);
    const result: { name: string; plantType: PlantType }[] = [];
    for (const plantType of PLANT_CATEGORIES) {
      for (const name of hidden[plantType] ?? []) {
        if (deferredGroup === ALL_GROUPS || getTaxonomy(name, plantType).group === deferredGroup) {
          result.push({ name, plantType });
        }
      }
    }
    return result;
  }, [profiles, deferredGroup]);

  const restore = useCallback(
    async (name: string, plantType: PlantType): Promise<void> => {
      try {
        await restorePlantProfile(plantType, name);
        // Silent: the list is already on screen, so update it in place rather
        // than blanking it behind the spinner.
        await reload({ silent: true });
      } catch (err: unknown) {
        logError('network', 'usePlantCatalogManager: restore failed', err);
        Alert.alert('Error', getErrorMessage(err));
      }
    },
    [reload]
  );

  return {
    mergedProfiles,
    activeGroup,
    setActiveGroup,
    groupMode,
    setGroupMode,
    loading,
    error,
    refreshing,
    groupData,
    reload,
    refresh,
    groupCounts,
    plantCountsByType,
    hiddenPlantNames,
    restore,
  };
}
