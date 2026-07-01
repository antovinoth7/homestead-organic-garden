/**
 * Image Compression Utility
 *
 * Downscales and re-encodes images before they are persisted to local storage,
 * so device-local photos stay reasonably sized and consistent. Images are never
 * uploaded anywhere (see docs/IMAGE_STORAGE.md) — this only affects the local
 * file we keep.
 *
 * Fails open: on any error (or on web, where manipulation is unnecessary) the
 * original URI is returned so saving still succeeds.
 */

import { Platform } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { logger } from './logger';

export interface CompressImageOptions {
  /** Source pixel width, when known (e.g. from the image picker asset). */
  width?: number;
  /** Source pixel height, when known. */
  height?: number;
  /** Longest edge is scaled down to at most this many pixels. */
  maxDimension?: number;
  /** JPEG quality, 0–1. */
  compress?: number;
}

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_COMPRESS = 0.6;

/**
 * Resize (to a max longest-edge) and re-encode an image as JPEG.
 *
 * @param uri Local image URI to compress.
 * @returns The compressed image URI, or the original URI if compression fails.
 */
export async function compressImage(
  uri: string,
  options: CompressImageOptions = {}
): Promise<string> {
  // Manipulation is unnecessary on web (blob URLs are session-scoped).
  if (Platform.OS === 'web') return uri;

  const {
    width,
    height,
    maxDimension = DEFAULT_MAX_DIMENSION,
    compress = DEFAULT_COMPRESS,
  } = options;

  try {
    const context = ImageManipulator.manipulate(uri);

    // Only resize when we know the source dimensions and it exceeds the cap.
    // Passing a single dimension preserves the aspect ratio.
    if (width && height) {
      const longest = Math.max(width, height);
      if (longest > maxDimension) {
        const scale = maxDimension / longest;
        context.resize(
          width >= height
            ? { width: Math.round(width * scale) }
            : { height: Math.round(height * scale) }
        );
      }
    }

    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ compress, format: SaveFormat.JPEG });
    return result.uri;
  } catch (error) {
    logger.warn('Image compression failed, using original', error as Error);
    return uri;
  }
}
