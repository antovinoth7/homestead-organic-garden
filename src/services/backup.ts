/**
 * Backup Service
 *
 * Supports two flows:
 *  - Images-only export/import (transfer photos without touching data).
 *  - Complete backup: a single ZIP carrying all user data as JSON plus the
 *    referenced images, with a restore that rehydrates local storage and
 *    Firestore. Data already syncs to the cloud, so this is for device-portable
 *    archives the farmer owns (Drive/WhatsApp) and full account migration.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { Platform } from 'react-native';
import { getData, setData, KEYS } from '../lib/storage';
import { getArchivedPlants, getPlants } from './plants';
import { getJournalEntries } from './journal';
import { getBeds } from './beds';
import { getTaskTemplates, getTaskLogs } from './tasks';
import { getLocationConfig, saveLocationConfig } from './locations';
import { getPlantProfiles, savePlantProfiles } from './plantProfiles';
import { getFarmConfig, saveFarmConfig } from './farmCapacity';
import { Plant, JournalEntry, Bed, TaskTemplate, TaskLog } from '../types/database.types';
import { QueryDocumentSnapshot, writeBatch, doc, collection } from 'firebase/firestore';
import { db, auth, refreshAuthToken } from '../lib/firebase';
import { LATEST_SCHEMA_VERSION } from '../migrations';
import { invalidateAll } from '../lib/dataCache';
import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS } from '../utils/firestoreTimeout';
import { createZipWithImages, extractZipWithImages, ZipImageFile } from '../utils/zipHelper';
import {
  FullBackupData,
  RestoreSummary,
  asArray,
  buildFullBackupManifest,
  validateFullBackupManifest,
} from '../utils/backupManifest';
import {
  getFilenameFromUri,
  imageExists,
  migrateImagesToMediaLibrary,
  resolveLocalImageUri,
} from '../lib/imageStorage';
import { logger } from '../utils/logger';
import { collectReferencedFilenames } from '../utils/photoFilename';

const BACKUP_PLANT_PAGE_SIZE = 200;

const getAllPlantsForBackup = async (): Promise<Plant[]> => {
  const paginatedPlants: Plant[] = [];
  let lastDoc: QueryDocumentSnapshot | undefined;

  while (true) {
    const { plants, lastDoc: newLastDoc } = await getPlants(BACKUP_PLANT_PAGE_SIZE, lastDoc);

    if (plants.length === 0) {
      break;
    }

    paginatedPlants.push(...plants);

    if (!newLastDoc || plants.length < BACKUP_PLANT_PAGE_SIZE) {
      break;
    }

    lastDoc = newLastDoc;
  }

  let archivedPlants: Plant[] = [];
  try {
    archivedPlants = await getArchivedPlants();
  } catch (error) {
    logger.warn('Failed to fetch archived plants for backup', error as Error);
  }

  const mergedPlants = new Map<string, Plant>();
  paginatedPlants.forEach((plant) => mergedPlants.set(plant.id, plant));
  archivedPlants.forEach((plant) => mergedPlants.set(plant.id, plant));

  return Array.from(mergedPlants.values());
};

const getNormalizedFilename = (value?: string | null): string | null => {
  const filename = getFilenameFromUri(value ?? '');
  return filename ? filename.toLowerCase() : null;
};

const buildImageUriLookup = (imageUris: Map<string, string>) => {
  const normalized = new Map<string, string>();
  imageUris.forEach((uri, filename) => {
    const key = getNormalizedFilename(filename);
    if (key) {
      normalized.set(key, uri);
    }
  });

  return (filename?: string | null): string | null => {
    const key = getNormalizedFilename(filename);
    if (!key) return null;
    return normalized.get(key) ?? null;
  };
};

const resolveImportedImageUri = async (
  getImportedImageUri: (filename?: string | null) => string | null,
  filename?: string | null
): Promise<string | null> => {
  const importedUri = getImportedImageUri(filename);

  if (importedUri) {
    const resolvedImportedUri = await resolveLocalImageUri(importedUri);
    if (resolvedImportedUri && (await imageExists(resolvedImportedUri))) {
      return resolvedImportedUri;
    }
  }

  return resolveLocalImageUri(filename ?? null);
};

const collectReferencedImageFilenames = (plants: Plant[], journal: JournalEntry[]): Set<string> =>
  collectReferencedFilenames(plants, journal);

const resolveImageFilesFromFilenames = async (
  imageFilenames: Set<string>
): Promise<ZipImageFile[]> => {
  const imageFiles: ZipImageFile[] = [];
  const resolvedImages = await Promise.all(
    Array.from(imageFilenames).map(async (filename) => ({
      filename,
      uri: await resolveLocalImageUri(filename),
    }))
  );

  resolvedImages.forEach((image) => {
    if (image.uri) {
      imageFiles.push({
        filename: image.filename,
        uri: image.uri,
      });
    }
  });

  return imageFiles;
};

const getBase64SizeInBytes = (base64: string): number => {
  const trimmed = base64.trim();
  const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((trimmed.length * 3) / 4) - padding);
};

const getImageUriSize = async (uri: string): Promise<number> => {
  if (!uri || Platform.OS === 'web') return 0;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && typeof info.size === 'number') {
      return info.size;
    }
  } catch {
    // Ignore and use fallback.
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return getBase64SizeInBytes(base64);
  } catch {
    return 0;
  }
};

const withImportVersion = (uri: string, version: string): string => {
  if (!uri) return uri;

  const [withoutHash = '', hashPart] = uri.split('#', 2);
  const hash = hashPart ? `#${hashPart}` : '';
  const [base, query = ''] = withoutHash.split('?', 2);
  const queryParts = query
    ? query.split('&').filter((part) => part && !part.startsWith('imgv='))
    : [];
  queryParts.push(`imgv=${version}`);
  const nextQuery = queryParts.join('&');
  return `${base}?${nextQuery}${hash}`;
};

export const getImagesOnlyStorageSize = async (): Promise<number> => {
  try {
    const [plants, journal] = await Promise.all([
      getData<Plant>(KEYS.PLANTS),
      getData<JournalEntry>(KEYS.JOURNAL),
    ]);
    const imageFilenames = collectReferencedImageFilenames(plants, journal);
    if (imageFilenames.size === 0) {
      return 0;
    }

    const imageFiles = await resolveImageFilesFromFilenames(imageFilenames);
    let totalSize = 0;

    for (const imageFile of imageFiles) {
      totalSize += await getImageUriSize(imageFile.uri);
    }

    return totalSize;
  } catch (error) {
    logger.error('Error calculating images-only size', error as Error);
    return 0;
  }
};

/**
 * Export ONLY images as a ZIP file (no data)
 * This creates an images-only archive for backup or transfer
 * @returns The file URI of the created images ZIP
 */
