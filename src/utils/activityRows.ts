/**
 * Activity rows for the dashboard hero — pure logic.
 *
 * Turns the per-type stats from `taskSummary` into one row per task type,
 * ordered so the types that need action lead the list. The hero shows only the
 * first `HERO_VISIBLE_ROWS` (roughly the donut's height) and hides the rest
 * behind a "+N more" toggle, so the ordering is what guarantees an overdue or
 * pending type is never buried.
 */

import { TaskType } from '@/types/database.types';
import { TaskTypeStat } from '@/utils/taskSummary';
import { TASK_EMOJIS } from '@/utils/taskConstants';

/** Rows kept visible when collapsed — matches the hero donut's height. */
export const HERO_VISIBLE_ROWS = 3;

export interface ActivityRow {
  type: TaskType;
  done: number;
  total: number;
  remaining: number;
  overdue: number;
  /** Completed share of this type's bar, 0-100. 0 when nothing is scheduled. */
  donePct: number;
  /** Overdue share of this type's bar, 0-100. Drawn at the bar's right end. */
  overduePct: number;
}

/**
 * Action-first priority so the collapsed three rows are always the meaningful
 * ones: 0 = has overdue, 1 = pending today, 2 = done-only, 3 = nothing scheduled.
 */
function rowPriority(row: ActivityRow): number {
  if (row.overdue > 0) return 0;
  if (row.remaining > 0) return 1;
  if (row.total > 0) return 2;
  return 3;
}

/**
 * Build one row per known task type (types absent from `typeStats` become empty
 * rows), stable-sorted by priority with ties broken by TASK_EMOJIS declaration
 * order so the list doesn't reshuffle between renders.
 */
export function buildActivityRows(typeStats: TaskTypeStat[]): ActivityRow[] {
  const rows = (Object.keys(TASK_EMOJIS) as TaskType[]).map((type) => {
    const stat = typeStats.find((s) => s.type === type);
    const done = stat?.done ?? 0;
    const total = stat?.total ?? 0;
    const overdue = stat?.overdueCount ?? 0;
    return {
      type,
      done,
      total,
      remaining: stat?.remaining ?? 0,
      overdue,
      donePct: total > 0 ? (done / total) * 100 : 0,
      overduePct: total > 0 ? (overdue / total) * 100 : 0,
    };
  });

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rowPriority(a.row) - rowPriority(b.row) || a.index - b.index)
    .map((entry) => entry.row);
}

/** Compact number display: 0-99 exact, 100-999 → "99+", 1000+ → "1k"/"1.5k". */
export function fmtCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  if (n >= 100) return '99+';
  return String(n);
}
