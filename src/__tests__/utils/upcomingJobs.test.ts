import { countJobsByDate, formatJobText } from '../../utils/upcomingJobs';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const DATES = ['2026-07-31', '2026-08-01', '2026-08-02'];

/**
 * Midday *farm time* (06:30Z = 12:00 IST) for a date key. Deliberately not
 * device-local: buckets are resolved in the forecast's timezone, so a fixture
 * built from the machine's clock would make these assertions depend on where
 * the test runs.
 */
const dueAt = (year: number, month: number, day: number): string => {
  const mm = `${month}`.padStart(2, '0');
  const dd = `${day}`.padStart(2, '0');
  return `${year}-${mm}-${dd}T06:30:00.000Z`;
};

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

  // Forecast dates are the provider's buckets in a named timezone, not the
  // device's calendar days. Asserting the *same instant* against two zones makes
  // this independent of where the suite runs — the old device-local key could
  // not be caught by any fixture built with `new Date(y, m, d)`.
  describe('timezone', () => {
    // 20:30 UTC on 9 Aug is already 02:00 on 10 Aug in Kanyakumari, but still
    // 9 Aug in Niue (UTC-11).
    const LATE_EVENING_IST = '2026-08-09T20:30:00.000Z';
    const WINDOW = ['2026-08-09', '2026-08-10'];

    const bucketIn = (timeZone: string): Map<string, number> => {
      const counts = countJobsByDate(
        [makeTaskTemplate({ id: 't1', next_due_at: LATE_EVENING_IST })],
        onePlot,
        'home',
        WINDOW,
        { timeZone }
      );
      return new Map([...counts].map(([date, jobs]) => [date, jobs.count]));
    };

    it('buckets a due date in the forecast timezone, not the device timezone', () => {
      expect(bucketIn('Asia/Kolkata').get('2026-08-10')).toBe(1);
      expect(bucketIn('Asia/Kolkata').get('2026-08-09')).toBe(0);

      expect(bucketIn('Pacific/Niue').get('2026-08-09')).toBe(1);
      expect(bucketIn('Pacific/Niue').get('2026-08-10')).toBe(0);
    });

    it('defaults to the farm timezone when none is given', () => {
      const counts = countJobsByDate(
        [makeTaskTemplate({ id: 't1', next_due_at: LATE_EVENING_IST })],
        onePlot,
        'home',
        WINDOW
      );
      expect(counts.get('2026-08-10')?.count).toBe(1);
    });

    it('skips a template whose due date cannot be parsed', () => {
      const counts = countJobsByDate(
        [makeTaskTemplate({ id: 't1', next_due_at: 'not-a-date' })],
        onePlot,
        'home',
        WINDOW
      );
      expect([...counts.values()].every((jobs) => jobs.count === 0)).toBe(true);
    });
  });

  describe('completed work', () => {
    it('excludes templates already logged done today', () => {
      const counts = countJobsByDate(
        [
          makeTaskTemplate({ id: 't1', next_due_at: dueAt(2026, 8, 1) }),
          makeTaskTemplate({ id: 't2', next_due_at: dueAt(2026, 8, 1) }),
        ],
        onePlot,
        'home',
        DATES,
        { completedTemplateIds: new Set(['t1']) }
      );

      expect(counts.get('2026-08-01')?.count).toBe(1);
    });

    it('does not let completed work sway the dominant task type', () => {
      const counts = countJobsByDate(
        [
          makeTaskTemplate({ id: 't1', task_type: 'water', next_due_at: dueAt(2026, 8, 1) }),
          makeTaskTemplate({ id: 't2', task_type: 'water', next_due_at: dueAt(2026, 8, 1) }),
          makeTaskTemplate({ id: 't3', task_type: 'prune', next_due_at: dueAt(2026, 8, 1) }),
        ],
        onePlot,
        'home',
        DATES,
        { completedTemplateIds: new Set(['t1', 't2']) }
      );

      expect(counts.get('2026-08-01')).toMatchObject({ count: 1, topType: 'prune' });
    });
  });

  // The C3 invariant: when the caller passes only the days the UI renders (all
  // >= today), overdue work folds onto today's row rather than onto a past row
  // that is filtered out before paint.
  it('folds overdue work onto the first rendered day', () => {
    const visibleWindow = ['2026-08-01', '2026-08-02'];
    const counts = countJobsByDate(
      [
        makeTaskTemplate({ id: 't1', next_due_at: dueAt(2026, 7, 20) }),
        makeTaskTemplate({ id: 't2', next_due_at: dueAt(2026, 7, 28) }),
        makeTaskTemplate({ id: 't3', next_due_at: dueAt(2026, 8, 1) }),
      ],
      onePlot,
      'home',
      visibleWindow
    );

    expect(counts.get('2026-08-01')).toMatchObject({ count: 3, overdue: 2 });
    expect(formatJobText(counts.get('2026-08-01'))).toBe('2 overdue · 3 jobs');
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
