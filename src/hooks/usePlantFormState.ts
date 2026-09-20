import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  BackHandler,
  Alert,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, StackActions } from '@react-navigation/native';
import { PlantFormScreenNavigationProp, PlantFormScreenRouteProp } from '../types/navigation.types';
import {
  getPlant,
  getAllPlants,
  createPlant,
  updatePlant,
  savePlantImage,
  pinGrowthStage,
  unpinGrowthStage,
} from '../services/plants';
import { getFilenameFromUri } from '../lib/imageStorage';
import { syncCareTasksForPlant } from '../services/tasks';
import {
  SpaceType,
  Plant,
  PlantType,
  SunlightLevel,
  SoilType,
  WaterRequirement,
  HealthStatus,
  FertiliserType,
  PestDiseaseRecord,
  GrowthStage,
  PlantCareProfiles,
} from '../types/database.types';
import {
  calculateExpectedHarvestDate,
  getDefaultHarvestSeason,
  CoconutAgeInfo,
  getCoconutAgeInfo,
  computeExpectedGrowthStage,
} from '../utils/plantHelpers';
import { getPlantCareProfile, hasPlantCareProfile } from '../utils/plantCareDefaults';
import { useTheme } from '../theme';
import type { Theme } from '../theme/colors';
import { getLocationConfig } from '../services/locations';
import { usePlantFormData } from './usePlantFormData';
import { plantTypeFromName } from '../utils/plantTypeFromName';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorLogging';
import type { EdgeInsets } from 'react-native-safe-area-context';
import {
  buildGeneratedPlantNameBase,
  isGeneratedPlantName,
  buildGeneratedPlantName,
} from '../utils/plantNameGenerator';
import { careScheduleErrors } from './plantFormValidation';
import type { PlantPickerItem } from '@/utils/plantPickerItems';
import {
  NOTES_MAX_LENGTH,
  sanitizeNumberText,
  type FormSectionKey,
  CATEGORY_OPTIONS,
  getFrequencyLabel,
  adjustFrequency,
} from '../utils/plantFormConstants';

// Re-export for consumers that already import from this module
export {
  NOTES_MAX_LENGTH,
  sanitizeNumberText,
  type FormSectionKey,
  CATEGORY_OPTIONS,
  getFrequencyLabel,
  adjustFrequency,
};

// ─── PlantFormStateReturn interface ──────────────────────────────────────────

export interface PlantFormStateReturn {
  plantId: string | undefined;
  returnTo: { wizardEntryId: string } | undefined;
  theme: Theme;
  insets: EdgeInsets;
  isCompactScreen: boolean;
  scrollViewRef: React.RefObject<ScrollView | null>;
  isSaving: React.MutableRefObject<boolean>;
  isDiscarding: React.MutableRefObject<boolean>;

  existingPlants: Plant[];
  setExistingPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  plantCareProfiles: Partial<PlantCareProfiles>;
  careProfilesLoaded: boolean;
  locationShortNames: Record<string, string>;
  parentLocationOptions: string[];
  childLocationOptions: string[];
  specificPlantOptions: string[];
  plantPickerItems: PlantPickerItem[];
  varietySuggestions: string[];
  harvestSeasonOptions: string[];

  name: string;
  setName: (v: string) => void;
  loadedGeneratedName: string;
  setLoadedGeneratedName: (v: string) => void;
  plantType: PlantType;
  setPlantType: (v: PlantType) => void;
  plantVariety: string;
  setPlantVariety: (v: string) => void;
  spaceType: SpaceType;
  setSpaceType: (v: SpaceType) => void;
  location: string;
  parentLocation: string;
  setParentLocation: (v: string) => void;
  childLocation: string;
  setChildLocation: (v: string) => void;
  landmarks: string;
  setLandmarks: (v: string) => void;
  bedId: string;
  setBedId: (v: string) => void;
  bedName: string;
  setBedName: (v: string) => void;
  potSize: string;
  setPotSize: (v: string) => void;
  variety: string;
  setVariety: (v: string) => void;
  customVarietyMode: boolean;
  setCustomVarietyMode: (v: boolean) => void;
  plantingDate: string;
  setPlantingDate: (v: string) => void;
  harvestSeason: string;
  setHarvestSeason: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  photoUri: string | null;
  setPhotoUri: (v: string | null) => void;
  photoFilename: string | null;
  setPhotoFilename: (v: string | null) => void;
  // Sunlight and water needs are read-only in the UI (no exported setters);
  // they are still set internally by profile seeding and edit-mode hydration.
  sunlight: SunlightLevel;
  waterRequirement: WaterRequirement;
  // Soil and fertiliser are profile-seeded but remain user-editable.
  soilType: SoilType;
  setSoilType: (v: SoilType) => void;
  wateringFrequency: string;
  setWateringFrequency: (v: string) => void;
  fertilisingFrequency: string;
  setFertilisingFrequency: (v: string) => void;
  preferredFertiliser: FertiliserType;
  setPreferredFertiliser: (v: FertiliserType) => void;
  mulchingUsed: boolean;
  setMulchingUsed: (v: boolean) => void;
  healthStatus: HealthStatus;
  setHealthStatus: (v: HealthStatus) => void;
  expectedHarvestDate: string;
  growthStage: GrowthStage;
  setGrowthStage: (v: GrowthStage) => void;
  /** Hard override of the derived growth stage; null = derive automatically. */
  pinnedStage: GrowthStage | null;
  setPinnedStage: (v: GrowthStage | null) => void;
  pruningFrequency: string;
  setPruningFrequency: (v: string) => void;
  pruningNotes: string;
  setPruningNotes: (v: string) => void;
  wateringEnabled: boolean;
  setWateringEnabled: (v: boolean) => void;
  fertilisingEnabled: boolean;
  setFertilisingEnabled: (v: boolean) => void;
  pruningEnabled: boolean;
  setPruningEnabled: (v: boolean) => void;
  coconutFrondsCount: string;
  setCoconutFrondsCount: (v: string) => void;
  nutsPerMonth: string;
  setNutsPerMonth: (v: string) => void;
  lastClimbingDate: string;
  setLastClimbingDate: (v: string) => void;
  spatheCount: string;
  setSpatheCount: (v: string) => void;
  nutFallCount: string;
  setNutFallCount: (v: string) => void;
  lastNutFallDate: string;
  setLastNutFallDate: (v: string) => void;
  coconutAgeInfo: CoconutAgeInfo | null;

