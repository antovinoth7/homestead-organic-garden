/**
 * The Care Plan's filter, sort and facet contract — one place that decides what
 * the task list shows and what each filter chip's count means.
 *
 * Mirrors `plantFilters.ts` / `filterAndSortBeds.ts`: the logic lives outside
 * the hook so it is directly unit-testable, and the screen and the filter sheet
 * share one filter shape instead of each declaring their own.
 *
 * Nothing a task carries says where it is, how urgent it is, or which bed it
 * belongs to — all three are *derived* (`plant_id` → `Plant.location`, `bed_id`
 * → `Bed.parent_location`, `priority_level` → `calculateTaskPriority`). Those
 * resolutions are expensive and live in React/Firestore-facing code, so they
 * arrive through `CareTaskContext` rather than being redone here. That also
 * keeps this module free of any service import.
 *
 * `countCareFacets` counts each category against every *other* active filter, so
 * a chip answers "how many would I get if I picked this?" — the only reading
 * that stays true while the other filters move. A category never filters its own
 * options, or picking one would zero the rest.
 *
 * Pure — no React, no services — so it is directly unit-testable.
 */

import type { TaskTemplate, TaskType } from '@/types/database.types';
import type { PlotAssignable } from '@/utils/plotGrouping';
import { calendarDaysOverdue, isFutureTask } from '@/services/taskSchedulingLogic';
import { farmDateKey } from '@/utils/farmDate';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Where a task sits relative to today, in farm-local calendar days. The same
 * three-way split the Care Plan already renders as its Overdue, Today and
 * day-grouped upcoming sections — the filter previously offered only the first.
 */
export type TaskDueStatus = 'overdue' | 'today' | 'upcoming';

/**
 * `unset` is the bucket for `preferred_time: null`, which is what every
 * auto-generated template carries — only a hand-created task names a time. It is
 * a real, selectable option rather than a hidden default, so those tasks stay
 * reachable while a time filter is active.
 */
export type TaskTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'unset';

export type TaskSortOption = 'due' | 'priority' | 'plant';

/** Priority order, most urgent first — the sort order and the chip order. */
export const TASK_PRIORITY_ORDER: readonly TaskPriority[] = ['critical', 'high', 'medium', 'low'];

/** Most urgent first, so the chips read in the order the list is worked. */
export const TASK_DUE_STATUS_ORDER: readonly TaskDueStatus[] = ['overdue', 'today', 'upcoming'];

export const TASK_DUE_STATUS_LABELS: Record<TaskDueStatus, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  upcoming: 'Upcoming',
};

export const TASK_TIME_OF_DAY_ORDER: readonly TaskTimeOfDay[] = [
  'morning',
  'afternoon',
  'evening',
  'unset',
];

export const TASK_TIME_OF_DAY_LABELS: Record<TaskTimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  unset: 'Any time',
};

export const TASK_SORT_LABELS: Record<TaskSortOption, string> = {
  due: 'Due date',
  priority: 'Priority',
  plant: 'Plant',
};

/**
 * Every dimension the task list is narrowed by, apart from the search box, the
 * Pots & Ground / Beds segment and the week/month window — those three are
 * applied elsewhere in the pipeline and are not user-clearable filters.
 *
 * An empty set means "all", never "none", so the cleared state shows everything.
 */
export interface CareTaskFilters {
  taskTypes: Set<TaskType>;
  dueStatuses: Set<TaskDueStatus>;
  /** Parent-location names, or `UNASSIGNED_PLOT_ID`. */
  plotIds: Set<string>;
  bedIds: Set<string>;
  priorities: Set<TaskPriority>;
  times: Set<TaskTimeOfDay>;
}

/**
 * A fresh cleared filter set. A factory rather than a shared constant on
 * purpose: the Sets are mutable, so a single exported instance would be handed
 * to every caller and one stray mutation would silently reshape everyone's
 * filters.
 */
export const emptyCareTaskFilters = (): CareTaskFilters => ({
  taskTypes: new Set(),
  dueStatuses: new Set(),
  plotIds: new Set(),
  bedIds: new Set(),
  priorities: new Set(),
  times: new Set(),
});

/**
 * The derived facts the filters need, resolved once by the caller.
 *
 * `resolvePriority` in particular must be memoised upstream: the real
 * implementation loads a care profile and computes a growth stage per task, so
 * calling it inside a sort comparator would repeat that work O(n log n) times.
 */
export interface CareTaskContext {
  resolvePlotId: (task: PlotAssignable) => string;
  resolveBedId: (task: TaskTemplate) => string | null;
  resolvePriority: (task: TaskTemplate) => TaskPriority;
  /** What the task is about — the plant's name, or the bed's for bed tasks. */
  subjectLabel: (task: TaskTemplate) => string;
}

