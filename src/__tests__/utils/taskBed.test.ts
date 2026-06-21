import { resolveTaskBedId, isBedLevelOrphanTask } from '@/utils/taskBed';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const plantsById = new Map<string, { bed_id?: string | null }>([
  ['plant-in-bed', { bed_id: 'bed-1' }],
  ['plant-no-bed', { bed_id: null }],
]);

describe('resolveTaskBedId', () => {
  it('uses the task bed_id for bed-level tasks', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-9', plant_id: null });
    expect(resolveTaskBedId(task, plantsById)).toBe('bed-9');
  });

  it('inherits the bed from the task plant when the task has no bed_id', () => {
    const task = makeTaskTemplate({ bed_id: null, plant_id: 'plant-in-bed' });
    expect(resolveTaskBedId(task, plantsById)).toBe('bed-1');
  });

  it('returns null when the plant has no bed', () => {
    const task = makeTaskTemplate({ bed_id: null, plant_id: 'plant-no-bed' });
    expect(resolveTaskBedId(task, plantsById)).toBeNull();
  });

  it('returns null when the plant is unknown', () => {
    const task = makeTaskTemplate({ bed_id: null, plant_id: 'missing' });
    expect(resolveTaskBedId(task, plantsById)).toBeNull();
  });

  it('returns null for a general task with no bed or plant', () => {
    const task = makeTaskTemplate({ bed_id: null, plant_id: null });
    expect(resolveTaskBedId(task, plantsById)).toBeNull();
  });

  it('prefers the task bed_id even when the plant is in a different bed', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-override', plant_id: 'plant-in-bed' });
    expect(resolveTaskBedId(task, plantsById)).toBe('bed-override');
  });
});

describe('isBedLevelOrphanTask', () => {
  const liveBedIds = new Set(['bed-1', 'bed-2']);

  it('flags a bed-level task whose bed no longer exists', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-gone', plant_id: null });
    expect(isBedLevelOrphanTask(task, liveBedIds)).toBe(true);
  });

  it('does not flag a bed-level task whose bed is still live', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-1', plant_id: null });
    expect(isBedLevelOrphanTask(task, liveBedIds)).toBe(false);
  });

  it('never flags a plant task (covered by plant orphan cleanup)', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-gone', plant_id: 'plant-in-bed' });
    expect(isBedLevelOrphanTask(task, liveBedIds)).toBe(false);
  });

  it('does not flag a pot/ground task with no bed', () => {
    const task = makeTaskTemplate({ bed_id: null, plant_id: null });
    expect(isBedLevelOrphanTask(task, liveBedIds)).toBe(false);
  });

  it('flags every bed-level task when there are no live beds', () => {
    const task = makeTaskTemplate({ bed_id: 'bed-1', plant_id: null });
    expect(isBedLevelOrphanTask(task, new Set())).toBe(true);
  });
});
