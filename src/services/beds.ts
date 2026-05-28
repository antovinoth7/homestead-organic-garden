import {
  Bed,
  BedType,
  CropFamily,
  RotationStatus,
  HarvestGapWarning,
  PestHistoryItem,
  GreenManureRecommendation,
} from '@/types/database.types';
import { db, auth, refreshAuthToken } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getData, setData, KEYS } from '@/lib/storage';
import {
  withTimeoutAndRetry,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FIRESTORE_READ_TIMEOUT_MS,
} from '@/utils/firestoreTimeout';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { convertTimestamp } from '@/utils/dateHelpers';
import { getCached, invalidate, dedup, CACHE_KEYS } from '@/lib/dataCache';
import {
  getBedSizeRecommendation,
  getGreenManureForMonth,
  getTransitionInputs as getTransitionInputsConfig,
  validateCompanionPair as validateCompanionPairConfig,
  checkRotationRules,
} from '@/config/beds';
import { getPlantsByBed, updatePlant } from '@/services/plants';
import type { BedSizeConditions, BedSizeResult, CompanionValidation } from '@/config/beds';

const BEDS_COLLECTION = 'beds';

// ─── Firestore ↔ App normalisation ───────────────────────────────────────────

function normalizeBed(id: string, data: Record<string, unknown>): Bed {
  return {
    id,
    user_id: data.user_id as string,
    name: data.name as string,
    type: (data.type as BedType) ?? 'leafy',
    dimensions: (data.dimensions as Bed['dimensions']) ?? {
      width_m: 1.2,
      length_m: 3,
      area_sqm: 3.6,
    },
    sunlight: (data.sunlight as Bed['sunlight']) ?? 'full_sun',
    soil_type: (data.soil_type as Bed['soil_type']) ?? 'garden_soil',
    slope: (data.slope as Bed['slope']) ?? 'flat',
    wind: (data.wind as Bed['wind']) ?? 'moderate',
    prev_land_use: (data.prev_land_use as string) ?? null,
    prev_crop_family: (data.prev_crop_family as CropFamily) ?? null,
    prev_crop_season: (data.prev_crop_season as string) ?? null,
    pest_history: (data.pest_history as PestHistoryItem[]) ?? [],
    water_source: (data.water_source as Bed['water_source']) ?? null,
    irrigation_method: (data.irrigation_method as Bed['irrigation_method']) ?? null,
    parent_location: (data.parent_location as string) ?? null,
    child_location: (data.child_location as string) ?? null,
    is_raised_bed: (data.is_raised_bed as boolean) ?? false,
    is_permanent: (data.is_permanent as boolean) ?? false,
    is_resting: (data.is_resting as boolean) ?? false,
    resting_until: (data.resting_until as string) ?? null,
    last_water_date: (data.last_water_date as string) ?? null,
    last_jeevamrutha_date: (data.last_jeevamrutha_date as string) ?? null,
    last_weeding_date: (data.last_weeding_date as string) ?? null,
    notes: (data.notes as string) ?? null,
    is_deleted: (data.is_deleted as boolean) ?? false,
    created_at: convertTimestamp(data.created_at as Timestamp | string) ?? new Date().toISOString(),
    updated_at: convertTimestamp(data.updated_at as Timestamp | string) ?? new Date().toISOString(),
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getBeds(): Promise<Bed[]> {
  const cached = getCached<Bed[]>(CACHE_KEYS.BEDS);
  if (cached) return cached;

  return dedup(CACHE_KEYS.BEDS, async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    await refreshAuthToken();

    try {
      const q = query(
        collection(db, BEDS_COLLECTION),
        where('user_id', '==', user.uid),
        where('is_deleted', '==', false)
      );
      const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
        timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      });

      const beds = snapshot.docs.map((d) =>
        normalizeBed(d.id, d.data() as Record<string, unknown>)
      );
      await setData(KEYS.BEDS, beds);
      return beds;
    } catch (error) {
      logger.warn('getBeds: Firestore failed, using cache', error as Error);
      logError('network', 'getBeds failed', error as Error, { userId: user.uid });
      return getData<Bed>(KEYS.BEDS);
    }
  });
}

