/**
 * The plot card's line of context — what is going on at this plot, as opposed
 * to the standing counts around it.
 *
 * Every other figure on the card is a total: how many jobs, how many beds, how
 * many sick plants. None of them says which plot to walk to first when two
 * cards both read "7 due". This line does, by picking the single most
 * decision-changing signal from a ranked ladder:
 *
 *   1. the oldest overdue job, named with the bed or plant it sits on
 *   2. rain about to close a window on weather-sensitive work due today
 *   3. what today's load actually consists of
 *   4. nothing — a quiet plot's title row already says "Nothing due"
 *
 * First match wins, and each rung falls through when its data is absent, so a
 * farm with no forecast and no history still gets a sensible line or none at
 * all. A separate freshness tail states when work was last recorded here.
 *
 * Counting is not repeated: the caller passes the `TodayTaskSummary` that
 * `summarizeTasksByPlot` already produced for this plot, so the sentence and
 * the "7 DUE · 2 OVERDUE" beside it cannot drift apart.
 *
 * Pure — no React Native, no Firestore.
 */

import {
  Bed,
  DailyWeather,
  Plant,
  PlotBriefLine,
  TaskTemplate,
  TaskType,
  WeatherForecast,
} from '@/types/database.types';
import { TodayTaskSummary } from '@/utils/taskSummary';
import { MS_PER_DAY, TASK_GERUNDS, TASK_LABELS } from '@/utils/taskConstants';
import { isPlantArchived } from '@/utils/plantHelpers';
import { toLocalDateString } from '@/utils/dateHelpers';
import { DRY_DAY_MM, SHOWERS_MM, forecastDateKey, weekdayLabel } from '@/utils/weatherWords';

export interface PlotBriefLineInput {
  /** This plot's summary from `summarizeTasksByPlot` — reused, never recomputed. */
  summary: TodayTaskSummary | undefined;
  forecast: WeatherForecast | null;
  /** This plot's plants (`PlotGroup.plants`). */
  plants: readonly Plant[];
  /** This plot's beds, resolved from `PlotGroup.bedIds`. */
  beds: readonly Bed[];
  bedNames: Record<string, string>;
  plantsById: ReadonlyMap<string, Plant>;
  now?: number;
}

/**
 * Work that rain genuinely ruins rather than merely postpones: sprays and
 * foliar feeds wash off, and produce picked wet keeps badly. Watering is the
 * obvious omission — rain does that job for you, so there is no window to warn
 * about.
 */
const RAIN_SENSITIVE_TASKS: ReadonlySet<TaskType> = new Set<TaskType>([
  'spray',
  'fertilise',
  'harvest',
  'harvest_leaves',
]);

/** How far ahead the rain warning looks. Beyond this it is not today's problem. */
const RAIN_LOOKAHEAD_DAYS = 3;

