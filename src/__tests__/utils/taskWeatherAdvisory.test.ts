import type { TaskType, WeatherForecast } from '@/types/database.types';
import { groupByPlot } from '@/utils/plotGrouping';
import { getTaskWeatherAdvisory, resolveTaskForecast } from '@/utils/taskWeatherAdvisory';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const forecast: WeatherForecast = {
  latitude: 8.1,
  longitude: 77.5,
  timezone: 'Asia/Kolkata',
  fetched_at: '2026-08-22T00:00:00.000Z',
  daily: [
    {
      date: '2026-08-23',
      tempMaxC: 31,
      tempMinC: 24,
      precipitationMm: 12,
      weatherCode: 61,
      precipitationProbabilityPct: 80,
    },
  ],
};

const dueAt = new Date('2026-08-23T12:30:00.000Z');

describe('getTaskWeatherAdvisory', () => {
  it.each<[TaskType, string]>([
    ['water', 'check soil'],
    ['spray', 'spray window'],
    ['fertilise', 'runoff'],
    ['harvest', 'pick or protect'],
    ['cultivating', 'drainage'],
  ])('gives task-specific advisory text for %s', (taskType, words) => {
    expect(getTaskWeatherAdvisory(taskType, forecast, dueAt)?.text).toContain(words);
  });

  it('never treats an unavailable forecast as no rain advice', () => {
    expect(getTaskWeatherAdvisory('water', null, dueAt)).toBeNull();
  });

  it('does not add a warning when the due date is outside available data', () => {
    expect(
      getTaskWeatherAdvisory('water', forecast, new Date('2026-08-30T12:30:00.000Z'))
    ).toBeNull();
  });

  it('warns about strong wind for spraying even when rain is not forecast', () => {
    const windy: WeatherForecast = {
      ...forecast,
      daily: [{ ...forecast.daily[0]!, precipitationMm: 0, windSpeedMaxKph: 25 }],
    };
    expect(getTaskWeatherAdvisory('spray', windy, dueAt)?.text).toContain('Strong wind');
    expect(getTaskWeatherAdvisory('water', windy, dueAt)).toBeNull();
  });

  it('assigns each task only its own plot forecast', () => {
    const homePlant = makePlant({ id: 'home-plant', location: 'Home farm' });
    const fieldPlant = makePlant({ id: 'field-plant', location: 'Paddy land' });
    const homeTask = makeTaskTemplate({ id: 'home-task', plant_id: homePlant.id });
    const fieldTask = makeTaskTemplate({ id: 'field-task', plant_id: fieldPlant.id });
    const grouping = groupByPlot({
      parentLocations: ['Home farm', 'Paddy land'],
      fallbackName: 'Kanyakumari',
      plants: [homePlant, fieldPlant],
      beds: [],
      tasks: [homeTask, fieldTask],
      logs: [],
      alerts: [],
    });
    const dryForecast: WeatherForecast = { ...forecast, latitude: 9.2, daily: [] };
    const byPlot = new Map<string, WeatherForecast | null>([
      ['Home farm', forecast],
      ['Paddy land', dryForecast],
    ]);

    expect(resolveTaskForecast(homeTask, byPlot, grouping.resolveTaskPlotId)).toBe(forecast);
    expect(resolveTaskForecast(fieldTask, byPlot, grouping.resolveTaskPlotId)).toBe(dryForecast);
    expect(
      resolveTaskForecast(
        makeTaskTemplate({ plant_id: null, bed_id: null }),
        byPlot,
        grouping.resolveTaskPlotId
      )
    ).toBeNull();
  });
});
