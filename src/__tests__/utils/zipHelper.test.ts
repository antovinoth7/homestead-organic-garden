/// <reference types="jest" />

/**
 * Tests for the ZIP backup helpers.
 *
 * The modern `expo-file-system` `File`/`Directory` API is backed by an
 * in-memory filesystem so round-trips exercise the real `fflate` codec.
 */

const memoryFiles = new Map<string, Uint8Array>();
const memoryDirs = new Set<string>();
/** URIs whose modern-API byte read should fail, forcing the legacy fallback. */
const byteReadFailures = new Set<string>();
/** URIs readable only through the legacy base64 reader (e.g. `content://`). */
const legacyOnlyFiles = new Map<string, Uint8Array>();

class MockFile {
  readonly uri: string;

  constructor(...uris: string[]) {
    this.uri = uris.join('');
  }

  get exists(): boolean {
    return memoryFiles.has(this.uri);
  }

  async bytes(): Promise<Uint8Array> {
    if (byteReadFailures.has(this.uri)) {
      throw new Error('Modern byte read unavailable');
    }
    const data = memoryFiles.get(this.uri);
    if (!data) {
      throw new Error(`No such file: ${this.uri}`);
    }
    return data;
  }

  write(content: Uint8Array | string): void {
    if (typeof content === 'string') {
      const encoded = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) encoded[i] = content.charCodeAt(i) & 0xff;
      memoryFiles.set(this.uri, encoded);
      return;
    }
    memoryFiles.set(this.uri, content);
  }
}

class MockDirectory {
  readonly uri: string;

  constructor(...uris: string[]) {
    this.uri = uris.join('');
  }

  get exists(): boolean {
    return memoryDirs.has(this.uri);
  }

  create(): void {
    memoryDirs.add(this.uri);
  }
}

