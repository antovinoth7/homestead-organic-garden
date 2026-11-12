import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db, refreshAuthToken } from '@/lib/firebase';
import { writeOrQueue } from '@/lib/offlineWrite';
import { getQueue } from '@/lib/offlineQueue';
import { hasPendingWriteFor } from '@/utils/offlineQueueLogic';
import {
  applyProfileDeletion,
  applyProfileRename,
  applyProfileRestore,
} from '@/utils/plantProfileMutations';
import { getData, setData, KEYS } from '@/lib/storage';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
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
  CatalogGroup,
} from '@/types/database.types';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { sortPlantNames } from '@/utils/plantSort';
import { PLANT_CATEGORIES } from '@/utils/plantCategories';

// ─── Constants ────────────────────────────────────────────────────────────────

export { PLANT_CATEGORIES };

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';
const CACHE_KEY = 'plantProfiles';

/**
 * Bumped on every local save. `syncFromFirestore` captures it before its read
 * and re-checks after, so a save that lands while the snapshot is in flight is
 * never overwritten by the copy that read fetched — the race that made the
 * resurrection feel random rather than reproducible.
 */
let localWriteGeneration = 0;

// ─── Default profiles (built from DEFAULT_PLANT_CATALOG data) ─────────────────

function buildDefaultProfiles(): PlantProfiles {
  const profiles = createEmptyProfiles();

  const seed = PLANT_CATEGORIES.map((type) => {
    const category = DEFAULT_PLANT_CATALOG.categories[type];
    return {
      type,
      plants: category.plants,
      varieties: category.varieties,
      tamilNames: category.tamilNames,
      descriptions: category.descriptions,
      varietyDetails: category.varietyDetails,
    };
  });

  for (const cat of seed) {
    for (const name of cat.plants) {
      profiles[cat.type][name] = {
        plantType: cat.type,
        name,
        tamilName: cat.tamilNames?.[name],
        description: cat.descriptions?.[name],
        varieties: cat.varieties?.[name] ?? [],
        varietyDetails: cat.varietyDetails?.[name],
      };
    }
  }

  return profiles;
}

export const DEFAULT_PLANT_PROFILES: PlantProfiles = buildDefaultProfiles();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Every category present, every category empty. Callers that need a coherent
 * `PlantProfiles` before a load resolves use this rather than casting `{}`;
 * `getProfileEntry` still answers from `DEFAULT_PLANT_PROFILES` through it.
 */
export function createEmptyProfiles(): PlantProfiles {
  return PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);
}

/**
 * The catalog as the user sees it: every bundled name plus their own additions,
 * minus any bundled entry they deleted (which survives in the stored map as an
 * `isDeleted` tombstone, since deleting the key alone would let the default
 * re-appear on the next read).
 *
 * Sorted A–Z, with the user's own additions interleaved rather than appended.
 * Unsorted this returned object-key insertion order — the array-literal order of
 * `DEFAULT_PLANT_CATALOG`, which is a curated top 25 followed by append batches
 * and reads as random past the first screenful. Every list surface reads through
 * here (catalog browse, add-plant dropdown via `toPlantCatalogShape`, picker
 * sheet), so sorting once here is what keeps them in agreement.
 */
/**
 * Memo for the above, keyed on the profiles object itself. Every write replaces
 * that object wholesale, so identity is a sound key — and a WeakMap lets the
 * superseded copy be collected with its entry. Worth it because one catalog
 * rebuild asks for the same eight categories about three times over, and each
 * ask re-sorts. Callers get a copy, so the cached order cannot be mutated.
 */
const namesByProfiles = new WeakMap<PlantProfiles, Partial<Record<PlantType, string[]>>>();

export function getPlantNamesForType(profiles: PlantProfiles, type: PlantType): string[] {
  let cached = namesByProfiles.get(profiles);
  const hit = cached?.[type];
  if (hit) return [...hit];

  const defaults = DEFAULT_PLANT_PROFILES[type];
  const user = profiles[type] ?? {};
  const defaultNames = Object.keys(defaults).filter((n) => !user[n]?.isDeleted);
  const userAdded = Object.keys(user).filter((n) => !defaults[n] && !user[n]?.isDeleted);
  const names = sortPlantNames([...defaultNames, ...userAdded]);

  if (!cached) {
    cached = {};
    namesByProfiles.set(profiles, cached);
  }
  cached[type] = names;
  return [...names];
}

