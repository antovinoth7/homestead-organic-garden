import { computeNextDueAt, getLastCareDate } from '@/services/taskSchedulingLogic';
import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import { makePlant } from '../fixtures/plant.fixtures';

// Fixed "now": 15 March 2026, noon local time.
const NOW = new Date(2026, 2, 15, 12, 0, 0, 0);

function localDue(year: number, monthIndex: number, day: number): string {
  const d = new Date(year, monthIndex, day, TASK_DUE_TIME_HOUR, 0, 0, 0);
  return d.toISOString();
}

const TODAY_DUE = localDue(2026, 2, 15);

describe('computeNextDueAt', () => {
  it('schedules from the last care date when history exists', () => {
    const plant = makePlant({
      last_watered_date: new Date(2026, 2, 14, 8, 0).toISOString(),
      planting_date: new Date(2025, 0, 1).toISOString(),
    });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 17));
  });

  it('uses the per-type last care date, not another type’s', () => {
    const plant = makePlant({
      last_watered_date: new Date(2026, 2, 14, 8, 0).toISOString(),
      planting_date: new Date(2026, 2, 13).toISOString(),
    });
    // Fertilise has no history → falls back to planting_date + 30.
    expect(computeNextDueAt(plant, 'fertilise', 30, NOW)).toBe(localDue(2026, 3, 12));
  });

  it('falls back to planting date when there is no care history', () => {
    const plant = makePlant({ planting_date: new Date(2026, 2, 13).toISOString() });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 16));
  });

  it('caps at today for a plant already past its cycle (never overdue-by-months)', () => {
    const plant = makePlant({ planting_date: new Date(2025, 0, 1).toISOString() });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(TODAY_DUE);
  });

  it('falls back to created_at when planting date is missing', () => {
    const plant = makePlant({ created_at: new Date(2026, 2, 14).toISOString() });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 17));
  });

  it('falls back to now + frequency when no dates exist at all', () => {
    const plant = makePlant({ created_at: '' });
    expect(computeNextDueAt(plant, 'water', 3, NOW)).toBe(localDue(2026, 2, 18));
  });

  it('uses last_harvest_date for harvest tasks', () => {
    const plant = makePlant({
      planting_date: new Date(2020, 0, 1).toISOString(),
      last_harvest_date: new Date(2026, 2, 1).toISOString(),
    });
    expect(computeNextDueAt(plant, 'harvest', 60, NOW)).toBe(localDue(2026, 3, 30));
  });

  it('caps an old tree’s first harvest at today when never harvested', () => {
    const plant = makePlant({ planting_date: new Date(2020, 0, 1).toISOString() });
    expect(computeNextDueAt(plant, 'harvest', 60, NOW)).toBe(TODAY_DUE);
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
