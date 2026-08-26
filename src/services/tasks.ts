import { TaskTemplate, TaskLog, Plant, TaskType } from '../types/database.types';
import { db, auth, refreshAuthToken } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { getData, setData, KEYS } from '../lib/storage';
import { writeOrQueue, isOfflineWriteError } from '../lib/offlineWrite';
import type { OfflineMutationInput } from '../types/offline.types';
import {
  withTimeoutAndRetry,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FIRESTORE_READ_TIMEOUT_MS,
} from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';
import { logger } from '../utils/logger';
import { convertTimestamp } from '../utils/dateHelpers';
import {
  getCached,
  peekCached,
  setCached,
  invalidate,
  invalidatePrefix,
  dedup,
  CACHE_KEYS,
} from '../lib/dataCache';
import { TASK_LABELS, EARLY_COMPLETION_BLOCK_REASON } from '../utils/taskConstants';
import { getCurrentSeason } from '../utils/seasonHelpers';
import { getCoconutAgeInfo, getEffectiveGrowthStage, isPlantArchived } from '../utils/plantHelpers';
import { getEffectiveWateringIntervalDays } from '../utils/plantWatering';
import { getPlantCareProfile } from '../utils/plantCareDefaults';
import {
  TASK_TYPE_TO_PLANT_LAST_CARE_FIELD,
  parseDateValue,
  getLastCareDate,
  computeNextDueAt,
  computeSkipDate,
  calendarDaysOverdue,
  isEarlyCompletionBlocked,
  isFutureTask,
  isSkipBlocked,
  isSyncOwnedTemplate,
  computeScheduleAfterCompletion,
  resolveCareInterval,
} from './taskSchedulingLogic';
import {
  addDaysToDateKey,
  farmDateKey,
  farmDateTimeFromKey,
  formatFarmDate,
} from '@/utils/farmDate';

const TASKS_COLLECTION = 'task_templates';
const TASK_LOGS_COLLECTION = 'task_logs';
const PLANTS_COLLECTION = 'plants';
/** Cache-key namespace for per-plant task logs; cleared via `invalidatePrefix`. */
const PLANT_TASK_LOGS_CACHE_PREFIX = 'taskLogs:plant:';
export interface TaskFarmDetails {
  inputQuantity?: number;
  inputUnit?: string;
  treatedArea?: number;
  areaUnit?: string;
  labourMinutes?: number;
}

export interface MarkTaskDoneOptions {
  skipAlreadyDoneCheck?: boolean;
  /** Explicit acknowledgement required when the work is recorded before its due date. */
  allowEarlyCompletion?: boolean;
  /** Required for early water/fertilise/spray records. */
  completionReason?: string;
  farmDetails?: TaskFarmDetails;
  /** Called after each batch chunk commits, with the running completed count. */
  onProgress?: (done: number, total: number) => void;
}

/**
 * Get all task templates with offline-first approach
 */
export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Return fresh in-memory data if available
  const cached = getCached<TaskTemplate[]>(CACHE_KEYS.TASK_TEMPLATES);
  if (cached) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const tasks = await dedup(CACHE_KEYS.TASK_TEMPLATES, async () => {
      const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
        timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
      });

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: convertTimestamp(doc.data().created_at),
        next_due_at: convertTimestamp(doc.data().next_due_at),
      })) as TaskTemplate[];
    });

    // Cache locally
    await setData(KEYS.TASKS, tasks);

    return tasks;
  } catch (error) {
    logger.warn('Failed to fetch task templates, using cached data', error as Error);
    logError('network', 'Failed to fetch task templates', error as Error);
    return getData<TaskTemplate>(KEYS.TASKS);
  }
};

export const getTodayTasks = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Return fresh in-memory data if available
  const cached = getCached<TaskTemplate[]>(CACHE_KEYS.TODAY_TASKS);
  if (cached) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  // Get today's date range (start and end of day)
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  try {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      where('enabled', '==', true)
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });

    let tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: convertTimestamp(doc.data().created_at),
      next_due_at: convertTimestamp(doc.data().next_due_at),
    })) as TaskTemplate[];

    // Filter tasks: include overdue tasks and tasks due today
    tasks = tasks.filter((task) => {
      if (!task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      // Show tasks that are overdue or due today
      return dueDate <= todayEnd;
    });

    tasks.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));

    setCached(CACHE_KEYS.TODAY_TASKS, tasks);
    return tasks;
  } catch (error) {
    logger.warn('Failed to fetch today tasks, using cached data', error as Error);
    logError('network', 'Failed to fetch today tasks', error as Error);
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const filtered = cachedTasks.filter((task) => {
      if (!task.enabled || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate <= todayEnd;
    });
    filtered.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
    return filtered;
  }
};

export const createTaskTemplate = async (
  template: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at'>
): Promise<TaskTemplate> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const newTemplate = {
    ...template,
    user_id: user.uid,
    created_at: Timestamp.now(),
    next_due_at: template.next_due_at ? Timestamp.fromDate(new Date(template.next_due_at)) : null,
  };

  // Client-generated id so the optimistic local record matches the synced one
  const docRef = doc(collection(db, TASKS_COLLECTION));
  await writeOrQueue(
    { collection: TASKS_COLLECTION, docId: docRef.id, op: 'create', payload: newTemplate },
    () => setDoc(docRef, newTemplate)
  );

  const result = {
    id: docRef.id,
    ...template,
    user_id: user.uid,
    created_at: convertTimestamp(newTemplate.created_at),
    next_due_at: newTemplate.next_due_at
      ? convertTimestamp(newTemplate.next_due_at)
      : template.next_due_at,
  } as TaskTemplate;

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);

  // Keep the AsyncStorage copy in sync so the task is visible offline
  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  await setData(KEYS.TASKS, [...cachedTasks, result]);

  return result;
};

export const updateTaskTemplate = async (
  id: string,
  updates: Partial<TaskTemplate>
): Promise<TaskTemplate> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, TASKS_COLLECTION, id);

  // Verify ownership before updating; offline, fall back to the local copy
  // (it only ever holds the signed-in user's own tasks).
  let owned: boolean;
  try {
    const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    owned = existingSnap.exists() && existingSnap.data().user_id === user.uid;
  } catch (error) {
    if (!isOfflineWriteError(error)) throw error;
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    owned = cachedTasks.some((t) => t.id === id);
  }
  if (!owned) throw new Error('Not authorized to update this task');

  const firestoreUpdates: Record<string, unknown> = { ...updates };
  if (updates.next_due_at) {
    const parsedDate = new Date(updates.next_due_at);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error('Invalid next_due_at date value');
    }
    firestoreUpdates.next_due_at = Timestamp.fromDate(parsedDate);
  }

  const { queued } = await writeOrQueue(
    { collection: TASKS_COLLECTION, docId: id, op: 'update', payload: firestoreUpdates },
    () => updateDoc(docRef, firestoreUpdates)
  );

  let result: TaskTemplate;
  if (queued) {
    // Offline: build the optimistic record from the local copy
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const index = cachedTasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task template not found');
    result = { ...cachedTasks[index]!, ...updates } as TaskTemplate;
    cachedTasks[index] = result;
    await setData(KEYS.TASKS, cachedTasks);
  } else {
    // Use direct document read instead of query for better performance
    const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    if (!docSnap.exists()) throw new Error('Task template not found');

    const doc_data = docSnap.data();
    result = {
      id,
      ...doc_data,
      created_at: convertTimestamp(doc_data.created_at),
      next_due_at: convertTimestamp(doc_data.next_due_at),
    } as TaskTemplate;

    // Keep the AsyncStorage copy in sync so a later offline/fallback read never
    // resurrects the pre-update state (e.g. a stale enabled: true).
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const index = cachedTasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      cachedTasks[index] = result;
      await setData(KEYS.TASKS, cachedTasks);
    }
  }

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);

  return result;
};

