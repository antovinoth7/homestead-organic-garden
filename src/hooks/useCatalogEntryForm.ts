import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  deletePlantProfile,
  getPlantProfiles,
  isBundledPlant,
  renamePlantProfile,
  savePlantProfile,
  savePlantProfiles,
  getPlantNamesForType,
  getProfileEntry,
} from '@/services/plantProfiles';
import { getAllPlants, getStoredPlants, updatePlantVariety } from '@/services/plants';
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
import { getErrorMessage, logError } from '@/utils/errorLogging';
import {
  buildCareForm,
  cloneDraft,
  isCatalogDraftDirty,
  PRUNING_SEED_KEYS,
  pruningSeed,
  sanitizeName,
  toOptNum,
  toRange,
} from '@/utils/catalogDraft';
import type { CareFormState, CatalogDraft } from '@/utils/catalogDraft';
import {
  findDuplicatePlantName,
  firstErroredField,
  validateCatalogDraft,
} from '@/utils/catalogValidation';
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
  /**
   * Whether deleting hides a bundled entry — restorable from "hidden plants" —
   * or removes a user-added one for good. Bundled membership is the only
   * reliable signal: `isUserAdded` is never set when an entry is created here.
   */
  deleteKind: 'hide' | 'remove';
  showErrors: boolean;
  /** Returns the first errored field when the save was blocked, else null. */
  attemptSave: () => CatalogFieldKey | null;
  resetCare: () => void;
  /**
   * Which delete flow applies: a plain confirmation when nothing uses the
   * entry, reassignment when garden plants do, or null when it cannot be
   * deleted at all (in use, with no sibling to move the plants to).
   */
  requestDelete: () => Promise<'confirm' | 'reassign' | null>;
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

  /**
   * The saved draft the form is diffed against. State rather than a ref because
   * `isDirty` is derived from it during render: as a ref it could move (see the
   * pruning re-seed below) without the dirty check recomputing, leaving the
   * discard prompt reading a stale baseline.
   */
  const [baseline, setBaseline] = useState<CatalogDraft | null>(null);
  const savedSuccessfully = useRef(false);
  const isDiscarding = useRef(false);
  const isSavingRef = useRef(false);
  /**
   * The care model is chosen on this screen while creating, so it must not be a
   * dependency of the load: everything the load fetches is type-independent,
   * and rebuilding the form would throw away whatever has been typed. The
   * pruning seeds are the one type-derived part, re-seeded by their own effect.
   */
  const plantTypeRef = useRef(plantType);
  // Written in an effect, not during render: the load effect below is declared
  // after this one, so it always sees the value committed for the same render.
  useEffect(() => {
    plantTypeRef.current = plantType;
  }, [plantType]);
  const prevPlantTypeRef = useRef(plantType);
  const hasLoadedRef = useRef(false);
  /** Resolves with the garden plants, which load without blocking the form. */
  const plantsPromiseRef = useRef<Promise<Plant[]> | null>(null);

  // ─── Load ────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const type = plantTypeRef.current;
        const profilesData = await getPlantProfiles();
        if (cancelled) return;

        const form = buildCareForm(profilesData, initialName, type, isCreating);
        // The merged entry, not the raw override map: the latter holds only the
        // user's own edits, so it is empty for a bundled plant nobody has
        // touched. Reading it directly showed every bundled variety list as
        // empty and then let the next save write that emptiness back over it.
        const entry = isCreating ? undefined : getProfileEntry(profilesData, type, initialName);
        const loadedVarieties = entry?.varieties ?? [];
        const loadedDetails = entry?.varietyDetails ?? {};

        setProfiles(profilesData);
        setCareForm(form);
        setVarieties(loadedVarieties);
        setVarietyDetails(loadedDetails);

        if (form) {
          setBaseline(
            cloneDraft({
              name: isCreating ? '' : initialName,
              careForm: form,
              varieties: loadedVarieties,
              varietyDetails: loadedDetails,
            })
          );
        }
        hasLoadedRef.current = true;
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
  }, [initialName, isCreating]);

  /**
   * Garden plants feed the usage count and the rename/reassign targets — never
   * the form — so the screen does not wait on them. `getStoredPlants` first for
   * the reason `usePlantCatalogManager` gives: `getAllPlants` paginates
   * Firestore and resolves every plant's local image URI, none of which this
   * screen reads.
   */
  useEffect(() => {
    let cancelled = false;

    const promise = (async (): Promise<Plant[]> => {
      try {
        const stored = await getStoredPlants();
        return stored.length > 0 ? stored : await getAllPlants();
      } catch (error: unknown) {
        logError('network', 'useCatalogEntryForm: plant load failed', error);
        return [];
      }
    })();

    plantsPromiseRef.current = promise;
    void promise.then((loaded) => {
      if (!cancelled) setPlants(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Re-seeds the pruning fields when the care model changes mid-creation. It
   * patches rather than rebuilds: a rebuild is what used to discard everything
   * typed so far. Only fields the user has not written over move, and the
   * baseline moves with them so a re-seed never reads as an unsaved edit.
   */
  useEffect(() => {
    const previous = prevPlantTypeRef.current;
    if (previous === plantType) return;
    prevPlantTypeRef.current = plantType;
    if (!isCreating || !hasLoadedRef.current) return;

    const outgoing = pruningSeed(previous);
    const incoming = pruningSeed(plantType);
    const untouched = (form: CareFormState): boolean =>
      PRUNING_SEED_KEYS.every((key) => form[key] === outgoing[key]);

    setCareForm((prev) => (prev && untouched(prev) ? { ...prev, ...incoming } : prev));

    setBaseline((prev) =>
      prev && untouched(prev.careForm)
        ? { ...prev, careForm: { ...prev.careForm, ...incoming } }
        : prev
    );
  }, [plantType, isCreating]);

  // ─── Derived ─────────────────────────────────────────────────────────────

  const setForm = useCallback(
    (patch: Partial<CareFormState>) => setCareForm((prev) => (prev ? { ...prev, ...patch } : prev)),
    []
  );

  // Both read the merged catalog, not the raw override map: the latter is empty
  // until the user edits something, which made every bundled entry look absent
  // and its whole category look empty.
  const currentProfile = useMemo(
    () => getProfileEntry(profiles, plantType, initialName),
    [profiles, plantType, initialName]
  );
  const categoryPlants = useMemo(
    () => getPlantNamesForType(profiles, plantType),
    [profiles, plantType]
  );

  const usageCount = useMemo(
    () =>
      plants.filter((p) => p.plant_type === plantType && p.plant_variety === initialName).length,
    [plants, plantType, initialName]
  );

  const deleteKind = useMemo<'hide' | 'remove'>(
    () => (isBundledPlant(plantType, initialName) ? 'hide' : 'remove'),
    [plantType, initialName]
  );

  const hasOverride = currentProfile?.waterRequirement !== undefined;

  /** Reference photos and pest lists follow the edited name, not the route param. */
  const lookupName = sanitizeName(name) || initialName;

  const isDirty = useMemo(() => {
    if (!careForm) return false;
    return isCatalogDraftDirty(baseline, {
      name,
      careForm,
      varieties,
      varietyDetails,
    });
  }, [baseline, name, careForm, varieties, varietyDetails]);

  const errors = useMemo(
    () => (careForm ? validateCatalogDraft(name, careForm) : {}),
    [name, careForm]
  );

  // ─── Save ────────────────────────────────────────────────────────────────

  const doSave = useCallback(
    // `knownPlants` is the settled list the caller already awaited, not the
    // `plants` state, which may not have re-rendered yet.
    async (trimmedName: string, knownPlants: Plant[]): Promise<void> => {
      if (!careForm) return;
      setSaving(true);
      isSavingRef.current = true;
      try {
        if (trimmedName !== initialName && !isCreating) {
          const targets = knownPlants.filter(
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
          shapePruningMonths: shapeTip
            ? careForm.shapePruningMonths.trim() || undefined
            : undefined,
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
          customDiseases: careForm.customDiseases.length > 0 ? careForm.customDiseases : undefined,
        };

        if (trimmedName !== initialName && !isCreating) {
          // Rename: writes the new name and tombstones the old one. Dropping
          // the old key instead left the plant under both names — the bundled
          // catalog re-injected it locally, and a merged write could not
          // express the removal remotely either.
          await renamePlantProfile(plantType, initialName, trimmedName, profileData);
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
    const duplicateOf = findDuplicatePlantName(trimmedName, initialName, categoryPlants);
    if (duplicateOf) {
      Alert.alert(
        'Already Exists',
        duplicateOf.toLowerCase() === trimmedName.toLowerCase()
          ? 'A plant with that name already exists.'
          : `"${trimmedName}" is the same plant as "${duplicateOf}", which is already in the catalog.`
      );
      return null;
    }

    // Validation above is synchronous so the screen can scroll to the offending
    // field; the rest waits on the background plant load. Pressing Save the
    // moment the screen appears would otherwise count zero plants to rename,
    // skipping both the confirmation and the rename itself and stranding the
    // garden plants under the old variety name.
    void (async () => {
      const knownPlants = (await plantsPromiseRef.current) ?? plants;
      const renameCount =
        trimmedName !== initialName
          ? knownPlants.filter((p) => p.plant_type === plantType && p.plant_variety === initialName)
              .length
          : 0;

      if (renameCount > 0) {
        Alert.alert('Update Plants', `Renaming will update ${renameCount} plant(s). Continue?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Rename', onPress: () => void doSave(trimmedName, knownPlants) },
        ]);
      } else {
        void doSave(trimmedName, knownPlants);
      }
    })();
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
              setBaseline(
                cloneDraft({
                  name: initialName,
                  careForm: form,
                  varieties: catalogOnly.varieties ?? [],
                  varietyDetails: catalogOnly.varietyDetails ?? {},
                })
              );
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

  const requestDelete = useCallback(async (): Promise<'confirm' | 'reassign' | null> => {
    // Counted from the settled list rather than the `usageCount` memo: the
    // plants load in the background, and a delete pressed before they land
    // would otherwise look unused and skip reassignment entirely, orphaning
    // every garden plant grown from this entry.
    const knownPlants = (await plantsPromiseRef.current) ?? plants;
    const inUse = knownPlants.filter(
      (p) => p.plant_type === plantType && p.plant_variety === initialName
    ).length;
    if (inUse === 0) return 'confirm';

    const remaining = categoryPlants.filter((p) => p !== initialName);
    if (remaining.length === 0) {
      Alert.alert('Cannot Delete', 'Add another plant option before deleting this one.');
      return null;
    }
    return 'reassign';
  }, [plants, plantType, categoryPlants, initialName]);

  const confirmDelete = useCallback(
    async (replacement?: string): Promise<void> => {
      setSaving(true);
      isSavingRef.current = true;
      try {
        if (replacement) {
          const knownPlants = (await plantsPromiseRef.current) ?? plants;
          const targets = knownPlants.filter(
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
        logError('network', 'useCatalogEntryForm: delete failed', error);
        // Staying on the screen matters: the entry is still in the catalog, and
        // navigating back would have claimed otherwise.
        Alert.alert('Delete failed', getErrorMessage(error));
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
    deleteKind,
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
