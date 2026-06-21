import {
  Plant,
  GrowthStage,
  GrowthStageHistoryEntry,
  PlantLifecycle,
  BedLayer,
} from '../types/database.types';
import { deriveInstanceLifecycle } from '../utils/plantHelpers';
import { getPlantCareProfile } from '../utils/plantCareDefaults';
import { db, auth, refreshAuthToken } from '../lib/firebase';
import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  saveImageLocallyWithFilename,
  resolveLocalImageUri,
  SavedImage,
} from '../lib/imageStorage';
import { getData, setData, KEYS } from '../lib/storage';
import {
  withTimeoutAndRetry,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FIRESTORE_READ_TIMEOUT_MS,
} from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';
import { logger } from '../utils/logger';
import { convertTimestamp } from '../utils/dateHelpers';
import { resolvePhotoFilename } from '../utils/photoFilename';
import { getCached, setCached, invalidate, dedup, CACHE_KEYS } from '../lib/dataCache';
import { LAYER_ORDER as BED_LAYER_ORDER } from '../config/beds/layerMeta';

const PLANTS_COLLECTION = 'plants';
const DEFAULT_PAGE_SIZE = 50;
const FETCH_ALL_PAGE_SIZE = 100;

/**
 * Get all plants with offline-first approach and pagination support
 * @param pageSize - Number of plants to fetch per page (default: 50)
 * @param lastDoc - Last document from previous page (for pagination)
 * First returns cached data, then fetches from Firestore if online
 */
export const getPlants = async (
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ plants: Plant[]; lastDoc?: QueryDocumentSnapshot; fetchedCount?: number }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Refresh token to prevent expiration issues (tokens expire after 1 hour)
  await refreshAuthToken();

  try {
    // Build query with pagination
    let q = query(
      collection(db, PLANTS_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, PLANTS_COLLECTION),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    // Wrap Firestore call with timeout
    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    // Batch image resolution for better performance
    const plantsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);
      return {
        id: doc.id,
        ...data,
        photo_filename: photoFilename ?? null,
        photoIdentifier: data.photo_filename ?? data.photo_url ?? null,
        plant_type: data.plant_type || 'vegetable',
        created_at: convertTimestamp(data.created_at),
        deleted_at: convertTimestamp(data.deleted_at),
        is_deleted: data.is_deleted ?? false,
      };
    });

    // Resolve all images in parallel
    const resolvedUrls = await Promise.all(
      plantsData.map(async (p) => {
        try {
          return await resolveLocalImageUri(p.photoIdentifier);
        } catch (error) {
          logger.warn('Failed to resolve plant image', error as Error);
          return null;
        }
      })
    );

    const plants = plantsData.map((plant, index) => {
      const { photoIdentifier: _photoIdentifier, ...plantData } = plant;
      return {
        ...plantData,
        photo_url: resolvedUrls[index] ?? null,
      } as Plant;
    });
    const activePlants = plants.filter((plant) => !plant.is_deleted);

    // Cache the results locally (only first page to avoid memory issues)
    if (!lastDoc) {
      await setData(KEYS.PLANTS, activePlants);
    }

    return {
      plants: activePlants,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      // Raw doc count (before the is_deleted filter) so callers can paginate on
      // pages, not on the filtered active count — a full page of raw docs may
      // contain soft-deleted docs and yield fewer active plants.
      fetchedCount: snapshot.docs.length,
    };
  } catch (error) {
    logger.warn('Failed to fetch plants, using cached data', error as Error);
    logError('network', 'Failed to fetch plants from Firestore', error as Error, {
      userId: user.uid,
    });
    // Fall back to cached data if offline
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    // Batch resolve cached images for performance
    const photoIdentifiers = cachedPlants.map((p) => p.photo_filename ?? p.photo_url ?? null);
    const resolvedUrls = await Promise.all(
      photoIdentifiers.map(async (id) => {
        try {
          return await resolveLocalImageUri(id);
        } catch (error) {
          logger.warn('Failed to resolve cached plant image', error as Error);
          return null;
        }
      })
    );

    const resolvedCached = cachedPlants.map((plant, index) => ({
      ...plant,
      photo_filename: plant.photo_filename ?? resolvePhotoFilename(null, plant.photo_url) ?? null,
      photo_url: resolvedUrls[index] ?? null,
    }));
    return { plants: resolvedCached.filter((plant) => !plant.is_deleted) };
  }
};

