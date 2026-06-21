import {
  summarizeTodayTasks,
  computeDonutSegments,
  filterToKnownPlants,
  getNextTask,
} from '@/utils/taskSummary';
import { makeTaskTemplate, makeTaskLog } from '../fixtures/task.fixtures';

// Anchor "now" so date comparisons are deterministic.
const NOW = new Date('2026-01-10T12:00:00.000Z').getTime();
const todayIso = '2026-01-10T08:00:00.000Z';
const yesterdayIso = '2026-01-09T08:00:00.000Z';

describe('summarizeTodayTasks', () => {
  it('splits overdue vs today and counts completion', () => {
    const tasks = [
      makeTaskTemplate({ id: 'a', task_type: 'water', next_due_at: yesterdayIso }),
      makeTaskTemplate({ id: 'b', task_type: 'water', next_due_at: todayIso }),
      makeTaskTemplate({ id: 'c', task_type: 'fertilise', next_due_at: todayIso }),
    ];
    const logs = [makeTaskLog({ template_id: 'c', task_type: 'fertilise' })];

    const summary = summarizeTodayTasks(tasks, logs, NOW);

    expect(summary.overdueTasks.map((t) => t.id)).toEqual(['a']);
    expect(summary.todayTasks.map((t) => t.id)).toEqual(['b']);
    expect(summary.totalTasks).toBe(3);
    expect(summary.completed).toBe(1);
    expect(summary.completionRate).toBe(33);
    expect(summary.overdueCount).toBe(1);
  });

  it('excludes completed templates from remaining lists', () => {
    const tasks = [makeTaskTemplate({ id: 'a', next_due_at: yesterdayIso })];
    const logs = [makeTaskLog({ template_id: 'a' })];

    const summary = summarizeTodayTasks(tasks, logs, NOW);

    expect(summary.overdueTasks).toHaveLength(0);
    expect(summary.completionRate).toBe(100);
  });

  it('builds per-type stats with done/total', () => {
    const tasks = [
      makeTaskTemplate({ id: 'a', task_type: 'water', next_due_at: todayIso }),
      makeTaskTemplate({ id: 'b', task_type: 'water', next_due_at: todayIso }),
    ];
    const logs = [makeTaskLog({ template_id: 'x', task_type: 'water' })];

    const summary = summarizeTodayTasks(tasks, logs, NOW);
    const water = summary.typeStats.find((s) => s.type === 'water');

    expect(water).toMatchObject({ type: 'water', done: 1, total: 3, remaining: 2 });
  });
});

describe('computeDonutSegments', () => {
  it('returns no segments when there are no tasks', () => {
    const summary = summarizeTodayTasks([], [], NOW);
    expect(computeDonutSegments(summary)).toEqual([]);
  });

  it('sweeps sum to 360° across all task types', () => {
    const tasks = [
      makeTaskTemplate({ id: 'a', task_type: 'water', next_due_at: todayIso }),
      makeTaskTemplate({ id: 'b', task_type: 'fertilise', next_due_at: todayIso }),
    ];
    const summary = summarizeTodayTasks(tasks, [], NOW);
    const total = computeDonutSegments(summary).reduce((sum, s) => sum + s.sweep, 0);
    expect(Math.round(total)).toBe(360);
  });
});

describe('filterToKnownPlants', () => {
  it('keeps plant-scoped items whose plant_id is known', () => {
    const tasks = [
      makeTaskTemplate({ id: 'a', plant_id: 'p1' }),
      makeTaskTemplate({ id: 'b', plant_id: 'p2' }),
    ];
    const kept = filterToKnownPlants(tasks, new Set(['p1']));
    expect(kept.map((t) => t.id)).toEqual(['a']);
  });

  it('always keeps items with no plant_id (bed/farm-scoped)', () => {
    const logs = [
      makeTaskLog({ id: 'l1', plant_id: null }),
      makeTaskLog({ id: 'l2', plant_id: 'gone' }),
    ];
    const kept = filterToKnownPlants(logs, new Set<string>());
    expect(kept.map((l) => l.id)).toEqual(['l1']);
  });
});

describe('getNextTask', () => {
  it('prefers a remaining overdue task over a due-today one', () => {
    const summary = summarizeTodayTasks(
      [
        makeTaskTemplate({ id: 'a', task_type: 'water', next_due_at: yesterdayIso }),
        makeTaskTemplate({ id: 'b', task_type: 'water', next_due_at: todayIso }),
      ],
      [],
      NOW
    );
    expect(getNextTask(summary)?.id).toBe('a');
  });

  it('falls back to a due-today task when nothing is overdue', () => {
    const summary = summarizeTodayTasks(
      [makeTaskTemplate({ id: 'b', task_type: 'water', next_due_at: todayIso })],
      [],
      NOW
    );
    expect(getNextTask(summary)?.id).toBe('b');
  });

  it('returns null when nothing is pending', () => {
    expect(getNextTask(summarizeTodayTasks([], [], NOW))).toBeNull();
  });
});
