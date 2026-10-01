/**
 * Per-plot rain banner for the Care Plan.
 *
 * Each plot section shows its own forecast, because rain is local: one plot can
 * expect a soaking while the next gets a sprinkle. When the coming rain is heavy
 * enough to stand in for a watering, the banner offers to move that day's
 * watering in that plot past the rain — the farmer decides, nothing moves on its
 * own. See docs/DOMAIN_LOGIC.md → Rain-moved watering.
 */

import type { TaskTemplate, WeatherForecast } from '@/types/database.types';
import { addDaysToDateKey } from '@/utils/farmDate';
import {
  DRY_DAY_MM,
  SHOWERS_MM,
  forecastDateKey,
  selectForecastDays,
  weekdayLabel,
} from '@/utils/weatherWords';

/** Rain at or above this soaks the root zone enough to stand in for a watering. */
export const RAIN_MOVE_MIN_MM = 10;
/** How far a moved watering is pushed: the rain day plus this many days. */
export const RAIN_MOVE_DAYS = 2;
/** Today and the next two days — far enough ahead to plan, near enough to trust. */
export const RAIN_LOOKAHEAD_DAYS = 3;

export interface PlotRainDay {
  /** YYYY-MM-DD of the first rainy day in the lookahead. */
  dateKey: string;
  /** Rounded millimetres forecast for that day. */
  mm: number;
  /** "today", "tomorrow" or a short weekday ("Thu"). */
  when: string;
}

export type PlotRainBannerKind = 'light' | 'info' | 'move' | 'moved';

export interface PlotRainBanner {
  kind: PlotRainBannerKind;
  /** Bold lead — current conditions, e.g. "31°C, dry." */
  head: string;
  text: string;
  /** `move` only: the waterings the button would move. */
  taskIds: string[];
  /** `move` only: "Move 2". */
  buttonLabel: string;
  /** The rain day this banner is about. */
  rainDateKey: string;
}

const dayWord = (dateKey: string, todayKey: string): string => {
  if (dateKey === todayKey) return 'today';
  if (dateKey === addDaysToDateKey(todayKey, 1)) return 'tomorrow';
  return weekdayLabel(dateKey, 'short');
};

const capitalise = (value: string): string =>
  value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;

/** First day in the lookahead with at least showers, or null for a dry spell. */
export function findPlotRainDay(
  forecast: WeatherForecast | null,
  now: Date = new Date(),
  lookaheadDays: number = RAIN_LOOKAHEAD_DAYS
): PlotRainDay | null {
  if (!forecast) return null;
  const { available, todayKey } = selectForecastDays(forecast, now);
  const lastKey = addDaysToDateKey(todayKey, lookaheadDays);
  if (!lastKey) return null;
  const day = available.find(
    (entry) => entry.date < lastKey && entry.precipitationMm >= SHOWERS_MM
  );
  if (!day) return null;
  return {
    dateKey: day.date,
    mm: Math.round(day.precipitationMm),
    when: dayWord(day.date, todayKey),
  };
}

/** "31°C, dry." — today's conditions, the banner's bold lead. */
export function plotConditionsHead(forecast: WeatherForecast, now: Date = new Date()): string {
  const { today } = selectForecastDays(forecast, now);
  if (!today) return '';
  const temp = `${Math.round(today.tempMaxC)}°C`;
  if (today.precipitationMm >= SHOWERS_MM) return `${temp}, wet.`;
  if (today.precipitationMm < DRY_DAY_MM) return `${temp}, dry.`;
  return `${temp}.`;
}

/** The water tasks in `plotTasks` due on `dateKey` — the ones a move would push. */
export function rainMovableTasks(
  plotTasks: readonly TaskTemplate[],
  dateKey: string,
  timeZone?: string
): TaskTemplate[] {
  return plotTasks.filter((task) => {
    if (task.task_type !== 'water' || !task.next_due_at) return false;
    const due = new Date(task.next_due_at);
    return forecastDateKey(due, timeZone) === dateKey;
  });
}

/**
 * The banner for one plot, or null when no rain is coming in the lookahead.
 *
 * @param plotTasks open tasks in this plot (any type — only waterings move)
 * @param movedTaskIds waterings this plot already moved for the coming rain
 */
export function buildPlotRainBanner(
  forecast: WeatherForecast | null,
  plotTasks: readonly TaskTemplate[],
  movedTaskIds: readonly string[],
  now: Date = new Date()
): PlotRainBanner | null {
  if (!forecast) return null;
  const rain = findPlotRainDay(forecast, now);
  if (!rain) return null;

  const head = plotConditionsHead(forecast, now);
  const targetKey = addDaysToDateKey(rain.dateKey, RAIN_MOVE_DAYS);
  const target = targetKey ? weekdayLabel(targetKey, 'short') : '';
  const base = {
    head,
    taskIds: [] as string[],
    buttonLabel: '',
    rainDateKey: rain.dateKey,
  };

  if (movedTaskIds.length > 0) {
    return {
      ...base,
      kind: 'moved',
      text: `Rain ${rain.when} ${rain.mm} mm. Watering here moved to ${target}.`,
    };
  }

  if (rain.mm < RAIN_MOVE_MIN_MM) {
    return {
      ...base,
      kind: 'light',
      text: `Rain ${rain.when} only ${rain.mm} mm, too light. Keep watering as planned.`,
    };
  }

  const movable = rainMovableTasks(plotTasks, rain.dateKey, forecast.timezone);
  if (movable.length === 0) {
    return { ...base, kind: 'info', text: `Rain ${rain.when} ${rain.mm} mm.` };
  }

  return {
    ...base,
    kind: 'move',
    text: `Rain ${rain.when} ${rain.mm} mm here. ${capitalise(rain.when)}'s watering can wait until ${target}.`,
    taskIds: movable.map((task) => task.id),
    buttonLabel: `Move ${movable.length}`,
  };
}
