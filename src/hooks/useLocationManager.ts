import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { generateShortName, getLocationConfig, saveLocationConfig } from '@/services/locations';
import { getAllPlants, updatePlantLocation } from '@/services/plants';
import { LocationProfile, Plant } from '@/types/database.types';
import { parseLocation, buildLocation, sanitizeLocationName } from '@/utils/locationHelpers';
import { getErrorMessage } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';

// ─── Pure helpers (exported so modal components can reuse them) ───────────────

// The location-string helpers moved to `@/utils/locationHelpers` so the data
// layer can use them without importing this hook (which pulls in RN + Firebase).
// Re-exported here so existing call sites are unaffected.
export { parseLocation, buildLocation, sanitizeLocationName };

export const isDuplicate = (list: string[], value: string, ignore?: string): boolean => {
  const needle = value.toLowerCase();
  return list.some((item) => {
    const key = item.toLowerCase();
    if (ignore && key === ignore.toLowerCase()) return false;
    return key === needle;
  });
};

export const hasProfileData = (profile?: LocationProfile): boolean => {
  if (!profile) return false;
  return !!(
    profile.soilPH != null ||
    profile.soilType ||
    profile.drainageQuality ||
    profile.moistureRetention ||
    profile.nitrogenLevel ||
    profile.phosphorusLevel ||
    profile.potassiumLevel ||
    profile.windExposure ||
    profile.waterSource ||
    profile.lastSoilTestDate ||
    profile.notes ||
    profile.land_cents != null ||
    profile.latitude != null ||
    profile.longitude != null
  );
};

export const hasSoilData = (profile?: LocationProfile): boolean => {
  if (!profile) return false;
  return !!(
    profile.soilPH != null ||
    profile.soilType ||
    profile.drainageQuality ||
    profile.moistureRetention ||
    profile.nitrogenLevel ||
    profile.phosphorusLevel ||
    profile.potassiumLevel ||
    profile.windExposure ||
    profile.waterSource ||
    profile.lastSoilTestDate ||
    profile.notes
  );
};

// ─── Modal state types (exported for modal components) ───────────────────────

export type EditModalState = {
  type: 'parent' | 'child';
  original: string;
  value: string;
  shortName?: string;
  profile?: LocationProfile;
  activeTab?: 'name' | 'plot' | 'soil';
  showDatePicker?: boolean;
};

export type ReassignModalState = {
  type: 'parent' | 'child';
  target: string;
  replacement: string;
};

export type DeleteConfirmState = {
  type: 'parent' | 'child';
  target: string;
};

// ─── Return type ──────────────────────────────────────────────────────────────

export interface LocationManagerState {
  parentLocations: string[];
  childLocations: string[];
  shortNames: Record<string, string>;
  locationProfiles: Record<string, LocationProfile>;
  plants: Plant[];
  loading: boolean;
  plantsLoading: boolean;
  saving: boolean;
  editModal: EditModalState | null;
  reassignModal: ReassignModalState | null;
  deleteConfirm: DeleteConfirmState | null;
}

export interface LocationManagerActions {
  loadData: () => Promise<void>;
  setEditModal: React.Dispatch<React.SetStateAction<EditModalState | null>>;
  setReassignModal: React.Dispatch<React.SetStateAction<ReassignModalState | null>>;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<DeleteConfirmState | null>>;
  handleRename: () => Promise<void>;
  handleDeleteRequest: (type: 'parent' | 'child', name: string) => void;
  handleDeleteConfirm: () => void;
  handleReassignConfirm: () => void;
  updateProfile: (patch: Partial<LocationProfile>) => void;
}

export interface LocationManagerDerived {
  parentCounts: Record<string, number>;
  childCounts: Record<string, number>;
  editCount: number;
  reassignCount: number;
  reassignOptions: string[];
}

