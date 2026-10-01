import type { DailyWeather, WeatherForecast } from '@/types/database.types';
import {
  RAIN_MOVE_MIN_MM,
  buildPlotRainBanner,
  findPlotRainDay,
  plotConditionsHead,
  rainMovableTasks,
} from '@/utils/plotRainMove';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

// 2026-08-19 is a Wednesday; noon IST.
const NOW = new Date('2026-08-19T06:30:00.000Z');

const day = (date: string, precipitationMm: number, tempMaxC = 31): DailyWeather => ({
  date,
  tempMaxC,
  tempMinC: 24,
  precipitationMm,
  weatherCode: precipitationMm > 0 ? 61 : 0,
  precipitationProbabilityPct: precipitationMm > 0 ? 80 : 5,
});

const forecastOf = (...daily: DailyWeather[]): WeatherForecast => ({
  latitude: 8.1,
  longitude: 77.5,
  timezone: 'Asia/Kolkata',
  fetched_at: '2026-08-19T00:00:00.000Z',
  daily,
});

// Due dates at 6 PM IST on the given day.
const dueOn = (date: string): string => new Date(`${date}T12:30:00.000Z`).toISOString();

describe('findPlotRainDay', () => {
  it('finds the first rainy day in the next three days', () => {
    const rain = findPlotRainDay(
      forecastOf(day('2026-08-19', 0), day('2026-08-20', 12.4), day('2026-08-21', 20)),
      NOW
    );
    expect(rain).toEqual({ dateKey: '2026-08-20', mm: 12, when: 'tomorrow' });
  });

  it('names a later day by weekday', () => {
    const rain = findPlotRainDay(
      forecastOf(day('2026-08-19', 0), day('2026-08-20', 0), day('2026-08-21', 5)),
      NOW
    );
    expect(rain?.when).toBe('Fri');
  });

  it('ignores rain past the lookahead and drizzle under showers', () => {
    expect(
      findPlotRainDay(
        forecastOf(
          day('2026-08-19', 1),
          day('2026-08-20', 0),
          day('2026-08-21', 0),
          day('2026-08-22', 30)
        ),
        NOW
      )
    ).toBeNull();
  });

  it('makes no claim without a forecast', () => {
    expect(findPlotRainDay(null, NOW)).toBeNull();
  });
});

describe('plotConditionsHead', () => {
  it('describes today', () => {
    expect(plotConditionsHead(forecastOf(day('2026-08-19', 0, 31.4)), NOW)).toBe('31°C, dry.');
    expect(plotConditionsHead(forecastOf(day('2026-08-19', 8, 29)), NOW)).toBe('29°C, wet.');
  });
});

describe('rainMovableTasks', () => {
  it('picks only waterings due on the rain day', () => {
    const tasks = [
      makeTaskTemplate({ id: 'w1', next_due_at: dueOn('2026-08-20') }),
      makeTaskTemplate({ id: 'w2', next_due_at: dueOn('2026-08-21') }),
      makeTaskTemplate({ id: 's1', task_type: 'spray', next_due_at: dueOn('2026-08-20') }),
    ];
    expect(rainMovableTasks(tasks, '2026-08-20').map((t) => t.id)).toEqual(['w1']);
  });
});

describe('buildPlotRainBanner', () => {
  const heavy = forecastOf(day('2026-08-19', 0), day('2026-08-20', RAIN_MOVE_MIN_MM + 2));
  const water = [
    makeTaskTemplate({ id: 'w1', next_due_at: dueOn('2026-08-20') }),
    makeTaskTemplate({ id: 'w2', next_due_at: dueOn('2026-08-20') }),
  ];

  it('offers to move the rain day’s watering', () => {
    const banner = buildPlotRainBanner(heavy, water, [], NOW);
    expect(banner?.kind).toBe('move');
    expect(banner?.buttonLabel).toBe('Move 2');
    expect(banner?.taskIds).toEqual(['w1', 'w2']);
    expect(banner?.text).toBe("Rain tomorrow 12 mm here. Tomorrow's watering can wait until Sat.");
    expect(banner?.head).toBe('31°C, dry.');
  });

  it('says watering stays when the rain is too light', () => {
    const light = forecastOf(day('2026-08-19', 0), day('2026-08-20', 3));
    const banner = buildPlotRainBanner(light, water, [], NOW);
    expect(banner?.kind).toBe('light');
    expect(banner?.text).toContain('too light');
    expect(banner?.taskIds).toEqual([]);
  });

  it('just reports heavy rain when nothing is due that day', () => {
    const banner = buildPlotRainBanner(heavy, [], [], NOW);
    expect(banner?.kind).toBe('info');
    expect(banner?.text).toBe('Rain tomorrow 12 mm.');
  });

  it('reports a move already made', () => {
    const banner = buildPlotRainBanner(heavy, [], ['w1'], NOW);
    expect(banner?.kind).toBe('moved');
    expect(banner?.text).toBe('Rain tomorrow 12 mm. Watering here moved to Sat.');
  });

  it('shows nothing in a dry spell', () => {
    expect(buildPlotRainBanner(forecastOf(day('2026-08-19', 0)), water, [], NOW)).toBeNull();
  });
});
