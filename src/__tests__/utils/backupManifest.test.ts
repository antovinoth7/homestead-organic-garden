/// <reference types="jest" />
import {
  BACKUP_TYPE_FULL,
  asArray,
  buildFullBackupManifest,
  validateFullBackupManifest,
  FullBackupData,
} from '../../utils/backupManifest';

const emptyData = (): FullBackupData => ({
  plants: [],
  beds: [],
  taskTemplates: [],
  taskLogs: [],
  journal: [],
  locations: null,
  plantProfiles: null,
  farmConfig: null,
});

describe('backupManifest', () => {
  describe('asArray', () => {
    it('returns the array unchanged', () => {
      expect(asArray<number>([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('coerces non-arrays (undefined/null/object) to an empty array', () => {
      expect(asArray(undefined)).toEqual([]);
      expect(asArray(null)).toEqual([]);
      expect(asArray({ length: 2 })).toEqual([]);
    });
  });

  describe('buildFullBackupManifest', () => {
    it('stamps type, schema version and counts from the data', () => {
      const data = emptyData();
      data.plants = [{ id: 'p1' }, { id: 'p2' }] as FullBackupData['plants'];
      data.beds = [{ id: 'b1' }] as FullBackupData['beds'];

      const manifest = buildFullBackupManifest(data, 5, 4);

      expect(manifest.type).toBe(BACKUP_TYPE_FULL);
      expect(manifest.schemaVersion).toBe(4);
      expect(manifest.counts.plants).toBe(2);
      expect(manifest.counts.beds).toBe(1);
      expect(manifest.counts.images).toBe(5);
      expect(manifest.data).toBe(data);
      expect(typeof manifest.exportDate).toBe('string');
    });
  });

  describe('validateFullBackupManifest', () => {
    it('accepts a well-formed full backup at the current schema', () => {
      const manifest = buildFullBackupManifest(emptyData(), 0, 4);
      expect(validateFullBackupManifest(manifest, 4)).toBe(manifest);
    });

    it('accepts an older-schema backup (migrations upgrade on next launch)', () => {
      const manifest = buildFullBackupManifest(emptyData(), 0, 2);
      expect(() => validateFullBackupManifest(manifest, 4)).not.toThrow();
    });

    it('rejects a backup made with a newer schema version', () => {
      const manifest = buildFullBackupManifest(emptyData(), 0, 99);
      expect(() => validateFullBackupManifest(manifest, 4)).toThrow(/newer app version/i);
    });

    it('rejects an images-only / non-complete archive', () => {
      expect(() => validateFullBackupManifest({ imageCount: 3 }, 4)).toThrow(/not a complete backup/i);
      expect(() => validateFullBackupManifest(null, 4)).toThrow(/not a complete backup/i);
    });
  });
});