  loading: boolean;
  dataLoading: boolean;
  hasUnsavedChanges: boolean;
  showDiscardModal: boolean;
  setShowDiscardModal: (v: boolean) => void;
  showPhotoSourceModal: boolean;
  setShowPhotoSourceModal: (v: boolean) => void;
  showValidationErrors: boolean;
  showCustomNameInput: boolean;
  setShowCustomNameInput: (v: boolean) => void;
  autoSuggestFired: boolean;
  locationDefaultsFired: boolean;
  sectionExpanded: Record<FormSectionKey, boolean>;
  showPlantingDatePicker: boolean;
  setShowPlantingDatePicker: (v: boolean) => void;
  showClimbingDatePicker: boolean;
  setShowClimbingDatePicker: (v: boolean) => void;
  showNutFallDatePicker: boolean;
  setShowNutFallDatePicker: (v: boolean) => void;

  generatedPlantName: string;
  validationErrors: Record<FormSectionKey, string[]>;
  totalErrorCount: number;
  sectionStatuses: Record<FormSectionKey, 'required_incomplete' | 'complete' | 'optional'>;
  phase2Unlocked: boolean;
  phase3Unlocked: boolean;

  handleSave: (onSuccessOverride?: () => void) => Promise<void>;
  handleBackPress: () => void;
  handleDiscard: () => void;
  setSectionExpandedState: (section: FormSectionKey, expanded: boolean) => void;
  openCamera: () => Promise<void>;
  openImageLibrary: () => Promise<void>;
  pickImage: () => void;
  navigateToPlantsAfterSave: (savedPlant?: Plant) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlantFormState(): PlantFormStateReturn {
  const navigation = useNavigation<PlantFormScreenNavigationProp>();
  const route = useRoute<PlantFormScreenRouteProp>();
  const { plantId, prefill, returnTo } = route.params ?? {};
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompactScreen = screenWidth <= 380;

  // ── Field state ────────────────────────────────────────────────────────────
  // Prefill seed for "Create new" flow from BedCreationWizard
  // prefill.name is the species (e.g. "Tomato") → seeds plantVariety (the "Plant"
  // dropdown / plant_variety). prefill.variety (e.g. "Cherry Red") → seeds variety.
  // Leave the nickname (name) empty so the app's generated unique name is used,
  // matching the normal Add-Plant flow.
  const [name, setName] = useState('');
  const [loadedGeneratedName, setLoadedGeneratedName] = useState('');
  const [plantType, setPlantType] = useState<PlantType>(() =>
    prefill ? plantTypeFromName(prefill.name) : 'vegetable'
  );
  const [plantVariety, setPlantVariety] = useState(() => prefill?.name ?? '');
  const [spaceType, setSpaceType] = useState<SpaceType>(() => (prefill ? 'bed' : 'ground'));
  const [location, setLocation] = useState('');
  const [parentLocation, setParentLocation] = useState(() => prefill?.parentLocation ?? '');
  const [childLocation, setChildLocation] = useState(() => prefill?.childLocation ?? '');
  const [landmarks, setLandmarks] = useState('');
  const [bedId, setBedId] = useState(() => prefill?.bedId ?? '');
  const [bedName, setBedName] = useState(() => prefill?.bedName ?? '');
  const [potSize, setPotSize] = useState('');
  const [variety, setVariety] = useState(() => prefill?.variety ?? '');
  const [customVarietyMode, setCustomVarietyMode] = useState(false);
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestSeason, setHarvestSeason] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
  const [sunlight, setSunlight] = useState<SunlightLevel>(() => prefill?.sunlight ?? 'full_sun');
  const [soilType, setSoilType] = useState<SoilType>('garden_soil');
  const [waterRequirement, setWaterRequirement] = useState<WaterRequirement>('medium');
  const [wateringFrequency, setWateringFrequency] = useState('');
  const [fertilisingFrequency, setFertilisingFrequency] = useState('');
  const [preferredFertiliser, setPreferredFertiliser] = useState<FertiliserType>('compost');
  const [mulchingUsed, setMulchingUsed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [pestDiseaseHistory, setPestDiseaseHistory] = useState<PestDiseaseRecord[]>([]);
  const [growthStage, setGrowthStage] = useState<GrowthStage>('seedling');
  // The user's hard override of the derived stage — mirrors plant.growth_stage_pinned.
  // null means "let the app compute the stage". Applied on save via pin/unpin.
  const [pinnedStage, setPinnedStage] = useState<GrowthStage | null>(null);
  const initialPinnedStage = useRef<GrowthStage | null>(null);
  const [pruningFrequency, setPruningFrequency] = useState('');
  const [pruningNotes, setPruningNotes] = useState('');
  // Care task enable/disable toggles (Phase B)
  const [wateringEnabled, setWateringEnabled] = useState(true);
  const [fertilisingEnabled, setFertilisingEnabled] = useState(true);
  const [pruningEnabled, setPruningEnabled] = useState(true);
  const [coconutFrondsCount, setCoconutFrondsCount] = useState('');
  const [nutsPerMonth, setNutsPerMonth] = useState('');
  const [lastClimbingDate, setLastClimbingDate] = useState('');
  const [spatheCount, setSpatheCount] = useState('');
  const [nutFallCount, setNutFallCount] = useState('');
  const [lastNutFallDate, setLastNutFallDate] = useState('');
  const [coconutAgeInfo, setCoconutAgeInfo] = useState<CoconutAgeInfo | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!!plantId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [autoSuggestFired, setAutoSuggestFired] = useState(false);
  const [locationDefaultsFired, setLocationDefaultsFired] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState<Record<FormSectionKey, boolean>>({
    basic: true,
    location: true,
    care: true,
    // Expanded so each tab's section is tall enough for the scroll-spy to
    // resolve it; the niche harvest/coconut blocks stay collapsed.
    health: true,
    harvest: false,
    coconut: false,
    notesHistory: false,
    pestDisease: false,
  });
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showClimbingDatePicker, setShowClimbingDatePicker] = useState(false);
  const [showNutFallDatePicker, setShowNutFallDatePicker] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const isDiscarding = useRef(false);
  const savedSuccessfully = useRef(false);
  const autoSuggestApplied = useRef(false);
  const locationDefaultsApplied = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const formSnapshot = useRef<string>('');
  const shouldCaptureSnapshot = useRef(false);

