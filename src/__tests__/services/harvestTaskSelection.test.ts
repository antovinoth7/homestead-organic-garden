import type { TaskTemplate } from '@/types/database.types';
import { selectDueHarvestTasks } from '@/services/taskSchedulingLogic';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

/**
 * Which harvest tasks a logged harvest closes.
 *
 * `journal.ts` runs this and hands the result to `markTaskDone`, so this is the
 * decision half of "logging a harvest also advances the schedule" — the part
 * that used not to happen at all, leaving a task overdue for work already done.
 */
describe('selectDueHarvestTasks', () => {
  const PLANT = 'keerai-1';
  // 22 Aug 2026 in the farm's timezone.
  const HARVESTED_AT = '2026-08-22T06:30:00.000Z';

  const harvestTask = (overrides: Partial<TaskTemplate> = {}): TaskTemplate =>
    makeTaskTemplate({
      id: 'harvest-task',
      plant_id: PLANT,
      task_type: 'harvest',
      enabled: true,
      next_due_at: '2026-08-20T12:30:00.000Z',
      ...overrides,
    });

  const idsFor = (templates: TaskTemplate[]): string[] =>
    selectDueHarvestTasks(templates, PLANT, HARVESTED_AT).map((t) => t.id);

  it('selects an overdue harvest task', () => {
    expect(idsFor([harvestTask()])).toEqual(['harvest-task']);
  });

  it('selects a task due on the day of the harvest', () => {
    expect(idsFor([harvestTask({ next_due_at: '2026-08-22T12:30:00.000Z' })])).toEqual([
      'harvest-task',
    ]);
  });

  // Completing a future task rebases its whole cycle onto today, so an early
  // pick records the yield without silently rescheduling the rest of the season.
  it('leaves a task that is not due yet alone', () => {
    expect(idsFor([harvestTask({ next_due_at: '2026-08-25T12:30:00.000Z' })])).toEqual([]);
  });

  it('selects leaf-harvest tasks too', () => {
    expect(idsFor([harvestTask({ id: 'leaves', task_type: 'harvest_leaves' })])).toEqual(['leaves']);
  });

  it('ignores care work that is not a harvest', () => {
    expect(
      idsFor([
        harvestTask({ id: 'water', task_type: 'water' }),
        harvestTask({ id: 'prune', task_type: 'prune' }),
      ])
    ).toEqual([]);
  });

  it('ignores disabled tasks and other plants', () => {
    expect(
      idsFor([
        harvestTask({ id: 'off', enabled: false }),
        harvestTask({ id: 'elsewhere', plant_id: 'other-plant' }),
      ])
    ).toEqual([]);
  });

  it('ignores a task with no due date rather than throwing', () => {
    expect(idsFor([harvestTask({ next_due_at: null as unknown as string })])).toEqual([]);
  });

  it('returns every due harvest task when a plant has more than one', () => {
    expect(
      idsFor([
        harvestTask({ id: 'a' }),
        harvestTask({ id: 'b', task_type: 'harvest_leaves' }),
        harvestTask({ id: 'later', next_due_at: '2026-09-10T12:30:00.000Z' }),
      ])
    ).toEqual(['a', 'b']);
  });

  it('returns nothing for an unparseable harvest date', () => {
    expect(selectDueHarvestTasks([harvestTask()], PLANT, 'not-a-date')).toEqual([]);
  });
});