const formatDueLabel = (template: TaskTemplate): string =>
  formatFarmDate(new Date(template.next_due_at), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const skipBlockedMessage = (template: TaskTemplate): string =>
  `${TASK_LABELS[template.task_type]} isn't due until ${formatDueLabel(template)}. ` +
  'Only tasks that are due can be skipped.';

/**
 * Postpone a task by whole days and record *why*. The new due date is derived
 * from `computeSkipDate`, so a skip can only ever push a task later — skipping
 * a task that is already scheduled for next week never drags it back to today.
 */
export const skipTaskTemplate = async (
  template: TaskTemplate,
  days: number,
  reason?: string
): Promise<TaskTemplate> => {
  // A task that isn't due yet has nothing to defer. The Care Plan blocks this in
  // the UI; this makes it impossible to bypass — including via a queued offline
  // write replayed later.
  if (isSkipBlocked(template)) {
    throw new Error(skipBlockedMessage(template));
  }

  const trimmedReason = reason?.trim();
  return updateTaskTemplate(template.id, {
    next_due_at: computeSkipDate(template, days).toISOString(),
    last_skipped_at: new Date().toISOString(),
    last_skip_reason: trimmedReason ? trimmedReason : null,
    skip_count: (template.skip_count ?? 0) + 1,
  });
};

export const deleteTasksForPlantIds = async (plantIds: string[]): Promise<void> => {
  const uniquePlantIds = Array.from(
    new Set(plantIds.filter((plantId) => plantId && plantId.trim() !== ''))
  );
  if (uniquePlantIds.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const plantIdSet = new Set(uniquePlantIds);
  const tasks = await getTaskTemplates();
  const logs = await getTaskLogs();

  const tasksToDelete = tasks.filter((task) => task.plant_id && plantIdSet.has(task.plant_id));
  const logsToDelete = logs.filter((log) => log.plant_id && plantIdSet.has(log.plant_id));

  // Batch delete all related templates and logs atomically
  // Firestore batches support up to 500 operations
  const BATCH_LIMIT = 500;
  const allDeletes = [
    ...tasksToDelete.map((task) => doc(db, TASKS_COLLECTION, task.id)),
    ...logsToDelete.map((log) => doc(db, TASK_LOGS_COLLECTION, log.id)),
  ];

  for (let i = 0; i < allDeletes.length; i += BATCH_LIMIT) {
    const chunk = allDeletes.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await writeOrQueue(
      chunk.map((ref) => ({
        collection: ref.parent.id,
        docId: ref.id,
        op: 'delete' as const,
        payload: null,
      })),
      () => batch.commit()
    );
  }

  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  if (cachedTasks.length > 0) {
    const filteredTasks = cachedTasks.filter(
      (task) => !task.plant_id || !plantIdSet.has(task.plant_id)
    );
    await setData(KEYS.TASKS, filteredTasks);
  }

  const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
  if (cachedLogs.length > 0) {
    const filteredLogs = cachedLogs.filter((log) => !log.plant_id || !plantIdSet.has(log.plant_id));
    await setData(KEYS.TASK_LOGS, filteredLogs);
  }

  invalidate(
    CACHE_KEYS.TASK_TEMPLATES,
    CACHE_KEYS.TODAY_TASKS,
    CACHE_KEYS.TODAY_TASK_LOGS,
    CACHE_KEYS.TASK_LOGS
  );
  invalidatePrefix(PLANT_TASK_LOGS_CACHE_PREFIX);
};

/**
 * Delete bed-level tasks (and their logs) for the given beds — the cascade
 * counterpart to `deleteTasksForPlantIds`, run when a bed is deleted so its
 * "Water the bed" / soil-input tasks don't linger as orphans. Bed-level tasks
 * carry `bed_id`; their logs are matched by `template_id` (TaskLog has no
 * `bed_id`). Plant-level tasks for the bed are handled by the plant cascade.
 */
export const deleteTasksForBedIds = async (bedIds: string[]): Promise<void> => {
  const uniqueBedIds = Array.from(new Set(bedIds.filter((bedId) => bedId && bedId.trim() !== '')));
  if (uniqueBedIds.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const bedIdSet = new Set(uniqueBedIds);
  const tasks = await getTaskTemplates();
  const logs = await getTaskLogs();

  // Bed-level only (`plant_id == null`), matching `isBedLevelOrphanTask`. Without
  // that clause this deleted every task carrying the bed_id, so one stale
  // bed task could take out a whole bed's plant schedule — detection was narrow
  // while deletion was wide. Plant tasks go through `deleteTasksForPlantIds`.
  const tasksToDelete = tasks.filter(
    (task) => task.plant_id == null && task.bed_id != null && bedIdSet.has(task.bed_id)
  );
  if (tasksToDelete.length === 0) return;

  const deletedTaskIds = new Set(tasksToDelete.map((task) => task.id));
  const logsToDelete = logs.filter((log) => deletedTaskIds.has(log.template_id));

  // Batch delete templates + logs atomically (Firestore caps batches at 500 ops)
  const BATCH_LIMIT = 500;
  const allDeletes = [
    ...tasksToDelete.map((task) => doc(db, TASKS_COLLECTION, task.id)),
    ...logsToDelete.map((log) => doc(db, TASK_LOGS_COLLECTION, log.id)),
  ];

  for (let i = 0; i < allDeletes.length; i += BATCH_LIMIT) {
    const chunk = allDeletes.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await writeOrQueue(
      chunk.map((ref) => ({
        collection: ref.parent.id,
        docId: ref.id,
        op: 'delete' as const,
        payload: null,
      })),
      () => batch.commit()
    );
  }

  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  if (cachedTasks.length > 0) {
    const filteredTasks = cachedTasks.filter(
      (task) => task.bed_id == null || !bedIdSet.has(task.bed_id)
    );
    await setData(KEYS.TASKS, filteredTasks);
  }

  const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
  if (cachedLogs.length > 0) {
    const filteredLogs = cachedLogs.filter((log) => !deletedTaskIds.has(log.template_id));
    await setData(KEYS.TASK_LOGS, filteredLogs);
  }

  invalidate(
    CACHE_KEYS.TASK_TEMPLATES,
    CACHE_KEYS.TODAY_TASKS,
    CACHE_KEYS.TODAY_TASK_LOGS,
    CACHE_KEYS.TASK_LOGS
  );
  invalidatePrefix(PLANT_TASK_LOGS_CACHE_PREFIX);
};

/**
 * Bed-task subtypes whose completion should stamp the bed's last-input date,
 * so the bed detail's Soil Input Log stays in sync with the Care Plan (which is
 * the single completion surface). Subtypes with no date field (mulch, wood_ash,
 * chop_and_drop) simply complete as normal.
 */
const BED_TASK_SUBTYPE_DATE_FIELD: Partial<
  Record<string, 'last_water_date' | 'last_jeevamrutha_date' | 'last_weeding_date'>
> = {
  water_bed: 'last_water_date',
  jeevamrutha: 'last_jeevamrutha_date',
  weeding: 'last_weeding_date',
};

type BedDateField = 'last_water_date' | 'last_jeevamrutha_date' | 'last_weeding_date';

/**
 * All the Firestore operations and matching local-cache deltas needed to mark a
 * single task done. Pure/synchronous: callers feed it the already-loaded cached
 * plants (for the water-frequency multiplier and the one-shot archive check), so
 * the same builder serves both the single-complete and batch-complete paths.
 */
interface TaskDoneOps {
  log: { ref: DocumentReference; data: Record<string, unknown> };
  templateUpdate: {
    ref: DocumentReference;
    data: { next_due_at?: Timestamp; enabled?: boolean };
  } | null;
  plantUpdate: { ref: DocumentReference; data: PlantWriteData } | null;
  cache: {
    newTaskLog: TaskLog;
    taskId: string;
    taskPatch: Partial<Pick<TaskTemplate, 'enabled' | 'next_due_at'>> | null;
    plantPatch: { plantId: string; data: Partial<Plant> } | null;
  };
  sideEffects: {
    bedStamp: { bedId: string; field: BedDateField; value: string } | null;
    archiveOneShotPlantId: string | null;
  };
}

/**
 * Fields a completion writes back to the plant doc. Wider than the last-care
 * date alone: a water completion also records the multiplier it applied.
 */
type PlantWriteData = Record<string, string | number | null>;

const buildTaskDoneOps = (
  template: TaskTemplate,
  userId: string,
  cachedPlants: Plant[],
  notes?: string,
  productUsed?: string,
  options?: MarkTaskDoneOptions
): TaskDoneOps => {
  const doneAt = new Date();
  const doneAtIso = doneAt.toISOString();
  const frequencyDays = Number.isFinite(template.frequency_days) ? template.frequency_days : 0;

  // Scheduling lives in taskSchedulingLogic so it can be unit-tested without a
  // Firestore emulator; this function only turns the result into batch writes.
  const waterPlant = template.plant_id
    ? cachedPlants.find((p) => p.id === template.plant_id) ?? null
    : null;
  const { nextDueAt, wateringMultiplier } = computeScheduleAfterCompletion(
    template,
    waterPlant,
    doneAt
  );
  const completedEarly = isFutureTask(template, doneAt);
  const completionReason = options?.completionReason?.trim() || null;
  const farmDetails = options?.farmDetails;

  // Insert task log with optional notes
  const logRef = doc(collection(db, TASK_LOGS_COLLECTION));
  const logData = {
    user_id: userId,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: Timestamp.fromDate(doneAt),
    notes: notes || null,
    product_used: productUsed || null,
    completed_early: completedEarly,
    completion_reason: completionReason,
    input_quantity: farmDetails?.inputQuantity ?? null,
    input_unit: farmDetails?.inputUnit?.trim() || null,
    treated_area: farmDetails?.treatedArea ?? null,
    area_unit: farmDetails?.areaUnit?.trim() || null,
    labour_minutes: farmDetails?.labourMinutes ?? null,
    created_at: Timestamp.now(),
  };

  // Update next due date
  const templateUpdates: { next_due_at?: Timestamp; enabled?: boolean } = {};
  let nextDueAtIso: string | undefined;
  if (frequencyDays <= 0) {
    templateUpdates.enabled = false;
    templateUpdates.next_due_at = Timestamp.fromDate(doneAt);
    nextDueAtIso = doneAtIso;
  } else if (nextDueAt && !Number.isNaN(nextDueAt.getTime())) {
    templateUpdates.next_due_at = Timestamp.fromDate(nextDueAt);
    nextDueAtIso = nextDueAt.toISOString();
  }
  const hasTemplateUpdate = Object.keys(templateUpdates).length > 0;

  // Determine plant last-care update. A water completion also stamps the
  // multiplier it used, so the overdue math can read the decision back instead
  // of re-deriving it from a season (and a forecast) that have since moved on.
  const plantLastCareField = TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[template.task_type];
  const plantCareUpdate: Partial<Plant> | null = plantLastCareField
    ? {
        [plantLastCareField]: doneAtIso,
        ...(wateringMultiplier !== null
          ? {
              last_watering_multiplier: wateringMultiplier,
              last_watering_adjustment: null,
            }
          : {}),
      }
    : null;

  const newTaskLog: TaskLog = {
    id: logRef.id,
    user_id: userId,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: doneAtIso,
    notes: notes || null,
    product_used: productUsed || null,
    completed_early: completedEarly,
    completion_reason: completionReason,
    input_quantity: farmDetails?.inputQuantity ?? null,
    input_unit: farmDetails?.inputUnit?.trim() || null,
    treated_area: farmDetails?.treatedArea ?? null,
    area_unit: farmDetails?.areaUnit?.trim() || null,
    labour_minutes: farmDetails?.labourMinutes ?? null,
    created_at: doneAtIso,
  };

  // Bed tasks: stamp the bed's matching last-input date so the bed detail's
  // Soil Input Log reflects this completion (Care Plan is the single "do" surface).
  const bedDateField = template.task_subtype
    ? BED_TASK_SUBTYPE_DATE_FIELD[template.task_subtype]
    : undefined;

  // For one_shot annual plants: completing a harvest task auto-archives the plant.
  let archiveOneShotPlantId: string | null = null;
  if (template.task_type === 'harvest' && template.plant_id) {
    const harvestedPlant = cachedPlants.find((p) => p.id === template.plant_id);
    if (harvestedPlant?.harvest_mode === 'one_shot' && !isPlantArchived(harvestedPlant)) {
      archiveOneShotPlantId = template.plant_id;
    }
  }

  return {
    log: { ref: logRef, data: logData },
    templateUpdate: hasTemplateUpdate
      ? { ref: doc(db, TASKS_COLLECTION, template.id), data: templateUpdates }
      : null,
    plantUpdate:
      template.plant_id && plantCareUpdate
        ? {
            ref: doc(db, PLANTS_COLLECTION, template.plant_id),
            data: plantCareUpdate as PlantWriteData,
          }
        : null,
    cache: {
      newTaskLog,
      taskId: template.id,
      taskPatch: hasTemplateUpdate
        ? {
            ...(typeof templateUpdates.enabled === 'boolean'
              ? { enabled: templateUpdates.enabled }
              : {}),
            ...(nextDueAtIso ? { next_due_at: nextDueAtIso } : {}),
          }
        : null,
      plantPatch:
        template.plant_id && plantCareUpdate
          ? { plantId: template.plant_id, data: plantCareUpdate }
          : null,
    },
    sideEffects: {
      bedStamp:
        template.bed_id && bedDateField
          ? { bedId: template.bed_id, field: bedDateField, value: doneAtIso }
          : null,
      archiveOneShotPlantId,
    },
  };
};

/**
 * Map completed-task ops to offline mutations so a batch commit that fails
 * offline can be queued and replayed per document on reconnect.
 */
const taskDoneMutations = (opsList: TaskDoneOps[]): OfflineMutationInput[] =>
  opsList.flatMap((ops) => {
    const mutations: OfflineMutationInput[] = [
      {
        collection: TASK_LOGS_COLLECTION,
        docId: ops.log.ref.id,
        op: 'create',
        payload: ops.log.data,
      },
    ];
    if (ops.templateUpdate) {
      mutations.push({
        collection: TASKS_COLLECTION,
        docId: ops.templateUpdate.ref.id,
        op: 'update',
        payload: ops.templateUpdate.data,
      });
    }
    if (ops.plantUpdate) {
      mutations.push({
        collection: PLANTS_COLLECTION,
        docId: ops.plantUpdate.ref.id,
        op: 'update',
        payload: ops.plantUpdate.data,
      });
    }
    return mutations;
  });

/**
 * Apply the local-cache deltas for one or more completed tasks with a single
 * read-modify-write per storage key (logs / tasks / plants), then invalidate.
 * Batch-completing N tasks no longer serialises the whole arrays N times.
 */
const applyTaskDoneCacheDeltas = async (opsList: TaskDoneOps[]): Promise<void> => {
  if (opsList.length === 0) return;

  // Prepends the new logs (input order preserved: newest-first overall).
  const prependNewLogs = (logs: TaskLog[]): TaskLog[] => {
    const next = logs.slice();
    for (let i = opsList.length - 1; i >= 0; i--) {
      next.unshift(opsList[i]!.cache.newTaskLog);
    }
    return next;
  };

  // Applies next_due_at / enabled patches to a task-template list (in place copy).
  const taskPatches = opsList.filter((o) => o.cache.taskPatch);
  const patchTasks = (list: TaskTemplate[]): TaskTemplate[] => {
    const next = list.slice();
    for (const o of taskPatches) {
      const idx = next.findIndex((t) => t.id === o.cache.taskId);
      if (idx !== -1) next[idx] = { ...next[idx]!, ...o.cache.taskPatch! };
    }
    return next;
  };

  // Applies last-care-date patches to a plant list (in place copy).
  const plantPatches = opsList.filter((o) => o.cache.plantPatch);
  const patchPlants = (list: Plant[]): Plant[] => {
    const next = list.slice();
    for (const o of plantPatches) {
      const p = o.cache.plantPatch!;
      const idx = next.findIndex((pl) => pl.id === p.plantId);
      if (idx !== -1) next[idx] = { ...next[idx]!, ...p.data };
    }
    return next;
  };

  // AsyncStorage (offline fallback) — always patched.
  await setData(KEYS.TASK_LOGS, prependNewLogs(await getData<TaskLog>(KEYS.TASK_LOGS)));
  if (taskPatches.length > 0) {
    await setData(KEYS.TASKS, patchTasks(await getData<TaskTemplate>(KEYS.TASKS)));
  }
  if (plantPatches.length > 0) {
    await setData(KEYS.PLANTS, patchPlants(await getData<Plant>(KEYS.PLANTS)));
  }

  // Warm in-memory cache — patch it in place so the post-completion reload is
  // served synchronously instead of re-fetching from Firestore. Fall back to
  // invalidate when a key is cold (nothing to patch). The dedup fetchedAt guard
  // protects a patched entry from being clobbered by an in-flight fetch.
  const warmTasks = peekCached<TaskTemplate[]>(CACHE_KEYS.TASK_TEMPLATES);
  if (warmTasks) setCached(CACHE_KEYS.TASK_TEMPLATES, patchTasks(warmTasks));
  else invalidate(CACHE_KEYS.TASK_TEMPLATES);

  const warmPlants = peekCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);
  if (warmPlants) setCached(CACHE_KEYS.ALL_PLANTS, patchPlants(warmPlants));
  else invalidate(CACHE_KEYS.ALL_PLANTS);

  const warmTodayLogs = peekCached<TaskLog[]>(CACHE_KEYS.TODAY_TASK_LOGS);
  if (warmTodayLogs) setCached(CACHE_KEYS.TODAY_TASK_LOGS, prependNewLogs(warmTodayLogs));
  else invalidate(CACHE_KEYS.TODAY_TASK_LOGS);

  const warmLogs = peekCached<TaskLog[]>(CACHE_KEYS.TASK_LOGS);
  if (warmLogs) setCached(CACHE_KEYS.TASK_LOGS, prependNewLogs(warmLogs));
  else invalidate(CACHE_KEYS.TASK_LOGS);

  // Per-plant log caches are dropped rather than patched — splicing each one
  // would mean re-deriving which plant every new log belongs to, and the next
  // History open refetches a single plant's logs cheaply.
  invalidatePrefix(PLANT_TASK_LOGS_CACHE_PREFIX);

  // TODAY_TASKS is a differently-filtered list used by other screens; leave it
  // to a plain invalidate rather than reconstructing the filter here.
  invalidate(CACHE_KEYS.TODAY_TASKS);
};

/**
 * Run the post-commit side-effects for completed tasks: stamp bed last-input
 * dates (deduped/merged per bed) and auto-archive one_shot harvested plants.
 */
const runTaskDoneSideEffects = async (opsList: TaskDoneOps[]): Promise<void> => {
  // Bed stamps — merge all fields per bed into a single update.
  const bedUpdates = new Map<string, Partial<Record<BedDateField, string>>>();
  for (const o of opsList) {
    const stamp = o.sideEffects.bedStamp;
    if (stamp) {
      const existing = bedUpdates.get(stamp.bedId) ?? {};
      existing[stamp.field] = stamp.value;
      bedUpdates.set(stamp.bedId, existing);
    }
  }
  if (bedUpdates.size > 0) {
    try {
      const { updateBed } = await import('./beds');
      for (const [bedId, data] of bedUpdates) {
        await updateBed(bedId, data);
      }
    } catch (err) {
      logger.warn('markTaskDone: failed to stamp bed input date', err as Error);
    }
  }

  // One-shot harvest auto-archive — deduped.
  const archiveIds = Array.from(
    new Set(
      opsList
        .map((o) => o.sideEffects.archiveOneShotPlantId)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (archiveIds.length > 0) {
    try {
      const { archivePlant } = await import('./plants');
      for (const id of archiveIds) {
        await archivePlant(id);
      }
    } catch (err) {
      logger.warn('markTaskDone: failed to auto-archive one_shot plant', err as Error);
    }
  }
};

const earlyCompletionBlockedMessage = (template: TaskTemplate): string =>
  `${TASK_LABELS[template.task_type]} isn't due until ${formatDueLabel(template)}. ` +
  `${EARLY_COMPLETION_BLOCK_REASON[template.task_type]}`;

export const markTaskDone = async (
  template: TaskTemplate,
  notes?: string,
  productUsed?: string,
  options?: MarkTaskDoneOptions
): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Verify the task belongs to the current user
  if (template.user_id !== user.uid) {
    throw new Error('Not authorized to complete this task');
  }

  // Water / fertilise / spray can't be logged before they are due — doing the
  // work early is harmful and would re-base the season-adjusted cycle on today.
  // The Care Plan blocks this in the UI; this makes it impossible to bypass.
  const completingEarly = isFutureTask(template);
  if (completingEarly && !options?.allowEarlyCompletion) {
    throw new Error(
      `${formatDueLabel(template)} is the planned date. Confirm before logging early work.`
    );
  }
  if (completingEarly && !options?.completionReason?.trim()) {
    const safetyContext = isEarlyCompletionBlocked(template)
      ? `${earlyCompletionBlockedMessage(template)} `
      : '';
    throw new Error(`${safetyContext}Add the field reason to log early work.`);
  }

  const frequencyDays = Number.isFinite(template.frequency_days) ? template.frequency_days : 0;

  if (!options?.skipAlreadyDoneCheck) {
    const doneAt = new Date();
    const todayKey = farmDateKey(doneAt);
    const tomorrowKey = todayKey ? addDaysToDateKey(todayKey, 1) : null;
    const startOfDay = todayKey ? farmDateTimeFromKey(todayKey, 0) : null;
    const endOfDay = tomorrowKey ? farmDateTimeFromKey(tomorrowKey, 0) : null;

    const existingLogs = await getTaskLogs(template.id);
    const alreadyDoneToday = existingLogs.some((log) => {
      const logDate = new Date(log.done_at);
      return (
        startOfDay !== null && endOfDay !== null && logDate >= startOfDay && logDate < endOfDay
      );
    });

    if (alreadyDoneToday) {
      if (frequencyDays <= 0) {
        await writeOrQueue(
          {
            collection: TASKS_COLLECTION,
            docId: template.id,
            op: 'update',
            payload: { enabled: false },
          },
          () => updateDoc(doc(db, TASKS_COLLECTION, template.id), { enabled: false })
        );
      }
      return false;
    }
  }

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const ops = buildTaskDoneOps(template, user.uid, cachedPlants, notes, productUsed, options);

  // Atomic batch: create log + update template + update plant in one commit
  const batch = writeBatch(db);
  batch.set(ops.log.ref, ops.log.data);
  if (ops.templateUpdate) batch.update(ops.templateUpdate.ref, ops.templateUpdate.data);
  if (ops.plantUpdate) batch.update(ops.plantUpdate.ref, ops.plantUpdate.data);
  await writeOrQueue(taskDoneMutations([ops]), () => batch.commit());

  await applyTaskDoneCacheDeltas([ops]);
  await runTaskDoneSideEffects([ops]);

  return true;
};

// Each completed task contributes ≤ 3 writes (log + template + plant); cap tasks
// per batch so we stay under Firestore's 500-operation limit.
const MAX_TASKS_PER_BATCH = Math.floor(500 / 3);

/**
 * Complete many tasks in one pass: chunked Firestore batches (one commit per
 * ≤166 tasks instead of one per task) and a single cache read-modify-write per
 * key. Used by the Care Plan's "Complete selected" action.
 *
 * Callers pass `skipAlreadyDoneCheck: true` (the selection UI is the intent).
 * Without it we defer to per-task `markTaskDone` to preserve the duplicate guard.
 */
export const markTasksDone = async (
  templates: TaskTemplate[],
  options?: MarkTaskDoneOptions
): Promise<{ succeeded: number; failed: number }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Same early-completion rule as markTaskDone. Blocked tasks are dropped here
  // rather than aborting the batch, so one bad selection can't sink the rest;
  // they surface in the returned `failed` count.
  const owned = templates.filter((template) => template.user_id === user.uid);
  const eligible = owned.filter((template) => {
    if (!isFutureTask(template)) return true;
    if (!options?.allowEarlyCompletion) return false;
    return Boolean(options.completionReason?.trim());
  });
  if (eligible.length === 0) return { succeeded: 0, failed: templates.length };

  // One fresh bounded read preserves duplicate protection without one history
  // query per selected task.
  invalidate(CACHE_KEYS.TODAY_TASK_LOGS);
  const todayLogs = await getTodayTaskLogs();
  const completedTodayIds = new Set(todayLogs.map((log) => log.template_id));
  const pending = eligible.filter((template) => !completedTodayIds.has(template.id));
  if (pending.length === 0) return { succeeded: 0, failed: templates.length };

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const opsList = pending.map((template) =>
    buildTaskDoneOps(template, user.uid, cachedPlants, undefined, undefined, options)
  );

  let committed = 0;
  for (let i = 0; i < opsList.length; i += MAX_TASKS_PER_BATCH) {
    const chunk = opsList.slice(i, i + MAX_TASKS_PER_BATCH);
    const batch = writeBatch(db);
    // Merge plant updates within the chunk so we never write the same plant doc twice.
    const plantRefs = new Map<string, DocumentReference>();
    const plantData = new Map<string, PlantWriteData>();
    for (const ops of chunk) {
      batch.set(ops.log.ref, ops.log.data);
      if (ops.templateUpdate) batch.update(ops.templateUpdate.ref, ops.templateUpdate.data);
      if (ops.plantUpdate) {
        const key = ops.plantUpdate.ref.path;
        plantRefs.set(key, ops.plantUpdate.ref);
        plantData.set(key, { ...(plantData.get(key) ?? {}), ...ops.plantUpdate.data });
      }
    }
    for (const [key, data] of plantData) {
      batch.update(plantRefs.get(key)!, data);
    }

    try {
      // Queued-offline chunks count as committed: the local cache is updated
      // and the mutations replay on reconnect.
      await writeOrQueue(taskDoneMutations(chunk), () => batch.commit());
      committed += chunk.length;
      options?.onProgress?.(committed, pending.length);
    } catch (err) {
      logger.error('markTasksDone: batch commit failed', err as Error);
      // Persist whatever committed before the failure, then report the rest as failed.
      const committedOps = opsList.slice(0, committed);
      await applyTaskDoneCacheDeltas(committedOps);
      await runTaskDoneSideEffects(committedOps);
      return { succeeded: committed, failed: templates.length - committed };
    }
  }

  await applyTaskDoneCacheDeltas(opsList);
  await runTaskDoneSideEffects(opsList);

  return { succeeded: committed, failed: templates.length - committed };
};

/** Reads the locally-stored task logs (AsyncStorage) without any network call. */
export const getStoredTaskLogs = async (): Promise<TaskLog[]> => {
  const logs = await getData<TaskLog>(KEYS.TASK_LOGS);
  logs.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());
  return logs;
};

export const getTaskLogs = async (templateId?: string): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Serve the full log list from the in-memory cache when warm — the History
  // view re-reads it on every open and a full-collection fetch is expensive.
  if (!templateId) {
    const cached = getCached<TaskLog[]>(CACHE_KEYS.TASK_LOGS);
    if (cached) return cached;
  }

  try {
    await refreshAuthToken();

    let q;

    if (templateId) {
      // Query with template filter - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where('user_id', '==', user.uid),
        where('template_id', '==', templateId)
      );
    } else {
      // Query all user's logs - no orderBy to avoid composite index
      q = query(collection(db, TASK_LOGS_COLLECTION), where('user_id', '==', user.uid));
    }

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      done_at: convertTimestamp(doc.data().done_at),
      created_at: convertTimestamp(doc.data().created_at),
    })) as TaskLog[];

    // Sort in-memory by done_at descending
    logs.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());

    // Cache locally (in-memory for fast re-reads, AsyncStorage for offline).
    // Both caches hold the FULL log list, so a template-filtered result must
    // never be written to either — doing so would drop unrelated history from
    // offline views, backups, and delete cascades. Same invariant that
    // getPlantTaskLogs documents below.
    if (!templateId) {
      setCached(CACHE_KEYS.TASK_LOGS, logs);
      await setData(KEYS.TASK_LOGS, logs);
    }

    return logs;
  } catch (error) {
    logger.warn('Failed to fetch task logs, using cached data', error as Error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    const filtered = templateId
      ? cachedLogs.filter((log) => log.template_id === templateId)
      : cachedLogs;
    filtered.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());
    return filtered;
  }
};

