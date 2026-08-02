import { countJobsByDate, formatJobText } from '../../utils/upcomingJobs';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const DATES = ['2026-07-31', '2026-08-01', '2026-08-02'];

/** Local-noon ISO for a date key, so the local-date bucketing is unambiguous. */
const dueAt = (year: number, month: number, day: number): string =>
  new Date(year, month - 1, day, 12).toISOString();

/** Every template belongs to the plot under test unless it says otherwise. */
const onePlot = (): string => 'home';

describe('countJobsByDate', () => {
  it('buckets templates onto their due date', () => {
    const counts = countJobsByDate(
      [
        makeTaskTemplate({ id: 't1', next_due_at: dueAt(2026, 7, 31) }),
        makeTaskTemplate({ id: 't2', next_due_at: dueAt(2026, 8, 1) }),
        makeTaskTemplate({ id: 't3', next_due_at: dueAt(2026, 8, 1) }),
      ],
      onePlot,
      'home',
      DATES
    );

    expect(counts.get('2026-07-31')?.count).toBe(1);
    expect(counts.get('2026-08-01')?.count).toBe(2);
    expect(counts.get('2026-08-02')?.count).toBe(0);
  });

  it('folds work due before the window into the first day as overdue', () => {
    const counts = countJobsByDate(
      [makeTaskTemplate({ id: 't1', next_due_at: dueAt(2026, 7, 20) })],
      onePlot,
      'home',
      DATES
    );

    expect(counts.get('2026-07-31')).toMatchObject({ count: 1, overdue: 1 });
  });

  it('drops work due beyond the window', () => {
    const counts = countJobsByDate(
      [makeTaskTemplate({ id: 't1', next_due_at: dueAt(2026, 9, 15) })],
      onePlot,
      'home',
      DATES
    );

    expect([...counts.values()].every((day) => day.count === 0)).toBe(true);
  });

  it('ignores disabled templates', () => {
    const counts = countJobsByDate(
      [makeTaskTemplate({ id: 't1', enabled: false, next_due_at: dueAt(2026, 8, 1) })],
      onePlot,
      'home',
      DATES
    );

    expect(counts.get('2026-08-01')?.count).toBe(0);
  });

  it('counts only the plot asked for, using the caller\'s resolver', () => {
    const resolve = (task: { plant_id: string | null }): string =>
      task.plant_id === 'p-home' ? 'home' : 'paddy';

    const templates = [
      makeTaskTemplate({ id: 't1', plant_id: 'p-home', next_due_at: dueAt(2026, 8, 1) }),
      makeTaskTemplate({ id: 't2', plant_id: 'p-paddy', next_due_at: dueAt(2026, 8, 1) }),
    ];

    expect(countJobsByDate(templates, resolve, 'home', DATES).get('2026-08-01')?.count).toBe(1);
    expect(countJobsByDate(templates, resolve, 'paddy', DATES).get('2026-08-01')?.count).toBe(1);
  });

  it('names the dominant task type, and stays silent on an even split', () => {
    const dominant = countJobsByDate(
      [
        makeTaskTemplate({ id: 't1', task_type: 'water', next_due_at: dueAt(2026, 8, 1) }),
        makeTaskTemplate({ id: 't2', task_type: 'water', next_due_at: dueAt(2026, 8, 1) }),
        makeTaskTemplate({ id: 't3', task_type: 'prune', next_due_at: dueAt(2026, 8, 1) }),
      ],
      onePlot,
      'home',
      DATES
    );
    expect(dominant.get('2026-08-01')?.topType).toBe('water');

    const split = countJobsByDate(
      [
        makeTaskTemplate({ id: 't1', task_type: 'water', next_due_at: dueAt(2026, 8, 1) }),
        makeTaskTemplate({ id: 't2', task_type: 'prune', next_due_at: dueAt(2026, 8, 1) }),
      ],
      onePlot,
      'home',
      DATES
    );
    expect(split.get('2026-08-01')?.topType).toBeNull();
  });

  it('returns nothing when there is no forecast window', () => {
    expect(countJobsByDate([makeTaskTemplate()], onePlot, 'home', []).size).toBe(0);
  });
});

describe('formatJobText', () => {
  it('dashes an empty day', () => {
    expect(formatJobText(undefined)).toBe('—');
    expect(formatJobText({ count: 0, overdue: 0, topType: null })).toBe('—');
  });

  it('counts jobs, singular and plural', () => {
    expect(formatJobText({ count: 1, overdue: 0, topType: null })).toBe('1 job');
    expect(formatJobText({ count: 4, overdue: 0, topType: null })).toBe('4 jobs');
  });

  it('names a dominant type', () => {
    expect(formatJobText({ count: 4, overdue: 0, topType: 'water' })).toBe('4 jobs · Water');
  });

  it('leads with overdue, which matters more than what kind', () => {
    expect(formatJobText({ count: 4, overdue: 2, topType: 'water' })).toBe('2 overdue · 4 jobs');
  });
});
