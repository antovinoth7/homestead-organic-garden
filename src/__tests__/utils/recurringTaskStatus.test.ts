import { isRecurringTaskActive } from '@/utils/recurringTaskStatus';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

describe('isRecurringTaskActive', () => {
  it('is active when the template is enabled and the plant toggle is on', () => {
    const plant = makePlant({ watering_enabled: true });
    const task = makeTaskTemplate({ task_type: 'water', enabled: true });
    expect(isRecurringTaskActive(task, plant)).toBe(true);
  });

  it('is inactive when the template itself is disabled', () => {
    const plant = makePlant({ watering_enabled: true });
    const task = makeTaskTemplate({ task_type: 'water', enabled: false });
    expect(isRecurringTaskActive(task, plant)).toBe(false);
  });

  it('reads inactive when the plant toggle is off even if the template is stale-enabled', () => {
    // Reproduces the divergence: template never got disabled, but the plant's
    // own toggle is the source of truth.
    const plant = makePlant({ watering_enabled: false });
    const task = makeTaskTemplate({ task_type: 'water', enabled: true, frequency_days: 10 });
    expect(isRecurringTaskActive(task, plant)).toBe(false);
  });

  it('maps fertilise and prune to their own plant toggles', () => {
    const plant = makePlant({ fertilising_enabled: false, pruning_enabled: true });
    const fertilise = makeTaskTemplate({ task_type: 'fertilise', enabled: true });
    const prune = makeTaskTemplate({ task_type: 'prune', enabled: true });
    expect(isRecurringTaskActive(fertilise, plant)).toBe(false);
    expect(isRecurringTaskActive(prune, plant)).toBe(true);
  });

  it('treats a missing/undefined plant toggle as on (only explicit false is off)', () => {
    const plant = makePlant({ watering_enabled: undefined });
    const task = makeTaskTemplate({ task_type: 'water', enabled: true });
    expect(isRecurringTaskActive(task, plant)).toBe(true);
  });

  it('falls back to the template flag for types without a plant toggle (harvest)', () => {
    const plant = makePlant({ watering_enabled: false });
    const active = makeTaskTemplate({ task_type: 'harvest', enabled: true });
    const inactive = makeTaskTemplate({ task_type: 'harvest', enabled: false });
    expect(isRecurringTaskActive(active, plant)).toBe(true);
    expect(isRecurringTaskActive(inactive, plant)).toBe(false);
  });
});