/**
 * Get one plant's task logs — much cheaper than getTaskLogs(), which fetches
 * every log the user owns just to filter it down to a single plant.
 *
 * Two equality filters with no orderBy (sorted in memory instead), matching the
 * template-filtered branch of getTaskLogs, so no composite index is required.
 *
 * This deliberately never writes KEYS.TASK_LOGS or CACHE_KEYS.TASK_LOGS —
 * those hold the *full* log list that getStoredTaskLogs, the delete cascades
 * and backup.ts read, and a plant-scoped subset would corrupt them.
 */
export const getPlantTaskLogs = async (plantId: string): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `${PLANT_TASK_LOGS_CACHE_PREFIX}${plantId}`;
  const cached = getCached<TaskLog[]>(cacheKey);
  if (cached) return cached;

  try {
    await refreshAuthToken();

    const q = query(
      collection(db, TASK_LOGS_COLLECTION),
      where('user_id', '==', user.uid),
      where('plant_id', '==', plantId)
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      done_at: convertTimestamp(d.data().done_at),
      created_at: convertTimestamp(d.data().created_at),
    })) as TaskLog[];

    logs.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());

    setCached(cacheKey, logs);
    return logs;
  } catch (error) {
    logger.warn('Failed to fetch plant task logs, using cached data', error as Error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    const filtered = cachedLogs.filter((log) => log.plant_id === plantId);
    filtered.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());
    return filtered;
  }
};

