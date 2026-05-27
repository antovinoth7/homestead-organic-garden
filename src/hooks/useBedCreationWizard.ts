import { useState, useCallback, useEffect } from 'react';
import {
  BedType,
  BedSlope,
  SunlightLevel,
  SoilType,
  CropFamily,
  PestHistoryItem,
  PlantEntry,
  Bed,
  BedRowSnapshot,
  LocationConfig,
  Plant,
} from '@/types/database.types';

import { addBed, updateBed } from '@/services/beds';
import { createPlant, updatePlant } from '@/services/plants';
import { getBedSizeRecommendation } from '@/config/beds';
import type { BedSizeResult } from '@/config/beds';
import { GUILD_TEMPLATES, getGuildTemplate } from '@/config/beds/guildTemplates';
import { computeRowLayout } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { getLocationConfig } from '@/services/locations';
import { plantTypeFromName } from '@/utils/plantTypeFromName';
import { cropFamilyFromName } from '@/utils/cropFamilyFromName';

// ─── Per-step data shapes ─────────────────────────────────────────────────────

export interface Step1Data {
  bed_type: BedType | null;
}

export interface Step2Data {
  name: string;
  sunlight: SunlightLevel;
  soil_type: SoilType;
  slope: BedSlope;
  wind: Bed['wind'];
  parent_location: string | null;
  child_location: string | null;
  prev_crop_family: CropFamily | null;
  prev_crop_season: string | null;
  pest_history: PestHistoryItem[];
  waterlogging_risk: boolean;
  construction_type: 'raised' | 'in_ground';
}

export interface Step3Data {
  width_m: number;
  length_m: number;
  area_sqm: number;
  coconut_distance_m: number | null;
  sizeRecommendation: BedSizeResult | null;
}

export interface Step4Data {
  plant_entries: PlantEntry[];
}

export type { PlantEntry };

