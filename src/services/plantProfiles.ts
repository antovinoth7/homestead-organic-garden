import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, refreshAuthToken } from '@/lib/firebase';
import { getData, setData, KEYS } from '@/lib/storage';
import { getCached, setCached } from '@/lib/dataCache';
import {
  PlantProfile,
  PlantProfiles,
  PlantType,
  PlantCatalog,
  PlantCareProfiles,
  WaterRequirement,
  SunlightLevel,
  SoilType,
  FertiliserType,
  GrowthStage,
  ToleranceLevel,
  FeedingIntensity,
  PlantLifecycle,
  NumericRange,
  GrowthStageDurations,
  AnnualCycleDurations,
  VarietyDetail,
} from '@/types/database.types';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { CATEGORY_OPTIONS } from '@/utils/plantLabels';
import { DEFAULT_PLANT_DATA } from '@/config/plants/defaultPlantData';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLANT_CATEGORIES: PlantType[] = CATEGORY_OPTIONS.map((opt) => opt.value);

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';
const CACHE_KEY = 'plantProfiles';

// ─── Default profiles (derived from the shared DEFAULT_PLANT_DATA) ────────────

function buildDefaultProfiles(): PlantProfiles {
  const profiles = createEmptyProfiles();
  for (const type of PLANT_CATEGORIES) {
    const data = DEFAULT_PLANT_DATA[type];
    if (!data) continue;
    for (const name of data.plants) {
      profiles[type][name] = {
        plantType: type,
        name,
        tamilName: data.tamilNames[name],
        description: data.descriptions[name],
        varieties: data.varieties[name] ?? [],
      };
    }
  }

  return profiles;
}

export const DEFAULT_PLANT_PROFILES: PlantProfiles = buildDefaultProfiles();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyProfiles(): PlantProfiles {
  return PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);
}

export function getPlantNamesForType(profiles: PlantProfiles, type: PlantType): string[] {
  const defaults = DEFAULT_PLANT_PROFILES[type];
  const user = profiles[type] ?? {};
  const defaultNames = Object.keys(defaults);
  const userAdded = Object.keys(user).filter((n) => !defaults[n]);
  return [...defaultNames, ...userAdded];
}

export function getProfileEntry(
  profiles: PlantProfiles,
  type: PlantType,
  name: string
): PlantProfile | undefined {
  return profiles[type]?.[name] ?? DEFAULT_PLANT_PROFILES[type]?.[name];
}

// ─── Bridge helpers for unmigrated callers ────────────────────────────────────

export function toPlantCatalogShape(profiles: PlantProfiles): PlantCatalog {
  const categories = {} as PlantCatalog['categories'];
  for (const type of PLANT_CATEGORIES) {
    const plants: string[] = getPlantNamesForType(profiles, type);
    const varieties: Record<string, string[]> = {};
    const tamilNames: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    const varietyDetails: Record<string, Record<string, VarietyDetail>> = {};
    for (const name of plants) {
      const p = getProfileEntry(profiles, type, name);
      if (!p) continue;
      if (p.varieties?.length) varieties[name] = p.varieties;
      if (p.tamilName) tamilNames[name] = p.tamilName;
      if (p.description) descriptions[name] = p.description;
      if (p.varietyDetails) varietyDetails[name] = p.varietyDetails;
    }
    categories[type] = { plants, varieties, tamilNames, descriptions, varietyDetails };
  }
  return { categories };
}

