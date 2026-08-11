import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  deletePlantProfile,
  getPlantProfiles,
  savePlantProfile,
  savePlantProfiles,
} from '@/services/plantProfiles';
import { getAllPlants, updatePlantVariety } from '@/services/plants';
import type {
  FeedingIntensity,
  Plant,
  PlantLifecycle,
  PlantProfile,
  PlantProfiles,
  PlantType,
  ToleranceLevel,
  VarietyDetail,
} from '@/types/database.types';
import type { MoreStackParamList } from '@/types/navigation.types';
import { getErrorMessage } from '@/utils/errorLogging';
import {
  buildCareForm,
  cloneDraft,
  isCatalogDraftDirty,
  sanitizeName,
  toOptNum,
  toRange,
} from '@/utils/catalogDraft';
import type { CareFormState, CatalogDraft } from '@/utils/catalogDraft';
import { firstErroredField, validateCatalogDraft } from '@/utils/catalogValidation';
import type { CatalogErrors, CatalogFieldKey } from '@/utils/catalogValidation';

type NavProp = NativeStackNavigationProp<MoreStackParamList>;

interface Args {
  initialName: string;
  plantType: PlantType;
  isCreating: boolean;
  /** True while any modal is open — suppresses the discard guard. */
  anyModalOpen: boolean;
}

export interface UseCatalogEntryFormReturn {
  loading: boolean;
  saving: boolean;
  profiles: PlantProfiles;
  plants: Plant[];
  name: string;
  setName: (next: string) => void;
  careForm: CareFormState | null;
  setForm: (patch: Partial<CareFormState>) => void;
  varieties: string[];
  varietyDetails: Record<string, VarietyDetail>;
  setVarieties: React.Dispatch<React.SetStateAction<string[]>>;
  setVarietyDetails: React.Dispatch<React.SetStateAction<Record<string, VarietyDetail>>>;
  /** Live name, falling back to the route name — never stale after a rename. */
  lookupName: string;
  currentProfile: PlantProfile | undefined;
  categoryPlants: string[];
  usageCount: number;
  hasOverride: boolean;
  isDirty: boolean;
  errors: CatalogErrors;
  showErrors: boolean;
  /** Returns the first errored field when the save was blocked, else null. */
  attemptSave: () => CatalogFieldKey | null;
  resetCare: () => void;
  /**
   * Which delete flow applies: a plain confirmation when nothing uses the
   * entry, reassignment when garden plants do, or null when it cannot be
   * deleted at all (in use, with no sibling to move the plants to).
   */
  requestDelete: () => 'confirm' | 'reassign' | null;
  confirmDelete: (replacement?: string) => Promise<void>;
  showDiscardDialog: boolean;
  dismissDiscard: () => void;
  discardChanges: () => void;
}

/**
 * Owns everything the catalog detail screen edits, so the screen itself only
 * orchestrates UI.
 *
 * Varieties are held here as their own state rather than being read back out of
 * `profiles`. The old shape wrote variety edits straight into a copy of the
 * whole profile store keyed by the *route* name, which made a cheap dirty diff
 * impossible and silently broke whenever the entry was renamed in-session.
 */