// Step 5 is the layout designer — positions are managed locally in BedLayoutStep
// Step 6 is Review (notes only — name was captured in Step 2)
export interface Step6Data {
  notes: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WizardStepData {
  1: Step1Data;
  2: Step2Data;
  3: Step3Data;
  4: Step4Data;
  6: Step6Data;
}

// ─── Default values ───────────────────────────────────────────────────────────

const DEFAULT_STEP2: Step2Data = {
  name: '',
  sunlight: 'full_sun',
  soil_type: 'garden_soil',
  slope: 'flat',
  wind: 'moderate',
  parent_location: null,
  child_location: null,
  prev_crop_family: null,
  prev_crop_season: null,
  pest_history: [],
  waterlogging_risk: false,
  construction_type: 'raised',
};

const DEFAULT_STEP3: Step3Data = {
  width_m: 1.2,
  length_m: 3.0,
  area_sqm: 3.6,
  coconut_distance_m: null,
  sizeRecommendation: null,
};

// ─── Row-layout snapshot ──────────────────────────────────────────────────────

/**
 * Compute the per-row snapshot persisted on `Bed.row_layout`. Mirrors the same
 * engine call as Step 5's visual layout so what the farmer sees == what's
 * saved. Returns undefined when there are no plants yet (no snapshot to save).
 */
function computeRowLayoutSnapshot(
  bedType: BedType,
  s3: Step3Data,
  plantEntries: PlantEntry[],
  constructionType: 'raised' | 'in_ground'
): BedRowSnapshot[] | undefined {
  if (plantEntries.length === 0) return undefined;
  const template = getGuildTemplate(bedType);
  const inputs = mapPlantEntriesToRowInputs(plantEntries, template);
  if (inputs.length === 0) return undefined;
  const result = computeRowLayout(inputs, s3.width_m, s3.length_m, bedType, constructionType);
  const plantedAt = new Date().toISOString();
  return result.rows.map((row) => {
    const species: string[] = [];
    const familySet = new Set<CropFamily>();
    for (const plant of row.plants) {
      if (!species.includes(plant.name)) species.push(plant.name);
      const fam = cropFamilyFromName(plant.name);
      if (fam) familySet.add(fam);
    }
    return {
      row_index: row.rowIndex,
      layer: row.layer,
      north_edge_cm: row.northEdgeCm,
      plants_per_row: row.plantsPerRow,
      crop_families: [...familySet],
      species,
      planted_at: plantedAt,
    };
  });
}

// ─── Per-step validation ──────────────────────────────────────────────────────

function canProceedStep(step: WizardStep, data: Partial<WizardStepData>): boolean {
  switch (step) {
    case 1:
      return !!data[1]?.bed_type;
    case 2: {
      const s2 = data[2];
      if (!s2) return false;
      if (!s2.name?.trim()) return false;
      if (s2.prev_crop_family === 'solanaceae') return false;
      return true;
    }
    case 3: {
      const s3 = data[3];
      return !!s3 && s3.width_m > 0 && s3.length_m > 0;
    }
    case 4:
      return true; // optional guild selections
    case 5:
      return true; // layout designer — always proceed
    case 6:
      return true; // notes optional; name was validated in Step 2
    case 7:
      return false; // success step — no forward navigation
    default:
      return false;
  }
}

// ─── Plant materialization (turn wizard PlantEntry into real Plant record) ───

async function materializeEntry(
  entry: PlantEntry,
  bedId: string,
  bedLocation: string,
  bedSunlight: SunlightLevel
): Promise<Plant> {
  const resolution = entry.resolution ?? { kind: 'placeholder' };

  const sortOrder = entry.sortOrder ?? 0;

  if (resolution.kind === 'link') {
    return updatePlant(resolution.plantId, {
      bed_id: bedId,
      bed_layer: entry.layer,
      spacing_cm: entry.spacingCm,
      sort_order: sortOrder,
    });
  }

  const variety = resolution.kind === 'create' ? resolution.variety ?? null : null;
  const cropFamily = cropFamilyFromName(entry.name);

  return createPlant({
    name: entry.name,
    plant_type: plantTypeFromName(entry.name),
    plant_variety: variety,
    photo_filename: null,
    photo_url: null,
    space_type: 'bed',
    location: bedLocation,
    bed_id: bedId,
    bed_layer: entry.layer,
    spacing_cm: entry.spacingCm,
    sort_order: sortOrder,
    crop_family: cropFamily,
    sunlight: bedSunlight,
    light_requirement: bedSunlight,
    is_deleted: false,
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseBedCreationWizardResult {
  currentStep: WizardStep;
  stepData: Partial<WizardStepData>;
  canProceed: boolean;
  solanaceaeBlocked: boolean;
  isDirty: boolean;
  submitting: boolean;
  error: string | null;
  locationConfig: LocationConfig;
  locationLoading: boolean;
  persistedBedId: string | null;
  setStep1: (data: Partial<Step1Data>) => void;
  setStep2: (data: Partial<Step2Data>) => void;
  setStep3: (data: Partial<Step3Data>) => void;
  setStep4: (data: Partial<Step4Data>) => void;
  setStep6: (data: Partial<Step6Data>) => void;
  goNext: () => void;
  goBack: () => void;
  submit: () => Promise<string | null>;
  reset: () => void;
  ensureBedSaved: () => Promise<string>;
  applyResolvedEntry: (entryId: string, plantId: string) => void;
}

export function useBedCreationWizard(prefillType?: BedType): UseBedCreationWizardResult {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [stepData, setStepData] = useState<Partial<WizardStepData>>({
    1: { bed_type: prefillType ?? null },
    2: prefillType
      ? { ...DEFAULT_STEP2, sunlight: GUILD_TEMPLATES[prefillType].sunlight_requirement }
      : DEFAULT_STEP2,
    3: DEFAULT_STEP3,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationConfig, setLocationConfig] = useState<LocationConfig>({
    parentLocations: [],
    childLocations: [],
  });
  const [locationLoading, setLocationLoading] = useState(true);
  const [persistedBedId, setPersistedBedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLocationConfig()
      .then((config) => {
        if (!cancelled) setLocationConfig(config);
      })
      .finally(() => {
        if (!cancelled) setLocationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const solanaceaeBlocked = stepData[2]?.prev_crop_family === 'solanaceae';
  const canProceed = canProceedStep(currentStep, stepData);
  const isDirty = currentStep > 1 || !!stepData[1]?.bed_type;

  const patchStep = useCallback(
    <S extends keyof WizardStepData>(step: S, patch: Partial<WizardStepData[S]>) => {
      setStepData((prev) => ({
        ...prev,
        [step]: { ...(prev[step] ?? {}), ...patch },
      }));
    },
    []
  );

  // When Step 2 changes, auto-compute Step 3 size recommendation
  const setStep2 = useCallback((data: Partial<Step2Data>) => {
    setStepData((prev) => {
      const merged: Step2Data = { ...(prev[2] ?? DEFAULT_STEP2), ...data };
      const rec = getBedSizeRecommendation({
        slope: merged.slope,
        soil_type: merged.soil_type,
        sunlight: merged.sunlight,
        waterlogging_risk: merged.waterlogging_risk,
        construction_type: merged.construction_type,
      });
      const updated3: Step3Data = {
        ...(prev[3] ?? DEFAULT_STEP3),
        width_m: rec.width_m,
        length_m: rec.length_m,
        area_sqm: rec.area_sqm,
        sizeRecommendation: rec,
      };
      return { ...prev, 2: merged, 3: updated3 };
    });
  }, []);

  const setStep1 = useCallback((data: Partial<Step1Data>) => {
    setStepData((prev) => {
      const merged1: Step1Data = { ...(prev[1] ?? { bed_type: null }), ...data };
      if (!merged1.bed_type) return { ...prev, 1: merged1 };
      const recommended = GUILD_TEMPLATES[merged1.bed_type].sunlight_requirement;
      const merged2: Step2Data = { ...(prev[2] ?? DEFAULT_STEP2), sunlight: recommended };
      const rec = getBedSizeRecommendation({
        slope: merged2.slope,
        soil_type: merged2.soil_type,
        sunlight: recommended,
        waterlogging_risk: merged2.waterlogging_risk,
        construction_type: merged2.construction_type,
      });
      const updated3: Step3Data = {
        ...(prev[3] ?? DEFAULT_STEP3),
        width_m: rec.width_m,
        length_m: rec.length_m,
        area_sqm: rec.area_sqm,
        sizeRecommendation: rec,
      };
      return { ...prev, 1: merged1, 2: merged2, 3: updated3 };
    });
  }, []);
  const setStep3 = useCallback((data: Partial<Step3Data>) => patchStep(3, data), [patchStep]);
  const setStep4 = useCallback((data: Partial<Step4Data>) => patchStep(4, data), [patchStep]);
  const setStep6 = useCallback((data: Partial<Step6Data>) => patchStep(6, data), [patchStep]);

  const goNext = useCallback(() => {
    if (!canProceed) return;
    setCurrentStep((s) => {
      const next = Math.min(s + 1, 7) as WizardStep;
      if (next === 6) {
        setStepData((prev) => (prev[6] ? prev : { ...prev, 6: { notes: '' } }));
      }
      return next;
    });
  }, [canProceed]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 1) as WizardStep);
  }, []);

  // Build the bed payload from current step state. Used by both addBed and updateBed.
  const buildBedPayload = useCallback((): Omit<
    Bed,
    'id' | 'user_id' | 'created_at' | 'updated_at'
  > | null => {
    const s1 = stepData[1];
    const s2 = stepData[2] ?? DEFAULT_STEP2;
    const s3 = stepData[3] ?? DEFAULT_STEP3;
    const s4 = stepData[4];
    const s6 = stepData[6];

    if (!s1?.bed_type || !s2.name?.trim()) return null;

    const rowLayout = computeRowLayoutSnapshot(
      s1.bed_type,
      s3,
      s4?.plant_entries ?? [],
      s2.construction_type
    );

    return {
      name: s2.name.trim(),
      type: s1.bed_type,
      dimensions: {
        width_m: s3.width_m,
        length_m: s3.length_m,
        area_sqm: s3.area_sqm,
      },
      sunlight: s2.sunlight,
      soil_type: s2.soil_type,
      slope: s2.slope,
      wind: s2.wind,
      parent_location: s2.parent_location,
      child_location: s2.child_location,
      prev_crop_family: s2.prev_crop_family,
      prev_crop_season: s2.prev_crop_season,
      pest_history: s2.pest_history,
      is_raised_bed: s2.construction_type === 'raised',
      is_permanent: false,
      coconut_distance_m: s3.coconut_distance_m,
      notes: s6?.notes || null,
      row_layout: rowLayout,
      is_deleted: false,
    };
  }, [stepData]);

  const ensureBedSaved = useCallback(async (): Promise<string> => {
    const payload = buildBedPayload();
    if (!payload) {
      throw new Error('Bed type and name are required before saving');
    }
    if (persistedBedId) {
      await updateBed(persistedBedId, payload);
      return persistedBedId;
    }
    const bed = await addBed(payload);
    setPersistedBedId(bed.id);
    return bed.id;
  }, [buildBedPayload, persistedBedId]);

  const applyResolvedEntry = useCallback((entryId: string, plantId: string): void => {
    setStepData((prev) => {
      const entries = prev[4]?.plant_entries ?? [];
      const updated = entries.map((e) =>
        e.id === entryId ? { ...e, resolution: { kind: 'link', plantId } as const } : e
      );
      return { ...prev, 4: { plant_entries: updated } };
    });
  }, []);

  const submit = useCallback(async (): Promise<string | null> => {
    const s1 = stepData[1];
    const s2 = stepData[2] ?? DEFAULT_STEP2;
    const s4 = stepData[4];

    if (!s1?.bed_type || !s2.name?.trim()) {
      logger.warn(
        'useBedCreationWizard: submit guard failed',
        new Error(`bed_type=${s1?.bed_type ?? 'null'}, name=${s2.name ?? 'undefined'}`)
      );
      setError('Bed type and name are required');
      return null;
    }

    setSubmitting(true);
    setError(null);
    try {
      const bedId = await ensureBedSaved();

      const entries = s4?.plant_entries ?? [];
      if (entries.length > 0) {
        const bedLocation = s2.parent_location ?? s2.child_location ?? '';
        const results = await Promise.allSettled(
          entries.map((entry) => materializeEntry(entry, bedId, bedLocation, s2.sunlight))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          logError(
            'network',
            'useBedCreationWizard: some plant entries failed to persist',
            new Error(`${failed} of ${entries.length} plant writes failed`)
          );
          setError(
            `Bed saved, but ${failed} of ${entries.length} plant${
              entries.length > 1 ? 's' : ''
            } couldn't be added. You can add them from the Plants tab.`
          );
        }
      }

      setCurrentStep(7);
      return bedId;
    } catch (err) {
      logError('network', 'useBedCreationWizard: submit failed', err as Error);
      setError('Failed to save bed. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [stepData, ensureBedSaved]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setStepData({
      1: { bed_type: prefillType ?? null },
      2: prefillType
        ? { ...DEFAULT_STEP2, sunlight: GUILD_TEMPLATES[prefillType].sunlight_requirement }
        : DEFAULT_STEP2,
      3: DEFAULT_STEP3,
    });
    setPersistedBedId(null);
    setError(null);
  }, [prefillType]);

  return {
    currentStep,
    stepData,
    canProceed,
    solanaceaeBlocked,
    isDirty,
    submitting,
    error,
    locationConfig,
    locationLoading,
    persistedBedId,
    setStep1,
    setStep2,
    setStep3,
    setStep4,
    setStep6,
    goNext,
    goBack,
    submit,
    reset,
    ensureBedSaved,
    applyResolvedEntry,
  };
}