export function getProfileEntry(
  profiles: PlantProfiles,
  type: PlantType,
  name: string
): PlantProfile | undefined {
  const stored = profiles[type]?.[name];
  if (stored?.isDeleted) return undefined;
  return stored ?? DEFAULT_PLANT_PROFILES[type]?.[name];
}

/**
 * The catalog flattened into one map: bundled defaults with the user's edits
 * applied, their additions included and their deletions removed.
 *
 * `profiles` on its own holds only the user's overrides — on an install where
 * nothing has been edited it is empty — so anything that has to see the whole
 * catalog (search, duplicate checks) must go through this rather than reading
 * the stored map directly.
 */
export function getMergedProfiles(profiles: PlantProfiles): PlantProfiles {
  const merged = createEmptyProfiles();
  for (const type of PLANT_CATEGORIES) {
    for (const name of getPlantNamesForType(profiles, type)) {
      const entry = getProfileEntry(profiles, type, name);
      if (entry) merged[type][name] = entry;
    }
  }
  return merged;
}

/**
 * Bundled entries the user deleted, per category — drives the restore UI.
 *
 * Cross-checked against the current defaults: a tombstone can outlive the plant
 * it hides when a name is dropped from the catalog, and offering to restore one
 * is a lie — `restorePlantProfile` removes the tombstone and nothing comes
 * back, because there is no default left to un-hide.
 */
export function getHiddenPlantNames(profiles: PlantProfiles): Record<PlantType, string[]> {
  return PLANT_CATEGORIES.reduce(
    (acc, type) => {
      acc[type] = Object.keys(profiles[type] ?? {}).filter(
        (name) =>
          profiles[type]?.[name]?.isDeleted === true &&
          profiles[type]?.[name]?.isDismissed !== true &&
          DEFAULT_PLANT_PROFILES[type]?.[name] !== undefined
      );
      return acc;
    },
    {} as Record<PlantType, string[]>
  );
}

// ─── Bridge helpers for unmigrated callers ────────────────────────────────────

export function toPlantCatalogShape(profiles: PlantProfiles): PlantCatalog {
  const categories = {} as PlantCatalog['categories'];
  for (const type of PLANT_CATEGORIES) {
    categories[type] = catalogCategory(profiles, type);
  }
  return { categories };
}

/** One plant type's slice of the legacy catalog shape. */
function catalogCategory(
  profiles: PlantProfiles,
  type: PlantType
): PlantCatalog['categories'][PlantType] {
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
  return { plants, varieties, tamilNames, descriptions, varietyDetails };
}

/**
 * Copies an object without the keys whose value is `undefined`.
 *
 * Generic over the key so the value type is carried through: iterating with
 * `Object.entries` would collapse every field to the union of all of them and
 * lose the per-key relation.
 */