export function toPlantCareProfilesShape(profiles: PlantProfiles): PlantCareProfiles {
  const result = PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantCareProfiles);

  for (const type of PLANT_CATEGORIES) {
    for (const [name, p] of Object.entries(profiles[type] ?? {})) {
      const override: PlantCareProfileOverride = {};
      if (p.waterRequirement !== undefined) override.waterRequirement = p.waterRequirement;
      if (p.wateringFrequencyDays !== undefined)
        override.wateringFrequencyDays = p.wateringFrequencyDays;
      if (p.wateringEnabled !== undefined) override.wateringEnabled = p.wateringEnabled;
      if (p.fertilisingFrequencyDays !== undefined)
        override.fertilisingFrequencyDays = p.fertilisingFrequencyDays;
      if (p.fertilisingEnabled !== undefined) override.fertilisingEnabled = p.fertilisingEnabled;
      if (p.pruningFrequencyDays !== undefined)
        override.pruningFrequencyDays = p.pruningFrequencyDays;
      if (p.pruningEnabled !== undefined) override.pruningEnabled = p.pruningEnabled;
      if (p.sunlight !== undefined) override.sunlight = p.sunlight;
      if (p.soilType !== undefined) override.soilType = p.soilType;
      if (p.preferredFertiliser !== undefined) override.preferredFertiliser = p.preferredFertiliser;
      if (p.initialGrowthStage !== undefined) override.initialGrowthStage = p.initialGrowthStage;
      if (p.pruningTips !== undefined) override.pruningTips = p.pruningTips;
      if (p.shapePruningTip !== undefined) override.shapePruningTip = p.shapePruningTip;
      if (p.shapePruningMonths !== undefined) override.shapePruningMonths = p.shapePruningMonths;
      if (p.flowerPruningTip !== undefined) override.flowerPruningTip = p.flowerPruningTip;
      if (p.flowerPruningMonths !== undefined) override.flowerPruningMonths = p.flowerPruningMonths;
      if (p.scientificName !== undefined) override.scientificName = p.scientificName;
      if (p.taxonomicFamily !== undefined) override.taxonomicFamily = p.taxonomicFamily;
      if (p.lifecycle !== undefined) override.lifecycle = p.lifecycle;
      if (p.tamilName !== undefined) override.tamilName = p.tamilName;
      if (p.description !== undefined) override.description = p.description;
      if (p.daysToHarvest !== undefined) override.daysToHarvest = p.daysToHarvest;
      if (p.yearsToFirstHarvest !== undefined) override.yearsToFirstHarvest = p.yearsToFirstHarvest;
      if (p.heightCm !== undefined) override.heightCm = p.heightCm;
      if (p.spacingCm !== undefined) override.spacingCm = p.spacingCm;
      if (p.plantingDepthCm !== undefined) override.plantingDepthCm = p.plantingDepthCm;
      if (p.growingSeason !== undefined) override.growingSeason = p.growingSeason;
      if (p.germinationDays !== undefined) override.germinationDays = p.germinationDays;
      if (p.germinationTempC !== undefined) override.germinationTempC = p.germinationTempC;
      if (p.soilPhRange !== undefined) override.soilPhRange = p.soilPhRange;
      if (p.heatTolerance !== undefined) override.heatTolerance = p.heatTolerance;
      if (p.droughtTolerance !== undefined) override.droughtTolerance = p.droughtTolerance;
      if (p.waterloggingTolerance !== undefined)
        override.waterloggingTolerance = p.waterloggingTolerance;
      if (p.vitamins !== undefined) override.vitamins = p.vitamins;
      if (p.minerals !== undefined) override.minerals = p.minerals;
      if (p.petToxicity !== undefined) override.petToxicity = p.petToxicity;
      if (p.feedingIntensity !== undefined) override.feedingIntensity = p.feedingIntensity;
      if (p.customPests !== undefined) override.customPests = p.customPests;
      if (p.customDiseases !== undefined) override.customDiseases = p.customDiseases;
      if (p.customBeneficials !== undefined) override.customBeneficials = p.customBeneficials;
      if (p.growthStageDurations !== undefined)
        override.growthStageDurations = p.growthStageDurations;
      if (p.annualCycleDurations !== undefined)
        override.annualCycleDurations = p.annualCycleDurations;
      if (p.floweringStartMonth !== undefined) override.floweringStartMonth = p.floweringStartMonth;
      if (p.seedSource !== undefined) override.seedSource = p.seedSource;
      if (p.isPermanent !== undefined) override.isPermanent = p.isPermanent;
      if (p.isDynamicAccumulator !== undefined)
        override.isDynamicAccumulator = p.isDynamicAccumulator;
      if (p.chopDropIntervalDays !== undefined)
        override.chopDropIntervalDays = p.chopDropIntervalDays;
      if (p.guild !== undefined) override.guild = p.guild;
      if (Object.keys(override).length > 0) result[type][name] = override;
    }
  }
  return result;
}

// Needed for bridge type reference
type PlantCareProfileOverride = import('@/types/database.types').PlantCareProfileOverride;

// ─── Normalization ────────────────────────────────────────────────────────────

