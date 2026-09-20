/**
 * ZIP Helper Utilities
 *
 * Cross-platform utilities for creating and extracting ZIP files
 * containing both JSON backup data and image files.
 *
 * Uses fflate - a modern, fast, actively maintained compression library
 * with built-in TypeScript support and no dependencies.
 *
 * Binary I/O goes through the modern `expo-file-system` `File` API, which
 * reads and writes raw `Uint8Array` bytes. The legacy base64 API is kept only
 * as a fallback for URIs the new API rejects (for example Android
 * `content://` MediaLibrary assets).
 *
 * Platform compatibility:
 * - iOS: Full support
 * - Android: Full support
 * - Web: Full support (uses browser APIs)
 */

import { zipSync, unzipSync, strToU8, strFromU8, Zippable } from 'fflate';
import { File, Directory } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { logger } from './logger';

export interface ZipImageFile {
  uri: string;
  filename: string;
}

export type BackupProgressPhase =
  | 'collecting'
  | 'resolving'
  | 'packing'
  | 'compressing'
  | 'saving'
  | 'extracting';

export interface BackupProgress {
  phase: BackupProgressPhase;
  current?: number;
  total?: number;
}

export type BackupProgressCallback = (progress: BackupProgress) => void;

export interface ZipOperationOptions {
  onProgress?: BackupProgressCallback;
}

/**
 * How many images to read from disk at once. Bounded on purpose: unbounded
 * parallelism would hold hundreds of whole photos in memory at the same time
 * on low-end devices.
 */
const IMAGE_READ_CONCURRENCY = 6;

/** JSON compresses well; already-compressed photo bytes do not. */
const JSON_COMPRESSION_LEVEL = 6;
const IMAGE_COMPRESSION_LEVEL = 0;

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sanitizeZipImageFilename = (filename: string): string => {
  const normalized = filename.replace(/\\/g, '/');
  // Reject path traversal attempts
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return `image_${Date.now()}.jpg`;
  }
  const clean = normalized.split('/').pop() || `image_${Date.now()}.jpg`;
  const decoded = safeDecodeURIComponent(clean).replace(/\0/g, '');
  // Whitelist safe characters only
  const safeName = decoded.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safeName || `image_${Date.now()}.jpg`;
};

const formatBackupTimestamp = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

/**
 * Run an async mapper over items with a bounded number of concurrent workers.
 * Results keep the input order.
 */
const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    let index = nextIndex++;
    while (index < items.length) {
      results[index] = await mapper(items[index]!, index);
      index = nextIndex++;
    }
  };

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
};

/**
 * Read a local file as raw bytes, avoiding a base64 round-trip where possible.
 * Falls back to the legacy base64 reader for URIs the modern API cannot open.
 */
const readFileBytes = async (uri: string): Promise<Uint8Array> => {
  try {
    return await new File(uri).bytes();
  } catch (error) {
    logger.debug(`Byte read failed for ${uri}, falling back to base64: ${(error as Error).message}`);
    const base64Data = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToUint8Array(base64Data);
  }
};

/**
 * Cheap existence check so missing photos are reported as skips rather than
 * errors. Only meaningful for `file://` URIs; anything else defers to the read.
 */
const isMissingLocalFile = (uri: string): boolean => {
  if (Platform.OS === 'web' || !uri.startsWith('file://')) return false;
  try {
    return !new File(uri).exists;
  } catch {
    // Let the read attempt decide.
    return false;
  }
};

const ensureDirectoryExists = (directoryUri: string): void => {
  if (Platform.OS === 'web' || !directoryUri) return;
  const directory = new Directory(directoryUri);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
};

/**
 * Create a ZIP file containing JSON data and images
 * @param jsonData - The backup JSON data object
 * @param imageFiles - Array of image URIs with stable filenames to include
 * @param options - Optional progress reporting
 * @returns URI of the created ZIP file
 */
export const createZipWithImages = async (
  jsonData: Record<string, unknown>,
  imageFiles: ZipImageFile[],
  options: ZipOperationOptions = {}
): Promise<string> => {
  const { onProgress } = options;

  try {
    // Prepare files for ZIP
    const files: Zippable = {};

    // Add JSON backup data
    const jsonString = JSON.stringify(jsonData, null, 2);
    files['backup.json'] = [strToU8(jsonString), { level: JSON_COMPRESSION_LEVEL }];

    const candidates = imageFiles.filter((imageFile) => !!imageFile.uri && imageFile.uri.trim());
    let packed = 0;
    onProgress?.({ phase: 'packing', current: 0, total: candidates.length });

    // Read images in parallel, bounded so memory stays predictable
    const readImages = await mapWithConcurrency(
      candidates,
      IMAGE_READ_CONCURRENCY,
      async (imageFile) => {
        const imageUri = imageFile.uri;

        try {
          if (isMissingLocalFile(imageUri)) {
            logger.warn(`Image not found, skipping: ${imageUri}`);
            return null;
          }

          // Keep original filename from backup metadata so restore can remap reliably.
          const filename = sanitizeZipImageFilename(imageFile.filename);

          let imageData: Uint8Array;
          if (Platform.OS === 'web') {
            // For web, fetch blob and convert to Uint8Array
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            imageData = new Uint8Array(arrayBuffer);
          } else {
            imageData = await readFileBytes(imageUri);
          }

          logger.debug(`Read image for ZIP: ${filename}`);
          return { filename, imageData };
        } catch (error) {
          logger.error(`Error adding image ${imageUri}`, error as Error);
          // Continue with other images even if one fails
          return null;
        } finally {
          packed += 1;
          onProgress?.({ phase: 'packing', current: packed, total: candidates.length });
        }
      }
    );

    readImages.forEach((image) => {
      if (image) {
        // Photos are already compressed; storing them skips pointless CPU work.
        files[`images/${image.filename}`] = [image.imageData, { level: IMAGE_COMPRESSION_LEVEL }];
      }
    });

    // Create ZIP using fflate (synchronous for React Native compatibility)
    // Workers are not available in React Native, so we use zipSync
    onProgress?.({ phase: 'compressing' });
    const zipData = zipSync(files, { level: JSON_COMPRESSION_LEVEL });

    // Save ZIP file to device
    onProgress?.({ phase: 'saving' });
    const timestamp = formatBackupTimestamp(new Date());
    const filename = `garden-backup-${timestamp}.zip`;

    if (Platform.OS === 'web') {
      // For web, create a download link
      // Create a new Uint8Array to avoid TypeScript issues with ArrayBufferLike
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return url;
    } else {
      // For mobile, save to document directory as raw bytes (no base64 round-trip)
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      new File(fileUri).write(zipData);
      logger.debug(`ZIP file created: ${fileUri}`);
      return fileUri;
    }
  } catch (error) {
    logger.error('Error creating ZIP', error as Error);
    throw new Error('Failed to create backup ZIP: ' + (error as Error).message);
  }
};