export function useCatalogEntryForm({
  initialName,
  plantType,
  isCreating,
  anyModalOpen,
}: Args): UseCatalogEntryFormReturn {
  const navigation = useNavigation<NavProp>();

  const [profiles, setProfiles] = useState<PlantProfiles>({} as PlantProfiles);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initialName);
  const [careForm, setCareForm] = useState<CareFormState | null>(null);
  const [varieties, setVarieties] = useState<string[]>([]);
  const [varietyDetails, setVarietyDetails] = useState<Record<string, VarietyDetail>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const baselineRef = useRef<CatalogDraft | null>(null);
  const savedSuccessfully = useRef(false);
  const isDiscarding = useRef(false);
  const isSavingRef = useRef(false);

  // ─── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const [profilesData, allPlants] = await Promise.all([getPlantProfiles(), getAllPlants()]);
        if (cancelled) return;

        const form = buildCareForm(profilesData, initialName, plantType, isCreating);
        const entry = isCreating ? undefined : profilesData[plantType]?.[initialName];
        const loadedVarieties = entry?.varieties ?? [];
        const loadedDetails = entry?.varietyDetails ?? {};

        setProfiles(profilesData);
        setPlants(allPlants);
        setCareForm(form);
        setVarieties(loadedVarieties);
        setVarietyDetails(loadedDetails);

        if (form) {
          baselineRef.current = cloneDraft({
            name: isCreating ? '' : initialName,
            careForm: form,
            varieties: loadedVarieties,
            varietyDetails: loadedDetails,
          });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          Alert.alert('Error', getErrorMessage(error) ?? 'Failed to load plant data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialName, plantType, isCreating]);

  // ─── Derived ─────────────────────────────────────────────────────────────

  const setForm = useCallback(
    (patch: Partial<CareFormState>) => setCareForm((prev) => (prev ? { ...prev, ...patch } : prev)),
    []
  );

  const currentProfile = profiles[plantType]?.[initialName];
  const categoryPlants = useMemo(
    () => Object.keys(profiles[plantType] ?? {}),
    [profiles, plantType]
  );

  const usageCount = useMemo(
    () =>
      plants.filter((p) => p.plant_type === plantType && p.plant_variety === initialName).length,
    [plants, plantType, initialName]
  );

  const hasOverride = currentProfile?.waterRequirement !== undefined;

  /** Reference photos and pest lists follow the edited name, not the route param. */
  const lookupName = sanitizeName(name) || initialName;

  const isDirty = useMemo(() => {
    if (!careForm) return false;
    return isCatalogDraftDirty(baselineRef.current, {
      name,
      careForm,
      varieties,
      varietyDetails,
    });
  }, [name, careForm, varieties, varietyDetails]);

  const errors = useMemo(
    () => (careForm ? validateCatalogDraft(name, careForm) : {}),
    [name, careForm]
  );

  // ─── Save ────────────────────────────────────────────────────────────────

  const doSave = useCallback(
    async (trimmedName: string): Promise<void> => {
      if (!careForm) return;
      setSaving(true);
      isSavingRef.current = true;
      try {
        if (trimmedName !== initialName && !isCreating) {
          const targets = plants.filter(
            (p) => p.plant_type === plantType && p.plant_variety === initialName
          );
          for (const p of targets) {
            await updatePlantVariety(p.id, trimmedName);
          }
        }

        const pruningDaysVal = parseInt(careForm.pruningFrequencyDays, 10);
        const pruningTips = careForm.pruningTips
          .split('\n')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        // Months only mean something alongside their tip. Clearing a tip hides
        // its months row, so the stored months must go with it rather than
        // lingering as an orphan the UI can no longer show or edit.
        const shapeTip = careForm.shapePruningTip.trim();
        const flowerTip = careForm.flowerPruningTip.trim();

        const profileData: Omit<PlantProfile, 'plantType' | 'name'> = {
          varieties: varieties.length > 0 ? varieties : undefined,
          varietyDetails: Object.keys(varietyDetails).length > 0 ? varietyDetails : undefined,
          isUserAdded: currentProfile?.isUserAdded,
          tamilName: careForm.tamilName.trim() || undefined,
          description: careForm.description.trim() || undefined,
          waterRequirement: careForm.waterRequirement,
          wateringFrequencyDays: parseInt(careForm.wateringFrequencyDays, 10),
          fertilisingFrequencyDays: parseInt(careForm.fertilisingFrequencyDays, 10),
          pruningFrequencyDays:
            Number.isNaN(pruningDaysVal) || pruningDaysVal < 1 ? undefined : pruningDaysVal,
          sunlight: careForm.sunlight,
          soilType: careForm.soilType,
          preferredFertiliser: careForm.preferredFertiliser,
          initialGrowthStage: careForm.initialGrowthStage,
          pruningTips: pruningTips.length > 0 ? pruningTips : undefined,
          shapePruningTip: shapeTip || undefined,
          shapePruningMonths: shapeTip ? careForm.shapePruningMonths.trim() || undefined : undefined,
          flowerPruningTip: flowerTip || undefined,
          flowerPruningMonths: flowerTip
            ? careForm.flowerPruningMonths.trim() || undefined
            : undefined,
          scientificName: careForm.scientificName.trim() || undefined,
          taxonomicFamily: careForm.taxonomicFamily.trim() || undefined,
          lifecycle: (careForm.lifecycle || undefined) as PlantLifecycle | undefined,
          growingSeason: careForm.growingSeason.trim() || undefined,
          daysToHarvest: toRange(careForm.daysToHarvestMin, careForm.daysToHarvestMax),
          yearsToFirstHarvest: toOptNum(careForm.yearsToFirstHarvest),
          heightCm: toRange(careForm.heightCmMin, careForm.heightCmMax),
          spacingCm: toOptNum(careForm.spacingCm),
          plantingDepthCm: toOptNum(careForm.plantingDepthCm),
          germinationDays: toRange(careForm.germinationDaysMin, careForm.germinationDaysMax),
          germinationTempC: toRange(careForm.germinationTempMin, careForm.germinationTempMax),
          soilPhRange: toRange(careForm.soilPhMin, careForm.soilPhMax),
          heatTolerance: (careForm.heatTolerance || undefined) as ToleranceLevel | undefined,
          droughtTolerance: (careForm.droughtTolerance || undefined) as ToleranceLevel | undefined,
          feedingIntensity: (careForm.feedingIntensity || undefined) as
            | FeedingIntensity
            | undefined,
          customPests: careForm.customPests.length > 0 ? careForm.customPests : undefined,
          customDiseases:
            careForm.customDiseases.length > 0 ? careForm.customDiseases : undefined,
        };

        if (trimmedName !== initialName && !isCreating) {
          // Rename: move the old entry to the new key in one atomic write.
          const current = await getPlantProfiles();
          const next: PlantProfiles = { ...current, [plantType]: { ...current[plantType] } };
          delete next[plantType][initialName];
          next[plantType][trimmedName] = { plantType, name: trimmedName, ...profileData };
          await savePlantProfiles(next);
        } else {
          await savePlantProfile(plantType, trimmedName, profileData);
        }

        savedSuccessfully.current = true;
        navigation.goBack();
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) ?? 'Failed to save. Please try again.');
      } finally {
        setSaving(false);
        isSavingRef.current = false;
      }
    },
    [
      careForm,
      initialName,
      isCreating,
      plants,
      plantType,
      varieties,
      varietyDetails,
      currentProfile,
      navigation,
    ]
  );

  const attemptSave = useCallback((): CatalogFieldKey | null => {
    if (!careForm) return null;

    const blocking = firstErroredField(errors);
    if (blocking) {
      setShowErrors(true);
      return blocking;
    }

    const trimmedName = sanitizeName(name);
    const isDuplicate =
      trimmedName.toLowerCase() !== initialName.toLowerCase() &&
      categoryPlants.some((p) => p.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      Alert.alert('Already Exists', 'A plant with that name already exists.');
      return null;
    }

    const renameCount =
      trimmedName !== initialName
        ? plants.filter((p) => p.plant_type === plantType && p.plant_variety === initialName)
            .length
        : 0;

    if (renameCount > 0) {
      Alert.alert('Update Plants', `Renaming will update ${renameCount} plant(s). Continue?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rename', onPress: () => void doSave(trimmedName) },
      ]);
    } else {
      void doSave(trimmedName);
    }
    return null;
  }, [careForm, errors, name, initialName, categoryPlants, plants, plantType, doSave]);

  // ─── Reset / delete ──────────────────────────────────────────────────────

  const resetCare = useCallback((): void => {
    if (!hasOverride) return;
    Alert.alert('Reset Defaults', 'Remove custom care defaults and use app defaults?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            const catalogOnly: PlantProfile = {
              plantType,
              name: initialName,
              tamilName: currentProfile?.tamilName,
              description: currentProfile?.description,
              varieties: currentProfile?.varieties,
              varietyDetails: currentProfile?.varietyDetails,
              isUserAdded: currentProfile?.isUserAdded,
            };
            const current = await getPlantProfiles();
            const next: PlantProfiles = {
              ...current,
              [plantType]: { ...current[plantType], [initialName]: catalogOnly },
            };
            await savePlantProfiles(next);
            setProfiles(next);

            const form = buildCareForm(next, initialName, plantType, isCreating);
            setCareForm(form);
            setVarieties(catalogOnly.varieties ?? []);
            setVarietyDetails(catalogOnly.varietyDetails ?? {});
            if (form) {
              baselineRef.current = cloneDraft({
                name: initialName,
                careForm: form,
                varieties: catalogOnly.varieties ?? [],
                varietyDetails: catalogOnly.varietyDetails ?? {},
              });
            }
            setName(initialName);
          } catch (error: unknown) {
            Alert.alert('Error', getErrorMessage(error) ?? 'Failed to reset.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [hasOverride, plantType, initialName, currentProfile, isCreating]);

  const requestDelete = useCallback((): 'confirm' | 'reassign' | null => {
    if (usageCount === 0) return 'confirm';

    const remaining = categoryPlants.filter((p) => p !== initialName);
    if (remaining.length === 0) {
      Alert.alert('Cannot Delete', 'Add another plant option before deleting this one.');
      return null;
    }
    return 'reassign';
  }, [usageCount, categoryPlants, initialName]);

  const confirmDelete = useCallback(
    async (replacement?: string): Promise<void> => {
      setSaving(true);
      isSavingRef.current = true;
      try {
        if (replacement) {
          const targets = plants.filter(
            (p) => p.plant_type === plantType && p.plant_variety === initialName
          );
          for (const p of targets) {
            await updatePlantVariety(p.id, replacement);
          }
        }
        await deletePlantProfile(plantType, initialName);
        savedSuccessfully.current = true;
        navigation.goBack();
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) ?? 'Failed to delete.');
      } finally {
        setSaving(false);
        isSavingRef.current = false;
      }
    },
    [plants, plantType, initialName, navigation]
  );

  // ─── Unsaved-changes guard ───────────────────────────────────────────────

  const discardChanges = useCallback(() => {
    isDiscarding.current = true;
    setShowDiscardDialog(false);
    navigation.goBack();
  }, [navigation]);

  const dismissDiscard = useCallback(() => setShowDiscardDialog(false), []);

  useEffect(() => {
    const shouldGuard = (): boolean => {
      if (savedSuccessfully.current || isDiscarding.current) return false;
      if (!isDirty || isSavingRef.current) return false;
      // An AlertDialog stacked over an open Modal renders behind it on Android,
      // so let the modal's own dismissal run first.
      return !anyModalOpen;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!shouldGuard()) return false;
      setShowDiscardDialog(true);
      return true;
    });

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!shouldGuard()) return;
      e.preventDefault();
      setShowDiscardDialog(true);
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [isDirty, anyModalOpen, navigation]);

  return {
    loading,
    saving,
    profiles,
    plants,
    name,
    setName,
    careForm,
    setForm,
    varieties,
    varietyDetails,
    setVarieties,
    setVarietyDetails,
    lookupName,
    currentProfile,
    categoryPlants,
    usageCount,
    hasOverride,
    isDirty,
    errors,
    showErrors,
    attemptSave,
    resetCare,
    requestDelete,
    confirmDelete,
    showDiscardDialog,
    dismissDiscard,
    discardChanges,
  };
}