const WATER_REQS: WaterRequirement[] = ['low', 'medium', 'high'];
const SUNLIGHT_LEVELS: SunlightLevel[] = ['full_sun', 'partial_sun', 'shade'];
const SOIL_TYPES: SoilType[] = [
  'garden_soil',
  'potting_mix',
  'coco_peat',
  'red_laterite',
  'coastal_sandy',
  'black_cotton',
  'alluvial',
  'custom',
];
const FERTILISERS: FertiliserType[] = [
  'compost',
  'vermicompost',
  'cow_dung_slurry',
  'neem_cake',
  'panchagavya',
  'jeevamrutham',
  'groundnut_cake',
  'fish_emulsion',
  'seaweed',
  'other',
];
const GROWTH_STAGES: GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'dormant',
  'mature',
];
const TOLERANCE_LEVELS: ToleranceLevel[] = ['low', 'medium', 'high'];
const FEEDING_INTENSITIES: FeedingIntensity[] = ['light', 'medium', 'heavy'];
const LIFECYCLES: PlantLifecycle[] = ['annual', 'biennial', 'perennial', 'permanent'];

function normalizeStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function normalizeNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

function normalizeRange(v: unknown): NumericRange | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const min = Number(o.min);
  const max = Number(o.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return undefined;
  return { min, max };
}

function normalizeStrArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const items = v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  return items.length > 0 ? items : undefined;
}

