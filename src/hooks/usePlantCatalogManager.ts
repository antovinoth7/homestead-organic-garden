import { useState, useCallback, useDeferredValue, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
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
import { signPlantVarietyCounts } from '@/utils/catalogCounts';
import { deriveInstanceLifecycle } from '@/utils/plantHelpers';
import { LIFECYCLE_LABELS } from '@/utils/plantLabels';
import type { CatalogBrowseEntry, CatalogGroupMode } from '@/utils/catalogListItems';
import { CatalogGroup, Plant, PlantProfiles, PlantType } from '@/types/database.types';
import { CATALOG_GROUP_ORDER, getTaxonomy } from '@/config/plants/catalogTaxonomy';
import { getErrorMessage, logError } from '@/utils/errorLogging';

export interface GroupData {
  /**
   * The group and mode these entries were built for. Deferred, so they can lag
   * the pill the user just tapped by a frame — carrying them alongside the
   * entries is what stops the screen pairing a new group with old rows.
   */
  group: CatalogGroup;
  mode: CatalogGroupMode;
  entries: CatalogBrowseEntry[];
  isEmpty: boolean;
}

export interface UsePlantCatalogManagerReturn {
  profiles: PlantProfiles;
  /**
   * Bundled defaults with the user's edits, additions and deletions applied.
   * Search indexes this — `profiles` alone holds only the overrides, and is
   * empty on an install where nothing has been edited.
   */
  mergedProfiles: PlantProfiles;
  plants: Plant[];
  /** The selected browse group. Urgent — this is what highlights the pill. */
  activeGroup: CatalogGroup;
  setActiveGroup: (group: CatalogGroup) => void;
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
  /** Total catalog plant count per browse group — drives pill badges. */
  groupCounts: Record<CatalogGroup, number>;
  /** Garden-plant counts keyed by category then variety name — feeds search. */
  plantCountsByType: Record<PlantType, Record<string, number>>;
  /** Bundled entries the user deleted from any category in the active group. */
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
  const [activeGroup, setActiveGroup] = useState<CatalogGroup>('vegetables');
  const [groupMode, setGroupMode] = useState<CatalogGroupMode>('type');

  /**
   * What the heavy derivations run on. React paints the newly tapped pill from
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
      const allPlants = storedPlants.length > 0 ? storedPlants : await getAllPlants();

      // Only adopt what actually changed. A revalidate that found the same data
      // would otherwise hand down new identities and re-resolve every browse
      // entry — the background work that made the category pills feel stuck.
      const profilesSig = JSON.stringify(profilesData);
      if (profilesSigRef.current !== profilesSig) {
        profilesSigRef.current = profilesSig;
        setProfiles(profilesData);
      }
      const plantsSig = signPlantVarietyCounts(allPlants);
      if (plantsSigRef.current !== plantsSig) {
        plantsSigRef.current = plantsSig;
        setPlants(allPlants);
      }
      hasLoadedRef.current = true;
      setError(null);
    } catch (err: unknown) {
      logError('network', 'usePlantCatalogManager: catalog load failed', err);
      setError(getErrorMessage(err));
      // A silent revalidate runs on every focus, so alerting there would pop a
      // modal each time the user came back from a plant while offline. The
      // screen renders the error state instead; only a load the user asked for
      // interrupts them. Same split as PlantsScreen's loadPlants.
      if (!options?.silent) {
        Alert.alert('Error', getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
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

  // Per-type plant counts keyed by variety name
  const plantCountsByType = useMemo(() => {
    const counts: Record<PlantType, Record<string, number>> = {
      vegetable: {},
      herb: {},
      flower: {},
      fruit_tree: {},
      timber_tree: {},
      coconut_tree: {},
      shrub: {},
      spinach: {},
    };
    plants.forEach((plant) => {
      const type = plant.plant_type;
      const variety = plant.plant_variety ?? '';
      if (!type || !variety) return;
      counts[type][variety] = (counts[type][variety] || 0) + 1;
    });
    return counts;
  }, [plants]);

  const mergedProfiles = useMemo(() => getMergedProfiles(profiles), [profiles]);

  /**
   * Every catalog plant as a browse entry, bucketed by group.
   *
   * Memoised on `profiles` and the garden counts only — deliberately not on
   * `activeGroup` or `groupMode`, so switching a pill or a grouping re-sections
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
        const taxonomy = getTaxonomy(name, plantType);
        const profile = getPlantCareProfile(name, plantType);
        const entry = mergedProfiles[plantType]?.[name];
        // The same derivation the plant record uses, so a plant is filed under
        // the same season heading here as on its own detail screen — and the
        // meta line names that same lifecycle.
        const lifecycle = deriveInstanceLifecycle(profile?.lifecycle, plantType);
        buckets[taxonomy.group].push({
          name,
          tamilName: entry?.tamilName,
          plantType,
          subGroup: taxonomy.subGroup,
          habit: taxonomy.habit,
          lifecycle,
          count: counts[name] ?? 0,
          // A fact the grower can compare between rows, rather than a
          // description they cannot finish reading in one truncated line.
          subtitle: buildCatalogMetaLine(
            profile?.daysToHarvest,
            LIFECYCLE_LABELS[lifecycle],
            entry?.description,
            entry?.varieties?.length ?? 0
          ),
        });
      }
    }
    return buckets;
  }, [profiles, mergedProfiles, plantCountsByType]);

  const groupData = useMemo((): GroupData => {
    const entries = entriesByGroup[deferredGroup] ?? [];
    return { group: deferredGroup, mode: deferredMode, entries, isEmpty: entries.length === 0 };
  }, [entriesByGroup, deferredGroup, deferredMode]);

  /** Catalog count per group — drives the pill badges. */
  const groupCounts = useMemo(() => {
    return CATALOG_GROUP_ORDER.reduce(
      (acc, group) => {
        acc[group] = entriesByGroup[group]?.length ?? 0;
        return acc;
      },
      {} as Record<CatalogGroup, number>
    );
  }, [entriesByGroup]);

  /**
   * Deleted bundled entries whose group is the active one. A group can span
   * several `PlantType`s, so each name carries its own — `restorePlantProfile`
   * needs the type, and the active pill can no longer supply it.
   */
  const hiddenPlantNames = useMemo(() => {
    const hidden = getHiddenPlantNames(profiles);
    const result: { name: string; plantType: PlantType }[] = [];
    for (const plantType of PLANT_CATEGORIES) {
      for (const name of hidden[plantType] ?? []) {
        if (getTaxonomy(name, plantType).group === deferredGroup) result.push({ name, plantType });
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
    profiles,
    mergedProfiles,
    plants,
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