/** A filter that can be held back, so a facet does not count its own options. */
export type CareFilterCategory = keyof CareTaskFilters;

export interface CareTaskFacetCounts {
  taskTypes: Record<string, number>;
  dueStatuses: Record<TaskDueStatus, number>;
  plotIds: Record<string, number>;
  bedIds: Record<string, number>;
  priorities: Record<TaskPriority, number>;
  times: Record<TaskTimeOfDay, number>;
}

/**
 * Which time-of-day bucket a task falls in. Anything other than the three named
 * values — including the `null` every synced template is created with — reads as
 * `unset` rather than being guessed from the task type: inferring "spraying is a
 * morning job" would be new agronomic policy, not a display detail.
 */
export function taskTimeOfDay(task: TaskTemplate): TaskTimeOfDay {
  const value = task.preferred_time;
  if (value === 'morning' || value === 'afternoon' || value === 'evening') return value;
  return 'unset';
}

/**
 * Which side of today a task falls on. `null` when its due date is unusable.
 *
 * Built from `calendarDaysOverdue` and `isFutureTask` rather than re-deriving
 * the date comparisons, so "overdue" and "not due yet" mean exactly here what
 * they mean everywhere else in the schedule — the same two helpers already gate
 * early completion and skipping.
 */
export function taskDueStatus(task: TaskTemplate, now?: Date): TaskDueStatus | null {
  const at = now ?? new Date();
  // Guarded first: neither helper below distinguishes "not late / not future"
  // from "no usable date at all", so an unparseable due date would otherwise
  // fall through and be filed under work that is due right now.
  if (farmDateKey(task.next_due_at) === null) return null;
  if (calendarDaysOverdue(task, at) !== null) return 'overdue';
  if (isFutureTask(task, at)) return 'upcoming';
  return 'today';
}

/**
 * Applies every filter. `except` holds one category back — `countCareFacets`
 * uses it, nothing else should need to.
 *
 * `now` is injectable so the tests do not depend on the wall clock.
 */
export function filterCareTasks(
  tasks: TaskTemplate[],
  filters: CareTaskFilters,
  ctx: CareTaskContext,
  except?: CareFilterCategory,
  now?: Date
): TaskTemplate[] {
  const at = now ?? new Date();

  return tasks.filter((task) => {
    if (!task) return false;
    if (
      except !== 'taskTypes' &&
      filters.taskTypes.size > 0 &&
      !filters.taskTypes.has(task.task_type)
    ) {
      return false;
    }
    if (except !== 'dueStatuses' && filters.dueStatuses.size > 0) {
      const status = taskDueStatus(task, at);
      if (status === null || !filters.dueStatuses.has(status)) return false;
    }
    // Resolved through `groupByPlot`, the same join the Today screen's plot
    // cards use — so a bed-level task lands on its bed's plot, and a plot name
    // is matched on the exact parent segment rather than by substring.
    if (
      except !== 'plotIds' &&
      filters.plotIds.size > 0 &&
      !filters.plotIds.has(ctx.resolvePlotId(task))
    ) {
      return false;
    }
    if (except !== 'bedIds' && filters.bedIds.size > 0) {
      const bedId = ctx.resolveBedId(task);
      if (bedId === null || !filters.bedIds.has(bedId)) return false;
    }
    if (
      except !== 'priorities' &&
      filters.priorities.size > 0 &&
      !filters.priorities.has(ctx.resolvePriority(task))
    ) {
      return false;
    }
    if (except !== 'times' && filters.times.size > 0 && !filters.times.has(taskTimeOfDay(task))) {
      return false;
    }
    return true;
  });
}

