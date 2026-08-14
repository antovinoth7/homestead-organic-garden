/**
 * Upcoming jobs per forecast day — the right-hand column of the forecast
 * overlay's seven rows.
 *
 * Task templates carry `next_due_at` but no plot id, so the caller passes the
 * `resolveTaskPlotId` returned by `groupByPlot`. Sharing that resolver is the
 * point: the overlay's counts and the plot card's "7 DUE" come from one join.
 *
 * What the two surfaces share: the `resolveTaskPlotId` join, the completion-log
 * subtraction (via `completedTemplateIds`), and known-plant scoping applied by
 * the caller. What they deliberately do not share: the bucketing timezone. Dates
 * here are the forecast's own provider buckets, because they are compared
 * against `WeatherForecast.daily[].date`; `taskSummary` buckets in device time
 * because it answers "what is due today" for the person holding the phone.
 *
 * A template appears once, on its `next_due_at`. `frequency_days` is not
 * projected across the window — a job repeating every two days shows on one row,
 * not three. That is intended, not an oversight.
 *
 * Pure — no React Native, no Firestore.
 */

import { TaskTemplate, TaskType } from '@/types/database.types';
import { PlotAssignable } from '@/utils/plotGrouping';
import { TASK_LABELS } from '@/utils/taskConstants';
import { FARM_TIMEZONE, forecastDateKeyFrom } from '@/utils/weatherWords';

export interface DayJobs {
  count: number;
  /** Templates already past due, folded into the first day of the window. */
  overdue: number;
  /** The task type with the most entries that day, for the "· water" suffix. */
  topType: TaskType | null;
}

export interface CountJobsOptions {
  /**
   * The forecast's own timezone. Its dates are provider buckets, so a due date
   * has to be resolved in that zone rather than the device's — otherwise a job
   * due late evening IST renders against the previous day's card abroad.
   */
  timeZone?: string;
  /** Templates already logged done today, so a day's count falls as work lands. */
  completedTemplateIds?: ReadonlySet<string>;
}

/**
 * Buckets one plot's enabled templates onto the forecast's dates. Anything due
 * before the window starts folds into the first day as `overdue` — it is work
 * the grower still has to fit in, so hiding it would understate the day.
 *
 * Pass only the dates that will actually be rendered. Folding overdue work onto
 * a `forecastDates[0]` the UI then filters out makes it vanish silently.
 */
export function countJobsByDate(
  templates: TaskTemplate[],
  resolveTaskPlotId: (task: PlotAssignable) => string,
  plotId: string,
  forecastDates: string[],
  options: CountJobsOptions = {}
): Map<string, DayJobs> {
  const result = new Map<string, DayJobs>();
  if (forecastDates.length === 0) return result;

  for (const date of forecastDates) result.set(date, { count: 0, overdue: 0, topType: null });

  const firstDate = forecastDates[0]!;
  const window = new Set(forecastDates);
  const typeTally = new Map<string, Map<TaskType, number>>();

  const timeZone = options.timeZone ?? FARM_TIMEZONE;

  for (const template of templates) {
    if (!template.enabled) continue;
    if (options.completedTemplateIds?.has(template.id)) continue;
    if (resolveTaskPlotId(template) !== plotId) continue;

    const key = forecastDateKeyFrom(template.next_due_at, timeZone);
    if (!key) continue;

    const isOverdue = key < firstDate;
    const bucketKey = isOverdue ? firstDate : key;
    if (!window.has(bucketKey)) continue;

    const bucket = result.get(bucketKey);
    if (!bucket) continue;
    bucket.count += 1;
    if (isOverdue) bucket.overdue += 1;

    const tally = typeTally.get(bucketKey) ?? new Map<TaskType, number>();
    tally.set(template.task_type, (tally.get(template.task_type) ?? 0) + 1);
    typeTally.set(bucketKey, tally);
  }

  for (const [key, tally] of typeTally) {
    let topType: TaskType | null = null;
    let topCount = 0;
    for (const [type, count] of tally) {
      if (count > topCount) {
        topType = type;
        topCount = count;
      }
    }
    const bucket = result.get(key);
    // Only name a type when it actually dominates — a 1-1 split reads as noise.
    if (bucket && topCount * 2 > bucket.count) bucket.topType = topType;
  }

  return result;
}

/** Row text: "—", "4 jobs", "4 jobs · Water", "2 overdue · 4 jobs". */
export function formatJobText(jobs: DayJobs | undefined): string {
  if (!jobs || jobs.count === 0) return '—';
  const countText = jobs.count === 1 ? '1 job' : `${jobs.count} jobs`;
  if (jobs.overdue > 0) return `${jobs.overdue} overdue · ${countText}`;
  const label = jobs.topType ? TASK_LABELS[jobs.topType] : null;
  return label ? `${countText} · ${label}` : countText;
}
