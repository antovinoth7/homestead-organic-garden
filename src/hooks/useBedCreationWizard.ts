import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BedType,
  BedSlope,
  BedLayer,
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

import { addBed, updateBed, deleteBed, getBeds, getBed } from '@/services/beds';
import {
  createPlantBatch,
  updatePlant,
  getPlantsByBed,
  getAllPlants,
  deletePlantsForBed,
} from '@/services/plants';
import { plantToEntry, computeRemovedPlants } from '@/utils/bedEditReconcile';
import { getBedSizeRecommendation } from '@/config/beds';
import type { BedSizeResult } from '@/config/beds';
import { GUILD_TEMPLATES, getGuildTemplate } from '@/config/beds/guildTemplates';
import { computeRowLayout } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import { classifyAsRowRecord } from '@/utils/plantClassification';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { getLocationConfig } from '@/services/locations';
import { plantTypeFromName } from '@/utils/plantTypeFromName';
import { cropFamilyFromName } from '@/utils/cropFamilyFromName';
import {
  buildGeneratedPlantNameBase,
  buildGeneratedPlantName,
} from '@/utils/plantNameGenerator';

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
  sizeRecommendation: BedSizeResult | null;
}

export interface Step4Data {
  plant_entries: PlantEntry[];
  quick_start_applied?: boolean;
}

export type { PlantEntry };

// Step 5 is the layout designer — positions are managed locally in BedLayoutStep
// Step 6 is Review (notes only — name was captured in Step 2)
export interface Step6Data {
  notes: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

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
      return (data[4]?.plant_entries.length ?? 0) > 0; // at least one crop required
    case 5:
      return true; // layout designer — always proceed
    case 6:
      return true; // notes optional; name was validated in Step 2
    default:
      return false;
  }
}

// ─── Plant materialization (turn wizard PlantEntry into real Plant records) ───

type NewPlantPayload = Omit<Plant, 'id' | 'user_id' | 'created_at'>;

function buildPlantPayload(opts: {
  name: string;
  layer: BedLayer;
  spacingCm: number;
  variety: string | null;
  bedId: string;
  bedLocation: string;
  bedSunlight: SunlightLevel;
  recordKind: 'specimen' | 'row';
  plantCount?: number;
  sortOrder: number;
}): NewPlantPayload {
  return {
    // `name` is a placeholder here — the batch builder overwrites it with the
    // auto-generated display name once all payloads exist (for unique suffixes).
    name: opts.name,
    plant_type: plantTypeFromName(opts.name),
    // The wizard entry's `name` is the species; it belongs in `plant_variety`
    // (the "Plant" selector), with any cultivar going to `variety`.
    plant_variety: opts.name,
    variety: opts.variety,
    photo_filename: null,
    photo_url: null,
    space_type: 'bed',
    location: opts.bedLocation,
    bed_id: opts.bedId,
    bed_layer: opts.layer,
    spacing_cm: opts.spacingCm,
    sort_order: opts.sortOrder,
    crop_family: cropFamilyFromName(opts.name),
    sunlight: opts.bedSunlight,
    light_requirement: opts.bedSunlight,
    is_deleted: false,
    record_kind: opts.recordKind,
    ...(opts.plantCount !== undefined ? { plant_count: opts.plantCount } : {}),
  };
}

function varietyFromEntry(entry: PlantEntry | undefined): string | null {
  if (!entry) return null;
  const r = entry.resolution;
  return r?.kind === 'create' ? r.variety ?? null : null;
}

/**
 * Split wizard PlantEntry[] into:
 *  - linkEntries: 'link' resolutions that re-parent existing plants to this bed
 *  - newPlants: payloads to be persisted via createPlantBatch, grouped per the
 *    engine's row layout. Each engine row's mains are classified together —
 *    dense crops collapse into one row-record (record_kind: 'row',
 *    plant_count: N), fruiting / climber / three-sisters / companion plants
 *    stay one doc each (record_kind: 'specimen').
 */
