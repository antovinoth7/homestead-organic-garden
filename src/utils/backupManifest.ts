/**
 * Pure helpers for the complete-backup manifest (no native / Firestore imports
 * so they stay unit-testable). Shared by `services/backup.ts`.
 */

import type {
  Plant,
  JournalEntry,
  Bed,
  TaskTemplate,
  TaskLog,
  LocationConfig,
  PlantProfiles,
  FarmConfig,
} from '@/types/database.types';

export const BACKUP_TYPE_FULL = 'full';

export interface FullBackupData {
  plants: Plant[];
  beds: Bed[];
  taskTemplates: TaskTemplate[];
  taskLogs: TaskLog[];
  journal: JournalEntry[];
  locations: LocationConfig | null;
  plantProfiles: PlantProfiles | null;
  farmConfig: FarmConfig | null;
}

export interface FullBackupManifest {
  type: string;
  exportDate: string;
  schemaVersion: number;
  app: string;
  counts: Record<string, number>;
  data: FullBackupData;
}

export interface RestoreSummary {
  plants: number;
  beds: number;
  taskTemplates: number;
  taskLogs: number;
  journal: number;
  images: number;
}

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * Assemble a complete-backup manifest from collected data + image count.
 */
export function buildFullBackupManifest(
  data: FullBackupData,
  imageCount: number,
  schemaVersion: number,
  app = '1.0.0'
): FullBackupManifest {
  return {
    type: BACKUP_TYPE_FULL,
    exportDate: new Date().toISOString(),
    schemaVersion,
    app,
    counts: {
      plants: data.plants.length,
      beds: data.beds.length,
      taskTemplates: data.taskTemplates.length,
      taskLogs: data.taskLogs.length,
      journal: data.journal.length,
      images: imageCount,
    },
    data,
  };
}

/**
 * Validate a parsed backup JSON before restoring. Throws a user-facing message
 * when it isn't a complete backup or was produced by a newer app schema.
 */
export function validateFullBackupManifest(
  jsonData: unknown,
  latestSchemaVersion: number
): FullBackupManifest {
  const manifest = jsonData as Partial<FullBackupManifest> | null;

  if (!manifest || manifest.type !== BACKUP_TYPE_FULL || !manifest.data) {
    throw new Error(
      'This is not a complete backup. Use "Import Images Only" for photo archives.'
    );
  }

  if (
    typeof manifest.schemaVersion === 'number' &&
    manifest.schemaVersion > latestSchemaVersion
  ) {
    throw new Error(
      'This backup was made with a newer app version. Please update the app before restoring.'
    );
  }

  return manifest as FullBackupManifest;
}