  // ── Data hook ──────────────────────────────────────────────────────────────
  const {
    existingPlants,
    setExistingPlants,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    locationProfiles,
    parentLocationOptions,
    childLocationOptions,
    specificPlantOptions,
    plantPickerItems,
    varietySuggestions,
    harvestSeasonOptions,
  } = usePlantFormData({
    plantType,
    plantVariety,
    parentLocation,
    childLocation,
    harvestSeason,
  });

  // ── Derived values ─────────────────────────────────────────────────────────

  const generatedPlantNameBase = useMemo(
    () =>
      buildGeneratedPlantNameBase(
        plantVariety,
        variety,
        plantingDate,
        parentLocation,
        locationShortNames[parentLocation]
      ),
    [plantVariety, variety, plantingDate, parentLocation, locationShortNames]
  );

  const generatedPlantName = useMemo(
    () =>
      buildGeneratedPlantName(generatedPlantNameBase, existingPlants, plantId, loadedGeneratedName),
    [existingPlants, generatedPlantNameBase, loadedGeneratedName, plantId]
  );

  const phase2Unlocked = useMemo(
    () => !!plantId || (!!plantVariety && !!plantType),
    [plantId, plantVariety, plantType]
  );
  const phase3Unlocked = useMemo(
    () => !!plantId || (phase2Unlocked && !!parentLocation),
    [plantId, phase2Unlocked, parentLocation]
  );

