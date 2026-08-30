import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, refreshAuthToken } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';
import { logger } from '@/utils/logger';
import { logError } from '@/utils/errorLogging';
import { Migration } from './types';
import { backfillDistrict } from './001_backfill_district';
import { seedCatalogEnrichment } from './002_seed_catalog_enrichment';
import { consolidatePlantProfiles } from './003_consolidate_plant_profiles';
import { backfillLifecycleType } from './004_backfill_lifecycle_type';
import { repairFarmConfig } from './005_repair_farm_config';
import { repairZoneAssignment } from './006_repair_zone_assignment';
import { mergeDuplicatePlantNames } from './007_merge_duplicate_plant_names';

const SETTINGS_COLLECTION = 'user_settings';

export const LATEST_SCHEMA_VERSION = 7;

const migrations: Migration[] = [
  { version: 1, name: 'backfill_district', run: backfillDistrict },
  { version: 2, name: 'seed_catalog_enrichment', run: seedCatalogEnrichment },
  { version: 3, name: 'consolidate_plant_profiles', run: consolidatePlantProfiles },
  { version: 4, name: 'backfill_lifecycle_type', run: backfillLifecycleType },
  { version: 5, name: 'repair_farm_config', run: repairFarmConfig },
  { version: 6, name: 'repair_zone_assignment', run: repairZoneAssignment },
  { version: 7, name: 'merge_duplicate_plant_names', run: mergeDuplicatePlantNames },
];

export async function getSchemaVersion(userId: string): Promise<number> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!snapshot.exists()) return 0;

  const data = snapshot.data();
  return typeof data.schema_version === 'number' ? data.schema_version : 0;
}

async function setSchemaVersion(userId: string, version: number): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  await withTimeoutAndRetry(() => setDoc(docRef, { schema_version: version }, { merge: true }), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
}

/**
 * Local cache of the remote schema_version, per user. Written only after the
 * remote version has been confirmed/migrated, so a cached value >= LATEST
 * means the launch-time Firestore read can be skipped entirely.
 */
const schemaVersionCacheKey = (userId: string): string => `@garden_schema_version_${userId}`;

async function getCachedSchemaVersion(userId: string): Promise<number | null> {
  const raw = await safeGetItem(schemaVersionCacheKey(userId));
  if (raw === null) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

async function setCachedSchemaVersion(userId: string, version: number): Promise<void> {
  await safeSetItem(schemaVersionCacheKey(userId), String(version));
}

export async function runPendingMigrations(userId: string): Promise<void> {
  // Skip the auth refresh + Firestore read when this install already
  // confirmed the account is at the latest schema version.
  const cachedVersion = await getCachedSchemaVersion(userId);
  if (cachedVersion !== null && cachedVersion >= LATEST_SCHEMA_VERSION) return;

  await refreshAuthToken();

  let currentVersion: number;
  try {
    currentVersion = await getSchemaVersion(userId);
  } catch (error) {
    logger.warn('Failed to read schema_version, skipping migrations', error as Error);
    return;
  }

  if (currentVersion >= LATEST_SCHEMA_VERSION) {
    await setCachedSchemaVersion(userId, currentVersion);
    return;
  }

  const pending = migrations.filter((m) => m.version > currentVersion);
  if (pending.length === 0) return;

  logger.info(
    `Running ${pending.length} migration(s) from v${currentVersion} to v${LATEST_SCHEMA_VERSION}`
  );

  for (const migration of pending) {
    try {
      logger.info(`Migration ${migration.version}: ${migration.name}`);
      await migration.run(userId);
      await setSchemaVersion(userId, migration.version);
      await setCachedSchemaVersion(userId, migration.version);
      logger.info(`Migration ${migration.version} complete`);
    } catch (error) {
      logError(
        'storage',
        `Migration ${migration.version} (${migration.name}) failed`,
        error as Error,
        { userId, version: migration.version }
      );
      break;
    }
  }
}