/** Local midnight, so "days late" counts calendar days rather than elapsed hours. */
function startOfDay(value: string | number | Date): Date | null {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Names the thing a task sits on: its bed, else its plant, else nothing. */
function resolveSubject(
  template: TaskTemplate,
  bedNames: Record<string, string>,
  plantsById: ReadonlyMap<string, Plant>
): string | null {
  if (template.bed_id) {
    const bedName = bedNames[template.bed_id];
    if (bedName) return bedName;
  }
  if (template.plant_id) {
    const plant = plantsById.get(template.plant_id);
    if (plant?.name) return plant.name;
  }
  return null;
}

/** Rung 1 — "Watering on Bed 3 is 5 days late." */
function overdueHeadline(input: PlotBriefLineInput, today: Date): string | null {
  const overdue = input.summary?.overdueTasks ?? [];
  if (overdue.length === 0) return null;

  let oldest: TaskTemplate | null = null;
  let oldestDue: Date | null = null;
  for (const template of overdue) {
    const due = startOfDay(template.next_due_at);
    if (!due) continue;
    if (!oldestDue || due < oldestDue) {
      oldest = template;
      oldestDue = due;
    }
  }
  if (!oldest || !oldestDue) return null;

  const daysLate = Math.round((today.getTime() - oldestDue.getTime()) / MS_PER_DAY);
  if (daysLate < 1) return null;

  const work = TASK_GERUNDS[oldest.task_type];
  const subject = resolveSubject(oldest, input.bedNames, input.plantsById);
  const where = subject ? ` on ${subject}` : '';
  const late = daysLate === 1 ? '1 day late' : `${daysLate} days late`;
  return `${work}${where} is ${late}.`;
}

/** The forecast entry for today, which is not always `daily[0]` on a stale copy. */
function findTodayIndex(forecast: WeatherForecast | null, now: number): number {
  if (!forecast || forecast.daily.length === 0) return -1;
  const key = forecastDateKey(new Date(now), forecast.timezone);
  const index = forecast.daily.findIndex((d) => d.date === key);
  return index;
}

/** Rung 2 — "12 mm on Sat — do today's 2 sprays before it." */
function rainHeadline(input: PlotBriefLineInput, now: number): string | null {
  const dueToday = input.summary?.todayTasks ?? [];
  const atRisk = dueToday.filter((t) => RAIN_SENSITIVE_TASKS.has(t.task_type));
  if (atRisk.length === 0) return null;

  const forecast = input.forecast;
  const todayIndex = findTodayIndex(forecast, now);
  if (!forecast || todayIndex < 0) return null;

  // Already wet today — the window is shut regardless of what tomorrow does, so
  // there is nothing useful to advise.
  const todayDay = forecast.daily[todayIndex];
  if (!todayDay || todayDay.precipitationMm >= DRY_DAY_MM) return null;

  let wet: DailyWeather | null = null;
  for (let i = todayIndex + 1; i <= todayIndex + RAIN_LOOKAHEAD_DAYS; i += 1) {
    const day = forecast.daily[i];
    if (!day) break;
    if (day.precipitationMm >= SHOWERS_MM) {
      wet = day;
      break;
    }
  }
  if (!wet) return null;

  const when = weekdayLabel(wet.date);
  const mm = `${Math.round(wet.precipitationMm)} mm`;
  // A single kind of work gets named; a mixed bag stays generic rather than
  // calling a harvest day a spray day. "N spray jobs" rather than "N sprays"
  // because only some of the type labels pluralise into a noun.
  const types = new Set(atRisk.map((t) => t.task_type));
  const jobWord = atRisk.length === 1 ? 'job' : 'jobs';
  const what =
    types.size === 1
      ? `${atRisk.length} ${TASK_LABELS[atRisk[0]!.task_type].toLowerCase()} ${jobWord}`
      : `${atRisk.length} rain-sensitive ${jobWord}`;
  const prefix = when ? `${mm} on ${when}` : `${mm} coming`;
  return `${prefix} — do today's ${what} before it.`;
}

/** Rung 3 — "Mostly watering — 5 of 7 jobs." / "7 jobs across 4 kinds of work." */
function workMixHeadline(input: PlotBriefLineInput): string | null {
  const stats = input.summary?.typeStats ?? [];
  const remaining = stats.reduce((sum, stat) => sum + stat.remaining, 0);
  if (remaining === 0) return null;

  const kinds = stats.filter((stat) => stat.remaining > 0);
  if (kinds.length === 1) {
    const only = TASK_GERUNDS[kinds[0]!.type].toLowerCase();
    return remaining === 1
      ? `The only job here is ${only}.`
      : `All ${remaining} jobs here are ${only}.`;
  }
  const jobs = `${remaining} jobs`;

  // `typeStats` is already sorted with the most pressing type first; "mostly"
  // is only claimed when it actually dominates, the same rule `upcomingJobs`
  // uses before naming a day's top type.
  const top = kinds.reduce((a, b) => (b.remaining > a.remaining ? b : a));
  if (top.remaining * 2 > remaining) {
    return `Mostly ${TASK_GERUNDS[top.type].toLowerCase()} — ${top.remaining} of ${remaining} jobs.`;
  }
  return `${jobs} across ${kinds.length} kinds of work.`;
}

/**
 * When work was last recorded here. Beds and plants each carry their own
 * `last_*` dates; the most recent of any of them is the closest thing the app
 * has to a visit, which is why the copy says "worked" and not "walked".
 */
function buildFreshness(input: PlotBriefLineInput, today: Date): string | null {
  // Tracked as a timestamp rather than a Date so the running maximum stays a
  // plain number the compiler can narrow.
  let latest = -1;
  const consider = (value: string | null | undefined): void => {
    if (!value) return;
    const day = startOfDay(value);
    // Future dates are data errors, not news about the past.
    if (!day || day.getTime() > today.getTime()) return;
    if (day.getTime() > latest) latest = day.getTime();
  };

  for (const bed of input.beds) {
    if (bed.is_deleted) continue;
    consider(bed.last_water_date);
    consider(bed.last_jeevamrutha_date);
    consider(bed.last_weeding_date);
  }
  for (const plant of input.plants) {
    if (plant.is_deleted || isPlantArchived(plant)) continue;
    consider(plant.last_watered_date);
    consider(plant.last_fertilised_date);
    consider(plant.last_harvest_date);
  }
  if (latest < 0) return null;

  const days = Math.round((today.getTime() - latest) / MS_PER_DAY);
  if (days <= 0) return 'Worked today.';
  if (days === 1) return 'Last worked yesterday.';
  if (days < 7) {
    const label = weekdayLabel(toLocalDateString(new Date(latest)));
    return label ? `Last worked ${label}.` : `Last worked ${days} days ago.`;
  }
  if (days < 28) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Last worked a week ago.' : `Last worked ${weeks} weeks ago.`;
  }
  return 'Not worked in over a month.';
}

/**
 * The plot card's context line. Both halves may be null; the card renders
 * nothing when they both are.
 */
export function buildPlotBriefLine(input: PlotBriefLineInput): PlotBriefLine {
  const now = input.now ?? Date.now();
  const today = startOfDay(now) ?? new Date(now);

  const headline =
    overdueHeadline(input, today) ?? rainHeadline(input, now) ?? workMixHeadline(input) ?? null;

  return { headline, freshness: buildFreshness(input, today) };
}
