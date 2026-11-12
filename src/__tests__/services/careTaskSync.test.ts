/**
 * The decisions behind `syncCareTasksForPlant` and `buildTaskDoneOps`, which
 * live in `taskSchedulingLogic` so they can be tested without Firestore. The
 * service functions only turn these results into template writes.
 */

import {
  careNextDueAt,
  careTemplateUpdates,
  computeNextDueAt,
  desiredCareTasks,
  oneShotArchivePlantId,
  plantCareStampAfterCompletion,
  templateChangeAfterCompletion,
} from '@/services/taskSchedulingLogic';
import { getCoconutAgeInfo } from '@/utils/plantHelpers';
import { getEffectiveWateringIntervalDays } from '@/utils/plantWatering';
import type { Plant, PlantType, TaskType } from '@/types/database.types';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

/** The desired care set as [type, interval, enabled] rows, for compact assertions. */
const careSet = (plant: Plant): [TaskType, number | null, boolean][] =>
  desiredCareTasks(plant).map(({ taskType, frequency, enabled }) => [taskType, frequency, enabled]);

describe('desiredCareTasks', () => {
  it('lists water, fertilise and prune with the plant’s own intervals', () => {
    const plant = makePlant({
      watering_frequency_days: 3,
      fertilising_frequency_days: 30,
      pruning_frequency_days: 60,
    });
    expect(careSet(plant)).toEqual([
      ['water', 3, true],
      ['fertilise', 30, true],
      ['prune', 60, true],
    ]);
  });

  it('keeps a switched-off care type, marked disabled, so its template can be turned off', () => {
    const plant = makePlant({
      watering_frequency_days: 3,
      fertilising_frequency_days: 30,
      pruning_frequency_days: 60,
      watering_enabled: false,
      pruning_enabled: false,
    });
    expect(careSet(plant)).toEqual([
      ['water', 3, false],
      ['fertilise', 30, true],
      ['prune', 60, false],
    ]);
  });

  it('reports an interval it cannot resolve as null, not as switched off', () => {
    const plant = makePlant({
      plant_type: 'not_a_plant_type' as PlantType,
      watering_frequency_days: null,
      fertilising_frequency_days: null,
      pruning_frequency_days: null,
    });
    expect(careSet(plant)).toEqual([
      ['water', null, true],
      ['fertilise', null, true],
      ['prune', null, true],
    ]);
  });

  it('adds a harvest task for a bearing coconut tree', () => {
    const planting_date = '2010-06-01';
    const harvestDays = getCoconutAgeInfo(planting_date)?.harvestFrequencyDays ?? 0;
    expect(harvestDays).toBeGreaterThan(0);

    const tasks = desiredCareTasks(makePlant({ plant_type: 'coconut_tree', planting_date }));
    expect(tasks.find((t) => t.taskType === 'harvest')).toEqual({
      taskType: 'harvest',
      frequency: harvestDays,
      enabled: true,
    });
  });

  it('adds no harvest task for a coconut tree that is not bearing yet', () => {
    const planting_date = new Date().toISOString().slice(0, 10);
    const tasks = desiredCareTasks(makePlant({ plant_type: 'coconut_tree', planting_date }));
    expect(tasks.map((t) => t.taskType)).not.toContain('harvest');
  });

  it('adds no harvest task for a coconut tree with no planting date', () => {
    const tasks = desiredCareTasks(makePlant({ plant_type: 'coconut_tree', planting_date: null }));
    expect(tasks.map((t) => t.taskType)).not.toContain('harvest');
  });

  it('adds a 14-day leaf-harvest task for a perennial, after the care types', () => {
    const tasks = desiredCareTasks(makePlant({ lifecycle_type: 'perennial' }));
    expect(tasks.map((t) => t.taskType)).toEqual(['water', 'fertilise', 'prune', 'harvest_leaves']);
    expect(tasks[3]).toEqual({ taskType: 'harvest_leaves', frequency: 14, enabled: true });
  });
});

describe('careNextDueAt', () => {
  it('schedules a non-water task straight from its interval', () => {
    const plant = makePlant({ last_fertilised_date: '2026-03-01T06:30:00.000Z' });
    expect(careNextDueAt(plant, 'fertilise', 30)).toBe(computeNextDueAt(plant, 'fertilise', 30));
  });

  it('season-adjusts a water task through the shared watering interval', () => {
    const plant = makePlant({
      watering_frequency_days: 4,
      last_watered_date: '2026-03-01T06:30:00.000Z',
    });
    const effective = getEffectiveWateringIntervalDays(plant) ?? 4;
    expect(careNextDueAt(plant, 'water', 4)).toBe(computeNextDueAt(plant, 'water', effective));
  });
});

