import {
  TASK_BEST_TIME,
  preferredTimeLabel,
  showPreferredTimeInMeta,
  taskBestTime,
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
