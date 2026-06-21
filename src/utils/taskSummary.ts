/**
 * Today-task summarization — pure logic (Phase C, C.11/C.15).
 *
 * Turns raw today task templates + today's completion logs into the per-type
 * counts and donut segments the dashboard needs. Extracted from the inline
 * memos in `TodayScreen` so `TodayProgressCard` / `useTodayTasks` can share it
 * and it can be unit-tested.
 */

import { TaskTemplate, TaskLog, TaskType } from '@/types/database.types';

export interface TaskTypeStat {
  type: TaskType;
  done: number;
  total: number;
  remaining: number;
  overdueCount: number;
}

export interface DonutSegment {
  key: TaskType;
  startAngle: number;
  sweep: number;
  doneSweep: number;
}

export interface TodayTaskSummary {
  totalTasks: number;
  completed: number;
  completionRate: number;
  overdueCount: number;
  /** Remaining (not-yet-done) overdue templates. */
  overdueTasks: TaskTemplate[];
  /** Remaining templates due today. */
  todayTasks: TaskTemplate[];
  typeStats: TaskTypeStat[];
}

function startOfToday(now: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * The single most-urgent remaining task for the dashboard "Up next" line: the
 * first not-yet-done overdue template, else the first due-today template, else
 * null when nothing is pending.
 */
export function getNextTask(summary: TodayTaskSummary): TaskTemplate | null {
  return summary.overdueTasks[0] ?? summary.todayTasks[0] ?? null;
}

/**
 * Drop items that reference a plant we don't know about. Tasks/logs with no
 * `plant_id` (bed- or farm-scoped) are always kept. Shared by the dashboard's
 * warm-cache first paint and its network refresh so both filter identically.
 */
export function filterToKnownPlants<T extends { plant_id?: string | null }>(
  items: T[],
  plantIds: Set<string>
): T[] {
  return items.filter((item) => !item.plant_id || plantIds.has(item.plant_id));
}

/**
 * Summarize today's tasks. `templates` are today's due/overdue templates,
 * `logs` are today's completion logs. Mirrors the previous TodayScreen stats.
 */
export function summarizeTodayTasks(
  templates: TaskTemplate[],
  logs: TaskLog[],
  now: number = Date.now()
): TodayTaskSummary {
  const completedTemplateIds = new Set(logs.map((l) => l.template_id));
  const today = startOfToday(now);
  const todayStr = new Date(now).toDateString();

  const overdueTasks = templates.filter((t) => {
    if (!t?.next_due_at || completedTemplateIds.has(t.id)) return false;
    return new Date(t.next_due_at) < today;
  });

  const todayTasks = templates.filter((t) => {
    if (!t?.next_due_at || completedTemplateIds.has(t.id)) return false;
    return new Date(t.next_due_at).toDateString() === todayStr;
  });

  // Total = unique template ids among remaining + completed.
  const taskIds = new Set(templates.map((t) => t.id));
  completedTemplateIds.forEach((id) => taskIds.add(id));
  const totalTasks = taskIds.size;
  const completed = completedTemplateIds.size;
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // Per-type stats.
  const remainingByType = new Map<TaskType, { remaining: number; overdue: number }>();
  for (const t of overdueTasks) {
    const e = remainingByType.get(t.task_type) ?? { remaining: 0, overdue: 0 };
    e.remaining += 1;
    e.overdue += 1;
    remainingByType.set(t.task_type, e);
  }
  for (const t of todayTasks) {
    const e = remainingByType.get(t.task_type) ?? { remaining: 0, overdue: 0 };
    e.remaining += 1;
    remainingByType.set(t.task_type, e);
  }
  const doneByType = new Map<TaskType, number>();
  for (const log of logs) {
    doneByType.set(log.task_type, (doneByType.get(log.task_type) ?? 0) + 1);
  }

  const allTypes = new Set<TaskType>();
  remainingByType.forEach((_, type) => allTypes.add(type));
  doneByType.forEach((_, type) => allTypes.add(type));

  const typeStats: TaskTypeStat[] = [];
  allTypes.forEach((type) => {
    const remaining = remainingByType.get(type)?.remaining ?? 0;
    const overdueCount = remainingByType.get(type)?.overdue ?? 0;
    const done = doneByType.get(type) ?? 0;
    typeStats.push({ type, done, total: done + remaining, remaining, overdueCount });
  });

  typeStats.sort((a, b) => {
    if (a.remaining > 0 && b.remaining === 0) return -1;
    if (b.remaining > 0 && a.remaining === 0) return 1;
    if (a.overdueCount > 0 && b.overdueCount === 0) return -1;
    if (b.overdueCount > 0 && a.overdueCount === 0) return 1;
    return b.total - a.total;
  });

  return {
    totalTasks,
    completed,
    completionRate,
    overdueCount: overdueTasks.length,
    overdueTasks,
    todayTasks,
    typeStats,
  };
}

/**
 * Compute donut segments (one arc per task type, full 360° = totalTasks).
 * `doneSweep` is the filled fraction of each type's arc.
 */
export function computeDonutSegments(summary: TodayTaskSummary): DonutSegment[] {
  if (summary.totalTasks === 0) return [];
  let angle = 0;
  return summary.typeStats.map((ts) => {
    const sweep = (ts.total / summary.totalTasks) * 360;
    const startAngle = angle;
    angle += sweep;
    const doneSweep = ts.total > 0 ? (ts.done / ts.total) * sweep : 0;
    return { key: ts.type, startAngle, sweep, doneSweep };
  });
}