/** Synchronous cache read — returns the warm plant list or null if stale/absent. */
export const getCachedPlants = (): Plant[] | null => getCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);

/**
 * Offline-first warm read for an instant first paint: the fresh in-memory cache
 * if present, otherwise the AsyncStorage copy. Unlike `getAllPlants` this never
 * touches the network or resolves images — callers that render thumbnails must
 * still use `getAllPlants`. The dashboard only needs ids/names/health, so this
 * keeps image resolution off the cold-start critical path.
 */
export const getStoredPlants = async (): Promise<Plant[]> => {
  const warm = getCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);
  if (warm) return warm;
  return getData<Plant>(KEYS.PLANTS);
};

export const getAllPlants = async (pageSize: number = FETCH_ALL_PAGE_SIZE): Promise<Plant[]> => {
  // Return fresh in-memory data if available (< 30s old)
  const cached = getCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);
  if (cached) return cached;

  return dedup(CACHE_KEYS.ALL_PLANTS, async () => {
    const allPlants: Plant[] = [];
    let lastDoc: QueryDocumentSnapshot | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await getPlants(pageSize, lastDoc);
        allPlants.push(...(response.plants ?? []));

        // Decide on the RAW page size, not the filtered active count: a page full
        // of docs can still yield <pageSize active plants once soft-deleted docs
        // exist, which would otherwise stop paging early and undercount.
        if (
          response.fetchedCount === undefined ||
          response.fetchedCount < pageSize ||
          !response.lastDoc
        ) {
          hasMore = false;
          continue;
        }

        lastDoc = response.lastDoc;
      } catch (error) {
        logger.warn('getAllPlants: page fetch failed, returning partial results', error as Error);
        break;
      }
    }

    return allPlants;
  });
};

export const getPlant = async (id: string): Promise<Plant | null> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const docRef = doc(db, PLANTS_COLLECTION, id);

  const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!docSnap.exists()) return null;

  const data = docSnap.data();

  // Security: Verify the plant belongs to the current user
  if (data.user_id !== user.uid) {
    logger.warn('Attempted to access plant belonging to another user');
    return null;
  }

  if (data.is_deleted) return null;

  const photoIdentifier = data.photo_filename ?? data.photo_url ?? null;
  const resolvedPhotoUrl = await resolveLocalImageUri(photoIdentifier);
  const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);

  return {
    id: docSnap.id,
    ...data,
    photo_filename: photoFilename ?? null,
    photo_url: resolvedPhotoUrl ?? null,
    created_at: convertTimestamp(data.created_at),
    deleted_at: convertTimestamp(data.deleted_at),
    is_deleted: data.is_deleted ?? false,
  } as Plant;
};

export const getArchivedPlants = async (): Promise<Plant[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const q = query(
      collection(db, PLANTS_COLLECTION),
      where('user_id', '==', user.uid),
      where('is_deleted', '==', true)
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });

    const plants = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plant_type: data.plant_type || 'vegetable',
        created_at: convertTimestamp(data.created_at),
        deleted_at: convertTimestamp(data.deleted_at),
        is_deleted: data.is_deleted ?? false,
      };
    }) as Plant[];

    plants.sort((a, b) => {
      const aDate = new Date(a.deleted_at || a.created_at).getTime();
      const bDate = new Date(b.deleted_at || b.created_at).getTime();
      return bDate - aDate;
    });

    return plants;
  } catch (error) {
    logger.warn('Failed to fetch archived plants, using cached data', error as Error);
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    return cachedPlants.filter((plant) => plant.is_deleted);
  }
};

export const plantExists = async (id: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const q = query(
    collection(db, PLANTS_COLLECTION),
    where('user_id', '==', user.uid),
    where(documentId(), '==', id)
  );

  const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  return !snapshot.empty;
};