jest.mock('expo-file-system', () => ({
  File: MockFile,
  Directory: MockDirectory,
}));

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
};

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  readAsStringAsync: jest.fn(async (uri: string) => {
    const data = legacyOnlyFiles.get(uri) ?? memoryFiles.get(uri);
    if (!data) {
      throw new Error(`No such file: ${uri}`);
    }
    return toBase64(data);
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Imports must stay below the mock setup: the jest.mock factories close over the
// classes and maps declared above, which have to be initialised before the
// module under test requires 'expo-file-system'.
/* eslint-disable import/first */
import {
  createZipWithImages,
  extractZipWithImages,
  BackupProgress,
  ZipImageFile,
} from '../../utils/zipHelper';
import { logger } from '../../utils/logger';
/* eslint-enable import/first */

const IMAGES_DIR = 'file:///docs/garden_images/';

/** Incompressible bytes, so a store-vs-deflate mistake cannot hide behind padding. */
const makeImageBytes = (seed: number, length = 512): Uint8Array => {
  const bytes = new Uint8Array(length);
  let state = seed * 2654435761;
  for (let i = 0; i < length; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    bytes[i] = state & 0xff;
  }
  return bytes;
};

const seedImage = (filename: string, bytes: Uint8Array): ZipImageFile => {
  const uri = `file:///photos/${filename}`;
  memoryFiles.set(uri, bytes);
  return { uri, filename };
};

beforeEach(() => {
  memoryFiles.clear();
  memoryDirs.clear();
  byteReadFailures.clear();
  legacyOnlyFiles.clear();
  jest.clearAllMocks();
});

describe('zipHelper', () => {
  describe('round trip', () => {
    it('preserves backup.json and image bytes exactly', async () => {
      const first = makeImageBytes(1);
      const second = makeImageBytes(2, 1024);
      const imageFiles = [seedImage('plant-a.jpg', first), seedImage('journal-b.jpg', second)];
      const jsonData = { version: 3, plants: [{ id: 'p1', name: 'Brinjal' }] };

      const zipUri = await createZipWithImages(jsonData, imageFiles);
      expect(memoryFiles.has(zipUri)).toBe(true);

      const { jsonData: restored, imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(restored).toEqual(jsonData);
      expect(imageUris.size).toBe(2);
      expect(memoryFiles.get(`${IMAGES_DIR}plant-a.jpg`)).toEqual(first);
      expect(memoryFiles.get(`${IMAGES_DIR}journal-b.jpg`)).toEqual(second);
    });

    it('creates the target images directory when missing', async () => {
      const imageFiles = [seedImage('a.jpg', makeImageBytes(3))];
      const zipUri = await createZipWithImages({ ok: true }, imageFiles);

      expect(memoryDirs.has(IMAGES_DIR)).toBe(false);
      await extractZipWithImages(zipUri, IMAGES_DIR);
      expect(memoryDirs.has(IMAGES_DIR)).toBe(true);
    });

    it('handles a backup with no images', async () => {
      const zipUri = await createZipWithImages({ plants: [] }, []);
      const { jsonData, imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(jsonData).toEqual({ plants: [] });
      expect(imageUris.size).toBe(0);
    });
  });

  describe('resilience', () => {
    it('skips a missing photo and still packs the rest', async () => {
      const good = makeImageBytes(4);
      const imageFiles = [
        { uri: 'file:///photos/gone.jpg', filename: 'gone.jpg' },
        seedImage('here.jpg', good),
      ];

      const zipUri = await createZipWithImages({ n: 1 }, imageFiles);
      const { imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(imageUris.size).toBe(1);
      expect(memoryFiles.get(`${IMAGES_DIR}here.jpg`)).toEqual(good);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Image not found, skipping')
      );
    });

    it('skips a photo whose read fails without aborting the backup', async () => {
      const good = makeImageBytes(5);
      const broken = seedImage('broken.jpg', makeImageBytes(6));
      byteReadFailures.add(broken.uri);
      // Legacy fallback cannot read it either.
      memoryFiles.delete(broken.uri);

      const zipUri = await createZipWithImages({ n: 2 }, [broken, seedImage('fine.jpg', good)]);
      const { imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(imageUris.size).toBe(1);
      expect(memoryFiles.get(`${IMAGES_DIR}fine.jpg`)).toEqual(good);
    });

    it('ignores entries with blank URIs', async () => {
      const zipUri = await createZipWithImages({ n: 3 }, [
        { uri: '   ', filename: 'blank.jpg' },
        seedImage('real.jpg', makeImageBytes(7)),
      ]);
      const { imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(imageUris.size).toBe(1);
      expect(imageUris.has('real.jpg')).toBe(true);
    });
  });

  describe('legacy base64 fallback', () => {
    it('reads content:// photos the modern byte API cannot open', async () => {
      const bytes = makeImageBytes(8, 300);
      const uri = 'content://media/external/images/media/42';
      legacyOnlyFiles.set(uri, bytes);

      const zipUri = await createZipWithImages({ n: 4 }, [{ uri, filename: 'media-42.jpg' }]);
      const { imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      expect(imageUris.size).toBe(1);
      expect(memoryFiles.get(`${IMAGES_DIR}media-42.jpg`)).toEqual(bytes);
    });
  });

  describe('progress reporting', () => {
    it('reports packing counts that advance monotonically to the total', async () => {
      const imageFiles = [1, 2, 3, 4, 5].map((n) => seedImage(`p${n}.jpg`, makeImageBytes(n)));
      const events: BackupProgress[] = [];

      await createZipWithImages({ n: 5 }, imageFiles, {
        onProgress: (progress) => events.push(progress),
      });

      const packing = events.filter((event) => event.phase === 'packing');
      expect(packing[0]).toEqual({ phase: 'packing', current: 0, total: 5 });
      expect(packing[packing.length - 1]).toEqual({ phase: 'packing', current: 5, total: 5 });

      const counts = packing.map((event) => event.current as number);
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]!).toBeGreaterThanOrEqual(counts[i - 1]!);
      }

      expect(events.map((event) => event.phase)).toEqual(
        expect.arrayContaining(['packing', 'compressing', 'saving'])
      );
    });

    it('reports extraction counts on the restore path', async () => {
      const imageFiles = [1, 2, 3].map((n) => seedImage(`r${n}.jpg`, makeImageBytes(n + 20)));
      const zipUri = await createZipWithImages({ n: 6 }, imageFiles);

      const events: BackupProgress[] = [];
      await extractZipWithImages(zipUri, IMAGES_DIR, {
        onProgress: (progress) => events.push(progress),
      });

      const extracting = events.filter(
        (event) => event.phase === 'extracting' && typeof event.current === 'number'
      );
      expect(extracting[extracting.length - 1]).toEqual({
        phase: 'extracting',
        current: 3,
        total: 3,
      });
    });
  });

  describe('validation', () => {
    it('rejects a ZIP without backup.json', async () => {
      const { zipSync } = await import('fflate');
      const uri = 'file:///docs/bad.zip';
      memoryFiles.set(uri, zipSync({ 'images/a.jpg': makeImageBytes(9) }));

      await expect(extractZipWithImages(uri, IMAGES_DIR)).rejects.toThrow('missing backup.json');
    });

    it('sanitizes traversal attempts in image filenames', async () => {
      const bytes = makeImageBytes(10);
      const uri = 'file:///photos/evil.jpg';
      memoryFiles.set(uri, bytes);

      const zipUri = await createZipWithImages({ n: 7 }, [
        { uri, filename: '../../../etc/passwd' },
      ]);
      const { imageUris } = await extractZipWithImages(zipUri, IMAGES_DIR);

      for (const writtenUri of imageUris.values()) {
        expect(writtenUri.startsWith(IMAGES_DIR)).toBe(true);
        expect(writtenUri).not.toContain('..');
      }
    });
  });
});
