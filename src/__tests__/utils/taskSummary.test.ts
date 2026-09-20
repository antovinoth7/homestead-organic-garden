import {
  countRemaining,
  summarizeTodayTasks,
  summarizeTasksByPlot,
  filterToKnownPlants,
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

describe('countRemaining', () => {
  const tasks = [
    makeTaskTemplate({ id: 'a', next_due_at: yesterdayIso }),
    makeTaskTemplate({ id: 'b', next_due_at: todayIso }),
    makeTaskTemplate({ id: 'c', next_due_at: todayIso }),
  ];

  it('counts due plus overdue work that is still owed', () => {
    // One of the three logged done → two left (one overdue, one due today).
    const summary = summarizeTodayTasks(tasks, [makeTaskLog({ template_id: 'c' })], NOW);

    expect(summary.totalTasks).toBe(3);
    expect(countRemaining(summary)).toBe(2);
  });

  it('falls to zero once everything is logged', () => {
    const logs = tasks.map((t) => makeTaskLog({ id: `log-${t.id}`, template_id: t.id }));

    expect(countRemaining(summarizeTodayTasks(tasks, logs, NOW))).toBe(0);
  });
});

describe('summarizeTasksByPlot', () => {
  const home = {
    id: 'Home farm',
    tasks: [
      makeTaskTemplate({ id: 'a', next_due_at: yesterdayIso }),
      makeTaskTemplate({ id: 'b', next_due_at: todayIso }),
    ],
    logs: [makeTaskLog({ id: 'l1', template_id: 'done-home' })],
  };
  const paddy = {
    id: 'Paddy land',
    tasks: [makeTaskTemplate({ id: 'c', next_due_at: todayIso })],
    logs: [],
  };

  it('summarises each plot independently', () => {
    const byPlot = summarizeTasksByPlot([home, paddy], NOW);

    expect(byPlot.get('Home farm')).toMatchObject({ overdueCount: 1, completed: 1 });
    expect(byPlot.get('Home farm')?.todayTasks.map((t) => t.id)).toEqual(['b']);
    expect(byPlot.get('Paddy land')).toMatchObject({ overdueCount: 0, completed: 0 });
    expect(byPlot.get('Paddy land')?.todayTasks.map((t) => t.id)).toEqual(['c']);
  });

  it('adds up to the account-wide summary over the same work', () => {
    const byPlot = summarizeTasksByPlot([home, paddy], NOW);
    const combined = summarizeTodayTasks(
      [...home.tasks, ...paddy.tasks],
      [...home.logs, ...paddy.logs],
      NOW
    );

    const sum = (pick: (s: { totalTasks: number; overdueCount: number }) => number): number =>
      [...byPlot.values()].reduce((total, summary) => total + pick(summary), 0);

    expect(sum((s) => s.totalTasks)).toBe(combined.totalTasks);
    expect(sum((s) => s.overdueCount)).toBe(combined.overdueCount);
  });

  it('returns an empty map for no plots', () => {
    expect(summarizeTasksByPlot([], NOW).size).toBe(0);
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