export const createPlant = async (
  plant: Omit<Plant, 'id' | 'user_id' | 'created_at'>
): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // CRITICAL: photo_filename should already be set for local images
  // Only the filename (not the image data) is stored in Firestore
  const { photo_url: _photoUrl, ...rest } = plant;
  const photoFilename = resolvePhotoFilename(plant.photo_filename, plant.photo_url);

  // Derive lifecycle_type from catalog profile if caller didn't set it explicitly
  let lifecycle_type: PlantLifecycle | null = rest.lifecycle_type ?? null;
  if (!lifecycle_type) {
    const profile = getPlantCareProfile(rest.plant_variety ?? '', rest.plant_type);
    lifecycle_type = deriveInstanceLifecycle(profile?.lifecycle, rest.plant_type);
  }

  const newPlant = {
    ...rest,
    lifecycle_type,
    photo_filename: photoFilename ?? null,
    user_id: user.uid,
    created_at: Timestamp.now(),
  };

  const docRef = await withTimeoutAndRetry(
    () => addDoc(collection(db, PLANTS_COLLECTION), newPlant),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );

  const resolvedPhotoUrl = await resolveLocalImageUri(photoFilename ?? null);
  const result = {
    id: docRef.id,
    ...newPlant,
    photo_url: resolvedPhotoUrl ?? null,
    created_at: convertTimestamp(newPlant.created_at),
  } as Plant;

  // Invalidate in-memory cache so next getAllPlants re-fetches
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  await setData(KEYS.PLANTS, [...cachedPlants, result]);

  return result;
};

/**
 * Atomically create multiple plants in a single Firestore writeBatch.
 *
 * Used by the bed wizard to persist all plants for a bed in one shot —
 * cuts a typical leafy bed from ~30 writes to 3-6 row-record writes,
 * which matters on free-tier quota and on flaky mobile networks.
 *
 * Resolves photo URIs and derives lifecycle per plant just like
 * createPlant; commits as one atomic batch; invalidates cache and
 * updates AsyncStorage once at the end.
 */
export const createPlantBatch = async (
  plants: Omit<Plant, 'id' | 'user_id' | 'created_at'>[]
): Promise<Plant[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  if (plants.length === 0) return [];

  const batch = writeBatch(db);
  const createdAt = Timestamp.now();

  const prepared = plants.map((plant) => {
    const { photo_url: _photoUrl, ...rest } = plant;
    const photoFilename = resolvePhotoFilename(plant.photo_filename, plant.photo_url);

    let lifecycle_type: PlantLifecycle | null = rest.lifecycle_type ?? null;
    if (!lifecycle_type) {
      const profile = getPlantCareProfile(rest.plant_variety ?? '', rest.plant_type);
      lifecycle_type = deriveInstanceLifecycle(profile?.lifecycle, rest.plant_type);
    }

    const docRef = doc(collection(db, PLANTS_COLLECTION));
    const newPlant = {
      ...rest,
      lifecycle_type,
      photo_filename: photoFilename ?? null,
      user_id: user.uid,
      created_at: createdAt,
    };
    batch.set(docRef, newPlant);
    return { docRef, newPlant, photoFilename };
  });

  await withTimeoutAndRetry(() => batch.commit(), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  const results = await Promise.all(
    prepared.map(async ({ docRef, newPlant, photoFilename }) => {
      const resolvedPhotoUrl = await resolveLocalImageUri(photoFilename ?? null);
      return {
        id: docRef.id,
        ...newPlant,
        photo_url: resolvedPhotoUrl ?? null,
        created_at: convertTimestamp(newPlant.created_at),
      } as Plant;
    })
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  await setData(KEYS.PLANTS, [...cachedPlants, ...results]);

  return results;
};

export const updatePlant = async (id: string, updates: Partial<Plant>): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  // CRITICAL: photo_filename should already be set for local images
  // Only the filename (not the image data) is stored in Firestore
  const firestoreUpdates: Partial<Plant> = { ...updates };
  if ('photo_url' in firestoreUpdates) {
    delete (firestoreUpdates as Partial<Plant>).photo_url;
  }
  await withTimeoutAndRetry(() => updateDoc(docRef, firestoreUpdates as Record<string, unknown>), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  const updated = await getPlant(id);
  if (!updated) throw new Error('Plant not found');

  // Invalidate in-memory cache so next getAllPlants re-fetches
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((p) => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = updated;
    await setData(KEYS.PLANTS, cachedPlants);
  }

  return updated;
};

export const updatePlantLocation = async (id: string, location: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  await withTimeoutAndRetry(() => updateDoc(docRef, { location }), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((plant) => plant.id === id);
  if (index !== -1) {
    cachedPlants[index] = { ...cachedPlants[index]!, location };
    await setData(KEYS.PLANTS, cachedPlants);
  }
};

export const updatePlantVariety = async (id: string, plantVariety: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  await withTimeoutAndRetry(() => updateDoc(docRef, { plant_variety: plantVariety }), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((plant) => plant.id === id);
  if (index !== -1) {
    cachedPlants[index] = {
      ...cachedPlants[index]!,
      plant_variety: plantVariety,
    };
    await setData(KEYS.PLANTS, cachedPlants);
  }
};

export const deletePlant = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before deleting
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to delete this plant');
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: true,
        deleted_at: Timestamp.now(),
      }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  // Invalidate in-memory cache
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const filtered = cachedPlants.filter((p) => p.id !== id);
  await setData(KEYS.PLANTS, filtered);

  // Cascade: delete orphaned tasks and logs for this plant
  try {
    const { deleteTasksForPlantIds } = await import('./tasks');
    await deleteTasksForPlantIds([id]);
  } catch (error) {
    logger.warn('Failed to cascade-delete tasks for plant', error as Error);
  }
};

/**
 * Soft-delete every plant in a bed in one shot — used when a bed is deleted.
 *
 * Collapses what would be N×(ownership getDoc + updateDoc + AsyncStorage rewrite +
 * task cascade) into a single writeBatch, one cache invalidate, one AsyncStorage
 * rewrite, and one task cascade — keeping the JS thread free so the UI stays
 * responsive. Callers pass plants already fetched for the user's bed, so per-plant
 * ownership re-verification is skipped.
 */
export const deletePlantsForBed = async (plants: Plant[]): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  if (plants.length === 0) return;

  await refreshAuthToken();

  const ids = plants.map((p) => p.id);
  const deletedAt = Timestamp.now();

  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(db, PLANTS_COLLECTION, id), {
      is_deleted: true,
      deleted_at: deletedAt,
    });
  }
  await withTimeoutAndRetry(() => batch.commit(), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  // Surgical in-memory cache update: filter deleted ids out of the warm cache
  // rather than invalidating it entirely, so the Plants tab can still serve
  // from cache without triggering a full Firestore re-fetch + image resolution.
  const idSet = new Set(ids);
  const warmPlants = getCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);
  if (warmPlants !== null) {
    setCached(CACHE_KEYS.ALL_PLANTS, warmPlants.filter((p) => !idSet.has(p.id)));
  }

  // Update local AsyncStorage cache once.
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  await setData(
    KEYS.PLANTS,
    cachedPlants.filter((p) => !idSet.has(p.id))
  );

  // Cascade: delete orphaned tasks and logs for all plants at once.
  try {
    const { deleteTasksForPlantIds } = await import('./tasks');
    await deleteTasksForPlantIds(ids);
  } catch (error) {
    logger.warn('Failed to cascade-delete tasks for bed plants', error as Error);
  }
};