export const exportImagesOnly = async (): Promise<string> => {
  try {
    logger.info('Starting images-only export...');

    const [plants, journal] = await withTimeoutAndRetry(
      () => Promise.all([getAllPlantsForBackup(), getJournalEntries()]),
      { timeoutMs: 30000 }
    );

    const imageFilenames = collectReferencedImageFilenames(plants, journal);
    const imageFiles = await resolveImageFilesFromFilenames(imageFilenames);

    logger.info(`Found ${imageFiles.length} images to export`);

    if (imageFiles.length === 0) {
      throw new Error('No images found to export');
    }

    const manifest = {
      exportDate: new Date().toISOString(),
      imageCount: imageFiles.length,
      note: 'This is an images-only backup. Import this on another device to restore photos.',
    };

    const zipUri = await createZipWithImages(manifest, imageFiles);

    logger.info('Images-only backup created: ' + zipUri);

    if (Platform.OS !== 'web' && (await isAvailableAsync())) {
      await shareAsync(zipUri, {
        mimeType: 'application/zip',
        dialogTitle: 'Save Images Backup',
        UTI: 'public.zip-archive',
      });
    }

    return zipUri;
  } catch (error) {
    logger.error('Error exporting images', error as Error);
    throw new Error('Failed to export images. Please ensure you have images to export.');
  }
};

