import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';
import { DEFAULT_PLANT_PROFILES } from '@/services/plantProfiles';
import { getStaticPruningDefaults } from '@/utils/plantCareDefaults';
import { DEFAULT_PROFILES_BY_TYPE } from '@/utils/plantCareDefaults/typeDefaults';
import { ADOPTED_CATALOG_ROWS_V18, planAdoptedRows } from './adoptedCatalogRowsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/**
 * What the add-entry form saved for a name with no care profile of its own: the
 * type defaults, and the type's generic pruning set in its stored shape. Neither
 * is keyed by name, which is the point — this is what the form showed before
 * the name had a row.
 */
function seededForType(type: PlantType): Partial<PlantProfile> {
  const pruning = getStaticPruningDefaults(type);
  return {
    ...DEFAULT_PROFILES_BY_TYPE[type],
    pruningTips: pruning.tips.length > 0 ? pruning.tips : undefined,
    shapePruningTip: pruning.shapePruning?.tip,
    shapePruningMonths: pruning.shapePruning?.months,
    flowerPruningTip: pruning.flowerPruning?.tip,
    flowerPruningMonths: pruning.flowerPruning?.months,
  };
}

function replan(profiles: PlantProfiles): PlantProfiles | null {
  return planAdoptedRows(
    profiles,
    ADOPTED_CATALOG_ROWS_V18,
    (type, name) => DEFAULT_PLANT_PROFILES[type]?.[name],
    seededForType
  );
}

/**
 * Lychee, Citron, Batoko Plum and Broccoli became bundled rows after users had
 * added them as their own entries. This lets those entries show the rows' Tamil
 * names, descriptions and care figures, keeping anything the user changed.
 *
 * Garden plants need nothing: their name and type already match the new rows.
 * Idempotent: a second run finds nothing left to fill or drop and writes nothing.
 */
export async function adoptNewCatalogRows(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  const next = remote ? replan(remote) : null;

  if (next) {
    // Not a merge write: `merge: true` deep-merges nested maps, so a dropped
    // care key would survive in Firestore. The field is replaced whole.
    await withTimeoutAndRetry(
      () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: next }, { mergeFields: [PLANT_PROFILES_FIELD] }),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );
  }

  // Keep the local copy in step, or the next read re-caches the old entry from
  // AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = replan(stored[0]);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  if (next) logger.info('Migration 018: stored entries adopted onto the new catalog rows');
}
