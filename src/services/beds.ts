import {
  Bed,
  CropFamily,
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
} from 'firebase/firestore';
import { getData, setData, KEYS } from '@/lib/storage';
import {
  withTimeoutAndRetry,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FIRESTORE_READ_TIMEOUT_MS,
} from '@/utils/firestoreTimeout';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { getCached, invalidate, dedup, CACHE_KEYS } from '@/lib/dataCache';
import {
  getBedSizeRecommendation,
  getGreenManureForMonth,
  getTransitionInputs as getTransitionInputsConfig,
  validateCompanionPair as validateCompanionPairConfig,
} from '@/config/beds';
import { getPlantsByBed, deletePlantsForBed } from '@/services/plants';
import type { BedSizeConditions, BedSizeResult, CompanionValidation } from '@/config/beds';
import { normalizeBed, getHarvestGapWarnings, getCrossBedStatus } from '@/services/bedLogic';

// Pure domain logic lives in `bedLogic.ts` (no Firestore/RN imports, unit-tested).
// Re-exported here so existing `@/services/beds` import sites keep working.
export { normalizeBed, getHarvestGapWarnings, getCrossBedStatus };

const BEDS_COLLECTION = 'beds';

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
  // Remove the bed's plants from the system too (soft-delete + task cascade),
  // batched in one shot so the cascade doesn't stall the UI thread.
  const plants = await getPlantsByBed(id);
  if (plants.length > 0) await deletePlantsForBed(plants);
}

export async function restoreBed(id: string): Promise<void> {
  // Un-delete a soft-deleted bed so it (and any restored plants) reappear.
  await updateBed(id, { is_deleted: false });
}

export async function getDeletedBeds(): Promise<Bed[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  await refreshAuthToken();

  try {
    const q = query(
      collection(db, BEDS_COLLECTION),
      where('user_id', '==', user.uid),
      where('is_deleted', '==', true)
    );
    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    return snapshot.docs.map((d) => normalizeBed(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.warn('getDeletedBeds: Firestore failed, using cache', error as Error);
    const cached = await getData<Bed>(KEYS.BEDS);
    return cached.filter((b) => b.is_deleted);
  }
}

export async function markBedAsResting(id: string, durationDays: number = 45): Promise<void> {
  const restingUntil = new Date();
  restingUntil.setDate(restingUntil.getDate() + durationDays);
  await updateBed(id, { is_resting: true, resting_until: restingUntil.toISOString() });
}

export async function endBedRest(id: string): Promise<void> {
  await updateBed(id, { is_resting: false, resting_until: null });
}

type BedInputType = 'water' | 'jeevamrutha' | 'weeding';

const INPUT_DATE_FIELD = {
  water: 'last_water_date',
  jeevamrutha: 'last_jeevamrutha_date',
  weeding: 'last_weeding_date',
} as const;

export async function logBedInput(id: string, inputType: BedInputType): Promise<void> {
  const now = new Date().toISOString();
  await updateBed(id, { [INPUT_DATE_FIELD[inputType]]: now });
}

/**
 * Restore a soil-input date to a previous value — used to undo a `logBedInput`.
 * Pass the date captured before logging (or null to clear it).
 */
export async function restoreBedInput(
  id: string,
  inputType: BedInputType,
  prevValue: string | null
): Promise<void> {
  await updateBed(id, { [INPUT_DATE_FIELD[inputType]]: prevValue });
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