export interface UseLocationManagerReturn {
  state: LocationManagerState;
  actions: LocationManagerActions;
  derived: LocationManagerDerived;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLocationManager(): UseLocationManagerReturn {
  const [parentLocations, setParentLocations] = useState<string[]>([]);
  const [childLocations, setChildLocations] = useState<string[]>([]);
  const [shortNames, setShortNames] = useState<Record<string, string>>({});
  const [locationProfiles, setLocationProfiles] = useState<Record<string, LocationProfile>>({});
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [reassignModal, setReassignModal] = useState<ReassignModalState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPlantsLoading(true);

    // Plants are only needed for per-location counts, and getAllPlants pages
    // through the whole collection — resolve it in the background so the
    // screen paints as soon as the (cache-first) config read lands.
    void getAllPlants()
      .then(setPlants)
      .catch((error: unknown) => {
        logger.warn('Failed to load plants for location counts', error as Error);
      })
      .finally(() => setPlantsLoading(false));

    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setShortNames(config.parentLocationShortNames ?? {});
      setLocationProfiles(config.parentLocationProfiles ?? {});
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) || 'Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Derived counts ─────────────────────────────────────────────────────────

  const parentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plants.forEach((plant) => {
      const { parent } = parseLocation(plant.location);
      if (!parent) return;
      counts[parent] = (counts[parent] || 0) + 1;
    });
    return counts;
  }, [plants]);

  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plants.forEach((plant) => {
      const { child } = parseLocation(plant.location);
      if (!child) return;
      counts[child] = (counts[child] || 0) + 1;
    });
    return counts;
  }, [plants]);

  // ─── Plant cascade helpers ───────────────────────────────────────────────────

  const updatePlantsForParent = useCallback(
    async (fromParent: string, toParent: string): Promise<number> => {
      const targets = plants.filter((plant) => parseLocation(plant.location).parent === fromParent);
      for (const plant of targets) {
        const { child } = parseLocation(plant.location);
        await updatePlantLocation(plant.id, buildLocation(toParent, child));
      }
      setPlants((prev) =>
        prev.map((plant) => {
          const { parent, child } = parseLocation(plant.location);
          if (parent !== fromParent) return plant;
          return { ...plant, location: buildLocation(toParent, child) };
        })
      );
      return targets.length;
    },
    [plants]
  );

  const updatePlantsForChild = useCallback(
    async (fromChild: string, toChild: string): Promise<number> => {
      const targets = plants.filter((plant) => parseLocation(plant.location).child === fromChild);
      for (const plant of targets) {
        const { parent } = parseLocation(plant.location);
        await updatePlantLocation(plant.id, buildLocation(parent, toChild));
      }
      setPlants((prev) =>
        prev.map((plant) => {
          const { parent, child } = parseLocation(plant.location);
          if (child !== fromChild) return plant;
          return { ...plant, location: buildLocation(parent, toChild) };
        })
      );
      return targets.length;
    },
    [plants]
  );

  // ─── Config save helper ──────────────────────────────────────────────────────

  const saveConfig = useCallback(
    async (
      parents: string[],
      children: string[],
      updatedShortNames?: Record<string, string>,
      updatedProfiles?: Record<string, LocationProfile>
    ): Promise<void> => {
      const names = updatedShortNames ?? shortNames;
      const profiles = updatedProfiles ?? locationProfiles;
      const saved = await saveLocationConfig({
        parentLocations: parents,
        childLocations: children,
        parentLocationShortNames: names,
        parentLocationProfiles: profiles,
      });
      setParentLocations(saved.parentLocations);
      setChildLocations(saved.childLocations);
      setShortNames(saved.parentLocationShortNames ?? {});
      setLocationProfiles(saved.parentLocationProfiles ?? {});
    },
    [shortNames, locationProfiles]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleRename = useCallback(async (): Promise<void> => {
    if (!editModal) return;

    // ── Add child ──
    if (editModal.type === 'child' && editModal.original === '') {
      const name = sanitizeLocationName(editModal.value);
      if (!name) {
        Alert.alert('Name Required', 'Enter a section/direction name.');
        return;
      }
      if (name.includes(' - ')) {
        Alert.alert('Invalid Name', "Please avoid using ' - ' in location names.");
        return;
      }
      if (isDuplicate(childLocations, name)) {
        Alert.alert('Already Exists', `"${name}" already exists.`);
        return;
      }
      setSaving(true);
      try {
        await saveConfig(parentLocations, [...childLocations, name]);
        setEditModal(null);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) || 'Failed to add section. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── Add parent ──
    if (editModal.type === 'parent' && editModal.original === '') {
      const name = sanitizeLocationName(editModal.value);
      if (!name) {
        Alert.alert('Name Required', 'Enter a garden location name.');
        return;
      }
      if (name.includes(' - ')) {
        Alert.alert('Invalid Name', "Please avoid using ' - ' in location names.");
        return;
      }
      if (isDuplicate(parentLocations, name)) {
        Alert.alert('Already Exists', `"${name}" already exists.`);
        return;
      }
      setSaving(true);
      try {
        const sn = editModal.shortName?.trim().toUpperCase().slice(0, 5) || generateShortName(name);
        const updatedShortNames = { ...shortNames, [name]: sn };
        const updatedProfiles = hasProfileData(editModal.profile)
          ? { ...locationProfiles, [name]: editModal.profile! }
          : { ...locationProfiles };
        await saveConfig(
          [...parentLocations, name],
          childLocations,
          updatedShortNames,
          updatedProfiles
        );
        setEditModal(null);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) || 'Failed to add area. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── Rename existing ──
    // Counts drive the plant-cascade confirm below; while plants are still
    // loading they read 0 and the cascade would be silently skipped.
    if (plantsLoading) {
      Alert.alert('Still Loading', 'Plant data is still loading — try again in a moment.');
      return;
    }
    const name = sanitizeLocationName(editModal.value);
    const list = editModal.type === 'parent' ? parentLocations : childLocations;
    const count =
      editModal.type === 'parent'
        ? parentCounts[editModal.original] || 0
        : childCounts[editModal.original] || 0;
    const nameChanged = name !== editModal.original;

    if (!name) {
      Alert.alert('Name Required', 'Please enter a new name.');
      return;
    }
    if (name.includes(' - ')) {
      Alert.alert('Invalid Name', "Please avoid using ' - ' in location names.");
      return;
    }
    if (isDuplicate(list, name, editModal.original)) {
      Alert.alert('Already Exists', 'That name is already in use.');
      return;
    }
    if (!nameChanged && editModal.type === 'child') {
      setEditModal(null);
      return;
    }

    const performRename = async (): Promise<void> => {
      setSaving(true);
      try {
        if (editModal.type === 'parent') {
          if (count > 0 && nameChanged) {
            await updatePlantsForParent(editModal.original, name);
          }
          const updatedParents = parentLocations.map((item) =>
            item === editModal.original ? name : item
          );
          const updatedShortNames = { ...shortNames };
          const sn = editModal.shortName?.trim().toUpperCase().slice(0, 5);
          const newShortName =
            sn && sn.length >= 2
              ? sn
              : shortNames[editModal.original] ?? generateShortName(name);
          if (nameChanged) delete updatedShortNames[editModal.original];
          updatedShortNames[name] = newShortName;
          const updatedProfiles = { ...locationProfiles };
          if (nameChanged && updatedProfiles[editModal.original]) {
            updatedProfiles[name] = updatedProfiles[editModal.original]!;
            delete updatedProfiles[editModal.original];
          }
          if (editModal.profile) {
            updatedProfiles[name] = editModal.profile;
          }
          await saveConfig(updatedParents, childLocations, updatedShortNames, updatedProfiles);
        } else {
          if (count > 0 && nameChanged) {
            await updatePlantsForChild(editModal.original, name);
          }
          const updatedChildren = childLocations.map((item) =>
            item === editModal.original ? name : item
          );
          await saveConfig(parentLocations, updatedChildren);
        }
        setEditModal(null);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) || 'Failed to rename. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    if (count > 0 && nameChanged) {
      Alert.alert('Update Plants', `Renaming will update ${count} plant(s). Continue?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rename', onPress: performRename },
      ]);
    } else {
      performRename();
    }
  }, [
    editModal,
    plantsLoading,
    parentLocations,
    childLocations,
    shortNames,
    locationProfiles,
    parentCounts,
    childCounts,
    saveConfig,
    updatePlantsForParent,
    updatePlantsForChild,
  ]);

  const handleDelete = useCallback(
    async (type: 'parent' | 'child', name: string, replacement?: string): Promise<void> => {
      setSaving(true);
      try {
        if (type === 'parent') {
          if (replacement) {
            await updatePlantsForParent(name, replacement);
          }
          const updatedParents = parentLocations.filter((item) => item !== name);
          const updatedShortNames = { ...shortNames };
          delete updatedShortNames[name];
          const updatedProfiles = { ...locationProfiles };
          delete updatedProfiles[name];
          await saveConfig(updatedParents, childLocations, updatedShortNames, updatedProfiles);
        } else {
          if (replacement) {
            await updatePlantsForChild(name, replacement);
          }
          const updatedChildren = childLocations.filter((item) => item !== name);
          await saveConfig(parentLocations, updatedChildren);
        }
        setReassignModal(null);
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) || 'Failed to delete. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      parentLocations,
      childLocations,
      shortNames,
      locationProfiles,
      saveConfig,
      updatePlantsForParent,
      updatePlantsForChild,
    ]
  );

  const handleDeleteRequest = useCallback(
    (type: 'parent' | 'child', name: string): void => {
      // Counts decide between plain delete and the reassign flow; while plants
      // are still loading they read 0 and the reassign flow would be skipped.
      if (plantsLoading) {
        Alert.alert('Still Loading', 'Plant data is still loading — try again in a moment.');
        return;
      }
      const list = type === 'parent' ? parentLocations : childLocations;
      const count = type === 'parent' ? parentCounts[name] || 0 : childCounts[name] || 0;

      if (count === 0) {
        setDeleteConfirm({ type, target: name });
        return;
      }
      const options = list.filter((item) => item !== name);
      if (options.length === 0) {
        Alert.alert(
          'Cannot Delete',
          "Add another location first, or remove the plant's location assignment."
        );
        return;
      }
      setReassignModal({ type, target: name, replacement: options[0]! });
    },
    [plantsLoading, parentLocations, childLocations, parentCounts, childCounts]
  );

  const handleReassignConfirm = useCallback((): void => {
    if (!reassignModal) return;
    handleDelete(reassignModal.type, reassignModal.target, reassignModal.replacement);
  }, [reassignModal, handleDelete]);

  const handleDeleteConfirm = useCallback((): void => {
    if (!deleteConfirm) return;
    handleDelete(deleteConfirm.type, deleteConfirm.target);
    setDeleteConfirm(null);
  }, [deleteConfirm, handleDelete]);

  const updateProfile = useCallback((patch: Partial<LocationProfile>): void => {
    setEditModal((prev) =>
      prev ? { ...prev, profile: { ...(prev.profile ?? {}), ...patch } } : prev
    );
  }, []);

  // ─── Derived modal values ────────────────────────────────────────────────────

  const editCount = useMemo(() => {
    if (!editModal) return 0;
    return editModal.type === 'parent'
      ? parentCounts[editModal.original] || 0
      : childCounts[editModal.original] || 0;
  }, [editModal, parentCounts, childCounts]);

  const reassignCount = useMemo(() => {
    if (!reassignModal) return 0;
    return reassignModal.type === 'parent'
      ? parentCounts[reassignModal.target] || 0
      : childCounts[reassignModal.target] || 0;
  }, [reassignModal, parentCounts, childCounts]);

  const reassignOptions = useMemo(() => {
    if (!reassignModal) return [];
    const list = reassignModal.type === 'parent' ? parentLocations : childLocations;
    return list.filter((item) => item !== reassignModal.target);
  }, [reassignModal, parentLocations, childLocations]);

  return {
    state: {
      parentLocations,
      childLocations,
      shortNames,
      locationProfiles,
      plants,
      loading,
      plantsLoading,
      saving,
      editModal,
      reassignModal,
      deleteConfirm,
    },
    actions: {
      loadData,
      setEditModal,
      setReassignModal,
      setDeleteConfirm,
      handleRename,
      handleDeleteRequest,
      handleDeleteConfirm,
      handleReassignConfirm,
      updateProfile,
    },
    derived: {
      parentCounts,
      childCounts,
      editCount,
      reassignCount,
      reassignOptions,
    },
  };
}