function normalizeEntry(raw: unknown): PlantProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = normalizeStr(r.name);
  const plantType = r.plantType as PlantType;
  if (!name || !PLANT_CATEGORIES.includes(plantType)) return null;

  const entry: PlantProfile = { plantType, name };
  const tamilName = normalizeStr(r.tamilName);
  if (tamilName) entry.tamilName = tamilName;
  const description = normalizeStr(r.description);
  if (description) entry.description = description;
  const varieties = normalizeStrArr(r.varieties);
  if (varieties) entry.varieties = varieties;
  if (r.isUserAdded === true) entry.isUserAdded = true;
  if (r.varietyDetails && typeof r.varietyDetails === 'object')
    entry.varietyDetails = r.varietyDetails as Record<string, VarietyDetail>;
  if (WATER_REQS.includes(r.waterRequirement as WaterRequirement))
    entry.waterRequirement = r.waterRequirement as WaterRequirement;
  if (SUNLIGHT_LEVELS.includes(r.sunlight as SunlightLevel))
    entry.sunlight = r.sunlight as SunlightLevel;
  if (SOIL_TYPES.includes(r.soilType as SoilType)) entry.soilType = r.soilType as SoilType;
  if (FERTILISERS.includes(r.preferredFertiliser as FertiliserType))
    entry.preferredFertiliser = r.preferredFertiliser as FertiliserType;
  if (GROWTH_STAGES.includes(r.initialGrowthStage as GrowthStage))
    entry.initialGrowthStage = r.initialGrowthStage as GrowthStage;
  if (LIFECYCLES.includes(r.lifecycle as PlantLifecycle))
    entry.lifecycle = r.lifecycle as PlantLifecycle;
  if (TOLERANCE_LEVELS.includes(r.heatTolerance as ToleranceLevel))
    entry.heatTolerance = r.heatTolerance as ToleranceLevel;
  if (TOLERANCE_LEVELS.includes(r.droughtTolerance as ToleranceLevel))
    entry.droughtTolerance = r.droughtTolerance as ToleranceLevel;
  if (TOLERANCE_LEVELS.includes(r.waterloggingTolerance as ToleranceLevel))
    entry.waterloggingTolerance = r.waterloggingTolerance as ToleranceLevel;
  if (FEEDING_INTENSITIES.includes(r.feedingIntensity as FeedingIntensity))
    entry.feedingIntensity = r.feedingIntensity as FeedingIntensity;
  const wDays = normalizeNum(r.wateringFrequencyDays);
  if (wDays) entry.wateringFrequencyDays = wDays;
  if (r.wateringEnabled === false) entry.wateringEnabled = false;
  const fDays = normalizeNum(r.fertilisingFrequencyDays);
  if (fDays) entry.fertilisingFrequencyDays = fDays;
  if (r.fertilisingEnabled === false) entry.fertilisingEnabled = false;
  const pDays = normalizeNum(r.pruningFrequencyDays);
  if (pDays) entry.pruningFrequencyDays = pDays;
  if (r.pruningEnabled === false) entry.pruningEnabled = false;
  const pruningTips = normalizeStrArr(r.pruningTips);
  if (pruningTips) entry.pruningTips = pruningTips;
  const shapePruningTip = normalizeStr(r.shapePruningTip);
  if (shapePruningTip) entry.shapePruningTip = shapePruningTip;
  const shapePruningMonths = normalizeStr(r.shapePruningMonths);
  if (shapePruningMonths) entry.shapePruningMonths = shapePruningMonths;
  const flowerPruningTip = normalizeStr(r.flowerPruningTip);
  if (flowerPruningTip) entry.flowerPruningTip = flowerPruningTip;
  const flowerPruningMonths = normalizeStr(r.flowerPruningMonths);
  if (flowerPruningMonths) entry.flowerPruningMonths = flowerPruningMonths;
  const scientificName = normalizeStr(r.scientificName);
  if (scientificName) entry.scientificName = scientificName;
  const taxonomicFamily = normalizeStr(r.taxonomicFamily);
  if (taxonomicFamily) entry.taxonomicFamily = taxonomicFamily;
  const daysToHarvest = normalizeRange(r.daysToHarvest);
  if (daysToHarvest) entry.daysToHarvest = daysToHarvest;
  const heightCm = normalizeRange(r.heightCm);
  if (heightCm) entry.heightCm = heightCm;
  const germinationDays = normalizeRange(r.germinationDays);
  if (germinationDays) entry.germinationDays = germinationDays;
  const germinationTempC = normalizeRange(r.germinationTempC);
  if (germinationTempC) entry.germinationTempC = germinationTempC;
  const soilPhRange = normalizeRange(r.soilPhRange);
  if (soilPhRange) entry.soilPhRange = soilPhRange;
  const spacingCm = normalizeNum(r.spacingCm);
  if (spacingCm) entry.spacingCm = spacingCm;
  const plantingDepthCm = normalizeNum(r.plantingDepthCm);
  if (plantingDepthCm) entry.plantingDepthCm = plantingDepthCm;
  const yearsToFirstHarvest = normalizeNum(r.yearsToFirstHarvest);
  if (yearsToFirstHarvest) entry.yearsToFirstHarvest = yearsToFirstHarvest;
  const chopDropIntervalDays = normalizeNum(r.chopDropIntervalDays);
  if (chopDropIntervalDays) entry.chopDropIntervalDays = chopDropIntervalDays;
  const floweringStartMonth = normalizeNum(r.floweringStartMonth);
  if (floweringStartMonth && floweringStartMonth >= 1 && floweringStartMonth <= 12)
    entry.floweringStartMonth = floweringStartMonth;
  const growingSeason = normalizeStr(r.growingSeason);
  if (growingSeason) entry.growingSeason = growingSeason;
  const seedSource = normalizeStr(r.seedSource);
  if (seedSource) entry.seedSource = seedSource;
  const guild = normalizeStr(r.guild);
  if (guild) entry.guild = guild;
  if (r.isPermanent === true) entry.isPermanent = true;
  if (r.isDynamicAccumulator === true) entry.isDynamicAccumulator = true;
  if (typeof r.petToxicity === 'boolean') entry.petToxicity = r.petToxicity;
  const vitamins = normalizeStrArr(r.vitamins);
  if (vitamins) entry.vitamins = vitamins;
  const minerals = normalizeStrArr(r.minerals);
  if (minerals) entry.minerals = minerals;
  const customPests = normalizeStrArr(r.customPests);
  if (customPests) entry.customPests = customPests;
  const customDiseases = normalizeStrArr(r.customDiseases);
  if (customDiseases) entry.customDiseases = customDiseases;
  const customBeneficials = normalizeStrArr(r.customBeneficials);
  if (customBeneficials) entry.customBeneficials = customBeneficials;
  if (r.growthStageDurations && typeof r.growthStageDurations === 'object')
    entry.growthStageDurations = r.growthStageDurations as GrowthStageDurations;
  if (r.annualCycleDurations && typeof r.annualCycleDurations === 'object')
    entry.annualCycleDurations = r.annualCycleDurations as AnnualCycleDurations;
  if (r.cropFamily) entry.cropFamily = r.cropFamily as PlantProfile['cropFamily'];
  if (r.layer) entry.layer = r.layer as PlantProfile['layer'];
  return entry;
}

function normalizeProfiles(raw: unknown): PlantProfiles {
  const result = createEmptyProfiles();
  if (!raw || typeof raw !== 'object') return result;
  const r = raw as Record<string, unknown>;
  for (const type of PLANT_CATEGORIES) {
    const cat = r[type];
    if (!cat || typeof cat !== 'object') continue;
    for (const [name, entryRaw] of Object.entries(cat as Record<string, unknown>)) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const entry = normalizeEntry({ ...(entryRaw as object), name: trimmed, plantType: type });
      if (entry) result[type][trimmed] = entry;
    }
  }
  return result;
}