/**
 * Get only today's task logs — much cheaper than getTaskLogs() which
 * fetches the entire history.  Uses a Firestore date-range filter so
 * only relevant docs cross the wire.
 */
export const getTodayTaskLogs = async (): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Return fresh in-memory data if available
  const cached = getCached<TaskLog[]>(CACHE_KEYS.TODAY_TASK_LOGS);
  if (cached) return cached;

  const todayKey = farmDateKey(new Date());
  const tomorrowKey = todayKey ? addDaysToDateKey(todayKey, 1) : null;
  const today = todayKey ? farmDateTimeFromKey(todayKey, 0) : null;
  const todayEnd = tomorrowKey ? farmDateTimeFromKey(tomorrowKey, 0) : null;
  if (!today || !todayEnd) return [];

  try {
    const q = query(
      collection(db, TASK_LOGS_COLLECTION),
      where('user_id', '==', user.uid),
      where('done_at', '>=', Timestamp.fromDate(today)),
      where('done_at', '<', Timestamp.fromDate(todayEnd))
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });

    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      done_at: convertTimestamp(d.data().done_at),
      created_at: convertTimestamp(d.data().created_at),
    })) as TaskLog[];

    logs.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());

    setCached(CACHE_KEYS.TODAY_TASK_LOGS, logs);
    return logs;
  } catch (error) {
    logger.warn('Failed to fetch today logs, using cached data', error as Error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    return cachedLogs.filter((log) => {
      const logDate = new Date(log.done_at);
      return logDate >= today && logDate < todayEnd;
    });
  }
};