function dropUndefined<T extends object>(source: T): T {
  const result = {} as T;
  for (const key of Object.keys(source) as (keyof T)[]) {
    const value = source[key];
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/**
 * Narrows stored profiles to just their care-override fields.
 *
 * The eight profile-only keys are named and dropped; everything left is, by
 * construction, `Partial<PlantCareProfile>` — which is what
 * `PlantCareProfileOverride` is. This used to be 48 hand-written
 * `if (p.x !== undefined) override.x = p.x` lines, so a newly added care field
 * was silently dropped here until someone remembered to add a 49th. Now the
 * failure mode is inverted: a new care field is carried automatically, and
 * only a new *non*-care field would need a line adding.
 *
 * Undefined values are stripped so an override stays a delta — an explicit
 * `undefined` would otherwise count as a key and shadow the bundled default.
 */
export function toPlantCareProfilesShape(profiles: PlantProfiles): PlantCareProfiles {
  const result = PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantCareProfiles);

  for (const type of PLANT_CATEGORIES) {
    for (const [name, p] of Object.entries(profiles[type] ?? {})) {
      if (p.isDeleted) continue;

      const {
        plantType: _plantType,
        name: _name,
        varieties: _varieties,
        varietyDetails: _varietyDetails,
        isUserAdded: _isUserAdded,
        isDeleted: _isDeleted,
        cropFamily: _cropFamily,
        layer: _layer,
        group: _group,
        ...care
      } = p;

      const override = dropUndefined<PlantCareProfileOverride>(care);
      if (Object.keys(override).length > 0) result[type][name] = override;
    }
  }
  return result;
}

// Needed for bridge type reference
type PlantCareProfileOverride = import('@/types/database.types').PlantCareProfileOverride;

// ─── Normalization ────────────────────────────────────────────────────────────

const WATER_REQS = new Set<WaterRequirement>(['low', 'medium', 'high']);
const SUNLIGHT_LEVELS = new Set<SunlightLevel>(['full_sun', 'partial_sun', 'shade']);
const SOIL_TYPES = new Set<SoilType>([
  'garden_soil',
  'potting_mix',
  'coco_peat',
  'red_laterite',
  'coastal_sandy',
  'black_cotton',
  'alluvial',
  'custom',
]);
const FERTILISERS = new Set<FertiliserType>([
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
]);
const GROWTH_STAGES = new Set<GrowthStage>([
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'dormant',
  'mature',
]);
const TOLERANCE_LEVELS = new Set<ToleranceLevel>(['low', 'medium', 'high']);
const FEEDING_INTENSITIES = new Set<FeedingIntensity>(['light', 'medium', 'heavy']);
const LIFECYCLES = new Set<PlantLifecycle>(['annual', 'biennial', 'perennial', 'permanent']);

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

  // Keys are set in a fixed order; `setIf` keeps a value only when it is truthy.
  const entry: PlantProfile = { plantType, name };
  setIf(entry, 'tamilName', normalizeStr(r.tamilName));
  setIf(entry, 'description', normalizeStr(r.description));
  setIf(entry, 'varieties', normalizeStrArr(r.varieties));
  setIf(entry, 'isUserAdded', trueOr(r.isUserAdded));
  setIf(entry, 'isDeleted', trueOr(r.isDeleted));
  if (entry.isDeleted) {
    setIf(entry, 'isDismissed', trueOr(r.isDismissed));
    setIf(entry, 'deletedAt', normalizeNum(r.deletedAt));
  }
  setIf(entry, 'varietyDetails', objectOr<Record<string, VarietyDetail>>(r.varietyDetails));
  setIf(entry, 'waterRequirement', pickEnum(WATER_REQS, r.waterRequirement));
  setIf(entry, 'sunlight', pickEnum(SUNLIGHT_LEVELS, r.sunlight));
  setIf(entry, 'soilType', pickEnum(SOIL_TYPES, r.soilType));
  setIf(entry, 'preferredFertiliser', pickEnum(FERTILISERS, r.preferredFertiliser));
  setIf(entry, 'initialGrowthStage', pickEnum(GROWTH_STAGES, r.initialGrowthStage));
  setIf(entry, 'lifecycle', pickEnum(LIFECYCLES, r.lifecycle));
  setIf(entry, 'heatTolerance', pickEnum(TOLERANCE_LEVELS, r.heatTolerance));
  setIf(entry, 'droughtTolerance', pickEnum(TOLERANCE_LEVELS, r.droughtTolerance));
  setIf(entry, 'waterloggingTolerance', pickEnum(TOLERANCE_LEVELS, r.waterloggingTolerance));
  setIf(entry, 'feedingIntensity', pickEnum(FEEDING_INTENSITIES, r.feedingIntensity));
  setIf(entry, 'wateringFrequencyDays', normalizeNum(r.wateringFrequencyDays));
  if (r.wateringEnabled === false) entry.wateringEnabled = false;
  setIf(entry, 'fertilisingFrequencyDays', normalizeNum(r.fertilisingFrequencyDays));
  if (r.fertilisingEnabled === false) entry.fertilisingEnabled = false;
  setIf(entry, 'pruningFrequencyDays', normalizeNum(r.pruningFrequencyDays));
  if (r.pruningEnabled === false) entry.pruningEnabled = false;
  setIf(entry, 'pruningTips', normalizeStrArr(r.pruningTips));
  setIf(entry, 'shapePruningTip', normalizeStr(r.shapePruningTip));
  setIf(entry, 'shapePruningMonths', normalizeStr(r.shapePruningMonths));
  setIf(entry, 'flowerPruningTip', normalizeStr(r.flowerPruningTip));
  setIf(entry, 'flowerPruningMonths', normalizeStr(r.flowerPruningMonths));
  setIf(entry, 'scientificName', normalizeStr(r.scientificName));
  setIf(entry, 'taxonomicFamily', normalizeStr(r.taxonomicFamily));
  setIf(entry, 'daysToHarvest', normalizeRange(r.daysToHarvest));
  setIf(entry, 'heightCm', normalizeRange(r.heightCm));
  setIf(entry, 'germinationDays', normalizeRange(r.germinationDays));
  setIf(entry, 'germinationTempC', normalizeRange(r.germinationTempC));
  setIf(entry, 'soilPhRange', normalizeRange(r.soilPhRange));
  setIf(entry, 'spacingCm', normalizeNum(r.spacingCm));
  setIf(entry, 'plantingDepthCm', normalizeNum(r.plantingDepthCm));
  setIf(entry, 'yearsToFirstHarvest', normalizeNum(r.yearsToFirstHarvest));
  setIf(entry, 'chopDropIntervalDays', normalizeNum(r.chopDropIntervalDays));
  const floweringStartMonth = normalizeNum(r.floweringStartMonth);
  if (floweringStartMonth && floweringStartMonth >= 1 && floweringStartMonth <= 12)
    entry.floweringStartMonth = floweringStartMonth;
  setIf(entry, 'growingSeason', normalizeStr(r.growingSeason));
  setIf(entry, 'seedSource', normalizeStr(r.seedSource));
  setIf(entry, 'guild', normalizeStr(r.guild));
  setIf(entry, 'isPermanent', trueOr(r.isPermanent));
  setIf(entry, 'isDynamicAccumulator', trueOr(r.isDynamicAccumulator));
  if (typeof r.petToxicity === 'boolean') entry.petToxicity = r.petToxicity;
  setIf(entry, 'vitamins', normalizeStrArr(r.vitamins));
  setIf(entry, 'minerals', normalizeStrArr(r.minerals));
  setIf(entry, 'customPests', normalizeStrArr(r.customPests));
  setIf(entry, 'customDiseases', normalizeStrArr(r.customDiseases));
  setIf(entry, 'customBeneficials', normalizeStrArr(r.customBeneficials));
  setIf(entry, 'growthStageDurations', objectOr<GrowthStageDurations>(r.growthStageDurations));
  setIf(entry, 'annualCycleDurations', objectOr<AnnualCycleDurations>(r.annualCycleDurations));
  setIf(entry, 'cropFamily', r.cropFamily as PlantProfile['cropFamily']);
  setIf(entry, 'layer', r.layer as PlantProfile['layer']);
  if (CATALOG_GROUP_ORDER.includes(r.group as CatalogGroup)) entry.group = r.group as CatalogGroup;
  return entry;
}