  const validationErrors = useMemo(() => {
    const errors: Record<FormSectionKey, string[]> = {
      basic: [],
      location: [],
      care: [],
      health: [],
      harvest: [],
      coconut: [],
      notesHistory: [],
      pestDisease: [],
    };
    if (!plantVariety.trim()) errors.basic.push('Please select a specific plant');
    if (!parentLocation.trim()) errors.location.push('Please select a main location');
    if (!childLocation.trim()) errors.location.push('Please select a direction/section');
    errors.care = careScheduleErrors({
      wateringEnabled,
      wateringFrequency,
      fertilisingEnabled,
      fertilisingFrequency,
      pruningEnabled,
      pruningFrequency,
    });
    if (notes.length > NOTES_MAX_LENGTH)
      errors.notesHistory.push(`Notes must be ${NOTES_MAX_LENGTH} characters or less`);
    return errors;
  }, [
    plantVariety,
    parentLocation,
    childLocation,
    wateringEnabled,
    wateringFrequency,
    fertilisingEnabled,
    fertilisingFrequency,
    pruningEnabled,
    pruningFrequency,
    notes,
  ]);

  const totalErrorCount = useMemo(
    () => Object.values(validationErrors).reduce((sum, arr) => sum + arr.length, 0),
    [validationErrors]
  );

