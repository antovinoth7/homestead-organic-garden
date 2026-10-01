import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Animated, AppState, Easing } from 'react-native';
import { markTaskDone, markTasksDone } from '@/services/tasks';
import type { TaskTemplate } from '@/types/database.types';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { logger } from '@/utils/logger';
import {
  PendingCompletionQueue,
  type PendingCompletionSnapshot,
} from '@/utils/pendingCompletionQueue';

/** How long a tick stays undoable before it is saved. */
export const UNDO_WINDOW_MS = 5000;

export interface CompletionSaveResult {
  tasks: TaskTemplate[];
  succeeded: number;
  failed: number;
}

interface Options {
  /** Runs after each save settles — reload the plan, count the work done. */
  onSaved: (result: CompletionSaveResult) => Promise<void> | void;
  /** A save threw outright (not a partial failure). */
  onError: (tasks: TaskTemplate[], error: unknown) => void;
}

export interface UsePendingCompletionsReturn {
  /** Ticked, still inside the Undo window. */
  pending: readonly TaskTemplate[];
  /** Being saved; shown as done but no longer undoable. */
  saving: readonly TaskTemplate[];
  /** True while a task is waiting or saving — hide it from the open lists. */
  isDone: (taskId: string) => boolean;
  /** Ticks `tasks` and opens a fresh Undo window. */
  complete: (tasks: TaskTemplate[]) => void;
  /** Takes back the whole waiting batch. */
  undo: () => void;
  /** Takes back one waiting task (the green tick in Done today). */
  undoOne: (taskId: string) => void;
  /** Saves the waiting batch now — on blur, before navigating away. */
  flush: () => Promise<void>;
  /** 1 → 0 across the Undo window, for the toast's draining bar. */
  progress: Animated.Value;
}

/**
 * One-tap completion with Undo, saved after the window rather than reversed on
 * Undo — see `PendingCompletionQueue` for why. Saving also happens when the app
 * goes to the background and when the screen unmounts; the screen flushes on
 * blur itself, since only it knows its focus.
 */
export function usePendingCompletions({ onSaved, onError }: Options): UsePendingCompletionsReturn {
  const [queue] = useState(() => new PendingCompletionQueue<TaskTemplate>(UNDO_WINDOW_MS));
  const snapshot: PendingCompletionSnapshot<TaskTemplate> = useSyncExternalStore(
    queue.subscribe,
    queue.getSnapshot
  );
  const progress = useAnimatedValue(0);

  // Handlers are re-registered whenever the screen's callbacks change, so a
  // save always reloads through the current `loadData`.
  useEffect(() => {
    queue.setHandlers({
      commit: async (tasks) => {
        let succeeded = 0;
        let failed = 0;
        if (tasks.length === 1 && tasks[0]) {
          // `markTaskDone` keeps the already-done-today guard for a lone tick.
          const marked = await markTaskDone(tasks[0]);
          succeeded = marked ? 1 : 0;
          failed = marked ? 0 : 1;
        } else {
          ({ succeeded, failed } = await markTasksDone(tasks));
        }
        logger.debug('Care plan saved ticked tasks', {
          tags: ['calendar', 'completion'],
          metadata: { count: tasks.length, succeeded, failed },
        });
        await onSaved({ tasks, succeeded, failed });
      },
      onError,
    });
  }, [queue, onSaved, onError]);

  // The app going to the background may be the last chance to save.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void queue.flush();
    });
    return () => subscription.remove();
  }, [queue]);

  // Unmount saves too — a tick must never be lost to navigation.
  useEffect(() => () => void queue.flush(), [queue]);

  // Drain the toast's bar across the window, restarting with each new batch.
  const pendingCount = snapshot.pending.length;
  useEffect(() => {
    if (pendingCount === 0) {
      progress.stopAnimation();
      progress.setValue(0);
      return;
    }
    progress.setValue(1);
    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: UNDO_WINDOW_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [snapshot.pending, pendingCount, progress]);

  const isDone = useCallback((taskId: string) => queue.isDone(taskId), [queue]);
  const complete = useCallback((tasks: TaskTemplate[]) => queue.add(tasks), [queue]);
  const undo = useCallback(() => {
    queue.undo();
  }, [queue]);
  const undoOne = useCallback(
    (taskId: string) => {
      queue.undoOne(taskId);
    },
    [queue]
  );
  const flush = useCallback(() => queue.flush(), [queue]);

  return {
    pending: snapshot.pending,
    saving: snapshot.saving,
    isDone,
    complete,
    undo,
    undoOne,
    flush,
    progress,
  };
}