function buildPlantBatchFromEntries(
  entries: PlantEntry[],
  bedId: string,
  bedType: BedType,
  bedLocation: string,
  bedSunlight: SunlightLevel,
  s3: Step3Data,
  constructionType: 'raised' | 'in_ground',
  locationShortName: string,
  existingPlants: readonly Partial<Pick<Plant, 'id' | 'name'>>[]
): {
  newPlants: NewPlantPayload[];
  linkEntries: PlantEntry[];
} {
  const linkEntries: PlantEntry[] = [];
  const createEntries: PlantEntry[] = [];
  for (const entry of entries) {
    if (entry.resolution?.kind === 'link') {
      linkEntries.push(entry);
    } else {
      createEntries.push(entry);
    }
  }

  if (createEntries.length === 0) {
    return { newPlants: [], linkEntries };
  }

  const entryById = new Map<string, PlantEntry>();
  for (const e of createEntries) entryById.set(e.id, e);

  const template = getGuildTemplate(bedType);
  const inputs = mapPlantEntriesToRowInputs(createEntries, template);
  const result = computeRowLayout(
    inputs,
    s3.width_m,
    s3.length_m,
    bedType,
    constructionType
  );

  const newPlants: NewPlantPayload[] = [];
  let sortCounter = 0;
  const consumedIds = new Set<string>();

  for (const row of result.rows) {
    const mains = row.plants.filter((p) => p.isCompanion !== true);
    const companions = row.plants.filter((p) => p.isCompanion === true);

    if (mains.length > 0) {
      const first = mains[0]!;
      const isRow = classifyAsRowRecord(first.spacingCm, bedType, false);

      if (isRow) {
        const firstEntry = entryById.get(first.id ?? '');
        newPlants.push(
          buildPlantPayload({
            name: first.name,
            layer: row.layer,
            spacingCm: first.spacingCm,
            variety: varietyFromEntry(firstEntry),
            bedId,
            bedLocation,
            bedSunlight,
            recordKind: 'row',
            plantCount: mains.length,
            sortOrder: sortCounter++,
          })
        );
        mains.forEach((p) => {
          if (p.id) consumedIds.add(p.id);
        });
      } else {
        for (const main of mains) {
          const mEntry = entryById.get(main.id ?? '');
          newPlants.push(
            buildPlantPayload({
              name: main.name,
              layer: row.layer,
              spacingCm: main.spacingCm,
              variety: varietyFromEntry(mEntry),
              bedId,
              bedLocation,
              bedSunlight,
              recordKind: 'specimen',
              sortOrder: sortCounter++,
            })
          );
          if (main.id) consumedIds.add(main.id);
        }
      }
    }

    for (const comp of companions) {
      const cEntry = entryById.get(comp.id ?? '');
      newPlants.push(
        buildPlantPayload({
          name: comp.name,
          layer: cEntry?.layer ?? row.layer,
          spacingCm: comp.spacingCm,
          variety: varietyFromEntry(cEntry),
          bedId,
          bedLocation,
          bedSunlight,
          recordKind: 'specimen',
          sortOrder: sortCounter++,
        })
      );
      if (comp.id) consumedIds.add(comp.id);
    }
  }

  // Stragglers: entries the engine couldn't fit get persisted as specimens so
  // they still appear in the user's list and can be moved later.
  for (const entry of createEntries) {
    if (!consumedIds.has(entry.id)) {
      newPlants.push(
        buildPlantPayload({
          name: entry.name,
          layer: entry.layer,
          spacingCm: entry.spacingCm,
          variety: varietyFromEntry(entry),
          bedId,
          bedLocation,
          bedSunlight,
          recordKind: 'specimen',
          sortOrder: sortCounter++,
        })
      );
    }
  }

  // Final pass: assign auto-generated display names, matching the manual Plant
  // form. Seed the dedup list with existing garden plants plus each payload as
  // it's named so repeated species get unique " #N" suffixes.
  const named: NewPlantPayload[] = [];
  const seed: Partial<Pick<Plant, 'id' | 'name'>>[] = [...existingPlants];
  for (const p of newPlants) {
    const base = buildGeneratedPlantNameBase(
      p.plant_type,
      p.plant_variety ?? '',
      p.variety ?? '',
      p.planting_date ?? undefined,
      bedLocation,
      locationShortName
    );
    const name = base ? buildGeneratedPlantName(base, seed) : p.plant_variety ?? '';
    const withName = { ...p, name };
    named.push(withName);
    seed.push(withName);
  }

  return { newPlants: named, linkEntries };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseBedCreationWizardOptions {
  prefillType?: BedType;
  /** When set, the wizard runs in edit mode, prefilled from this existing bed. */
  editBedId?: string;
}

export interface UseBedCreationWizardResult {
  mode: 'create' | 'edit';
  /** True while an edit-mode bed + its plants are loading. */
  initializing: boolean;
  currentStep: WizardStep;
  stepData: Partial<WizardStepData>;
  canProceed: boolean;
  solanaceaeBlocked: boolean;
  directionMissing: boolean;
  existingBeds: Bed[];
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
  discardDraft: () => Promise<void>;
}

export function useBedCreationWizard(
  options: UseBedCreationWizardOptions = {}
): UseBedCreationWizardResult {
  const { prefillType, editBedId } = options;
  const isEditMode = !!editBedId;
  const mode: 'create' | 'edit' = isEditMode ? 'edit' : 'create';
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [stepData, setStepData] = useState<Partial<WizardStepData>>({
    1: { bed_type: prefillType ?? null },
    2: prefillType
      ? { ...DEFAULT_STEP2, sunlight: GUILD_TEMPLATES[prefillType].sunlight_requirement }
      : DEFAULT_STEP2,
    3: DEFAULT_STEP3,
  });
  const [initializing, setInitializing] = useState(isEditMode);
  // Edit mode: tracks whether the user has changed anything, so an untouched
  // edit doesn't trigger the discard-changes prompt on exit.
  const [userTouched, setUserTouched] = useState(false);
  // Snapshot of the bed + its plants at edit load, used to preserve non-wizard
  // fields and to reconcile (soft-delete) plants the user removes on save.
  const originalBedRef = useRef<Bed | null>(null);
  const originalPlantsRef = useRef<Plant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationConfig, setLocationConfig] = useState<LocationConfig>({
    parentLocations: [],
    childLocations: [],
  });
  const [locationLoading, setLocationLoading] = useState(true);
  const [existingBeds, setExistingBeds] = useState<Bed[]>([]);
  const [persistedBedId, setPersistedBedId] = useState<string | null>(null);
  // Plants created in-form during this wizard session (via applyResolvedEntry).
  // Tracked so discardDraft can soft-delete them — but NOT plants the user merely
  // linked from existing ones, which go through a different resolver path.
  const createdPlantIdsRef = useRef<Set<string>>(new Set());
  // Set true once submit() succeeds so discardDraft knows the bed is finalized
  // and must not be cleaned up (the screen navigates away immediately after).
  const finalizedRef = useRef(false);

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

  // Load existing beds once so the Step 2 auto name can append a unique " #N".
  useEffect(() => {
    let cancelled = false;
    getBeds()
      .then((beds) => {
        if (!cancelled) setExistingBeds(beds);
      })
      .catch((err) => {
        logger.warn('useBedCreationWizard: getBeds failed', err instanceof Error ? err : undefined);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Edit mode: load the existing bed + its plants once, then prefill every step.
  // Uses a single setStepData (not the cascading setStep1/setStep2) so the saved
  // dimensions and plant entries aren't overwritten by fresh recommendations.
  useEffect(() => {
    if (!editBedId) return;
    let cancelled = false;
    void (async () => {
      try {
        const [bed, plants] = await Promise.all([getBed(editBedId), getPlantsByBed(editBedId)]);
        if (cancelled) return;
        if (!bed) {
          setError('Failed to load bed. Please try again.');
          return;
        }
        originalBedRef.current = bed;
        originalPlantsRef.current = plants;
        setPersistedBedId(editBedId);
        setStepData({
          1: { bed_type: bed.type },
          2: {
            name: bed.name,
            sunlight: bed.sunlight,
            soil_type: bed.soil_type,
            slope: bed.slope,
            wind: bed.wind,
            parent_location: bed.parent_location ?? null,
            child_location: bed.child_location ?? null,
            prev_crop_family: bed.prev_crop_family ?? null,
            prev_crop_season: bed.prev_crop_season ?? null,
            pest_history: bed.pest_history ?? [],
            waterlogging_risk: false,
            construction_type: bed.is_raised_bed ? 'raised' : 'in_ground',
          },
          3: {
            width_m: bed.dimensions.width_m,
            length_m: bed.dimensions.length_m,
            area_sqm: bed.dimensions.area_sqm,
            sizeRecommendation: null,
          },
          4: { plant_entries: plants.map(plantToEntry), quick_start_applied: bed.quick_start_applied ?? false },
          6: { notes: bed.notes ?? '' },
        });
      } catch (err) {
        if (!cancelled) {
          logError('network', 'useBedCreationWizard: edit prefill failed', err as Error);
          setError('Failed to load bed. Please try again.');
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editBedId]);

  const solanaceaeBlocked = stepData[2]?.prev_crop_family === 'solanaceae';
  // Step 2 requires a section/direction when the selected location offers them.
  const directionMissing =
    currentStep === 2 &&
    !!stepData[2]?.parent_location &&
    locationConfig.childLocations.length > 0 &&
    !stepData[2]?.child_location;
  const canProceed = canProceedStep(currentStep, stepData) && !directionMissing;
  const isDirty = isEditMode
    ? userTouched
    : currentStep > 1 || !!stepData[1]?.bed_type;

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
    setUserTouched(true);
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
    setUserTouched(true);
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
      // Plant entries and review notes are guild-specific — drop them when the
      // bed type changes so Step 4/5 don't carry over crops from a different
      // guild (which would otherwise show "Bed full" against the new bed).
      const bedTypeChanged = prev[1]?.bed_type !== merged1.bed_type;
      const next: Partial<WizardStepData> = { ...prev, 1: merged1, 2: merged2, 3: updated3 };
      if (bedTypeChanged) {
        next[4] = { plant_entries: [] };
        delete next[6];
      }
      return next;
    });
  }, []);
  const setStep3 = useCallback(
    (data: Partial<Step3Data>) => {
      setUserTouched(true);
      patchStep(3, data);
    },
    [patchStep]
  );
  const setStep4 = useCallback(
    (data: Partial<Step4Data>) => {
      setUserTouched(true);
      patchStep(4, data);
    },
    [patchStep]
  );
  const setStep6 = useCallback(
    (data: Partial<Step6Data>) => {
      setUserTouched(true);
      patchStep(6, data);
    },
    [patchStep]
  );

  const goNext = useCallback(() => {
    if (!canProceed) return;
    setCurrentStep((s) => {
      const next = Math.min(s + 1, 6) as WizardStep;
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
      // Preserve the existing flag when editing; default false on create.
      // (updateBed is a partial write, so is_resting / resting_until / water
      // fields omitted here are retained on the existing doc.)
      is_permanent: originalBedRef.current?.is_permanent ?? false,
      notes: s6?.notes || null,
      quick_start_applied: s4?.quick_start_applied ?? false,
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
    setUserTouched(true);
    // This plant was created in-form during this session; remember it so an
    // abandoned draft can clean it up (see discardDraft).
    createdPlantIdsRef.current.add(plantId);
    setStepData((prev) => {
      const entries = prev[4]?.plant_entries ?? [];
      const updated = entries.map((e) =>
        e.id === entryId ? { ...e, resolution: { kind: 'link', plantId } as const } : e
      );
      return { ...prev, 4: { ...(prev[4] ?? {}), plant_entries: updated } };
    });
  }, []);

  const discardDraft = useCallback(async (): Promise<void> => {
    // Edit mode: the bed already exists and must never be cleaned up on exit.
    if (editBedId) return;
    // Only relevant for a bed saved early (ensureBedSaved) but never finalized.
    // finalizedRef means submit() succeeded, so the bed is legitimate — leave it.
    if (!persistedBedId || finalizedRef.current) return;

    // If the user created real plants in-form, those plants already reference this
    // bed. Deleting it would orphan them, so keep the bed + plants instead — the
    // abandoned draft becomes a real saved bed. Refresh it with the latest layout.
    if (createdPlantIdsRef.current.size > 0) {
      createdPlantIdsRef.current = new Set();
      try {
        await ensureBedSaved();
      } catch (err) {
        logError(
          'network',
          'useBedCreationWizard: discardDraft keep-bed refresh failed',
          err as Error
        );
      }
      return;
    }

    // No in-form plants — the draft bed is empty, soft-delete it.
    const bedId = persistedBedId;
    setPersistedBedId(null);
    try {
      await deleteBed(bedId);
    } catch (err) {
      logError('network', 'useBedCreationWizard: discardDraft cleanup failed', err as Error);
    }
  }, [editBedId, persistedBedId, ensureBedSaved]);

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
        const s3 = stepData[3] ?? DEFAULT_STEP3;

        // Context for auto-naming, matching the manual Plant form. Both reads
        // degrade gracefully — naming falls back to the location's first word.
        let allPlants: Plant[] = [];
        let locationShortName = '';
        try {
          allPlants = await getAllPlants();
        } catch (err) {
          logError('network', 'useBedCreationWizard: getAllPlants for naming failed', err as Error);
        }
        try {
          const config = await getLocationConfig();
          locationShortName =
            config.parentLocationShortNames?.[s2.parent_location ?? ''] ?? '';
        } catch (err) {
          logError(
            'network',
            'useBedCreationWizard: getLocationConfig for naming failed',
            err as Error
          );
        }

        const { newPlants, linkEntries } = buildPlantBatchFromEntries(
          entries,
          bedId,
          s1.bed_type,
          bedLocation,
          s2.sunlight,
          s3,
          s2.construction_type,
          locationShortName,
          allPlants
        );

        const linkResults = await Promise.allSettled(
          linkEntries.map((entry) => {
            const r = entry.resolution;
            if (r?.kind !== 'link') return Promise.reject(new Error('not a link entry'));
            return updatePlant(r.plantId, {
              bed_id: bedId,
              bed_layer: entry.layer,
              spacing_cm: entry.spacingCm,
              sort_order: entry.sortOrder ?? 0,
            });
          })
        );

        let createFailed = 0;
        if (newPlants.length > 0) {
          try {
            await createPlantBatch(newPlants);
          } catch (err) {
            logError(
              'network',
              'useBedCreationWizard: createPlantBatch failed',
              err as Error
            );
            createFailed = newPlants.length;
          }
        }

        const linkFailed = linkResults.filter((r) => r.status === 'rejected').length;
        const totalFailed = createFailed + linkFailed;
        if (totalFailed > 0) {
          logError(
            'network',
            'useBedCreationWizard: some plant writes failed',
            new Error(`${totalFailed} of ${entries.length} plant writes failed`)
          );
          setError(
            `Bed saved, but ${totalFailed} of ${entries.length} plant${
              entries.length > 1 ? 's' : ''
            } couldn't be added. You can add them from the Plants tab.`
          );
        }
      }

      // Edit mode reconciliation: soft-delete any plant that was on the bed at
      // load but is no longer linked (the user removed it). Empty in create
      // mode, so this is a safe no-op there.
      const removed = computeRemovedPlants(originalPlantsRef.current, entries);
      if (removed.length > 0) {
        try {
          await deletePlantsForBed(removed);
        } catch (err) {
          logError(
            'network',
            'useBedCreationWizard: reconcile delete failed',
            err as Error
          );
          setError(
            `Bed saved, but ${removed.length} removed plant${
              removed.length > 1 ? 's' : ''
            } couldn't be deleted. Try again from the Plants tab.`
          );
        }
      }

      finalizedRef.current = true;
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
    createdPlantIdsRef.current = new Set();
    finalizedRef.current = false;
    setUserTouched(false);
    setError(null);
  }, [prefillType]);

  return {
    mode,
    initializing,
    currentStep,
    stepData,
    canProceed,
    solanaceaeBlocked,
    directionMissing,
    existingBeds,
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
    discardDraft,
  };
}