describe('careTemplateUpdates', () => {
  const NEXT_DUE = '2026-03-13T12:30:00.000Z';
  // Created before the stored due date, and already watered once — so none of
  // the due-date re-base rules apply unless a test sets one up.
  const plant = makePlant({
    created_at: '2026-01-01T00:00:00.000Z',
    last_watered_date: '2026-03-10T06:30:00.000Z',
  });
  const inStep = makeTaskTemplate({ frequency_days: 3, enabled: true, next_due_at: NEXT_DUE });

  it('changes nothing when the template already matches', () => {
    expect(careTemplateUpdates(inStep, plant, 'water', 3, NEXT_DUE)).toEqual({});
  });

  it('takes a new interval and re-dates the task', () => {
    const existing = makeTaskTemplate({ ...inStep, frequency_days: 5 });
    expect(careTemplateUpdates(existing, plant, 'water', 3, NEXT_DUE)).toEqual({
      frequency_days: 3,
      next_due_at: NEXT_DUE,
    });
  });

  it('re-enables a paused template and re-bases its due date', () => {
    const existing = makeTaskTemplate({
      ...inStep,
      enabled: false,
      next_due_at: '2026-02-01T12:30:00.000Z',
    });
    expect(careTemplateUpdates(existing, plant, 'water', 3, NEXT_DUE)).toEqual({
      enabled: true,
      next_due_at: NEXT_DUE,
    });
  });

  it('re-dates a template with no usable due date', () => {
    const existing = makeTaskTemplate({ ...inStep, next_due_at: 'not-a-date' });
    expect(careTemplateUpdates(existing, plant, 'water', 3, NEXT_DUE)).toEqual({
      next_due_at: NEXT_DUE,
    });
  });

  it('re-dates a due date that predates the plant itself', () => {
    const existing = makeTaskTemplate({ ...inStep, next_due_at: '2025-12-01T12:30:00.000Z' });
    expect(careTemplateUpdates(existing, plant, 'water', 3, NEXT_DUE)).toEqual({
      next_due_at: NEXT_DUE,
    });
  });

  describe('a never-completed task due later than its computed date', () => {
    const neverCared = makePlant({ created_at: '2026-01-01T00:00:00.000Z' });
    const late = makeTaskTemplate({
      ...inStep,
      task_type: 'water',
      next_due_at: '2026-04-01T12:30:00.000Z',
    });

    it('is pulled back for a task type with a plant last-care field', () => {
      expect(careTemplateUpdates(late, neverCared, 'water', 3, NEXT_DUE)).toEqual({
        next_due_at: NEXT_DUE,
      });
    });

    it('is left alone for a type the plant doc cannot record (leaf harvest)', () => {
      const leaves = makeTaskTemplate({ ...late, task_type: 'harvest_leaves', frequency_days: 14 });
      expect(careTemplateUpdates(leaves, neverCared, 'harvest_leaves', 14, NEXT_DUE)).toEqual({});
    });

    it('is left alone once the plant has a last-care date', () => {
      expect(careTemplateUpdates(late, plant, 'water', 3, NEXT_DUE)).toEqual({});
    });
  });
});

describe('templateChangeAfterCompletion', () => {
  const DONE_AT = new Date('2026-03-15T06:30:00.000Z');
  const NEXT = new Date('2026-03-18T12:30:00.000Z');

  it.each([0, -1])('switches a one-off (frequency %p) off, stamped at completion', (freq) => {
    expect(templateChangeAfterCompletion(freq, NEXT, DONE_AT)).toEqual({
      enabled: false,
      nextDueAt: DONE_AT,
    });
  });

  it('moves a recurring task to its next due date', () => {
    expect(templateChangeAfterCompletion(3, NEXT, DONE_AT)).toEqual({ nextDueAt: NEXT });
  });

  it.each([null, new Date(Number.NaN)])('leaves the template alone when the date is %p', (next) => {
    expect(templateChangeAfterCompletion(3, next, DONE_AT)).toEqual({});
  });
});

describe('plantCareStampAfterCompletion', () => {
  const DONE = '2026-03-15T06:30:00.000Z';

  it('stamps a watering with the multiplier it applied', () => {
    expect(plantCareStampAfterCompletion('water', DONE, 0.75)).toEqual({
      last_watered_date: DONE,
      last_watering_multiplier: 0.75,
      last_watering_adjustment: null,
    });
  });

  it('stamps only the last-care date when no multiplier applied', () => {
    expect(plantCareStampAfterCompletion('fertilise', DONE, null)).toEqual({
      last_fertilised_date: DONE,
    });
  });

  it('stamps nothing for a task type the plant doc does not record', () => {
    expect(plantCareStampAfterCompletion('spray', DONE, null)).toBeNull();
  });
});

describe('oneShotArchivePlantId', () => {
  const harvest = makeTaskTemplate({ task_type: 'harvest', plant_id: 'p1' });
  const oneShot = makePlant({ id: 'p1', harvest_mode: 'one_shot' });

  it('archives a one-shot plant when its harvest is completed', () => {
    expect(oneShotArchivePlantId(harvest, [oneShot])).toBe('p1');
  });

  it('leaves an already archived plant alone', () => {
    const archived = makePlant({ ...oneShot, archived_at: '2026-03-01T00:00:00.000Z' });
    expect(oneShotArchivePlantId(harvest, [archived])).toBeNull();
  });

  it('leaves a cut-and-come-again plant alone', () => {
    const repeat = makePlant({ ...oneShot, harvest_mode: 'cut_and_come_again' });
    expect(oneShotArchivePlantId(harvest, [repeat])).toBeNull();
  });

  it('ignores task types other than harvest', () => {
    const water = makeTaskTemplate({ task_type: 'water', plant_id: 'p1' });
    expect(oneShotArchivePlantId(water, [oneShot])).toBeNull();
  });

  it('ignores a harvest task with no plant, or a plant that is not loaded', () => {
    expect(oneShotArchivePlantId({ ...harvest, plant_id: null }, [oneShot])).toBeNull();
    expect(oneShotArchivePlantId(harvest, [])).toBeNull();
  });
});
