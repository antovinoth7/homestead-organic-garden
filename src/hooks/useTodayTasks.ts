/**
 * Today-tasks hook (Phase C, C.11/C.15).
 *
 * Wraps the tasks service (load + complete) and exposes the derived summary
 * (per-type counts, donut segments, overdue list) the dashboard renders.
 * Follows the `useBedData` pattern: silent refresh, focus reload, explicit
 * loading/error states.
 */

import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { TaskTemplate, TaskLog } from '@/types/database.types';
import { getTodayTasks, getTodayTaskLogs, markTaskDone } from '@/services/tasks';
import {
  summarizeTodayTasks,
  computeDonutSegments,
  TodayTaskSummary,
  DonutSegment,
} from '@/utils/taskSummary';
import { logError } from '@/utils/errorLogging';

export interface UseTodayTasksResult {
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  summary: TodayTaskSummary;
  donutSegments: DonutSegment[];
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => void;
  /** Mark a task done and refresh in the background. Returns success. */
  complete: (template: TaskTemplate, notes?: string) => Promise<boolean>;
}

export function useTodayTasks(): UseTodayTasksResult {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const [tasksData, logsData] = await Promise.all([getTodayTasks(), getTodayTaskLogs()]);
      setTasks(tasksData);
      setTaskLogs(logsData);
    } catch (err) {
      logError('network', 'useTodayTasks: failed to load tasks', err as Error);
      setError('Failed to load tasks');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const complete = useCallback(
    async (template: TaskTemplate, notes?: string): Promise<boolean> => {
      try {
        const ok = await markTaskDone(template, notes);
        await load({ silent: true });
        return ok;
      } catch (err) {
        logError('network', 'useTodayTasks: failed to complete task', err as Error);
        return false;
      }
    },
    [load]
  );

  const summary = useMemo(() => summarizeTodayTasks(tasks, taskLogs), [tasks, taskLogs]);
  const donutSegments = useMemo(() => computeDonutSegments(summary), [summary]);

  return { tasks, taskLogs, summary, donutSegments, loading, error, refresh: load, complete };
}
