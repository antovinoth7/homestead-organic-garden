import { resolveTaskBedId } from '@/utils/taskBed';
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
