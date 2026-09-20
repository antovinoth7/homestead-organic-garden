/**
 * Today's sky as a colour tone.
 *
 * A `WeatherConditionId` is thirteen values wide, and no surface wants thirteen
 * treatments. This collapses them into the six the design system actually has
 * ramps for, so a forecast reads the same whichever screen it is on.
 *
 * `neutral` is the one that carries no colour: cloud, fog and a missing
 * forecast are not news, and tinting them would spend attention on nothing.
 *
 * Pure — no React Native, no theme. Callers map the tone onto their own styles.
 */

import { WeatherConditionId } from '@/types/database.types';

export type WeatherTone = 'rain' | 'showers' | 'clear' | 'hot' | 'storm' | 'neutral';

const TONE_BY_CONDITION: Record<WeatherConditionId, WeatherTone> = {
  rain: 'rain',
  heavy_rain: 'rain',
  heavy_showers: 'rain',
  showers: 'showers',
  drizzle: 'showers',
  clear: 'clear',
  partly_cloudy: 'clear',
  hot: 'hot',
  thunderstorm: 'storm',
  cloudy: 'neutral',
  fog: 'neutral',
  snow: 'neutral',
  unknown: 'neutral',
};

/** The tone for a condition. Total over the union, so there is no fallback path. */
export function weatherTone(condition: WeatherConditionId): WeatherTone {
  return TONE_BY_CONDITION[condition];
}