function tally<T extends string>(
  tasks: TaskTemplate[],
  valueOf: (task: TaskTemplate) => T | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    const value = valueOf(task);
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

/**
 * How many tasks each filter option would yield, given the others. Every
 * category is counted against the list narrowed by everything but itself.
 */
export function countCareFacets(
  tasks: TaskTemplate[],
  filters: CareTaskFilters,
  ctx: CareTaskContext,
  now?: Date
): CareTaskFacetCounts {
  const at = now ?? new Date();
  const byPriority = tally(
    filterCareTasks(tasks, filters, ctx, 'priorities', at),
    ctx.resolvePriority
  );
  const byTime = tally(filterCareTasks(tasks, filters, ctx, 'times', at), taskTimeOfDay);
  const byDueStatus = tally(filterCareTasks(tasks, filters, ctx, 'dueStatuses', at), (t) =>
    taskDueStatus(t, at)
  );

  return {
    taskTypes: tally(filterCareTasks(tasks, filters, ctx, 'taskTypes', at), (t) => t.task_type),
    dueStatuses: {
      overdue: byDueStatus.overdue ?? 0,
      today: byDueStatus.today ?? 0,
      upcoming: byDueStatus.upcoming ?? 0,
    },
    plotIds: tally(filterCareTasks(tasks, filters, ctx, 'plotIds', at), ctx.resolvePlotId),
    bedIds: tally(filterCareTasks(tasks, filters, ctx, 'bedIds', at), ctx.resolveBedId),
    priorities: {
      critical: byPriority.critical ?? 0,
      high: byPriority.high ?? 0,
      medium: byPriority.medium ?? 0,
      low: byPriority.low ?? 0,
    },
    times: {
      morning: byTime.morning ?? 0,
      afternoon: byTime.afternoon ?? 0,
      evening: byTime.evening ?? 0,
      unset: byTime.unset ?? 0,
    },
  };
}

/**
 * Orders the task list. `due` is the long-standing default and must stay exactly
 * as it was — due date, then task type — so turning the new Sort By control back
 * to it restores the order farmers already know. The other two break their ties
 * on the due date for the same reason.
 */
export function sortCareTasks(
  tasks: TaskTemplate[],
  sortBy: TaskSortOption,
  ctx: CareTaskContext
): TaskTemplate[] {
  const dueTime = (task: TaskTemplate): number => new Date(task.next_due_at).getTime();

  const byDue = (a: TaskTemplate, b: TaskTemplate): number => {
    const dateA = dueTime(a);
    const dateB = dueTime(b);
    if (dateA !== dateB) return dateA - dateB;
    return a.task_type.localeCompare(b.task_type);
  };

  if (sortBy === 'due') return [...tasks].sort(byDue);

  if (sortBy === 'priority') {
    const rank = (task: TaskTemplate): number =>
      TASK_PRIORITY_ORDER.indexOf(ctx.resolvePriority(task));
    return [...tasks].sort((a, b) => {
      const rankA = rank(a);
      const rankB = rank(b);
      if (rankA !== rankB) return rankA - rankB;
      return byDue(a, b);
    });
  }

  return [...tasks].sort((a, b) => {
    const nameDiff = ctx.subjectLabel(a).localeCompare(ctx.subjectLabel(b));
    if (nameDiff !== 0) return nameDiff;
    return byDue(a, b);
  });
}

/** Which half of the plan a segment shows: bed-level work, or everything else. */
export type BedSegment = 'bed' | 'other';

/**
 * Whether a task belongs to the given segment.
 *
 * The Care Plan splits its list in two — Beds shows bed-level work, Pots &
 * Ground everything else — and the visible list, the segment badges and the
 * filter chip counts must all apply this one rule. When the chips counted
 * against a different scope than the list, a chip read "Watering (30)" in a
 * segment that then showed 12 rows.
 */
export function matchesBedSegment(bedId: string | null, segment: BedSegment): boolean {
  return segment === 'bed' ? bedId !== null : bedId === null;
}

/**
 * Overdue work either side of the bed/other split, counted *before* the segment
 * narrows the list to one of them.
 *
 * The Care Plan's Overdue section only ever holds the open segment's share,
 * while the counts that send a farmer to it — the Today plot card's "N Overdue"
 * — are the whole farm's. This is what lets the plan tell "there is no overdue
 * work" from "it is all in the segment you are not looking at", and follow it.
 *
 * `resolveBedId` is the caller's, because a task's bed is derived (a bed-level
 * task carries one; a bed *plant's* task resolves through its plant) and that
 * resolution lives in React-facing code. `now` is injectable for the tests.
 */
export function countOverdueBySegment(
  tasks: TaskTemplate[],
  resolveBedId: (task: TaskTemplate) => string | null,
  now?: Date
): { bed: number; other: number } {
  const at = now ?? new Date();
  let bed = 0;
  let other = 0;
  for (const task of tasks) {
    if (calendarDaysOverdue(task, at) === null) continue;
    if (resolveBedId(task) !== null) bed += 1;
    else other += 1;
  }
  return { bed, other };
}

/** How many filters are narrowing the list — drives the toolbar's badge. */
export function countActiveCareFilters(filters: CareTaskFilters): number {
  return (
    (filters.taskTypes.size > 0 ? 1 : 0) +
    (filters.dueStatuses.size > 0 ? 1 : 0) +
    (filters.plotIds.size > 0 ? 1 : 0) +
    (filters.bedIds.size > 0 ? 1 : 0) +
    (filters.priorities.size > 0 ? 1 : 0) +
    (filters.times.size > 0 ? 1 : 0)
  );
}

/** Adds or removes one value from a Set-valued filter, without mutating it. */
export function toggleSetValue<T>(source: Set<T>, value: T): Set<T> {
  const next = new Set(source);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
