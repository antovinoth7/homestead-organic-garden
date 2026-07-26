import { buildActivityRows, fmtCount, HERO_VISIBLE_ROWS } from '@/utils/activityRows';
import { TASK_EMOJIS } from '@/utils/taskConstants';
import { TaskTypeStat } from '@/utils/taskSummary';
import { TaskType } from '@/types/database.types';

const stat = (
  type: TaskType,
  done: number,
  remaining: number,
  overdueCount = 0
): TaskTypeStat => ({ type, done, remaining, overdueCount, total: done + remaining });

describe('buildActivityRows', () => {
  it('emits one row per known task type, even with no stats at all', () => {
    const rows = buildActivityRows([]);

    expect(rows).toHaveLength(Object.keys(TASK_EMOJIS).length);
    expect(rows.every((r) => r.total === 0 && r.donePct === 0 && r.overduePct === 0)).toBe(true);
  });

  it('orders overdue, then pending, then done-only, then empty', () => {
    const rows = buildActivityRows([
      stat('water', 3, 0), // done-only
      stat('prune', 0, 2), // pending
      stat('mulch', 1, 1, 1), // overdue
    ]);

    expect(rows.slice(0, 3).map((r) => r.type)).toEqual(['mulch', 'prune', 'water']);
    expect(rows.slice(3).every((r) => r.total === 0)).toBe(true);
  });

  it('keeps anything needing action inside the collapsed window', () => {
    // Only the last type in declaration order has work, so a naive order would
    // bury it behind ten empty rows.
    const rows = buildActivityRows([stat('cultivating', 0, 4, 2)]);

    expect(rows.slice(0, HERO_VISIBLE_ROWS).map((r) => r.type)).toContain('cultivating');
    expect(rows.map((r) => r.type)[0]).toBe('cultivating');
  });

  it('breaks ties by declaration order so rows do not reshuffle', () => {
    const declared = Object.keys(TASK_EMOJIS) as TaskType[];
    const rows = buildActivityRows([stat('prune', 0, 1), stat('water', 0, 1)]);

    const positions = rows.slice(0, 2).map((r) => declared.indexOf(r.type));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(rows.slice(0, 2).map((r) => r.type)).toEqual(['water', 'prune']);
  });

  it('computes done and overdue as percentages of the type total', () => {
    const row = buildActivityRows([stat('water', 1, 3, 2)]).find((r) => r.type === 'water');

    expect(row?.total).toBe(4);
    expect(row?.donePct).toBe(25);
    expect(row?.overduePct).toBe(50);
  });

  it('does not divide by zero for a type with nothing scheduled', () => {
    const rows = buildActivityRows([stat('repot', 0, 0)]);
    const repot = rows.find((r) => r.type === 'repot');

    expect(repot?.donePct).toBe(0);
    expect(repot?.overduePct).toBe(0);
  });
});

describe('fmtCount', () => {
  it('shows small counts exactly and abbreviates large ones', () => {
    expect(fmtCount(0)).toBe('0');
    expect(fmtCount(99)).toBe('99');
    expect(fmtCount(100)).toBe('99+');
    expect(fmtCount(1000)).toBe('1k');
    expect(fmtCount(1500)).toBe('1.5k');
  });
});