/**
 * Warm read of today's tasks for an instant first paint: the fresh in-memory
 * cache if present, otherwise the AsyncStorage copy filtered to today's window.
 * Mirrors the offline fallback in `getTodayTasks` but never touches the network.
 */
export const getStoredTodayTasks = async (): Promise<TaskTemplate[]> => {
  const cached = getCached<TaskTemplate[]>(CACHE_KEYS.TODAY_TASKS);
  if (cached) return cached;

  const todayKey = farmDateKey(new Date());
  const stored = await getData<TaskTemplate>(KEYS.TASKS);
  const filtered = stored.filter((task) => {
    if (!task.enabled || !task.next_due_at) return false;
    const dueKey = farmDateKey(task.next_due_at);
    return dueKey !== null && todayKey !== null && dueKey <= todayKey;
  });
  filtered.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
  return filtered;
};

/**
 * Warm read of today's task logs for an instant first paint: the fresh
 * in-memory cache if present, otherwise the AsyncStorage copy filtered to today.
 */
export const getStoredTodayTaskLogs = async (): Promise<TaskLog[]> => {
  const cached = getCached<TaskLog[]>(CACHE_KEYS.TODAY_TASK_LOGS);
  if (cached) return cached;

  const todayKey = farmDateKey(new Date());
  const stored = await getData<TaskLog>(KEYS.TASK_LOGS);
  return stored.filter((log) => farmDateKey(log.done_at) === todayKey);
};