/** Sets `entry[key]` only when `value` is truthy — blank, zero and missing are dropped. */
function setIf<K extends keyof PlantProfile>(
  entry: PlantProfile,
  key: K,
  value: PlantProfile[K] | undefined
): void {
  if (value) entry[key] = value;
}

/** `v` when it is one of the allowed values, else undefined. */
function pickEnum<T extends string>(allowed: ReadonlySet<T>, v: unknown): T | undefined {
  return allowed.has(v as T) ? (v as T) : undefined;
}

/** `v` when it is a non-null object, else undefined. Its contents pass through as stored. */
function objectOr<T>(v: unknown): T | undefined {
  return v && typeof v === 'object' ? (v as T) : undefined;
}

/** `true` only for a literal `true`; anything else leaves the flag unset. */
function trueOr(v: unknown): true | undefined {
  return v === true ? true : undefined;
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

  // The server is knowingly behind while writes are still queued, so adopting
  // it here would undo them. Checked before the read, so it also saves a
  // Firestore hit. The queue is shared with farmCapacity and locations, which
  // makes this slightly over-eager — it only ever delays a background refresh,
  // and a flush calls invalidateAll(), so the next read picks the change up.
  if (hasPendingWriteFor(await getQueue(), SETTINGS_COLLECTION, user.uid)) {
    logger.info('plantProfiles: local writes still pending, skipping remote adopt');
    return;
  }

  await refreshAuthToken();
  try {
    const generation = localWriteGeneration;
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    if (!snapshot.exists()) return;
    const data = snapshot.data() as Record<string, unknown>;
    const remote = data[PLANT_PROFILES_FIELD];
    if (!remote) return;
    // A save landed while this read was in flight; it is newer than what came
    // back, so leave it alone.
    if (generation !== localWriteGeneration) return;
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
  localWriteGeneration += 1;

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    // Queued payload uses a concrete Timestamp (serverTimestamp() sentinels
    // can't be serialized for replay); the online path keeps server time.
    await writeOrQueue(
      {
        collection: SETTINGS_COLLECTION,
        docId: user.uid,
        op: 'set',
        payload: { [PLANT_PROFILES_FIELD]: normalized, updated_at: Timestamp.now() },
      },
      () =>
        setDoc(
          docRef,
          { [PLANT_PROFILES_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        )
    );
  } catch (err) {
    logError('network', 'plantProfiles: Firestore save failed', err as Error);
    // The local copy is saved, but the server never got it — so the caller must
    // not report success. Left silent, the next sync adopts the server's older
    // copy and undoes whatever this write did. `writeOrQueue` resolves when it
    // queues, so an offline write still succeeds here; only the errors it
    // refuses to queue (permission-denied, invalid-argument, expired token)
    // reach this line.
    throw err;
  }

  return normalized;
}

export async function savePlantProfile(
  type: PlantType,
  name: string,
  data: Omit<PlantProfile, 'plantType' | 'name'>
): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  // Re-saving a hidden entry resurrects it, so the tombstone must not be
  // inherited — fall through to the bundled default as if it were absent.
  const stored = current[type][name];
  const existing = (stored?.isDeleted ? undefined : stored) ?? DEFAULT_PLANT_PROFILES[type]?.[name] ?? {};
  const updated: PlantProfiles = {
    ...current,
    [type]: {
      ...current[type],
      [name]: { ...existing, ...data, plantType: type, name },
    },
  };
  return savePlantProfiles(updated);
}

/** True when the app ships this name, so deleting hides rather than removes it. */
export function isBundledPlant(type: PlantType, name: string): boolean {
  return DEFAULT_PLANT_PROFILES[type]?.[name] !== undefined;
}

/**
 * Removes a catalog entry — always by tombstone, never by dropping the key.
 * See `@/utils/plantProfileMutations` for why: the profiles map reaches
 * Firestore through a merged write, which cannot express a removed key.
 */
export async function deletePlantProfile(type: PlantType, name: string): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  return savePlantProfiles(applyProfileDeletion(current, type, name, Date.now()));
}

/** Renames an entry: the new name is written, the old one tombstoned. */
export async function renamePlantProfile(
  type: PlantType,
  from: string,
  to: string,
  data: Omit<PlantProfile, 'plantType' | 'name'>
): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  return savePlantProfiles(applyProfileRename(current, type, from, to, data, Date.now()));
}

/** Undoes a {@link deletePlantProfile} tombstone, restoring the bundled entry. */
export async function restorePlantProfile(type: PlantType, name: string): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  if (!current[type]?.[name]?.isDeleted) return current;
  return savePlantProfiles(applyProfileRestore(current, DEFAULT_PLANT_PROFILES, type, name));
}
