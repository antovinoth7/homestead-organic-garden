import {
  computeSkipDate,
  isEarlyCompletionBlocked,
  isFutureTask,
  isSkipBlocked,
  skipBaseDate,
} from '@/services/taskSchedulingLogic';
import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import type { TaskTemplate, TaskType } from '@/types/database.types';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

// Fixed "now": 15 March 2026, 09:00 local time — before the 18:00 due hour, so
// a task due today is still ahead of `now` on the clock.
const NOW = new Date(2026, 2, 15, 9, 0, 0, 0);

function localDue(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day, TASK_DUE_TIME_HOUR, 0, 0, 0).toISOString();
}

const dueToday = makeTaskTemplate({ next_due_at: localDue(2026, 2, 15) });
const dueInFiveDays = makeTaskTemplate({ next_due_at: localDue(2026, 2, 20) });
const overdue = makeTaskTemplate({ next_due_at: localDue(2026, 2, 10) });

describe('skipBaseDate', () => {
  it('uses the due date when the task is scheduled ahead of now', () => {
    expect(skipBaseDate(dueInFiveDays, NOW).toISOString()).toBe(localDue(2026, 2, 20));
  });

  it('uses now when the task is already overdue', () => {
    expect(skipBaseDate(overdue, NOW).getTime()).toBe(NOW.getTime());
  });
});

describe('computeSkipDate', () => {
  it('postpones a task due today to the requested day at the 18:00 due hour', () => {
    expect(computeSkipDate(dueToday, 1, NOW).toISOString()).toBe(localDue(2026, 2, 16));
    expect(computeSkipDate(dueToday, 7, NOW).toISOString()).toBe(localDue(2026, 2, 22));
  });

  it('anchors to the due date, so a future task is pushed later — never pulled in', () => {
    // Regression: the old handler used `now + days`, which dragged a task due
    // on the 20th back to the 16th.
    expect(computeSkipDate(dueInFiveDays, 1, NOW).toISOString()).toBe(localDue(2026, 2, 21));
  });

  it('reschedules an overdue task relative to today', () => {
    expect(computeSkipDate(overdue, 3, NOW).toISOString()).toBe(localDue(2026, 2, 18));
  });

  it('normalises to the 18:00 due hour regardless of the time of day it is tapped', () => {
    const lateEvening = new Date(2026, 2, 15, 23, 30, 0, 0);
    const result = new Date(computeSkipDate(overdue, 1, lateEvening));
    expect(result.getHours()).toBe(TASK_DUE_TIME_HOUR);
    expect(result.getMinutes()).toBe(0);
  });
});

describe('isFutureTask', () => {
  it('is false for a task due later today', () => {
    expect(isFutureTask(dueToday, NOW)).toBe(false);
  });

  it('is false for an overdue task', () => {
    expect(isFutureTask(overdue, NOW)).toBe(false);
  });

  it('is true for a task due on a later date', () => {
    expect(isFutureTask(dueInFiveDays, NOW)).toBe(true);
  });

  it('is true from the first moment of tomorrow', () => {
    const tomorrowMidnight = makeTaskTemplate({
      next_due_at: new Date(2026, 2, 16, 0, 0, 0, 0).toISOString(),
    });
    expect(isFutureTask(tomorrowMidnight, NOW)).toBe(true);
  });

  it('is false when the due date is unparseable', () => {
    expect(isFutureTask(makeTaskTemplate({ next_due_at: 'not-a-date' }), NOW)).toBe(false);
  });
});

describe('isSkipBlocked', () => {
  it('refuses a task due on a later date — there is nothing to defer yet', () => {
    expect(isSkipBlocked(dueInFiveDays, NOW)).toBe(true);
  });

  it('refuses from the first moment of tomorrow', () => {
    const tomorrowMidnight = makeTaskTemplate({
      next_due_at: new Date(2026, 2, 16, 0, 0, 0, 0).toISOString(),
    });
    expect(isSkipBlocked(tomorrowMidnight, NOW)).toBe(true);
  });

  it('allows a task due later today', () => {
    expect(isSkipBlocked(dueToday, NOW)).toBe(false);
  });

  it('allows an overdue task — skipping is exactly what it is for', () => {
    expect(isSkipBlocked(overdue, NOW)).toBe(false);
  });

  it('applies to every task type, not just the harmful-if-early ones', () => {
    const futurePrune = makeTaskTemplate({
      task_type: 'prune',
      next_due_at: localDue(2026, 2, 20),
    });
    // Early *completion* is allowed for prune; skipping still is not.
    expect(isEarlyCompletionBlocked(futurePrune, NOW)).toBe(false);
    expect(isSkipBlocked(futurePrune, NOW)).toBe(true);
  });

  it('does not block when the due date is unparseable', () => {
    expect(isSkipBlocked(makeTaskTemplate({ next_due_at: 'not-a-date' }), NOW)).toBe(false);
  });
});

describe('isEarlyCompletionBlocked', () => {
  const future = (task_type: TaskType): TaskTemplate =>
    makeTaskTemplate({ task_type, next_due_at: localDue(2026, 2, 20) });

  it.each<TaskType>(['water', 'fertilise', 'spray'])(
    'blocks a not-yet-due %s task — doing it early is harmful',
    (taskType) => {
      expect(isEarlyCompletionBlocked(future(taskType), NOW)).toBe(true);
    }
  );

  it.each<TaskType>(['prune', 'harvest', 'weeding', 'mulch'])(
    'allows a not-yet-due %s task through to the warn-then-allow path',
    (taskType) => {
      expect(isEarlyCompletionBlocked(future(taskType), NOW)).toBe(false);
    }
  );

  it('never blocks a watering task that is due today', () => {
    const dueTodayWater = makeTaskTemplate({
      task_type: 'water',
      next_due_at: localDue(2026, 2, 15),
    });
    expect(isEarlyCompletionBlocked(dueTodayWater, NOW)).toBe(false);
  });

  it('never blocks an overdue watering task', () => {
    expect(isEarlyCompletionBlocked(overdue, NOW)).toBe(false);
  });

  it('does not block when the due date is unparseable', () => {
    const broken = makeTaskTemplate({ task_type: 'water', next_due_at: 'not-a-date' });
    expect(isEarlyCompletionBlocked(broken, NOW)).toBe(false);
  });
});