  const sectionStatuses = useMemo(
    () =>
      ({
        basic: plantVariety && plantType ? 'complete' : 'required_incomplete',
        location: parentLocation && childLocation ? 'complete' : 'required_incomplete',
        care:
          (!wateringEnabled || wateringFrequency) && (!fertilisingEnabled || fertilisingFrequency)
            ? 'complete'
            : 'required_incomplete',
        health: 'optional',
        harvest: 'optional',
        coconut: 'optional',
        notesHistory: 'optional',
        pestDisease: 'optional',
      } as const),
    [
      plantVariety,
      plantType,
      parentLocation,
      childLocation,
      wateringEnabled,
      wateringFrequency,
      fertilisingEnabled,
      fertilisingFrequency,
    ]
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (plantId) {
      loadPlant();
    } else {
      const timeoutId = setTimeout(() => {
        initialDataLoaded.current = true;
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  // Detect unsaved changes by comparing current values to a snapshot
  useEffect(() => {
    const current = JSON.stringify([
      name,
      plantType,
      plantVariety,
      spaceType,
      location,
      parentLocation,
      childLocation,
      landmarks,
      bedId,
      bedName,
      potSize,
      variety,
      plantingDate,
      harvestSeason,
      notes,
      photoUri,
      sunlight,
      soilType,
      waterRequirement,
      wateringFrequency,
      fertilisingFrequency,
      preferredFertiliser,
      mulchingUsed,
      healthStatus,
      expectedHarvestDate,
      pestDiseaseHistory,
      growthStage,
      pinnedStage,
      pruningFrequency,
      pruningNotes,
      wateringEnabled,
      fertilisingEnabled,
      pruningEnabled,
      coconutFrondsCount,
      nutsPerMonth,
      lastClimbingDate,
    ]);
    if (!initialDataLoaded.current || shouldCaptureSnapshot.current) {
      formSnapshot.current = current;
      shouldCaptureSnapshot.current = false;
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(current !== formSnapshot.current);
  }, [
    name,
    plantType,
    plantVariety,
    spaceType,
    location,
    parentLocation,
    childLocation,
    landmarks,
    bedId,
    bedName,
    potSize,
    variety,
    plantingDate,
    harvestSeason,
    notes,
    photoUri,
    sunlight,
    soilType,
    waterRequirement,
    wateringFrequency,
    fertilisingFrequency,
    preferredFertiliser,
    mulchingUsed,
    healthStatus,
    expectedHarvestDate,
    pestDiseaseHistory,
    growthStage,
    pinnedStage,
    pruningFrequency,
    pruningNotes,
    wateringEnabled,
    fertilisingEnabled,
    pruningEnabled,
    coconutFrondsCount,
    nutsPerMonth,
    lastClimbingDate,
  ]);

  // Auto-calculate expected harvest date
  useEffect(() => {
    if (plantVariety && plantingDate) {
      const calculated = calculateExpectedHarvestDate(plantVariety, plantingDate, plantType);
      if (calculated) {
        setExpectedHarvestDate(calculated);
        shouldCaptureSnapshot.current = true;
      }
    }
  }, [plantVariety, plantingDate, plantType]);

  // Coconut age-based care defaults
  useEffect(() => {
    if (plantType === 'coconut_tree' && plantingDate) {
      const info = getCoconutAgeInfo(plantingDate);
      setCoconutAgeInfo(info);
      if (info && !plantId) {
        setGrowthStage(info.growthStage);
        setWateringFrequency(info.wateringFrequencyDays.toString());
        setFertilisingFrequency(info.fertilisingFrequencyDays.toString());
        setPruningFrequency(info.pruningFrequencyDays.toString());
        shouldCaptureSnapshot.current = true;
      }
    } else {
      setCoconutAgeInfo(null);
    }
  }, [plantType, plantingDate, plantId]);

  // Reset location defaults flag when parent location changes
  useEffect(() => {
    locationDefaultsApplied.current = false;
    setLocationDefaultsFired(false);
  }, [parentLocation]);

  // Apply location profile defaults (only for new plants, first time per location)
  useEffect(() => {
    if (plantId || !parentLocation || locationDefaultsApplied.current) return;
    const profile = locationProfiles[parentLocation];
    if (!profile) return;
    locationDefaultsApplied.current = true;
    if (profile.soilType) setSoilType(profile.soilType);
    if (profile.moistureRetention || profile.drainageQuality) {
      const retention = profile.moistureRetention;
      const drainage = profile.drainageQuality;
      let wr: WaterRequirement = 'medium';
      if (retention === 'high') wr = 'low';
      else if (retention === 'low' && (drainage === 'good' || drainage === 'excellent'))
        wr = 'high';
      else if (retention === 'low') wr = 'high';
      setWaterRequirement(wr);
    }
    setLocationDefaultsFired(true);
    shouldCaptureSnapshot.current = true;
  }, [parentLocation, locationProfiles, plantId]);

  // Reset auto-suggest flags when plant variety changes
  useEffect(() => {
    autoSuggestApplied.current = false;
    setAutoSuggestFired(false);
    setCustomVarietyMode(false);
  }, [plantVariety]);

  // Auto-suggest care defaults
  useEffect(() => {
    if (
      !plantId &&
      plantVariety &&
      careProfilesLoaded &&
      hasPlantCareProfile(plantVariety, plantType, plantCareProfiles) &&
      !autoSuggestApplied.current
    ) {
      const profile = getPlantCareProfile(plantVariety, plantType, plantCareProfiles);
      if (profile) {
        autoSuggestApplied.current = true;
        setAutoSuggestFired(true);
        // Auto-set care toggles from profile
        setWateringEnabled(profile.wateringEnabled !== false);
        setFertilisingEnabled(profile.fertilisingEnabled !== false);
        setPruningEnabled(profile.pruningEnabled !== false);
        if (profile.wateringEnabled !== false && profile.wateringFrequencyDays)
          setWateringFrequency(profile.wateringFrequencyDays.toString());
        if (profile.fertilisingEnabled !== false && profile.fertilisingFrequencyDays)
          setFertilisingFrequency(profile.fertilisingFrequencyDays.toString());
        if (profile.pruningEnabled !== false && profile.pruningFrequencyDays)
          setPruningFrequency(profile.pruningFrequencyDays.toString());
        setSunlight(profile.sunlight);
        setSoilType(profile.soilType);
        setWaterRequirement(profile.waterRequirement);
        setPreferredFertiliser(profile.preferredFertiliser);
        setGrowthStage(profile.initialGrowthStage);
        const defaultHarvestSeason = getDefaultHarvestSeason(plantVariety, plantType);
        if (defaultHarvestSeason) setHarvestSeason(defaultHarvestSeason);
        shouldCaptureSnapshot.current = true;
      }
    }
  }, [plantVariety, plantId, plantType, careProfilesLoaded, plantCareProfiles]);

  // B.4: Auto-compute growth stage from planting_date for new plants
  useEffect(() => {
    if (plantId) return; // editing — keep manual/pinned stage
    if (plantType === 'coconut_tree') return; // handled by coconut age effect
    if (!plantingDate || !plantVariety) return;
    const profile = getPlantCareProfile(plantVariety, plantType);
    if (!profile?.growthStageDurations) return;
    const result = computeExpectedGrowthStage(plantingDate, profile.growthStageDurations);
    if (result) {
      setGrowthStage(result.stage);
    }
  }, [plantId, plantType, plantingDate, plantVariety]);

  // Combine parent + child location
  useEffect(() => {
    if (parentLocation && childLocation) {
      setLocation(`${parentLocation} - ${childLocation}`);
    } else {
      setLocation('');
    }
  }, [parentLocation, childLocation]);

  // Back navigation — shared handler for both add and edit
  useEffect(() => {
    const backAction = (): boolean => {
      if (savedSuccessfully.current) return false;
      if (hasUnsavedChanges && !isSaving.current) {
        handleBackPress();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (savedSuccessfully.current || isDiscarding.current) return;
      if (!hasUnsavedChanges || isSaving.current) return;
      e.preventDefault();
      handleBackPress();
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, navigation]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setSectionExpandedState = useCallback((section: FormSectionKey, expanded: boolean) => {
    setSectionExpanded((prev) => ({ ...prev, [section]: expanded }));
  }, []);

  const handleBackPress = useCallback(() => {
    if (isSaving.current) return;
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      isDiscarding.current = true;
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  const handleDiscard = useCallback(() => {
    setShowDiscardModal(false);
    isDiscarding.current = true;
    setHasUnsavedChanges(false);
    navigation.goBack();
  }, [navigation]);

  const navigateToPlantsAfterSave = useCallback(
    (savedPlant?: Plant) => {
      // popTo (not navigate) removes this PlantForm entry from the stack, so a
      // hardware back-press from the plant list lands on the previous screen
      // instead of re-entering the (internally multi-step) wizard.
      navigation.dispatch(
        StackActions.popTo(
          'PlantsList',
          {
            refresh: Date.now(),
            savedPlantId: savedPlant?.id,
            savedPlantName: savedPlant?.name,
          },
          { merge: true }
        )
      );
    },
    [navigation]
  );

  const openImageLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0]!.uri);
      setPhotoFilename(null);
    }
  }, []);

  const openCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0]!.uri);
        setPhotoFilename(null);
      }
    } catch (error) {
      logger.warn('Camera launch failed', error as Error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  }, []);

  const pickImage = useCallback(() => {
    setShowPhotoSourceModal(true);
  }, []);

  const loadPlant = async (): Promise<void> => {
    if (!plantId) return;
    try {
      const plant = await getPlant(plantId);
      if (plant) {
        let loadedShortNames = locationShortNames;
        if (Object.keys(loadedShortNames).length === 0) {
          try {
            const config = await getLocationConfig();
            loadedShortNames = config.parentLocationShortNames ?? {};
          } catch {}
        }

        const locationParts = plant.location?.split(' - ') || [];
        const existingParentLoc = locationParts.length >= 1 ? locationParts[0] ?? '' : '';

        const richBase = buildGeneratedPlantNameBase(
          plant.plant_variety || '',
          plant.variety || '',
          plant.planting_date || undefined,
          existingParentLoc || undefined,
          loadedShortNames[existingParentLoc] || undefined
        );
        const richBaseOld = buildGeneratedPlantNameBase(
          plant.plant_variety || '',
          plant.variety || '',
          plant.planting_date || undefined,
          existingParentLoc || undefined,
          undefined
        );
        const simpleBase = buildGeneratedPlantNameBase(
          plant.plant_variety || '',
          plant.variety || ''
        );
        const generatedName = isGeneratedPlantName(plant.name, richBase)
          ? plant.name
          : isGeneratedPlantName(plant.name, richBaseOld)
          ? plant.name
          : isGeneratedPlantName(plant.name, simpleBase)
          ? plant.name
          : '';

        setName(generatedName ? '' : plant.name);
        setLoadedGeneratedName(generatedName);
        if (!generatedName && plant.name) setShowCustomNameInput(true);
        setPlantType(plant.plant_type);
        setPlantVariety(plant.plant_variety || '');
        setSpaceType(plant.space_type);
        setLocation(plant.location);

        if (locationParts.length === 2) {
          setParentLocation(locationParts[0]!);
          setChildLocation(locationParts[1]!);
        } else if (locationParts.length === 1 && locationParts[0]) {
          setParentLocation(locationParts[0]!);
          setChildLocation('');
        }

        setBedId(plant.bed_id || '');
        setBedName(plant.bed_name || '');
        setPotSize(plant.pot_size || '');
        setVariety(plant.variety || '');
        setCustomVarietyMode(false);
        setLandmarks(plant.landmarks || '');
        setPlantingDate(plant.planting_date || '');
        setHarvestSeason(plant.harvest_season || '');
        setNotes(plant.notes || '');
        setPhotoUri(plant.photo_url);
        setPhotoFilename(plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? ''));
        setSunlight(plant.sunlight || 'full_sun');
        setSoilType(plant.soil_type || 'potting_mix');
        setWaterRequirement(plant.water_requirement || 'medium');
        setWateringFrequency(plant.watering_frequency_days?.toString() || '3');
        setFertilisingFrequency(plant.fertilising_frequency_days?.toString() || '14');
        setPreferredFertiliser(plant.preferred_fertiliser || 'compost');
        setMulchingUsed(plant.mulching_used || false);
        setHealthStatus(plant.health_status || 'healthy');
        setExpectedHarvestDate(plant.expected_harvest_date || '');
        setPestDiseaseHistory(plant.pest_disease_history || []);
        setGrowthStage(plant.growth_stage || 'seedling');
        setPinnedStage(plant.growth_stage_pinned ?? null);
        initialPinnedStage.current = plant.growth_stage_pinned ?? null;
        setPruningFrequency(plant.pruning_frequency_days?.toString() || '');
        setPruningNotes(plant.pruning_notes || '');
        setWateringEnabled(plant.watering_enabled !== false);
        setFertilisingEnabled(plant.fertilising_enabled !== false);
        setPruningEnabled(plant.pruning_enabled !== false);
        setCoconutFrondsCount(plant.coconut_fronds_count?.toString() || '');
        setNutsPerMonth(plant.nuts_per_month?.toString() || '');
        setLastClimbingDate(plant.last_climbing_date || '');
        setSpatheCount(plant.spathe_count_per_month?.toString() || '');
        setNutFallCount(plant.nut_fall_count?.toString() || '');
        setLastNutFallDate(plant.last_nut_fall_date || '');

        setSectionExpanded((prev) => ({
          ...prev,
          health:
            prev.health || (plant.health_status !== undefined && plant.health_status !== 'healthy'),
          coconut: plant.plant_type === 'coconut_tree',
          notesHistory:
            prev.notesHistory || !!plant.notes || (plant.pest_disease_history?.length ?? 0) > 0,
          pestDisease: prev.pestDisease || (plant.pest_disease_history?.length ?? 0) > 0,
        }));

        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 500);
      }
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    setShowValidationErrors(true);
    const sectionOrder: FormSectionKey[] = [
      'basic',
      'location',
      'care',
      'health',
      'harvest',
      'coconut',
      'notesHistory',
    ];
    const firstErrorSection = sectionOrder.find((s) => validationErrors[s].length > 0);
    if (firstErrorSection) {
      // Both flows surface errors inline under each field (PickerField errorText);
      // expanding the errored section is all that's needed here.
      setSectionExpandedState(firstErrorSection, true);
      return;
    }

    if (loading || isSaving.current) return;

    setLoading(true);
    isSaving.current = true;
    setHasUnsavedChanges(false);
    try {
      const nickname = name.trim();
      let resolvedPhotoFilename = photoFilename;
      const combinedLocation = `${parentLocation.trim()} - ${childLocation.trim()}`;
      // When auto-generating a name, always number against a fresh plant list
      // (cache-backed, 30s TTL, invalidated after each create) so back-to-back
      // creates don't collide on a stale in-memory list and produce duplicate #N.
      const plantsForNaming = nickname ? existingPlants : await getAllPlants();
      const finalPlantName =
        nickname ||
        buildGeneratedPlantName(
          generatedPlantNameBase,
          plantsForNaming,
          plantId,
          loadedGeneratedName
        );

      if (photoUri && !resolvedPhotoFilename) {
        const saved = await savePlantImage(photoUri);
        resolvedPhotoFilename = saved.filename ?? getFilenameFromUri(saved.uri);
      } else if (!photoUri) {
        resolvedPhotoFilename = null;
      }

      const plantData: Partial<Plant> = {
        name: finalPlantName,
        plant_type: plantType,
        plant_variety: plantVariety.trim() || null,
        space_type: spaceType,
        location: combinedLocation,
        bed_id: bedId.trim() || null,
        bed_name: spaceType === 'bed' ? bedName.trim() || null : null,
        ...(prefill ? { bed_layer: prefill.bedLayer, spacing_cm: prefill.spacingCm } : null),
        pot_size: spaceType === 'pot' ? sanitizeNumberText(potSize) || null : null,
        variety: variety.trim() || null,
        landmarks: landmarks.trim() || null,
        planting_date: plantingDate.trim() || null,
        harvest_season: harvestSeason.trim() || null,
        notes: notes.trim() || null,
        photo_filename: resolvedPhotoFilename ?? null,
        sunlight,
        soil_type: soilType,
        water_requirement: waterRequirement,
        watering_frequency_days: parseInt(wateringFrequency, 10) || null,
        fertilising_frequency_days: parseInt(fertilisingFrequency, 10) || null,
        preferred_fertiliser: preferredFertiliser,
        mulching_used: mulchingUsed,
        health_status: healthStatus,
        expected_harvest_date: expectedHarvestDate || null,
        pest_disease_history: pestDiseaseHistory.length > 0 ? pestDiseaseHistory : null,
        growth_stage: growthStage,
        pruning_frequency_days: pruningFrequency ? parseInt(pruningFrequency, 10) : null,
        pruning_notes: pruningNotes.trim() || null,
        watering_enabled: wateringEnabled,
        fertilising_enabled: fertilisingEnabled,
        pruning_enabled: pruningEnabled,
      };

      // Force frequency to null when toggle is OFF
      if (!wateringEnabled) plantData.watering_frequency_days = null;
      if (!fertilisingEnabled) plantData.fertilising_frequency_days = null;
      if (!pruningEnabled) plantData.pruning_frequency_days = null;

      if (plantType === 'coconut_tree') {
        plantData.coconut_fronds_count = coconutFrondsCount
          ? parseInt(coconutFrondsCount, 10)
          : null;
        plantData.nuts_per_month = nutsPerMonth ? parseInt(nutsPerMonth, 10) : null;
        plantData.last_climbing_date = lastClimbingDate || null;
        plantData.spathe_count_per_month = spatheCount ? parseInt(spatheCount, 10) : null;
        plantData.nut_fall_count = nutFallCount ? parseInt(nutFallCount, 10) : null;
        plantData.last_nut_fall_date = lastNutFallDate || null;
      }

      const savedPlant = plantId
        ? await updatePlant(plantId, plantData as Omit<Plant, 'id' | 'user_id' | 'created_at'>)
        : await createPlant(plantData as Omit<Plant, 'id' | 'user_id' | 'created_at'>);

      // The stage override lives in growth_stage_pinned, which updatePlant does
      // not touch — pin/unpin also append to growth_stage_history, so they must
      // be called rather than folded into the payload above.
      if (plantId && pinnedStage !== initialPinnedStage.current) {
        if (pinnedStage) {
          await pinGrowthStage(plantId, pinnedStage);
        } else {
          await unpinGrowthStage(plantId);
        }
        initialPinnedStage.current = pinnedStage;
      }

      setLoadedGeneratedName(nickname ? '' : finalPlantName);
      setExistingPlants((prev) => [...prev.filter((p) => p.id !== savedPlant.id), savedPlant]);

      // Care tasks are what drive the Today/Calendar reminders — a silent
      // failure here leaves a saved plant with no schedule and no feedback.
      // Surface it with a retry instead of only logging.
      try {
        await syncCareTasksForPlant(savedPlant);
      } catch (error) {
        logger.warn('Failed to sync care tasks', error as Error);
        Alert.alert(
          'Care tasks not created',
          'Your plant was saved, but its care schedule could not be set up. Watering and other reminders may be missing.',
          [
            {
              text: 'Retry',
              onPress: () => {
                void syncCareTasksForPlant(savedPlant).catch((retryError) => {
                  logger.warn('Retry: failed to sync care tasks', retryError as Error);
                  Alert.alert(
                    'Still could not create tasks',
                    'You can set up the care schedule later by editing the plant.'
                  );
                });
              },
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
      }

      savedSuccessfully.current = true;
      if (returnTo) {
        // The bed wizard is still mounted below this form in the same stack.
        // popTo returns to that existing instance (preserving its Step 5 state)
        // and updates its params — unlike navigate, which was pushing a fresh
        // wizard on top, losing the user's in-progress bed.
        navigation.dispatch(
          StackActions.popTo('BedCreationWizard', {
            resolvedEntry: { wizardEntryId: returnTo.wizardEntryId, plantId: savedPlant.id },
          })
        );
        return;
      }
      navigateToPlantsAfterSave(savedPlant);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
      setHasUnsavedChanges(true);
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    plantId,
    theme,
    insets,
    isCompactScreen,
    scrollViewRef,
    isSaving,
    isDiscarding,
    existingPlants,
    setExistingPlants,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    parentLocationOptions,
    childLocationOptions,
    specificPlantOptions,
    plantPickerItems,
    varietySuggestions,
    harvestSeasonOptions,
    name,
    setName,
    loadedGeneratedName,
    setLoadedGeneratedName,
    plantType,
    setPlantType,
    plantVariety,
    setPlantVariety,
    spaceType,
    setSpaceType,
    location,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    landmarks,
    setLandmarks,
    bedId,
    setBedId,
    bedName,
    setBedName,
    potSize,
    setPotSize,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    plantingDate,
    setPlantingDate,
    harvestSeason,
    setHarvestSeason,
    notes,
    setNotes,
    photoUri,
    setPhotoUri,
    photoFilename,
    setPhotoFilename,
    sunlight,
    waterRequirement,
    soilType,
    setSoilType,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    preferredFertiliser,
    setPreferredFertiliser,
    mulchingUsed,
    setMulchingUsed,
    healthStatus,
    setHealthStatus,
    expectedHarvestDate,
    growthStage,
    setGrowthStage,
    pinnedStage,
    setPinnedStage,
    pruningFrequency,
    setPruningFrequency,
    pruningNotes,
    setPruningNotes,
    wateringEnabled,
    setWateringEnabled,
    fertilisingEnabled,
    setFertilisingEnabled,
    pruningEnabled,
    setPruningEnabled,
    coconutFrondsCount,
    setCoconutFrondsCount,
    nutsPerMonth,
    setNutsPerMonth,
    lastClimbingDate,
    setLastClimbingDate,
    spatheCount,
    setSpatheCount,
    nutFallCount,
    setNutFallCount,
    lastNutFallDate,
    setLastNutFallDate,
    coconutAgeInfo,
    loading,
    dataLoading,
    hasUnsavedChanges,
    showDiscardModal,
    setShowDiscardModal,
    showPhotoSourceModal,
    setShowPhotoSourceModal,
    showValidationErrors,
    showCustomNameInput,
    setShowCustomNameInput,
    autoSuggestFired,
    locationDefaultsFired,
    sectionExpanded,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
    showClimbingDatePicker,
    setShowClimbingDatePicker,
    showNutFallDatePicker,
    setShowNutFallDatePicker,
    generatedPlantName,
    validationErrors,
    totalErrorCount,
    sectionStatuses,
    phase2Unlocked,
    phase3Unlocked,
    returnTo,
    handleSave,
    handleBackPress,
    handleDiscard,
    setSectionExpandedState,
    openCamera,
    openImageLibrary,
    pickImage,
    navigateToPlantsAfterSave,
  };
}