export interface SyncCareTasksResult {
  created: TaskType[];
  updated: TaskType[];
}

export const syncCareTasksForPlant = async (plant: Plant): Promise<SyncCareTasksResult> => {
  const result: SyncCareTasksResult = { created: [], updated: [] };
  if (!plant?.id) return result;

  // Archived plants have their tasks disabled in archivePlant() — skip sync.
  if (isPlantArchived(plant)) return result;

  // Every care type the plant could have a template for, with its on/off intent.
  // Disabled types are kept (not filtered out) so an existing template can be
  // flipped to enabled: false below — otherwise turning a care type off would
  // leave a stale "Active" task on the Care Plan and detail screen.
  const desiredFrequencies: {
    taskType: TaskType;
    frequency: number | null | undefined;
    enabled: boolean;
  }[] = [
    {
      taskType: 'water',
      frequency: resolveCareInterval(plant, 'watering'),
      enabled: plant.watering_enabled !== false,
    },
    {
      taskType: 'fertilise',
      frequency: resolveCareInterval(plant, 'fertilising'),
      enabled: plant.fertilising_enabled !== false,
    },
    {
      taskType: 'prune',
      frequency: resolveCareInterval(plant, 'pruning'),
      enabled: plant.pruning_enabled !== false,
    },
  ];

  // For coconut trees, auto-derive a Harvest task from the tree's age.
  // harvestFrequencyDays === 0 means the tree is not yet bearing.
  if (plant.plant_type === 'coconut_tree' && plant.planting_date) {
    const ageInfo = getCoconutAgeInfo(plant.planting_date);
    if (ageInfo && ageInfo.harvestFrequencyDays > 0) {
      desiredFrequencies.push({
        taskType: 'harvest',
        frequency: ageInfo.harvestFrequencyDays,
        enabled: true,
      });
    }
  }

  // For perennial plants (Type 2), maintain a recurring "harvest_leaves" task
  // so the user is prompted to log leaf/produce weight on a fixed cycle.
  // Default 14-day cycle; permanent plants use their own harvest cadence (coconut above).
  if (plant.lifecycle_type === 'perennial') {
    desiredFrequencies.push({
      taskType: 'harvest_leaves',
      frequency: 14,
      enabled: true,
    });
  }

  const existingTasks = await getTaskTemplates();
  // Only templates sync owns. A manually-created task for this plant is left
  // completely alone — not re-dated, not disabled as a "duplicate" — so the
  // farmer's own schedule survives every plant save. See isSyncOwnedTemplate.
  const plantTasks = existingTasks.filter(
    (task) => task.plant_id === plant.id && isSyncOwnedTemplate(task)
  );
  const plantCreatedAt = parseDateValue(plant.created_at);

  for (const item of desiredFrequencies) {
    const { taskType, enabled } = item;
    const frequency =
      typeof item.frequency === 'number' && Number.isFinite(item.frequency) && item.frequency > 0
        ? item.frequency
        : null;
    // Collect every template of this type for the plant. Using filter (not a
    // single find) is deliberate: if duplicate templates ever got created for
    // the same plant + task type, all of them must be reconciled — otherwise a
    // stale duplicate keeps reading "Active" (and firing reminders) after the
    // care type is turned off.
    const matching = plantTasks.filter((task) => task.task_type === taskType);

    // Care type switched off by the farmer: disable every existing template so
    // none linger on the Care Plan / detail screen and no reminders fire.
    if (!enabled) {
      let changed = false;
      for (const task of matching) {
        if (task.enabled) {
          await updateTaskTemplate(task.id, { enabled: false });
          changed = true;
        }
      }
      if (changed) result.updated.push(taskType);
      continue;
    }

    // No interval could be resolved — not even a plant-type default, so the
    // plant type is unrecognised. That is "unknown", not "switched off": leave
    // whatever templates exist exactly as they are rather than disabling work
    // the farmer is doing. Absence is not evidence (see CLAUDE.md), and this is
    // the one branch a recovery action must never take.
    if (frequency === null) continue;

    // Apply the farm zone's season multiplier for water tasks. frequencyDays
    // stored remains the user-configured base so the user's intent is preserved
    // across seasons; only next_due_at is adjusted. The shared helper keeps this
    // in step with the listing/alerts overdue math — and, because that helper
    // now prefers the multiplier recorded at the last watering, a plant keeps
    // the cadence it was actually put on rather than being re-derived into a
    // different one the moment the calendar crosses a season.
    const effectiveFrequency =
      taskType === 'water' ? getEffectiveWateringIntervalDays(plant) ?? frequency : frequency;
    const nextDueAt = computeNextDueAt(plant, taskType, effectiveFrequency);

    // Keep the first template as canonical and disable any duplicates so only
    // one enabled template of this type survives.
    const [existing, ...duplicates] = matching;
    let disabledDuplicate = false;
    for (const dup of duplicates) {
      if (dup.enabled) {
        await updateTaskTemplate(dup.id, { enabled: false });
        disabledDuplicate = true;
      }
    }
    if (disabledDuplicate) result.updated.push(taskType);

    if (existing) {
      const updates: Partial<TaskTemplate> = {};
      if (existing.frequency_days !== frequency) {
        updates.frequency_days = frequency;
        updates.next_due_at = nextDueAt;
      }
      if (!existing.enabled) {
        // Re-enabling always means the schedule is resuming after a pause — a
        // restored plant, or a care type switched back on — so the stored due
        // date is stale by however long the gap was. Re-base it, or a plant
        // restored after three months returns showing three months of overdue
        // work nobody was expected to do. `computeNextDueAt` caps at today, so
        // the task comes back due today rather than backdated.
        updates.enabled = true;
        updates.next_due_at = nextDueAt;
      }
      const existingDueDate = parseDateValue(existing.next_due_at);
      if (!existingDueDate) {
        updates.next_due_at = nextDueAt;
      } else if (plantCreatedAt && existingDueDate < plantCreatedAt) {
        updates.next_due_at = nextDueAt;
      } else if (
        TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[taskType] !== undefined &&
        !parseDateValue(getLastCareDate(plant, taskType)) &&
        existingDueDate > new Date(nextDueAt)
      ) {
        // Older builds seeded the first due date from "now" instead of the
        // planting date; pull never-completed tasks back into agreement.
        // Only for task types with a plant last-care field — completions of
        // other types (harvest_leaves) are invisible on the plant doc.
        updates.next_due_at = nextDueAt;
      }
      if (Object.keys(updates).length > 0) {
        await updateTaskTemplate(existing.id, updates);
        result.updated.push(taskType);
      }
      continue;
    }

    await createTaskTemplate({
      plant_id: plant.id,
      task_type: taskType,
      frequency_days: frequency,
      next_due_at: nextDueAt,
      enabled: true,
      preferred_time: null,
      source: 'auto',
    });
    result.created.push(taskType);
  }

  return result;
};