export const restorePlant = async (id: string): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before restoring
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to restore this plant');
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: false,
        deleted_at: null,
      }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!docSnap.exists()) throw new Error('Plant not found');

  const data = docSnap.data();
  const photoIdentifier = data.photo_filename ?? data.photo_url ?? null;
  const resolvedPhotoUrl = await resolveLocalImageUri(photoIdentifier);
  const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);
  const restored = {
    id: docSnap.id,
    ...data,
    photo_filename: photoFilename ?? null,
    photo_url: resolvedPhotoUrl ?? null,
    plant_type: data.plant_type || 'vegetable',
    created_at: convertTimestamp(data.created_at),
    deleted_at: convertTimestamp(data.deleted_at),
    is_deleted: data.is_deleted ?? false,
  } as Plant;

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((p) => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = restored;
  } else {
    cachedPlants.push(restored);
  }
  await setData(KEYS.PLANTS, cachedPlants);

  return restored;
};

/**
 * Save an image to local storage and return local URI + filename
 * This should be called BEFORE creating/updating a plant
 * @param sourceUri - Source image URI (from picker or camera)
 * @returns Local file URI and filename for persistence
 */
export const savePlantImage = async (sourceUri: string): Promise<SavedImage> => {
  return saveImageLocallyWithFilename(sourceUri, 'plant');
};

/**
 * Pin a manual growth stage override on a plant.
 * Records the event in growth_stage_history.
 */
