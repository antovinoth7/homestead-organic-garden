import {
  calendarDaysOverdue,
  computeNextDueAt,
  getLastCareDate,
} from '@/services/taskSchedulingLogic';
import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import { farmDateTimeFromKey } from '@/utils/farmDate';
import type { TaskTemplate } from '@/types/database.types';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

// Fixed "now": 15 March 2026, noon local time.
const NOW = new Date('2026-03-15T06:30:00.000Z');

function localDue(year: number, monthIndex: number, day: number): string {
  const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return farmDateTimeFromKey(key, TASK_DUE_TIME_HOUR)?.toISOString() ?? '';
}

const TODAY_DUE = localDue(2026, 2, 15);

describe('computeNextDueAt', () => {
  it('schedules from the last care date when history exists', () => {
    const plant = makePlant({
      last_watered_date: '2026-03-14T02:30:00.000Z',
      planting_date: '2025-01-01T06:30:00.000Z',
    });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 17));
  });

  it('uses the per-type last care date, not another type’s', () => {
    const plant = makePlant({
      last_watered_date: '2026-03-14T02:30:00.000Z',
      planting_date: '2026-03-13T06:30:00.000Z',
    });
    // Fertilise has no history → falls back to planting_date + 30.
    expect(computeNextDueAt(plant, 'fertilise', 30, NOW)).toBe(localDue(2026, 3, 12));
  });

  it('falls back to planting date when there is no care history', () => {
    const plant = makePlant({ planting_date: '2026-03-13T06:30:00.000Z' });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 16));
  });

  it('caps at today for a plant already past its cycle (never overdue-by-months)', () => {
    const plant = makePlant({ planting_date: '2025-01-01T06:30:00.000Z' });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(TODAY_DUE);
  });

  it('falls back to created_at when planting date is missing', () => {
    const plant = makePlant({ created_at: '2026-03-14T06:30:00.000Z' });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 17));
  });

  it('falls back to now + frequency when no dates exist at all', () => {
    const plant = makePlant({ created_at: '' });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 18));
  });

  it('uses last_harvest_date for harvest tasks', () => {
    const plant = makePlant({
      planting_date: '2020-01-01T06:30:00.000Z',
      last_harvest_date: '2026-03-01T06:30:00.000Z',
    });
    expect(computeNextDueAt(plant, 'harvest', 60, NOW)).toBe(localDue(2026, 3, 30));
  });

  it('caps an old tree’s first harvest at today when never harvested', () => {
    const plant = makePlant({ planting_date: '2020-01-01T06:30:00.000Z' });
    expect(computeNextDueAt(plant, 'harvest', 60, NOW)).toBe(TODAY_DUE);
  });
});

describe('calendarDaysOverdue', () => {
  const dueOn = (year: number, monthIndex: number, day: number): TaskTemplate =>
    makeTaskTemplate({ next_due_at: localDue(year, monthIndex, day) });

  it('counts a task due yesterday evening as one day late', () => {
    // Regression: due dates are stamped at 6 PM, so subtracting raw timestamps
    // and flooring gave 0 here — the detail sheet then read "Today" for a task
    // that was a day late, the most common overdue case there is.
    expect(calendarDaysOverdue(dueOn(2026, 2, 14), NOW)).toBe(1);
  });

  it('returns null for a task that came due today', () => {
    expect(calendarDaysOverdue(dueOn(2026, 2, 15), NOW)).toBeNull();
  });

  it('returns null for a task not due yet', () => {
    expect(calendarDaysOverdue(dueOn(2026, 2, 16), NOW)).toBeNull();
  });

  it('counts whole calendar days for longer overruns', () => {
    expect(calendarDaysOverdue(dueOn(2026, 2, 5), NOW)).toBe(10);
    expect(calendarDaysOverdue(dueOn(2026, 1, 15), NOW)).toBe(28);
  });

  it('is unaffected by the time of day the task was stamped', () => {
    const earlyMorning = makeTaskTemplate({
      next_due_at: '2026-03-13T18:35:00.000Z',
    });
    const lateEvening = makeTaskTemplate({
      next_due_at: '2026-03-14T18:25:00.000Z',
    });
    expect(calendarDaysOverdue(earlyMorning, NOW)).toBe(1);
    expect(calendarDaysOverdue(lateEvening, NOW)).toBe(1);
  });

  it('returns null when the due date is missing or unparseable', () => {
    expect(calendarDaysOverdue(makeTaskTemplate({ next_due_at: '' }), NOW)).toBeNull();
    expect(calendarDaysOverdue(makeTaskTemplate({ next_due_at: 'not a date' }), NOW)).toBeNull();
  });
});

describe('getLastCareDate', () => {
  const plant = makePlant({
    last_watered_date: '2026-03-10T00:00:00.000Z',
    last_fertilised_date: '2026-03-01T00:00:00.000Z',
    last_pruned_date: '2026-02-01T00:00:00.000Z',
    last_harvest_date: '2026-01-15T00:00:00.000Z',
  });

  it('maps each care task type to its plant field', () => {
    expect(getLastCareDate(plant, 'water')).toBe('2026-03-10T00:00:00.000Z');
    expect(getLastCareDate(plant, 'fertilise')).toBe('2026-03-01T00:00:00.000Z');
    expect(getLastCareDate(plant, 'prune')).toBe('2026-02-01T00:00:00.000Z');
    expect(getLastCareDate(plant, 'harvest')).toBe('2026-01-15T00:00:00.000Z');
  });

  it('returns null for task types without a plant last-care field', () => {
    expect(getLastCareDate(plant, 'harvest_leaves')).toBeNull();
    expect(getLastCareDate(plant, 'weeding')).toBeNull();
  });
});