export interface RebuildCareTasksResult {
  plantsProcessed: number;
  created: number;
  updated: number;
  failed: number;
}

/**
 * Rebuild every plant's care templates from its care profile and last-care dates.
 *
 * Templates are derived data, so a plant whose templates were lost can have them
 * regenerated without a backup. This is a thin fan-out over `syncCareTasksForPlant`
 * rather than a second scheduling implementation, so the rebuilt due dates match
 * exactly what a normal plant save would produce.
 *
 * Deliberately not wired to app startup: an automatic writer that reshapes task
 * data without the farmer asking is what made a silent loss hard to notice in the
 * first place. Call it from an explicit user action.
 */
export const rebuildCareTasksForAllPlants = async (
  plants: Plant[],
  onProgress?: (done: number, total: number) => void
): Promise<RebuildCareTasksResult> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const result: RebuildCareTasksResult = {
    plantsProcessed: 0,
    created: 0,
    updated: 0,
    failed: 0,
  };

  // Sequential on purpose: `syncCareTasksForPlant` reads the full template list
  // per plant, and running them in parallel would race those reads against each
  // other's writes and re-create duplicates it is meant to reconcile.
  for (const plant of plants) {
    try {
      const synced = await syncCareTasksForPlant(plant);
      result.created += synced.created.length;
      result.updated += synced.updated.length;
    } catch (error) {
      result.failed += 1;
      logger.warn(`Failed to rebuild care tasks for plant ${plant.id}`, error as Error);
    }
    result.plantsProcessed += 1;
    onProgress?.(result.plantsProcessed, plants.length);
  }

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);
  logger.info(
    `Care task rebuild: ${result.created} created, ${result.updated} updated, ${result.failed} failed across ${result.plantsProcessed} plants`
  );

  return result;
};