/**
 * Extract JSON data and images from a ZIP file
 * @param zipUri - URI of the ZIP file to extract
 * @param targetImagesDir - Directory where images should be extracted
 * @param options - Optional progress reporting
 * @returns Object containing parsed JSON data and array of restored image URIs
 */
export const extractZipWithImages = async (
  zipUri: string,
  targetImagesDir: string,
  options: ZipOperationOptions = {}
): Promise<{
  jsonData: Record<string, unknown>;
  imageUris: Map<string, string>; // Map of original filename -> new local URI
}> => {
  const MAX_FILES = 1000;
  const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500 MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file

  const { onProgress } = options;

  try {
    // Read ZIP file
    onProgress?.({ phase: 'extracting' });
    let zipData: Uint8Array;
    if (Platform.OS === 'web') {
      const response = await fetch(zipUri);
      const arrayBuffer = await response.arrayBuffer();
      zipData = new Uint8Array(arrayBuffer);
    } else {
      zipData = await readFileBytes(zipUri);
    }

    // Unzip using fflate (synchronous for React Native compatibility)
    // Workers are not available in React Native, so we use unzipSync
    const unzippedFiles = unzipSync(zipData);

    // Validate against ZIP bomb / decompression attacks
    const entryCount = Object.keys(unzippedFiles).length;
    if (entryCount > MAX_FILES) {
      throw new Error(`ZIP contains too many files (${entryCount}). Maximum allowed: ${MAX_FILES}`);
    }

    let totalSize = 0;
    for (const [filePath, fileData] of Object.entries(unzippedFiles)) {
      if (fileData.byteLength > MAX_FILE_SIZE) {
        throw new Error(
          `File "${filePath}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
      }
      // Reject path traversal in ZIP entry names
      if (filePath.includes('..') || filePath.startsWith('/')) {
        throw new Error(`Invalid file path in ZIP: "${filePath}"`);
      }
      totalSize += fileData.byteLength;
      if (totalSize > MAX_TOTAL_SIZE) {
        throw new Error(`ZIP total extracted size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit`);
      }
    }

    // Extract backup.json
    const backupJsonData = unzippedFiles['backup.json'];
    if (!backupJsonData) {
      throw new Error('Invalid backup ZIP: missing backup.json');
    }

    const jsonContent = strFromU8(backupJsonData);
    const jsonData = JSON.parse(jsonContent);

    // Ensure target images directory exists
    ensureDirectoryExists(targetImagesDir);

    // Extract images
    const imageUris = new Map<string, string>();
    const imageEntries = Object.entries(unzippedFiles).filter(
      ([filePath]) => filePath.startsWith('images/') && filePath !== 'images/'
    );

    let written = 0;
    onProgress?.({ phase: 'extracting', current: 0, total: imageEntries.length });

    for (const [filePath, fileData] of imageEntries) {
      try {
        const filename = sanitizeZipImageFilename(filePath.replace('images/', ''));
        if (!filename) {
          continue;
        }

        if (Platform.OS === 'web') {
          // For web, create blob URL
          // Create a new Uint8Array to avoid TypeScript issues with ArrayBufferLike
          const blob = new Blob([new Uint8Array(fileData)], { type: 'image/jpeg' });
          const blobUrl = URL.createObjectURL(blob);
          imageUris.set(filename, blobUrl);
        } else {
          // For mobile, save to local storage as raw bytes (no base64 round-trip)
          const localUri = `${targetImagesDir}${filename}`;
          new File(localUri).write(fileData);
          imageUris.set(filename, localUri);
          logger.debug(`Extracted image: ${filename}`);
        }
      } catch (error) {
        logger.error(`Error extracting image ${filePath}`, error as Error);
        // Continue with other images
      } finally {
        written += 1;
        onProgress?.({ phase: 'extracting', current: written, total: imageEntries.length });
      }
    }

    logger.info(`Extracted ${imageUris.size} images from backup`);
    return { jsonData, imageUris };
  } catch (error) {
    logger.error('Error extracting ZIP', error as Error);
    throw new Error('Failed to extract backup ZIP: ' + (error as Error).message);
  }
};

/**
 * Helper: Convert Base64 string to Uint8Array
 * Still needed for the legacy read fallback (for example Android `content://`).
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  // Remove data URL prefix if present
  const base64Clean = base64.replace(/^data:.*?;base64,/, '');
  const binaryString = atob(base64Clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};