export const pinGrowthStage = async (plantId: string, stage: GrowthStage): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const plantRef = doc(db, PLANTS_COLLECTION, plantId);
  const snap = await withTimeoutAndRetry(() => getDoc(plantRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snap.exists()) throw new Error('Plant not found');

  const existing = snap.data() as Plant;
  const history: GrowthStageHistoryEntry[] = [
    ...(existing.growth_stage_history ?? []),
    { stage, pinnedAt: new Date().toISOString() },
  ];

  await withTimeoutAndRetry(
    () =>
      updateDoc(plantRef, {
        growth_stage_pinned: stage,
        growth_stage_history: history,
      } as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);
};

/**
 * Remove a pinned growth stage override — reverts to computed stage.
 * Records the unpin timestamp on the last history entry.
 */
export const unpinGrowthStage = async (plantId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const plantRef = doc(db, PLANTS_COLLECTION, plantId);
  const snap = await withTimeoutAndRetry(() => getDoc(plantRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snap.exists()) throw new Error('Plant not found');

  const existing = snap.data() as Plant;
  const history = [...(existing.growth_stage_history ?? [])];
  // Mark the last pin entry as unpinned
  if (history.length > 0) {
    const lastEntry = history[history.length - 1]!;
    if (!lastEntry.unpinnedAt) {
      history[history.length - 1] = {
        ...lastEntry,
        unpinnedAt: new Date().toISOString(),
      };
    }
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(plantRef, {
        growth_stage_pinned: null,
        growth_stage_history: history,
      } as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);
};

const bedLayerRank = (l: BedLayer | null | undefined): number => {
  if (!l) return BED_LAYER_ORDER.length;
  const i = BED_LAYER_ORDER.indexOf(l);
  return i === -1 ? BED_LAYER_ORDER.length : i;
};

/**
 * Return all active plants assigned to a given bed, ordered by layer (canopy→ground_cover)
 * then by user-controlled `sort_order` within each layer. Filters from in-memory cache.
 */
export const getPlantsByBed = async (bedId: string): Promise<Plant[]> => {
  const all = await getAllPlants();
  const filtered = all.filter((p) => p.bed_id === bedId && !p.is_deleted);
  return filtered.sort((a, b) => {
    const layerDiff = bedLayerRank(a.bed_layer) - bedLayerRank(b.bed_layer);
    if (layerDiff !== 0) return layerDiff;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
};

/**
 * Archive a Type 1 (annual) plant after final harvest.
 * - Sets cleared_date + archived_at on the plant (record preserved for rotation history)
 * - Disables all task templates for this plant
 * - Updates bed's prev_crop_family / prev_crop_season and starts a rest period
 *
 * Does NOT soft-delete the plant — it remains queryable for rotation history.
 */
export const archivePlant = async (plantId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const plantRef = doc(db, PLANTS_COLLECTION, plantId);
  const snap = await withTimeoutAndRetry(() => getDoc(plantRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snap.exists() || snap.data().user_id !== user.uid) {
    throw new Error('Not authorized to archive this plant');
  }

  const plant = { id: plantId, ...snap.data() } as Plant;
  const now = new Date();
  const clearedDate = now.toISOString().split('T')[0]!;

  await withTimeoutAndRetry(
    () =>
      updateDoc(plantRef, {
        cleared_date: clearedDate,
        archived_at: now.toISOString(),
      } as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Disable all care task templates for this plant
  try {
    const { disableTasksForPlant } = await import('./tasks');
    await disableTasksForPlant(plantId);
  } catch (error) {
    logger.warn('archivePlant: failed to disable tasks', error as Error);
  }

  // Update bed rotation history and start rest period
  if (plant.bed_id) {
    try {
      const { markBedAsResting, updateBed } = await import('./beds');
      const bedUpdates: Record<string, unknown> = {};
      if (plant.crop_family) bedUpdates.prev_crop_family = plant.crop_family;
      if (plant.harvest_season) bedUpdates.prev_crop_season = plant.harvest_season;
      if (Object.keys(bedUpdates).length > 0) {
        await updateBed(plant.bed_id, bedUpdates as Parameters<typeof updateBed>[1]);
      }
      // Default 30-day rest for annuals; adjustable per crop profile in future
      await markBedAsResting(plant.bed_id, 30);
    } catch (error) {
      logger.warn('archivePlant: failed to update bed', error as Error);
    }
  }

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((p) => p.id === plantId);
  if (index !== -1) {
    cachedPlants[index] = {
      ...cachedPlants[index]!,
      cleared_date: clearedDate,
      archived_at: now.toISOString(),
    };
    await setData(KEYS.PLANTS, cachedPlants);
  }
};
