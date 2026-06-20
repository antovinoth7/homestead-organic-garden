import { summarizeTodayTasks, computeDonutSegments } from '@/utils/taskSummary';
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
