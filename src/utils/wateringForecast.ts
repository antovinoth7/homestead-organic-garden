/**
 * Pure forecast damping for watering intervals (no network / native deps — the
 * same split as `weatherLogic.ts`).
 *
 * The zone's season multiplier is a four-month climatological prior: it says
 * roughly how much rain and evaporation to expect, at calendar-month
 * granularity. The forecast says what is actually coming this week. This blends
 * them, letting the observation correct the prior without replacing it.
 *
 * The prior is never discarded, for two reasons. It is the offline fallback —
 * with no cached forecast the schedule must still be produced. And it carries
 * more than rain: summer's 0.5x is largely evapotranspiration, which no
 * precipitation figure expresses.
 */

import { WeatherForecast, WateringAdjustment } from '@/types/database.types';
import { forecastDateKey, SHOWERS_MM, DRY_DAY_MM } from '@/utils/weatherWords';

/**
 * The range the zone configs themselves span. Clamping here means a wrong
 * forecast degrades gracefully instead of opening a three-week gap.
 */
export const MIN_WATERING_MULTIPLIER = 0.5;
export const MAX_WATERING_MULTIPLIER = 3.0;

/** How far a correction may move the prior in one step. */
const DRY_CORRECTION = 0.5;
const WET_CORRECTION = 2;

export interface DampedWateringMultiplier {
  multiplier: number;
  adjustment: WateringAdjustment | null;
}

const clamp = (value: number): number =>
  Math.min(MAX_WATERING_MULTIPLIER, Math.max(MIN_WATERING_MULTIPLIER, value));

/**
 * Rain totals for the days between now and the season-implied next watering,
 * limited to the days the forecast actually covers.
 *
 * Today is excluded: the plant is being watered now, so only what falls before
 * the *next* watering is relevant. Days outside the forecast window are simply
 * absent — no data is never read as "no rain".
 */
function scanWindow(
  forecast: WeatherForecast,
  seasonDays: number,
  now: Date
): { coveredDays: number; wetDays: number; allDry: boolean } {
  const byDate = new Map(forecast.daily.map((day) => [day.date, day]));
  let coveredDays = 0;
  let wetDays = 0;
  let allDry = true;

  for (let offset = 1; offset <= seasonDays; offset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const day = byDate.get(forecastDateKey(date, forecast.timezone));
    if (!day) continue;
    coveredDays += 1;
    if (day.precipitationMm >= SHOWERS_MM) wetDays += 1;
    if (day.precipitationMm >= DRY_DAY_MM) allDry = false;
  }

  return { coveredDays, wetDays, allDry };
}

/**
 * Adjust a season multiplier by what the forecast expects before the next
 * watering would fall due.
 *
 * Returns the prior unchanged (and a null adjustment) whenever the forecast
 * cannot speak to the question — no forecast at all, or a window that lies
 * entirely beyond the seven days it covers.
 */
export function dampWateringMultiplier(
  seasonMultiplier: number,
  baseDays: number,
  forecast: WeatherForecast | null,
  now: Date = new Date()
): DampedWateringMultiplier {
  const prior = clamp(
    Number.isFinite(seasonMultiplier) && seasonMultiplier > 0 ? seasonMultiplier : 1
  );
  if (!forecast || !Number.isFinite(baseDays) || baseDays <= 0) {
    return { multiplier: prior, adjustment: null };
  }

  const seasonDays = Math.max(1, Math.round(baseDays * prior));
  const { coveredDays, wetDays, allDry } = scanWindow(forecast, seasonDays, now);
  if (coveredDays === 0) return { multiplier: prior, adjustment: null };

  // The season assumed rain that is not coming. Halve towards 1.0 rather than
  // snapping to it: the soil is still seasonally wet, and a hard reset would
  // only move the cliff this whole design removes from the calendar to the
  // weather.
  if (allDry && prior > 1) {
    return { multiplier: clamp(Math.max(1, prior * DRY_CORRECTION)), adjustment: 'dry' };
  }

  // Rain in a season that does not expect it — wait longer than the prior says.
  if (wetDays > 0 && prior <= 1) {
    return { multiplier: clamp(prior * WET_CORRECTION), adjustment: 'rain' };
  }

  return { multiplier: prior, adjustment: null };
}
