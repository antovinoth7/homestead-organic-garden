import { buildPlotBriefLine, PlotBriefLineInput } from '../../utils/plotBriefLine';
import { summarizeTodayTasks } from '../../utils/taskSummary';
import { Plant, TaskTemplate } from '../../types/database.types';
import { makeBed } from '../fixtures/bed.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';
import { makeDailyWeather, makeWeatherForecast } from '../fixtures/today.fixtures';

/** Friday 31 July 2026, 09:00 local — the day the design mock is set on. */
const NOW = new Date(2026, 6, 31, 9).getTime();

/** Local noon on a date, so day bucketing never straddles a timezone edge. */
const at = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12).toISOString();

/** Local YYYY-MM-DD, matching the keys Open-Meteo returns. */
const dateKey = (year: number, month: number, day: number): string =>
  `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;

/**
 * Builds the input through the real `summarizeTodayTasks`, so these tests
 * exercise the same join the hook does rather than a hand-written summary that
 * could drift from it.
 */
function makeInput(
  overrides: Partial<PlotBriefLineInput> & { tasks?: TaskTemplate[] } = {}
): PlotBriefLineInput {
  const { tasks = [], ...rest } = overrides;
  const input: PlotBriefLineInput = {
    summary: summarizeTodayTasks(tasks, [], NOW),
    forecast: null,
    plants: [],
    beds: [],
    bedNames: {},
    plantsById: new Map<string, Plant>(),
    now: NOW,
    ...rest,
  };
  return input;
}

describe('buildPlotBriefLine', () => {
  it('returns nothing at all for a plot with no work and no history', () => {
    expect(buildPlotBriefLine(makeInput())).toEqual({
      kind: null,
      headline: null,
      freshness: null,
    });
  });

  describe('rung 1 — the oldest overdue job', () => {
    it('names the work, its bed and how late it is', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 't1', task_type: 'water', bed_id: 'b1', next_due_at: at(2026, 7, 26) }),
            makeTaskTemplate({ id: 't2', task_type: 'prune', bed_id: 'b1', next_due_at: at(2026, 7, 29) }),
          ],
          bedNames: { b1: 'Bed 3' },
        })
      );

      expect(line.headline).toBe('Watering on Bed 3 is 5 days late.');
      expect(line.kind).toBe('overdue');
    });

    it('falls back to the plant name when the task has no bed', () => {
      const plant = makePlant({ id: 'p1', name: 'Brinjal' });
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 't1', task_type: 'spray', plant_id: 'p1', next_due_at: at(2026, 7, 29) }),
          ],
          plantsById: new Map([['p1', plant]]),
        })
      );

      expect(line.headline).toBe('Spraying on Brinjal is 2 days late.');
    });

    it('names no subject when neither the bed nor the plant is known', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 't1', task_type: 'weeding', plant_id: 'ghost', next_due_at: at(2026, 7, 30) }),
          ],
        })
      );

      expect(line.headline).toBe('Weeding is 1 day late.');
    });
  });

  describe('rung 2 — rain closing a window', () => {
    const dryToday = makeDailyWeather({ date: dateKey(2026, 7, 31), precipitationMm: 0 });
    const wetTomorrow = makeDailyWeather({ date: dateKey(2026, 8, 1), precipitationMm: 12 });

    const sprayDueToday = (): TaskTemplate[] => [
      makeTaskTemplate({ id: 's1', task_type: 'spray', next_due_at: at(2026, 7, 31) }),
      makeTaskTemplate({ id: 's2', task_type: 'spray', next_due_at: at(2026, 7, 31) }),
    ];

    it('warns when rain is coming and rain-sensitive work is due today', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: sprayDueToday(),
          forecast: makeWeatherForecast([dryToday, wetTomorrow]),
        })
      );

      expect(line.headline).toBe('12 mm on Sat — do today\'s 2 spray jobs before it.');
      expect(line.kind).toBe('rain');
    });

    it('stays generic when the work at risk is of mixed kinds', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 's1', task_type: 'spray', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'h1', task_type: 'harvest', next_due_at: at(2026, 7, 31) }),
          ],
          forecast: makeWeatherForecast([dryToday, wetTomorrow]),
        })
      );

      expect(line.headline).toBe('12 mm on Sat — do today\'s 2 rain-sensitive jobs before it.');
    });

    it('says nothing when today is already wet — the window is shut either way', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: sprayDueToday(),
          forecast: makeWeatherForecast([
            makeDailyWeather({ date: dateKey(2026, 7, 31), precipitationMm: 8 }),
            wetTomorrow,
          ]),
        })
      );

      expect(line.headline).not.toContain('before it');
    });

    it('ignores rain when only watering is due — the rain does that job', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [makeTaskTemplate({ id: 'w1', task_type: 'water', next_due_at: at(2026, 7, 31) })],
          forecast: makeWeatherForecast([dryToday, wetTomorrow]),
        })
      );

      expect(line.headline).toBe('The only job here is watering.');
    });

    it('ignores rain further out than the lookahead window', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: sprayDueToday(),
          forecast: makeWeatherForecast([
            dryToday,
            makeDailyWeather({ date: dateKey(2026, 8, 1), precipitationMm: 0 }),
            makeDailyWeather({ date: dateKey(2026, 8, 2), precipitationMm: 0 }),
            makeDailyWeather({ date: dateKey(2026, 8, 3), precipitationMm: 0 }),
            makeDailyWeather({ date: dateKey(2026, 8, 4), precipitationMm: 20 }),
          ]),
        })
      );

      expect(line.headline).toBe('All 2 jobs here are spraying.');
    });

    it('names a single kind of at-risk work with its count', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [makeTaskTemplate({ id: 'h1', task_type: 'harvest', next_due_at: at(2026, 7, 31) })],
          forecast: makeWeatherForecast([dryToday, wetTomorrow]),
        })
      );

      expect(line.headline).toBe('12 mm on Sat — do today\'s 1 harvest job before it.');
    });

    it('yields to an overdue job — lateness outranks a forecast', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            ...sprayDueToday(),
            makeTaskTemplate({ id: 'o1', task_type: 'water', next_due_at: at(2026, 7, 30) }),
          ],
          forecast: makeWeatherForecast([dryToday, wetTomorrow]),
        })
      );

      expect(line.headline).toBe('Watering is 1 day late.');
    });
  });

  describe('rung 3 — the shape of today\'s work', () => {
    it('names a type that dominates the day', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 'w1', task_type: 'water', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'w2', task_type: 'water', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'w3', task_type: 'water', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'p1', task_type: 'prune', next_due_at: at(2026, 7, 31) }),
          ],
        })
      );

      expect(line.headline).toBe('Mostly watering — 3 of 4 jobs.');
      expect(line.kind).toBe('load');
    });

    it('stays generic on an even split, where no type dominates', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [
            makeTaskTemplate({ id: 'w1', task_type: 'water', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'w2', task_type: 'water', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'p1', task_type: 'prune', next_due_at: at(2026, 7, 31) }),
            makeTaskTemplate({ id: 'm1', task_type: 'mulch', next_due_at: at(2026, 7, 31) }),
          ],
        })
      );

      expect(line.headline).toBe('4 jobs across 3 kinds of work.');
    });
  });

  describe('the freshness tail', () => {
    const withBedDate = (date: string): PlotBriefLineInput =>
      makeInput({ beds: [makeBed({ id: 'b1', last_water_date: date })] });

    it.each([
      [at(2026, 7, 31), 'Worked today.'],
      [at(2026, 7, 30), 'Last worked yesterday.'],
      [at(2026, 7, 26), 'Last worked Sun.'],
      [at(2026, 7, 24), 'Last worked a week ago.'],
      [at(2026, 7, 10), 'Last worked 3 weeks ago.'],
      [at(2026, 7, 3), 'Not worked in over a month.'],
    ])('reads %s as "%s"', (date, expected) => {
      expect(buildPlotBriefLine(withBedDate(date)).freshness).toBe(expected);
    });

    it('takes the most recent date across every bed and plant field', () => {
      const line = buildPlotBriefLine(
        makeInput({
          beds: [makeBed({ id: 'b1', last_water_date: at(2026, 7, 10) })],
          plants: [makePlant({ id: 'p1', last_harvest_date: at(2026, 7, 30) })],
        })
      );

      expect(line.freshness).toBe('Last worked yesterday.');
    });

    it('ignores archived plants and deleted beds', () => {
      const line = buildPlotBriefLine(
        makeInput({
          beds: [makeBed({ id: 'b1', is_deleted: true, last_water_date: at(2026, 7, 30) })],
          plants: [
            makePlant({ id: 'p1', archived_at: at(2026, 7, 1), last_watered_date: at(2026, 7, 30) }),
          ],
        })
      );

      expect(line.freshness).toBeNull();
    });

    it('ignores dates in the future, which are data errors rather than news', () => {
      expect(buildPlotBriefLine(withBedDate(at(2026, 8, 5))).freshness).toBeNull();
    });

    it('accompanies a headline rather than replacing it', () => {
      const line = buildPlotBriefLine(
        makeInput({
          tasks: [makeTaskTemplate({ id: 't1', task_type: 'water', next_due_at: at(2026, 7, 30) })],
          beds: [makeBed({ id: 'b1', last_water_date: at(2026, 7, 30) })],
        })
      );

      expect(line).toEqual({
        kind: 'overdue',
        headline: 'Watering is 1 day late.',
        freshness: 'Last worked yesterday.',
      });
    });
  });
});
