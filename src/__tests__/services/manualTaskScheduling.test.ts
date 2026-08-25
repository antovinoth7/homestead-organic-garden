import {
  computeScheduleAfterCompletion,
  computeSkipDate,
  dueHourForTemplate,
  isSyncOwnedTemplate,
} from '@/services/taskSchedulingLogic';
import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import { farmDateKey } from '@/utils/farmDate';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

// Fixed "done at": 15 March 2026, noon IST.
const DONE_AT = new Date('2026-03-15T06:30:00.000Z');

/** The hour a Date lands on in farm wall-clock time. */
function farmHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    }).format(date)
  );
}

describe('isSyncOwnedTemplate', () => {
  it('treats a template with no source as sync-owned', () => {
    // Backwards compatibility: every template written before the field existed
    // was already being reconciled by syncCareTasksForPlant.
    expect(isSyncOwnedTemplate(makeTaskTemplate())).toBe(true);
  });

  it('treats an explicit auto template as sync-owned', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: 'auto' }))).toBe(true);
  });

  it('treats a null source as sync-owned', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: null }))).toBe(true);
  });

  it('excludes a manually-created template from sync', () => {
    expect(isSyncOwnedTemplate(makeTaskTemplate({ source: 'manual' }))).toBe(false);
  });
});

describe('dueHourForTemplate', () => {
  it('uses 8 AM for a morning task', () => {
    expect(dueHourForTemplate(makeTaskTemplate({ preferred_time: 'morning' }))).toBe(8);
  });

  it('uses 2 PM for an afternoon task', () => {
    expect(dueHourForTemplate(makeTaskTemplate({ preferred_time: 'afternoon' }))).toBe(14);
  });

  it('uses the default due hour for an evening task', () => {
    expect(dueHourForTemplate(makeTaskTemplate({ preferred_time: 'evening' }))).toBe(
      TASK_DUE_TIME_HOUR
    );
  });

  it('uses the default due hour when no preference is set', () => {
    expect(dueHourForTemplate(makeTaskTemplate({ preferred_time: null }))).toBe(TASK_DUE_TIME_HOUR);
  });
});

describe('computeScheduleAfterCompletion', () => {
  it('season-adjusts a plant-level water task', () => {
    const template = makeTaskTemplate({ task_type: 'water', frequency_days: 6 });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(result.wateringMultiplier).not.toBeNull();
    expect(result.effectiveDays).toBe(Math.max(1, Math.round(6 * result.wateringMultiplier!)));
  });

  it('season-adjusts a bed-level water task the same as a plant in a bed', () => {
    // Regression: the multiplier used to be gated on plant_id, so a bed
    // watering task recurred at its raw interval all year while the plants
    // inside that bed followed the season.
    const bedTemplate = makeTaskTemplate({
      task_type: 'water',
      frequency_days: 6,
      plant_id: null,
      bed_id: 'bed-1',
    });
    const bedResult = computeScheduleAfterCompletion(bedTemplate, null, DONE_AT);
    const plantResult = computeScheduleAfterCompletion(
      makeTaskTemplate({ task_type: 'water', frequency_days: 6 }),
      makePlant({ space_type: 'bed' }),
      DONE_AT
    );

    expect(bedResult.wateringMultiplier).not.toBeNull();
    expect(bedResult.wateringMultiplier).toBe(plantResult.wateringMultiplier);
    expect(bedResult.effectiveDays).toBe(plantResult.effectiveDays);
  });

  it('leaves a general water task (no plant, no bed) on its raw interval', () => {
    const template = makeTaskTemplate({
      task_type: 'water',
      frequency_days: 6,
      plant_id: null,
      bed_id: null,
    });
    const result = computeScheduleAfterCompletion(template, null, DONE_AT);
    expect(result.wateringMultiplier).toBeNull();
    expect(result.effectiveDays).toBe(6);
  });

  it('never season-adjusts a non-water task', () => {
    const template = makeTaskTemplate({ task_type: 'fertilise', frequency_days: 30 });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(result.wateringMultiplier).toBeNull();
    expect(result.effectiveDays).toBe(30);
  });

  it('keeps the morning slot instead of dropping the task to 6 PM', () => {
    const template = makeTaskTemplate({
      task_type: 'prune',
      frequency_days: 7,
      preferred_time: 'morning',
    });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(result.nextDueAt).not.toBeNull();
    expect(farmHour(result.nextDueAt!)).toBe(8);
    expect(farmDateKey(result.nextDueAt!)).toBe('2026-03-22');
  });

  it('falls back to the default due hour with no preference', () => {
    const template = makeTaskTemplate({ task_type: 'prune', frequency_days: 7 });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(farmHour(result.nextDueAt!)).toBe(TASK_DUE_TIME_HOUR);
  });

  it('does not advance a one-time task past the day it was done', () => {
    // frequency 0 means "do this once"; the caller disables the template.
    const template = makeTaskTemplate({ task_type: 'repot', frequency_days: 0 });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(result.effectiveDays).toBe(0);
    expect(farmDateKey(result.nextDueAt!)).toBe('2026-03-15');
  });

  it('treats a non-finite frequency as zero rather than producing an invalid date', () => {
    const template = makeTaskTemplate({ task_type: 'water', frequency_days: Number.NaN });
    const result = computeScheduleAfterCompletion(template, makePlant(), DONE_AT);
    expect(result.effectiveDays).toBe(0);
    expect(result.wateringMultiplier).toBeNull();
  });
});

describe('computeSkipDate', () => {
  it('preserves the preferred hour when a task is pushed back', () => {
    const template = makeTaskTemplate({
      preferred_time: 'morning',
      next_due_at: '2026-03-15T02:30:00.000Z',
    });
    expect(farmHour(computeSkipDate(template, 3, DONE_AT))).toBe(8);
  });

  it('uses the default due hour when no preference is set', () => {
    const template = makeTaskTemplate({
      preferred_time: null,
      next_due_at: '2026-03-15T02:30:00.000Z',
    });
    expect(farmHour(computeSkipDate(template, 3, DONE_AT))).toBe(TASK_DUE_TIME_HOUR);
  });
});