/**
 * Import ONLY images from a ZIP file
 * This restores photos without affecting any data
 * @returns Number of images imported
 */
export const importImagesOnly = async (): Promise<number> => {
  try {
    logger.info('Starting images-only import...');

    const result = await getDocumentAsync({
      type: 'application/zip',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('Import cancelled');
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error('No backup file selected');
    }

    const IMAGES_DIR = Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}garden_images/`;

    const { imageUris } = await extractZipWithImages(result.assets[0]!.uri, IMAGES_DIR);
    const getImportedImageUri = buildImageUriLookup(imageUris);
    const importVersion = Date.now().toString();

    if (Platform.OS === 'android') {
      try {
        const migration = await migrateImagesToMediaLibrary();
        logger.info('Post-import migration: ' + migration.message);
      } catch (migrationError) {
        logger.warn('Post-import migration failed', migrationError as Error);
      }
    }

    logger.info(`Extracted ${imageUris.size} images to local storage`);
    logger.debug('Available image filenames: ' + Array.from(imageUris.keys()).join(', '));

    const { plantsUpdated, journalUpdated } = await relinkImportedImages(
      getImportedImageUri,
      importVersion
    );

    logger.info(
      `Images import completed: ${imageUris.size} extracted, ${plantsUpdated} plant photos updated, ${journalUpdated} journal entries updated`
    );

    return imageUris.size;
  } catch (error) {
    logger.error('Error importing images', error as Error);
    throw new Error('Failed to import images. Please try again with a valid backup file.');
  }
};

/**
 * Re-point locally cached plant + journal photos at freshly imported image
 * files. Reads/writes AsyncStorage in place and returns how many records were
 * touched. Shared by images-only import and full restore so the matching logic
 * never diverges between the two flows.
 */
const relinkImportedImages = async (
  getImportedImageUri: (filename?: string | null) => string | null,
  importVersion: string
): Promise<{ plantsUpdated: number; journalUpdated: number }> => {
  const plants = await getData<Plant>(KEYS.PLANTS);
  const journal = await getData<JournalEntry>(KEYS.JOURNAL);

  let plantsUpdated = 0;
  let journalUpdated = 0;

  const updatedPlants = await Promise.all(
    plants.map(async (plant) => {
      const photoFilename = plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? '');
      if (!photoFilename) return plant;

      const hasImportedFile = !!getImportedImageUri(photoFilename);
      const newUri = (await resolveImportedImageUri(getImportedImageUri, photoFilename)) ?? null;
      const nextPhotoUri = newUri ?? plant.photo_url ?? null;
      const finalPhotoUri =
        nextPhotoUri && hasImportedFile
          ? withImportVersion(nextPhotoUri, importVersion)
          : nextPhotoUri;

      const nextPlant = {
        ...plant,
        photo_filename: photoFilename,
        photo_url: finalPhotoUri,
      };
      const changed =
        (plant.photo_url ?? null) !== (finalPhotoUri ?? null) ||
        (plant.photo_filename ?? null) !== (photoFilename ?? null);
      if (changed) {
        plantsUpdated++;
      }
      return nextPlant;
    })
  );

  const updatedJournal = await Promise.all(
    journal.map(async (entry) => {
      const legacyUrls =
        entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
          ? [entry.photo_url]
          : [];
      const photoFilenames =
        entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri) => getFilenameFromUri(uri))
              .filter((filename): filename is string => !!filename);
      if (photoFilenames.length === 0) return entry;

      const currentUrls = entry.photo_urls ?? [];
      const updatedPhotos = (
        await Promise.all(
          photoFilenames.map(async (filename, index) => {
            const hasImportedFile = !!getImportedImageUri(filename);
            const matched = await resolveImportedImageUri(getImportedImageUri, filename);
            const nextUri = matched ?? currentUrls[index] ?? null;
            if (!nextUri) return null;
            return hasImportedFile ? withImportVersion(nextUri, importVersion) : nextUri;
          })
        )
      ).filter((uri): uri is string => !!uri);

      const nextEntry = {
        ...entry,
        photo_filenames: photoFilenames,
        photo_urls: updatedPhotos,
        photo_url: null,
      };

      const changed =
        JSON.stringify(entry.photo_filenames ?? []) !== JSON.stringify(photoFilenames) ||
        JSON.stringify(entry.photo_urls ?? []) !== JSON.stringify(updatedPhotos) ||
        !!entry.photo_url;

      if (changed) {
        journalUpdated++;
      }
      return nextEntry;
    })
  );

  await setData(KEYS.PLANTS, updatedPlants);
  await setData(KEYS.JOURNAL, updatedJournal);

  return { plantsUpdated, journalUpdated };
};

// ─── Complete backup (data + images) ────────────────────────────────────────

const RESTORE_BATCH_LIMIT = 400;

/** Re-create a Firestore collection's docs under their original ids, batched. */
const restoreCollectionToFirestore = async (
  collectionName: string,
  items: { id?: string }[],
  uid: string
): Promise<void> => {
  for (let i = 0; i < items.length; i += RESTORE_BATCH_LIMIT) {
    const chunk = items.slice(i, i + RESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    let writes = 0;
    for (const item of chunk) {
      if (!item.id) continue;
      const { id, ...rest } = item as { id: string } & Record<string, unknown>;
      batch.set(doc(collection(db, collectionName), id), { ...rest, user_id: uid });
      writes++;
    }
    if (writes === 0) continue;
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS });
  }
};

/**
 * Export ALL user data (plants, beds, tasks, journal, settings) plus referenced
 * images as a single ZIP. Data also lives in Firestore; this is a portable,
 * user-owned archive for transfer and account migration.
 */
export const exportFullBackup = async (): Promise<string> => {
  try {
    logger.info('Starting full backup export...');

    const data = await withTimeoutAndRetry<FullBackupData>(
      async () => {
        const [plants, beds, taskTemplates, taskLogs, journal, locations, plantProfiles, farmConfig] =
          await Promise.all([
            getAllPlantsForBackup(),
            getBeds(),
            getTaskTemplates(),
            getTaskLogs(),
            getJournalEntries(),
            getLocationConfig(),
            getPlantProfiles(),
            getFarmConfig(),
          ]);
        return { plants, beds, taskTemplates, taskLogs, journal, locations, plantProfiles, farmConfig };
      },
      { timeoutMs: 30000 }
    );

    const imageFilenames = collectReferencedImageFilenames(data.plants, data.journal);
    const imageFiles = await resolveImageFilesFromFilenames(imageFilenames);

    const manifest = buildFullBackupManifest(data, imageFiles.length, LATEST_SCHEMA_VERSION);

    const zipUri = await createZipWithImages(
      manifest as unknown as Record<string, unknown>,
      imageFiles
    );

    logger.info('Full backup created: ' + zipUri);

    if (Platform.OS !== 'web' && (await isAvailableAsync())) {
      await shareAsync(zipUri, {
        mimeType: 'application/zip',
        dialogTitle: 'Save Complete Backup',
        UTI: 'public.zip-archive',
      });
    }

    return zipUri;
  } catch (error) {
    logger.error('Error exporting full backup', error as Error);
    throw new Error('Failed to export backup. Please try again.');
  }
};

/**
 * Restore a complete backup ZIP. Replaces local data and rehydrates Firestore
 * under the current account, then re-links imported photos. Destructive on this
 * device — callers must confirm before invoking.
 */
export const importFullBackup = async (): Promise<RestoreSummary> => {
  try {
    logger.info('Starting full backup restore...');

    const result = await getDocumentAsync({
      type: 'application/zip',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('Import cancelled');
    }
    if (!result.assets || result.assets.length === 0) {
      throw new Error('No backup file selected');
    }

    const IMAGES_DIR = Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}garden_images/`;
    const { jsonData, imageUris } = await extractZipWithImages(result.assets[0]!.uri, IMAGES_DIR);

    const manifest = validateFullBackupManifest(jsonData, LATEST_SCHEMA_VERSION);

    const uid = auth.currentUser?.uid;
    if (uid) await refreshAuthToken();

    const plants = asArray<Plant>(manifest.data.plants);
    const beds = asArray<Bed>(manifest.data.beds);
    const taskTemplates = asArray<TaskTemplate>(manifest.data.taskTemplates);
    const taskLogs = asArray<TaskLog>(manifest.data.taskLogs);
    const journal = asArray<JournalEntry>(manifest.data.journal);

    // Stamp ownership so the restored data is visible to the current account.
    const stamp = <T extends object>(items: T[]): T[] =>
      uid ? items.map((item) => ({ ...item, user_id: uid })) : items;

    // 1. Local stores first (offline-first; screens read these immediately).
    await setData(KEYS.PLANTS, stamp(plants));
    await setData(KEYS.BEDS, stamp(beds));
    await setData(KEYS.TASKS, stamp(taskTemplates));
    await setData(KEYS.TASK_LOGS, stamp(taskLogs));
    await setData(KEYS.JOURNAL, stamp(journal));

    // 2. Whole-document settings (these persist to Firestore too).
    if (manifest.data.farmConfig) await saveFarmConfig(manifest.data.farmConfig);
    if (manifest.data.locations) await saveLocationConfig(manifest.data.locations);
    if (manifest.data.plantProfiles) await savePlantProfiles(manifest.data.plantProfiles);

    // 3. Re-link imported photos against the freshly extracted image files.
    const getImportedImageUri = buildImageUriLookup(imageUris);
    if (Platform.OS === 'android') {
      try {
        await migrateImagesToMediaLibrary();
      } catch (migrationError) {
        logger.warn('Post-restore image migration failed', migrationError as Error);
      }
    }
    await relinkImportedImages(getImportedImageUri, Date.now().toString());

    // 4. Push collections to Firestore under their original ids (durable across
    //    cache clears / new devices). Plants + journal use the re-linked copies.
    if (uid) {
      const relinkedPlants = await getData<Plant>(KEYS.PLANTS);
      const relinkedJournal = await getData<JournalEntry>(KEYS.JOURNAL);
      await restoreCollectionToFirestore('plants', relinkedPlants, uid);
      await restoreCollectionToFirestore('beds', stamp(beds), uid);
      await restoreCollectionToFirestore('task_templates', stamp(taskTemplates), uid);
      await restoreCollectionToFirestore('task_logs', stamp(taskLogs), uid);
      await restoreCollectionToFirestore('journal_entries', relinkedJournal, uid);
    } else {
      logger.warn('Restore: no authenticated user — data restored locally only');
    }

    invalidateAll();

    const summary: RestoreSummary = {
      plants: plants.length,
      beds: beds.length,
      taskTemplates: taskTemplates.length,
      taskLogs: taskLogs.length,
      journal: journal.length,
      images: imageUris.size,
    };

    logger.info(
      `Full restore completed: ${summary.plants} plants, ${summary.beds} beds, ${summary.journal} journal, ${summary.images} images`
    );

    return summary;
  } catch (error) {
    logger.error('Error restoring full backup', error as Error);
    if ((error as Error).message === 'Import cancelled') throw error as Error;
    throw new Error((error as Error).message || 'Failed to restore backup.');
  }
};