export async function getBed(id: string): Promise<Bed | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await refreshAuthToken();

  try {
    const snap = await withTimeoutAndRetry(() => getDoc(doc(db, BEDS_COLLECTION, id)), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    if (!snap.exists()) return null;
    return normalizeBed(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    logger.warn('getBed: Firestore failed', error as Error);
    const cached = await getData<Bed>(KEYS.BEDS);
    return cached.find((b) => b.id === id) ?? null;
  }
}

export async function addBed(
  data: Omit<Bed, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Bed> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await refreshAuthToken();

  const now = new Date().toISOString();
  const payload = {
    ...data,
    user_id: user.uid,
    is_deleted: false,
    created_at: now,
    updated_at: now,
  };

  const docRef = await withTimeoutAndRetry(() => addDoc(collection(db, BEDS_COLLECTION), payload), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  invalidate(CACHE_KEYS.BEDS);
  const newBed: Bed = { id: docRef.id, ...payload };
  return newBed;
}

export async function updateBed(
  id: string,
  updates: Partial<Omit<Bed, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await refreshAuthToken();

  const payload = { ...updates, updated_at: new Date().toISOString() };

  await withTimeoutAndRetry(() => updateDoc(doc(db, BEDS_COLLECTION, id), payload), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  invalidate(CACHE_KEYS.BEDS);
}

export async function deleteBed(id: string): Promise<void> {
  await updateBed(id, { is_deleted: true });
  const plants = await getPlantsByBed(id);
  await Promise.all(plants.map((p) => updatePlant(p.id, { bed_id: null })));
}

export async function markBedAsResting(id: string, durationDays: number = 45): Promise<void> {
  const restingUntil = new Date();
  restingUntil.setDate(restingUntil.getDate() + durationDays);
  await updateBed(id, { is_resting: true, resting_until: restingUntil.toISOString() });
}

export async function endBedRest(id: string): Promise<void> {
  await updateBed(id, { is_resting: false, resting_until: null });
}

export async function logBedInput(
  id: string,
  inputType: 'water' | 'jeevamrutha' | 'weeding'
): Promise<void> {
  const now = new Date().toISOString();
  const fieldMap = {
    water: 'last_water_date',
    jeevamrutha: 'last_jeevamrutha_date',
    weeding: 'last_weeding_date',
  } as const;
  await updateBed(id, { [fieldMap[inputType]]: now });
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function getBedSizeRecommendationForBed(conditions: BedSizeConditions): BedSizeResult {
  return getBedSizeRecommendation(conditions);
}

export function getGreenManureForSeason(month: number): GreenManureRecommendation {
  return getGreenManureForMonth(month);
}

export function getTransitionInputs(
  from: CropFamily,
  to: CropFamily,
  pestHistory: PestHistoryItem[]
): string[] {
  return getTransitionInputsConfig(from, to, pestHistory);
}

export function validateCompanionPair(a: string, b: string): CompanionValidation {
  return validateCompanionPairConfig(a, b);
}

export function getHarvestGapWarnings(beds: Bed[]): HarvestGapWarning[] {
  // Detect two beds of the same type with overlapping estimated clearing windows (< 21 days apart)
  const warnings: HarvestGapWarning[] = [];
  const bedsByType: Partial<Record<BedType, Bed[]>> = {};

  for (const bed of beds) {
    if (!bedsByType[bed.type]) bedsByType[bed.type] = [];
    bedsByType[bed.type]!.push(bed);
  }

  for (const [type, typeBeds] of Object.entries(bedsByType) as [BedType, Bed[]][]) {
    if (typeBeds.length < 2) continue;
    // Flag all beds of same type as potential gap risk
    for (const bed of typeBeds) {
      warnings.push({
        bed_id: bed.id,
        category: type,
        gap_start: 'current',
        gap_end: 'next_season',
      });
    }
  }

  return warnings;
}

export function getCrossBedStatus(
  beds: Bed[],
  plantsByBedId: Record<string, import('@/types/database.types').Plant[]>
): RotationStatus[] {
  return beds.map((bed) => {
    const plants = plantsByBedId[bed.id] ?? [];
    const legumes = plants.filter((p) => p.crop_family === 'legume').length;
    const legume_pct = plants.length > 0 ? Math.round((legumes / plants.length) * 100) : 0;

    const checklist = checkRotationRules({ bed, plants, allBeds: beds });
    const harvestGaps = getHarvestGapWarnings(beds).filter((w) => w.bed_id === bed.id);

    const month = new Date().getMonth() + 1;
    const greenManure = getGreenManureForMonth(month);

    return {
      bed_id: bed.id,
      has_solanaceae_violation: bed.prev_crop_family === 'solanaceae',
      legume_coverage_pct: legume_pct,
      harvest_gap_warnings: harvestGaps,
      coordinator_checklist: checklist,
      green_manure_recommendation: greenManure,
    } satisfies RotationStatus;
  });
}
