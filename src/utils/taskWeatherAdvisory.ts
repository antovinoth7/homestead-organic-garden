import { isRainPredictedOnDate } from '@/services/weatherLogic';
import type { TaskType, WeatherForecast } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import { locationKey } from '@/utils/locationHelpers';
import type { PlotAssignable } from '@/utils/plotGrouping';
import { forecastDateKey } from '@/utils/weatherWords';

export interface TaskWeatherAdvisory {
  iconKey: VisualIconKey;
  text: string;
}

/** Joins forecasts to tasks through the shared plot resolver—never by list order. */
export function resolveTaskForecast(
  task: PlotAssignable,
  byPlotName: ReadonlyMap<string, WeatherForecast | null>,
  resolveTaskPlotId: (value: PlotAssignable) => string
): WeatherForecast | null {
  const taskPlotKey = locationKey(resolveTaskPlotId(task));
  for (const [plotName, forecast] of byPlotName) {
    if (locationKey(plotName) === taskPlotKey) return forecast;
  }
  return null;
}

/** Weather is advisory only: missing or out-of-range data produces no claim. */
export function getTaskWeatherAdvisory(
  taskType: TaskType,
  forecast: WeatherForecast | null,
  dueAt: Date
): TaskWeatherAdvisory | null {
  const rainExpected = isRainPredictedOnDate(forecast, dueAt);
  const dueKey = forecast ? forecastDateKey(dueAt, forecast.timezone) : null;
  const windSpeed = dueKey
    ? forecast?.daily.find((day) => day.date === dueKey)?.windSpeedMaxKph
    : null;
  const strongWindExpected = taskType === 'spray' && windSpeed != null && windSpeed >= 20;
  if (!rainExpected && !strongWindExpected) return null;

  if (strongWindExpected && !rainExpected) {
    return {
      iconKey: 'general.warning',
      text: 'Strong wind expected — review spraying',
    };
  }

  const textByType: Partial<Record<TaskType, string>> = {
    water: 'Rain expected — check soil first',
    spray: 'Rain expected — review the spray window',
    fertilise: 'Rain expected — check runoff and timing',
    harvest: 'Rain expected — pick or protect produce',
    harvest_leaves: 'Rain expected — pick or protect produce',
    cultivating: 'Rain expected — check drainage and waterlogging',
    transplanting: 'Rain expected — check drainage and waterlogging',
    weeding: 'Rain expected — check field conditions',
  };

  const text = textByType[taskType];
  return text ? { iconKey: 'weather.rain', text } : null;
}