/**
 * PHASE 2: Calculate task priority based on plant health, growth stage, and overdue status
 */
export const calculateTaskPriority = (
  task: TaskTemplate,
  plant: Plant | null
): 'critical' | 'high' | 'medium' | 'low' => {
  const daysOverdue = calendarDaysOverdue(task);
  if (daysOverdue !== null && daysOverdue > 2) return 'critical';
  if (daysOverdue !== null) return 'high';
  if (!plant) return 'medium';

  // Compute effective growth stage (B.4 auto-progression)
  const profile = getPlantCareProfile(plant.plant_variety ?? '', plant.plant_type);
  const effectiveStage = getEffectiveGrowthStage(plant, profile).stage;

  // Health and crop stage only raise actions that are plausibly relevant. A
  // stressed plant does not make pruning/repotting/fertilising automatically
  // critical; the farmer still checks the observed cause first.
  if (
    (plant.health_status === 'sick' || plant.health_status === 'stressed') &&
    (task.task_type === 'water' || task.task_type === 'spray')
  ) {
    return 'high';
  }

  if (
    (effectiveStage === 'flowering' || effectiveStage === 'fruiting') &&
    (task.task_type === 'harvest' ||
      task.task_type === 'harvest_leaves' ||
      task.task_type === 'water')
  ) {
    return 'high';
  }

  // Low priority for dormant plants
  if (effectiveStage === 'dormant') {
    return 'low';
  }

  return 'medium';
};

/**
 * Get seasonal care reminder for plant
 * (Simplified version - seasonal care profiles removed)
 */
export const getSeasonalCareReminder = (
  plant: Plant,
  zone?: import('@/config/zones').AgroClimaticZone
): string | null => {
  if (!zone) return null;
  const season = getCurrentSeason(undefined, zone);

  // Provide season-specific advice for Kanyakumari conditions
  if ((season === 'sw_monsoon' || season === 'ne_monsoon') && plant.space_type === 'pot') {
    return season === 'ne_monsoon'
      ? 'NE Monsoon: heaviest rains — check drainage daily, move pots under cover if needed'
      : 'SW Monsoon: ensure proper drainage to prevent waterlogging';
  }

  if (season === 'ne_monsoon' && (plant.space_type === 'bed' || plant.space_type === 'ground')) {
    return 'NE Monsoon season — reduce watering; natural rainfall is usually sufficient';
  }

  if (season === 'summer') {
    return 'Peak summer heat — water early morning or after sunset to reduce evaporation';
  }

  if (season === 'cool_dry') {
    return 'Cool dry period — good time to apply organic mulch and prepare beds for the next season';
  }

  return null;
};

/**
 * Disable (but do not delete) every task template for the given plants.
 *
 * The reversible counterpart to `deleteTasksForPlantIds`: used when a plant is
 * archived or soft-deleted, so its tasks go quiet while the templates and their
 * completion history survive for a later restore. Reads templates once and
 * commits chunked batches, so soft-deleting a whole bed costs one pass rather
 * than one write per template.
 */
export const disableTasksForPlantIds = async (plantIds: string[]): Promise<void> => {
  const uniquePlantIds = Array.from(
    new Set(plantIds.filter((plantId) => plantId && plantId.trim() !== ''))
  );
  if (uniquePlantIds.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const plantIdSet = new Set(uniquePlantIds);
  const templates = await getTaskTemplates();
  const toDisable = templates.filter(
    (task) => task.plant_id && plantIdSet.has(task.plant_id) && task.enabled
  );
  if (toDisable.length === 0) return;

  const MAX_PER_BATCH = 500;
  for (let i = 0; i < toDisable.length; i += MAX_PER_BATCH) {
    const chunk = toDisable.slice(i, i + MAX_PER_BATCH);
    const batch = writeBatch(db);
    for (const task of chunk) {
      batch.update(doc(db, TASKS_COLLECTION, task.id), { enabled: false });
    }
    await writeOrQueue(
      chunk.map((task) => ({
        collection: TASKS_COLLECTION,
        docId: task.id,
        op: 'update' as const,
        payload: { enabled: false },
      })),
      () => batch.commit()
    );
  }

  const disabledIds = new Set(toDisable.map((task) => task.id));
  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  if (cachedTasks.length > 0) {
    await setData(
      KEYS.TASKS,
      cachedTasks.map((task) => (disabledIds.has(task.id) ? { ...task, enabled: false } : task))
    );
  }

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);
};

/**
 * Disable (but do not delete) all task templates for a given plant.
 * Called when a plant is archived after final harvest — tasks go quiet
 * while the record is preserved for rotation history.
 */
export const disableTasksForPlant = async (plantId: string): Promise<void> => {
  await disableTasksForPlantIds([plantId]);
};

// ─── Pre-Monsoon Batch Tasks ─────────────────────────────────────────────────

// Re-export pure pre-monsoon functions from utility (avoids Firebase dep in tests)
export { getDaysToSWMonsoon, getPreMonsoonTasks } from '@/utils/preMonsoonTasks';
export type { PreMonsoonTaskItem } from '@/utils/preMonsoonTasks';

// Re-export bed task sync for consumers that import from tasks.ts
export { syncBedTasksFromPlants } from './BedTaskResolver';
