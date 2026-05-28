import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, refreshAuthToken } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { logError } from '@/utils/errorLogging';
import { getData, setData, KEYS } from '@/lib/storage';
import { getCached, setCached, invalidate } from '@/lib/dataCache';
import type { FarmConfig, Bed, BedType, LocationProfile } from '@/types/database.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SETTINGS_COLLECTION = 'user_settings';
const FARM_CONFIG_FIELD = 'farmConfig';

/** 1 cent = 40.47 sqm */
const SQM_PER_CENT = 40.47;
/** Usable factor: ~70% after paths, structures */
const USABLE_FACTOR = 0.7;
/** Average bed area in sqm (1.2m × 4m) */
const AVG_BED_AREA_SQM = 4.8;
/** Path overhead per bed (60cm paths on both sides × length) */
const PATH_OVERHEAD_SQM = 1.44;
/** Weekly veg consumption per person in kg */
const WEEKLY_VEG_PER_PERSON_KG = 3.5;
/** Average family members per family */
const MEMBERS_PER_FAMILY = 4;

const CACHE_KEY_FARM_CONFIG = 'farmConfig';

// ─── Food categories mapped to bed types ─────────────────────────────────────

const CATEGORY_BED_MAP: Record<string, BedType[]> = {
  leafy: ['leafy'],
  fruiting: ['fruiting', 'three_sisters'],
  root_legume: ['root_legume'],
  spice: ['spice', 'medicinal_guild'],
  climber: ['climber_trellis'],
};

// ─── Pure computation functions ──────────────────────────────────────────────

/**
 * Calculate usable square meters from land area in cents.
 * Applies 70% usable factor (paths, structures).
 */
export function calcUsableSqm(cents: number): number {
  return Math.round(cents * SQM_PER_CENT * USABLE_FACTOR * 10) / 10;
}

/**
 * Calculate maximum number of beds that fit in the usable area.
 */
export function calcMaxBeds(usableSqm: number): number {
  const perBedTotal = AVG_BED_AREA_SQM + PATH_OVERHEAD_SQM;
  return Math.floor(usableSqm / perBedTotal);
}

/**
 * Calculate weekly vegetable requirement in kg for the household.
 */
export function calcWeeklyVegNeed(familiesCount: number): number {
  return Math.round(familiesCount * MEMBERS_PER_FAMILY * WEEKLY_VEG_PER_PERSON_KG * 10) / 10;
}

/**
 * Sum land_cents across all per-plot LocationProfiles.
 * Replaces the single user-level land_cents in FarmConfig.
 */
export function calcCapacityFromProfiles(profiles: Record<string, LocationProfile>): number {
  return Object.values(profiles).reduce((sum, p) => sum + (p.land_cents ?? 0), 0);
}

/**
 * Calculate percentage of beds belonging to a food category.
 */
export function calcCategoryPct(beds: Bed[], category: string): number {
  if (beds.length === 0) return 0;
  const targetTypes = CATEGORY_BED_MAP[category] ?? [];
  const count = beds.filter((b) => targetTypes.includes(b.type)).length;
  return Math.round((count / beds.length) * 100);
}

/**
 * Generate a 3-year phased planting plan based on farm config.
 * Returns year-by-year recommended bed additions.
 */
export interface YearPlan {
  year: number;
  beds_to_add: { type: BedType; count: number }[];
  focus: string;
}

export function getPhase3YearPlan(config: FarmConfig, totalCents?: number): YearPlan[] {
  const usable = calcUsableSqm(totalCents ?? config.land_cents ?? 0);
  const maxBeds = calcMaxBeds(usable);

  // Year 1: Foundation — leafy + root_legume (quick harvest)
  const y1Leafy = Math.max(1, Math.round(maxBeds * 0.3));
  const y1Root = Math.max(1, Math.round(maxBeds * 0.2));

  // Year 2: Diversity — fruiting + spice + climber
  const y2Fruit = Math.max(1, Math.round(maxBeds * 0.2));
  const y2Spice = Math.max(1, Math.round(maxBeds * 0.1));
  const y2Climber = Math.max(1, Math.round(maxBeds * 0.1));

  // Year 3: Specialization based on goals
  const y3Beds: { type: BedType; count: number }[] = [];
  const remaining = Math.max(0, maxBeds - y1Leafy - y1Root - y2Fruit - y2Spice - y2Climber);

  if (config.goals.includes('medicinal')) {
    y3Beds.push({ type: 'medicinal_guild', count: Math.max(1, Math.round(remaining * 0.4)) });
  }
  if (config.goals.includes('self_sufficiency')) {
    y3Beds.push({ type: 'three_sisters', count: Math.max(1, Math.round(remaining * 0.3)) });
  }
  if (y3Beds.length === 0) {
    y3Beds.push({ type: 'fruiting', count: Math.max(1, remaining) });
  }

  return [
    {
      year: 1,
      beds_to_add: [
        { type: 'leafy', count: y1Leafy },
        { type: 'root_legume', count: y1Root },
      ],
      focus: 'Quick harvests — leafy greens and legumes for nitrogen fixing',
    },
    {
      year: 2,
      beds_to_add: [
        { type: 'fruiting', count: y2Fruit },
        { type: 'spice', count: y2Spice },
        { type: 'climber_trellis', count: y2Climber },
      ],
      focus: 'Diversify — fruiting crops, spices, and climbers on trellis',
    },
    {
      year: 3,
      beds_to_add: y3Beds,
      focus: 'Specialize — based on your goals',
    },
  ];
}

// ─── Firestore CRUD ──────────────────────────────────────────────────────────

const DEFAULT_FARM_CONFIG: FarmConfig = {
  families_count: 1,
  goals: ['self_sufficiency'],
};

export async function getFarmConfig(): Promise<FarmConfig> {
  // 1. In-memory cache
  const cached = getCached<FarmConfig>(CACHE_KEY_FARM_CONFIG);
  if (cached) return cached;

  // 2. AsyncStorage
  const stored = await getData<FarmConfig>(KEYS.FARM_CONFIG);
  if (stored.length > 0 && stored[0]) {
    setCached(CACHE_KEY_FARM_CONFIG, stored[0]);
    return stored[0];
  }

  // 3. Firestore
  const user = auth.currentUser;
  if (!user) return DEFAULT_FARM_CONFIG;

  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    if (snapshot.exists()) {
      const data = snapshot.data() as Record<string, unknown>;
      const remote = data[FARM_CONFIG_FIELD] as FarmConfig | undefined;
      if (remote) {
        setCached(CACHE_KEY_FARM_CONFIG, remote);
        await setData(KEYS.FARM_CONFIG, [remote]);
        return remote;
      }
    }
  } catch (error) {
    logError('network', 'Failed to fetch farm config', error as Error);
  }

  return DEFAULT_FARM_CONFIG;
}

export async function saveFarmConfig(config: FarmConfig): Promise<FarmConfig> {
  const withTimestamp: FarmConfig = { ...config, updated_at: new Date().toISOString() };

  // Update local stores
  setCached(CACHE_KEY_FARM_CONFIG, withTimestamp);
  await setData(KEYS.FARM_CONFIG, [withTimestamp]);
  invalidate(CACHE_KEY_FARM_CONFIG);

  // Write to Firestore
  const user = auth.currentUser;
  if (!user) return withTimestamp;

  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [FARM_CONFIG_FIELD]: withTimestamp, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false }
    );
  } catch (error) {
    logError('network', 'Failed to save farm config', error as Error);
  }

  return withTimestamp;
}
