import {
  TASK_BEST_TIME,
  TIME_BANDS,
  TIME_BAND_ORDER,
  currentTimeBand,
  farmClockLabel,
  preferredTimeLabel,
  showPreferredTimeInMeta,
  taskBestTime,
  taskTimeBand,
} from '@/utils/taskTimeWindow';
import type { TaskType } from '@/types/database.types';

const task = (
  task_type: TaskType,
  preferred_time: string | null = null
): { task_type: TaskType; preferred_time: string | null } => ({
  task_type,
  preferred_time,
});

describe('taskBestTime', () => {
  it.each<[TaskType, string]>([
    ['water', 'Before 10 AM'],
    ['spray', 'After 4 PM'],
    ['fertilise', 'After watering'],
    ['harvest', 'Before 9 AM'],
    ['harvest_leaves', 'Before 9 AM'],
    ['transplanting', 'After 4 PM'],
    ['prune', 'Dry weather'],
  ])('gives %s its field window', (type, label) => {
    expect(taskBestTime(task(type))?.label).toBe(label);
  });

  it.each<TaskType>(['repot', 'mulch', 'weeding', 'cultivating'])(
    'makes no claim for %s',
    (type) => {
      expect(taskBestTime(task(type))).toBeNull();
    }
  );

  it('gives every window a reason for the detail sheet', () => {
    for (const window of Object.values(TASK_BEST_TIME)) {
      expect(window?.reason.length).toBeGreaterThan(10);
    }
  });

  it('turns an evening watering into the evening window', () => {
    const best = taskBestTime(task('water', 'evening'));
    expect(best?.label).toBe('After 4 PM');
    expect(best?.tone).toBe('cool');
  });

  it('keeps a window the farmer’s chosen time agrees with', () => {
    expect(taskBestTime(task('spray', 'evening'))?.label).toBe('After 4 PM');
    expect(taskBestTime(task('harvest', 'morning'))?.label).toBe('Before 9 AM');
  });

  it('drops a clock window that clashes with the farmer’s time', () => {
    expect(taskBestTime(task('harvest', 'evening'))).toBeNull();
    expect(taskBestTime(task('spray', 'afternoon'))).toBeNull();
    expect(taskBestTime(task('water', 'afternoon'))).toBeNull();
  });

  it('keeps condition windows whatever time is set', () => {
    expect(taskBestTime(task('fertilise', 'afternoon'))?.label).toBe('After watering');
  });

  it('uses the cool tone only for evening windows', () => {
    for (const window of Object.values(TASK_BEST_TIME)) {
      expect(window?.tone === 'cool').toBe(window?.slot === 'evening');
    }
  });
});

describe('preferredTimeLabel', () => {
  it('labels the three times and nothing else', () => {
    expect(preferredTimeLabel('morning')).toBe('Morning');
    expect(preferredTimeLabel('afternoon')).toBe('Afternoon');
    expect(preferredTimeLabel('evening')).toBe('Evening');
    expect(preferredTimeLabel(null)).toBeNull();
    expect(preferredTimeLabel('midnight')).toBeNull();
  });
});

describe('showPreferredTimeInMeta', () => {
  it('hides the time when a clock chip already says when', () => {
    expect(showPreferredTimeInMeta(task('water', 'morning'))).toBe(false);
  });

  it('shows the time when the chip is about conditions or absent', () => {
    expect(showPreferredTimeInMeta(task('fertilise', 'morning'))).toBe(true);
    expect(showPreferredTimeInMeta(task('mulch', 'evening'))).toBe(true);
    expect(showPreferredTimeInMeta(task('harvest', 'evening'))).toBe(true);
  });

  it('has nothing to show without a time', () => {
    expect(showPreferredTimeInMeta(task('mulch'))).toBe(false);
  });
});

describe('taskTimeBand', () => {
  it.each<[TaskType, string | null, string]>([
    ['water', null, 'morning'],
    ['harvest', null, 'morning'],
    ['spray', null, 'evening'],
    ['water', 'evening', 'evening'],
    ['fertilise', null, 'any'],
    ['mulch', null, 'any'],
    ['water', 'afternoon', 'any'],
  ])('puts %s (preferred %s) in the %s band', (type, preferred, band) => {
    expect(taskTimeBand(task(type, preferred))).toBe(band);
  });

  it('names every band in order', () => {
    expect(TIME_BAND_ORDER.map((band) => TIME_BANDS[band].title)).toEqual([
      'Before 10 AM',
      'Any time',
      'After 4 PM',
    ]);
  });
});

describe('currentTimeBand', () => {
  // The farm clock is IST (UTC+5:30): 04:29 UTC is 09:59 on the farm.
  it.each<[string, string]>([
    ['2026-10-03T00:53:00.000Z', 'morning'],
    ['2026-10-03T04:29:00.000Z', 'morning'],
    ['2026-10-03T04:30:00.000Z', 'any'],
    ['2026-10-03T10:29:00.000Z', 'any'],
    ['2026-10-03T10:30:00.000Z', 'evening'],
    ['2026-10-03T18:29:00.000Z', 'evening'],
    ['2026-10-03T18:30:00.000Z', 'morning'],
  ])('at %s is %s', (iso, band) => {
    expect(currentTimeBand(new Date(iso))).toBe(band);
  });

  it('labels the farm clock in 12-hour time', () => {
    expect(farmClockLabel(new Date('2026-10-03T00:53:00.000Z'))).toBe('6:23');
    expect(farmClockLabel(new Date('2026-10-03T10:35:00.000Z'))).toBe('4:05');
    expect(farmClockLabel(new Date('2026-10-03T18:30:00.000Z'))).toBe('12:00');
  });
});