// ─── One-time lazy migration from legacy stores ───────────────────────────────

async function migrateFromLegacyStores(): Promise<PlantProfiles> {
  const [rawCatalog, rawCare] = await Promise.all([
    getData<PlantCatalog>(KEYS.PLANT_CATALOG),
    getData<PlantCareProfiles>(KEYS.PLANT_CARE_PROFILES),
  ]);

  const unified = createEmptyProfiles();

  // Step 1: Build from PlantCatalog shape
  const catalog = rawCatalog[0];
  if (catalog?.categories) {
    for (const type of PLANT_CATEGORIES) {
      const cat = catalog.categories[type];
      if (!cat) continue;
      for (const name of cat.plants ?? []) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        unified[type][trimmed] = {
          plantType: type,
          name: trimmed,
          tamilName: cat.tamilNames?.[trimmed],
          description: cat.descriptions?.[trimmed],
          varieties: cat.varieties?.[trimmed] ?? [],
          varietyDetails: cat.varietyDetails?.[trimmed],
        };
      }
    }
  }

  // Step 2: Merge care overrides onto matching entries; add new entries for care-only plants
  const careProfiles = rawCare[0];
  if (careProfiles) {
    for (const type of PLANT_CATEGORIES) {
      const careCategory = (careProfiles as Record<string, unknown>)[type];
      if (!careCategory || typeof careCategory !== 'object') continue;
      for (const [rawName, overrideRaw] of Object.entries(
        careCategory as Record<string, unknown>
      )) {
        if (!overrideRaw || typeof overrideRaw !== 'object') continue;
        const override = overrideRaw as Record<string, unknown>;
        // Resolve the plant name — care profiles may use lowercased_underscored keys
        const candidateName =
          Object.keys(unified[type]).find(
            (n) => n.toLowerCase().replace(/\s+/g, '_') === rawName || n === rawName
          ) ?? rawName;
        const existing = unified[type][candidateName] ?? {
          plantType: type,
          name: candidateName,
          isUserAdded: true,
        };
        unified[type][candidateName] = {
          ...existing,
          ...normalizeEntry({ ...override, name: candidateName, plantType: type }),
        };
      }
    }
  }

  await setData(KEYS.PLANT_PROFILES, [unified]);
  logger.info('Plant profiles migration: legacy stores merged');
  return unified;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getPlantProfiles(): Promise<PlantProfiles> {
  const cached = getCached<PlantProfiles>(CACHE_KEY);
  if (cached) return cached;

  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const normalized = normalizeProfiles(stored[0]);
    setCached(CACHE_KEY, normalized);
    // Fire Firestore sync in background
    void syncFromFirestore();
    return normalized;
  }

  // Nothing in new key — run one-time migration from legacy stores
  const migrated = await migrateFromLegacyStores();
  setCached(CACHE_KEY, migrated);
  void syncFromFirestore();
  return migrated;
}

async function syncFromFirestore(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await refreshAuthToken();
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    if (!snapshot.exists()) return;
    const data = snapshot.data() as Record<string, unknown>;
    const remote = data[PLANT_PROFILES_FIELD];
    if (!remote) return;
    const normalized = normalizeProfiles(remote);
    await setData(KEYS.PLANT_PROFILES, [normalized]);
    setCached(CACHE_KEY, normalized);
  } catch (err) {
    logError('network', 'plantProfiles: Firestore sync failed', err as Error);
  }
}

export async function savePlantProfiles(profiles: PlantProfiles): Promise<PlantProfiles> {
  const normalized = normalizeProfiles(profiles);
  await setData(KEYS.PLANT_PROFILES, [normalized]);
  setCached(CACHE_KEY, normalized);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [PLANT_PROFILES_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false }
    );
  } catch (err) {
    logError('network', 'plantProfiles: Firestore save failed', err as Error);
  }

  return normalized;
}

export async function savePlantProfile(
  type: PlantType,
  name: string,
  data: Omit<PlantProfile, 'plantType' | 'name'>
): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  const existing = current[type][name] ?? DEFAULT_PLANT_PROFILES[type]?.[name] ?? {};
  const updated: PlantProfiles = {
    ...current,
    [type]: {
      ...current[type],
      [name]: { ...existing, ...data, plantType: type, name },
    },
  };
  return savePlantProfiles(updated);
}

export async function deletePlantProfile(type: PlantType, name: string): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  const updated = { ...current, [type]: { ...current[type] } };
  delete updated[type][name];
  return savePlantProfiles(updated);
}
