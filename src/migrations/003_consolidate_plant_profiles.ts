import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { logger } from '@/utils/logger';
import { PlantCatalog, PlantCareProfiles, PlantProfiles } from '@/types/database.types';
import { PLANT_CATEGORIES } from '@/services/plantProfiles';

const SETTINGS_COLLECTION = 'user_settings';

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function consolidatePlantProfiles(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!snapshot.exists()) {
    logger.info('003_consolidate: no user_settings doc found, skipping');
    return;
  }

  const data = snapshot.data() as Record<string, unknown>;

  // Already migrated
  if (data.plantProfiles) {
    logger.info('003_consolidate: plantProfiles already present, skipping');
    return;
  }

  const catalog = data.plantCatalog as PlantCatalog | undefined;
  const careProfiles = data.plantCareProfiles as PlantCareProfiles | undefined;

  const unified: PlantProfiles = PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);

  // Build from catalog
  if (catalog?.categories) {
    for (const type of PLANT_CATEGORIES) {
      const cat = catalog.categories[type];
      if (!cat) continue;
      for (const name of cat.plants ?? []) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        unified[type][trimmed] = stripUndefined({
          plantType: type,
          name: trimmed,
          tamilName: cat.tamilNames?.[trimmed],
          description: cat.descriptions?.[trimmed],
          varieties: cat.varieties?.[trimmed] ?? [],
          varietyDetails: cat.varietyDetails?.[trimmed],
        });
      }
    }
  }

  // Merge care overrides
  if (careProfiles) {
    for (const type of PLANT_CATEGORIES) {
      const careCategory = (careProfiles as Record<string, unknown>)[type];
      if (!careCategory || typeof careCategory !== 'object') continue;
      for (const [rawName, override] of Object.entries(careCategory as Record<string, unknown>)) {
        if (!override || typeof override !== 'object') continue;
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
          ...(override as object),
          plantType: type,
          name: candidateName,
        } as typeof existing;
      }
    }
  }

  // Write new field without removing old ones (rollback safety)
  await withTimeoutAndRetry(
    () =>
      setDoc(docRef, { plantProfiles: unified, updated_at: serverTimestamp() }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  logger.info('003_consolidate: plantProfiles written to Firestore');
}
