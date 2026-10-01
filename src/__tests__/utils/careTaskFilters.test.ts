import { TaskTemplate, UNASSIGNED_PLOT_ID } from '../../types/database.types';
import {
  countActiveCareFilters,
  countCareFacets,
  emptyCareTaskFilters,
  filterCareTasks,
  sortCareTasks,
  taskDueStatus,
  taskTimeOfDay,
  toggleSetValue,
  type CareTaskContext,
  type CareTaskFilters,
  type TaskDueStatus,
  type TaskPriority,
} from '../../utils/careTaskFilters';
import { groupByPlot } from '../../utils/plotGrouping';
import { resolveTaskBedId } from '../../utils/taskBed';
import { makeBed } from '../fixtures/bed.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

/** Fixed "today" so overdue and priority never depend on the wall clock. */
const NOW = new Date('2026-03-10T09:00:00.000Z');

const filters = (overrides: Partial<CareTaskFilters> = {}): CareTaskFilters => ({
  ...emptyCareTaskFilters(),
  ...overrides,
});

/**
 * Builds the context the way the Care Plan does — through the real `groupByPlot`
 * join and the real bed resolver, so a bug in either is caught here rather than
 * being papered over by a hand-written stub. Only `resolvePriority` is faked:
 * the real one lives in a Firestore-importing service.
 */
function context(options: {
  plants?: ReturnType<typeof makePlant>[];
  beds?: ReturnType<typeof makeBed>[];
  parentLocations?: string[];
  priorities?: Record<string, TaskPriority>;
}): CareTaskContext {
  const plants = options.plants ?? [];
  const beds = options.beds ?? [];
  const plantMap = new Map(plants.map((p) => [p.id, p]));
  const bedNames = new Map(beds.map((b) => [b.id, b.name]));
  const { resolveTaskPlotId } = groupByPlot({
    parentLocations: options.parentLocations ?? ['Home farm', 'Paddy land'],
    fallbackName: 'Kanyakumari',
    plants,
    beds,
    tasks: [],
    logs: [],
    alerts: [],
  });

  return {
    resolvePlotId: resolveTaskPlotId,
    resolveBedId: (task) => resolveTaskBedId(task, plantMap),
    resolvePriority: (task) => options.priorities?.[task.id] ?? task.priority_level ?? 'medium',
    subjectLabel: (task) => {
      if (task.plant_id) return plantMap.get(task.plant_id)?.name ?? 'Unknown';
      const bedId = resolveTaskBedId(task, plantMap);
      return (bedId ? bedNames.get(bedId) : undefined) ?? 'General';
    },
  };
}

const ids = (tasks: TaskTemplate[]): string[] => tasks.map((t) => t.id);

describe('taskTimeOfDay', () => {
  it('reads the three named times', () => {
    expect(taskTimeOfDay(makeTaskTemplate({ preferred_time: 'morning' }))).toBe('morning');
    expect(taskTimeOfDay(makeTaskTemplate({ preferred_time: 'afternoon' }))).toBe('afternoon');
    expect(taskTimeOfDay(makeTaskTemplate({ preferred_time: 'evening' }))).toBe('evening');
  });

  // Every synced template is created with a null preferred_time, so this is the
  // common case, not an edge case — and it must not be guessed from task type.
  it('buckets a null or unrecognised time as unset', () => {
    expect(taskTimeOfDay(makeTaskTemplate({ preferred_time: null }))).toBe('unset');
    expect(taskTimeOfDay(makeTaskTemplate({ preferred_time: 'dawn' }))).toBe('unset');
  });
});

describe('filterCareTasks — location', () => {
  const plants = [
    makePlant({ id: 'p-home', name: 'Tomato', location: 'Home farm - North' }),
    makePlant({ id: 'p-paddy', name: 'Brinjal', location: 'Paddy land - South' }),
    makePlant({ id: 'p-nowhere', name: 'Chilli', location: '' }),
  ];
  const beds = [makeBed({ id: 'b1', name: 'Bed 1', parent_location: 'Paddy land' })];
  const ctx = context({ plants, beds });

  const homeTask = makeTaskTemplate({ id: 't-home', plant_id: 'p-home' });
  const paddyTask = makeTaskTemplate({ id: 't-paddy', plant_id: 'p-paddy' });
  const looseTask = makeTaskTemplate({ id: 't-loose', plant_id: 'p-nowhere' });
  // A bed-level task: no plant at all, so its only route to a plot is its bed.
  const bedTask = makeTaskTemplate({ id: 't-bed', plant_id: null, bed_id: 'b1' });
  const all = [homeTask, paddyTask, looseTask, bedTask];

  it('narrows to one main location', () => {
    const result = filterCareTasks(
      all,
      filters({ plotIds: new Set(['Home farm']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['t-home']);
  });

  // The regression this whole change is about: grouping used to key on the
  // plant's raw location string, so a bed-level task had no plant and fell into
  // a single "General" bucket regardless of which plot its bed sat on.
  it('places a bed-level task on its bed’s plot', () => {
    const result = filterCareTasks(
      all,
      filters({ plotIds: new Set(['Paddy land']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['t-paddy', 't-bed']);
  });

  it('groups sub-locations of one plot together', () => {
    const twoDirections = [
      makePlant({ id: 'p-n', location: 'Home farm - North' }),
      makePlant({ id: 'p-s', location: 'Home farm - South' }),
    ];
    const localCtx = context({ plants: twoDirections });
    const tasks = [
      makeTaskTemplate({ id: 't-n', plant_id: 'p-n' }),
      makeTaskTemplate({ id: 't-s', plant_id: 'p-s' }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ plotIds: new Set(['Home farm']) }),
      localCtx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['t-n', 't-s']);
  });

  it('matches a plot name case-insensitively', () => {
    const localCtx = context({
      plants: [makePlant({ id: 'p1', location: 'HOME FARM - North' })],
    });
    const tasks = [makeTaskTemplate({ id: 't1', plant_id: 'p1' })];
    const result = filterCareTasks(
      tasks,
      filters({ plotIds: new Set(['Home farm']) }),
      localCtx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['t1']);
  });

  // A substring test would put this on "Home farm" because the direction name
  // contains it; the parent segment is matched exactly instead.
  it('does not match a plot name that only appears in the direction', () => {
    const localCtx = context({
      plants: [makePlant({ id: 'p1', location: 'Paddy land - Near Home farm' })],
    });
    const tasks = [makeTaskTemplate({ id: 't1', plant_id: 'p1' })];
    expect(
      filterCareTasks(tasks, filters({ plotIds: new Set(['Home farm']) }), localCtx, undefined, NOW)
    ).toEqual([]);
  });

  it('selects only blank-location records for the unassigned bucket', () => {
    const result = filterCareTasks(
      all,
      filters({ plotIds: new Set([UNASSIGNED_PLOT_ID]) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['t-loose']);
  });

  it('treats an empty plot set as "all"', () => {
    expect(ids(filterCareTasks(all, filters(), ctx, undefined, NOW))).toEqual(ids(all));
  });
});

describe('filterCareTasks — priority, time, bed, type, overdue', () => {
  const plants = [makePlant({ id: 'p1', name: 'Tomato', location: 'Home farm - North' })];
  const beds = [
    makeBed({ id: 'b1', name: 'Bed 1', parent_location: 'Home farm' }),
    makeBed({ id: 'b2', name: 'Bed 2', parent_location: 'Home farm' }),
  ];

  it('uses the stored priority_level when the template carries one', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({ id: 'a', priority_level: 'critical' }),
      makeTaskTemplate({ id: 'b', priority_level: 'low' }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ priorities: new Set<TaskPriority>(['critical']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['a']);
  });

  // priority_level is absent on almost every template, so the computed value is
  // the one that actually decides what a Critical chip shows.
  it('falls back to the computed priority when the field is null', () => {
    const ctx = context({ plants, beds, priorities: { a: 'critical', b: 'medium' } });
    const tasks = [
      makeTaskTemplate({ id: 'a', priority_level: null }),
      makeTaskTemplate({ id: 'b', priority_level: null }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ priorities: new Set<TaskPriority>(['critical']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['a']);
  });

  it('filters by time of day, including the unset bucket', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({ id: 'morning', preferred_time: 'morning' }),
      makeTaskTemplate({ id: 'none', preferred_time: null }),
    ];
    expect(
      ids(filterCareTasks(tasks, filters({ times: new Set(['morning']) }), ctx, undefined, NOW))
    ).toEqual(['morning']);
    expect(
      ids(filterCareTasks(tasks, filters({ times: new Set(['unset']) }), ctx, undefined, NOW))
    ).toEqual(['none']);
  });

  it('filters by bed, reaching bed-level and plant-level tasks alike', () => {
    const bedPlant = makePlant({ id: 'p-bed', location: 'Home farm', bed_id: 'b1' });
    const ctx = context({ plants: [...plants, bedPlant], beds });
    const tasks = [
      makeTaskTemplate({ id: 'bed-level', plant_id: null, bed_id: 'b1' }),
      makeTaskTemplate({ id: 'via-plant', plant_id: 'p-bed' }),
      makeTaskTemplate({ id: 'other-bed', plant_id: null, bed_id: 'b2' }),
      makeTaskTemplate({ id: 'no-bed', plant_id: 'p1' }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ bedIds: new Set(['b1']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['bed-level', 'via-plant']);
  });

  it('filters by task type', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({ id: 'w', task_type: 'water' }),
      makeTaskTemplate({ id: 's', task_type: 'spray' }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ taskTypes: new Set(['spray'] as const) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['s']);
  });

  it('filters to overdue by calendar day', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({ id: 'late', next_due_at: '2026-03-08T18:00:00.000Z' }),
      // Due today at 6 PM: not overdue, even though the clock says 9 AM.
      makeTaskTemplate({ id: 'today', next_due_at: '2026-03-10T18:00:00.000Z' }),
      makeTaskTemplate({ id: 'soon', next_due_at: '2026-03-12T18:00:00.000Z' }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({ dueStatuses: new Set<TaskDueStatus>(['overdue']) }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['late']);
  });

  // The three statuses partition the list, so each one alone is exactly its
  // own slice and any pair is their union. Same fixed NOW as above.
  describe('due status', () => {
    const dueTasks = [
      makeTaskTemplate({ id: 'late', next_due_at: '2026-03-08T18:00:00.000Z' }),
      // Due today at 6 PM: due, not overdue, even though the clock says 9 AM.
      makeTaskTemplate({ id: 'today', next_due_at: '2026-03-10T18:00:00.000Z' }),
      makeTaskTemplate({ id: 'soon', next_due_at: '2026-03-12T18:00:00.000Z' }),
    ];

    const pick = (...statuses: TaskDueStatus[]): string[] =>
      ids(
        filterCareTasks(
          dueTasks,
          filters({ dueStatuses: new Set(statuses) }),
          context({ plants, beds }),
          undefined,
          NOW
        )
      );

    it('selects due-today work without the overdue backlog', () => {
      expect(pick('today')).toEqual(['today']);
    });

    it('selects work that is not due yet', () => {
      expect(pick('upcoming')).toEqual(['soon']);
    });

    it('unions overdue and due today — everything owed now', () => {
      expect(pick('overdue', 'today').sort()).toEqual(['late', 'today']);
    });

    it('treats an empty set as all, not none', () => {
      expect(pick().sort()).toEqual(['late', 'soon', 'today']);
    });

    // A task with no usable due date has no status, so it must not be swept
    // into 'today' — the bucket it would land in if the guard were dropped.
    it('excludes a task whose due date cannot be read', () => {
      const broken = makeTaskTemplate({ id: 'broken', next_due_at: 'not-a-date' });
      expect(taskDueStatus(broken, NOW)).toBeNull();
      const result = filterCareTasks(
        [...dueTasks, broken],
        filters({ dueStatuses: new Set<TaskDueStatus>(['today']) }),
        context({ plants, beds }),
        undefined,
        NOW
      );
      expect(ids(result)).toEqual(['today']);
    });

    it('counts all three statuses against the other active filters', () => {
      const counts = countCareFacets(
        dueTasks,
        filters({ dueStatuses: new Set<TaskDueStatus>(['overdue']) }),
        context({ plants, beds }),
        NOW
      );
      // Counted against everything *but* itself, so picking Overdue does not
      // zero the other two — each still answers "how many if I picked this?".
      expect(counts.dueStatuses).toEqual({ overdue: 1, today: 1, upcoming: 1 });
    });
  });

  it('ANDs every active dimension together', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({
        id: 'match',
        plant_id: 'p1',
        task_type: 'spray',
        priority_level: 'high',
        next_due_at: '2026-03-08T18:00:00.000Z',
      }),
      // Right plot, right type, wrong priority.
      makeTaskTemplate({
        id: 'wrong-priority',
        plant_id: 'p1',
        task_type: 'spray',
        priority_level: 'low',
        next_due_at: '2026-03-08T18:00:00.000Z',
      }),
      // Everything right except it isn't overdue.
      makeTaskTemplate({
        id: 'not-late',
        plant_id: 'p1',
        task_type: 'spray',
        priority_level: 'high',
        next_due_at: '2026-03-12T18:00:00.000Z',
      }),
    ];
    const result = filterCareTasks(
      tasks,
      filters({
        plotIds: new Set(['Home farm']),
        taskTypes: new Set(['spray'] as const),
        priorities: new Set<TaskPriority>(['high']),
        dueStatuses: new Set<TaskDueStatus>(['overdue']),
      }),
      ctx,
      undefined,
      NOW
    );
    expect(ids(result)).toEqual(['match']);
  });

  it('holds back the excepted category only', () => {
    const ctx = context({ plants, beds });
    const tasks = [
      makeTaskTemplate({ id: 'w', plant_id: 'p1', task_type: 'water' }),
      makeTaskTemplate({ id: 's', plant_id: 'p1', task_type: 'spray' }),
    ];
    const active = filters({
      taskTypes: new Set(['spray'] as const),
      plotIds: new Set(['Home farm']),
    });
    // Without the exception the type filter narrows to one; with it, both
    // survive — but the plot filter still applies.
    expect(ids(filterCareTasks(tasks, active, ctx, undefined, NOW))).toEqual(['s']);
    expect(ids(filterCareTasks(tasks, active, ctx, 'taskTypes', NOW))).toEqual(['w', 's']);
  });
});

describe('countCareFacets', () => {
  const plants = [
    makePlant({ id: 'p-home', location: 'Home farm - North' }),
    makePlant({ id: 'p-paddy', location: 'Paddy land' }),
  ];
  const ctx = context({ plants });
  const tasks = [
    makeTaskTemplate({ id: 'a', plant_id: 'p-home', task_type: 'water', priority_level: 'high' }),
    makeTaskTemplate({ id: 'b', plant_id: 'p-home', task_type: 'spray', priority_level: 'low' }),
    makeTaskTemplate({ id: 'c', plant_id: 'p-paddy', task_type: 'water', priority_level: 'high' }),
  ];

  it('counts every option against the other active filters, not itself', () => {
    const counts = countCareFacets(tasks, filters({ plotIds: new Set(['Home farm']) }), ctx, NOW);
    // Task types are counted inside the chosen plot...
    expect(counts.taskTypes.water).toBe(1);
    expect(counts.taskTypes.spray).toBe(1);
    // ...but the plot chips still count the whole list, or picking one would
    // zero the others and the farmer could never switch plots.
    expect(counts.plotIds['Home farm']).toBe(2);
    expect(counts.plotIds['Paddy land']).toBe(1);
  });

  it('reports zero for options nothing matches', () => {
    const counts = countCareFacets(tasks, filters(), ctx, NOW);
    expect(counts.priorities.critical).toBe(0);
    expect(counts.priorities.high).toBe(2);
    expect(counts.times.unset).toBe(3);
    expect(counts.times.morning).toBe(0);
  });
});

describe('sortCareTasks', () => {
  const plants = [
    makePlant({ id: 'p-a', name: 'Amaranth' }),
    makePlant({ id: 'p-z', name: 'Zucchini' }),
  ];
  const ctx = context({
    plants,
    priorities: { late: 'critical', mid: 'medium', early: 'low' },
  });

  const late = makeTaskTemplate({
    id: 'late',
    plant_id: 'p-z',
    task_type: 'water',
    next_due_at: '2026-03-12T18:00:00.000Z',
  });
  const mid = makeTaskTemplate({
    id: 'mid',
    plant_id: 'p-a',
    task_type: 'spray',
    next_due_at: '2026-03-11T18:00:00.000Z',
  });
  const early = makeTaskTemplate({
    id: 'early',
    plant_id: 'p-z',
    task_type: 'harvest',
    next_due_at: '2026-03-10T18:00:00.000Z',
  });

  // The default must not move: farmers already know this order, and Sort By ->
  // Due date is the way back to it.
  it("'due' reproduces the long-standing due-date then task-type order", () => {
    const sameDay = [
      makeTaskTemplate({
        id: 'water',
        task_type: 'water',
        next_due_at: '2026-03-10T18:00:00.000Z',
      }),
      makeTaskTemplate({
        id: 'mulch',
        task_type: 'mulch',
        next_due_at: '2026-03-10T18:00:00.000Z',
      }),
    ];
    const legacy = [...[late, mid, early, ...sameDay]].sort((a, b) => {
      const dateA = new Date(a.next_due_at).getTime();
      const dateB = new Date(b.next_due_at).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.task_type.localeCompare(b.task_type);
    });
    expect(ids(sortCareTasks([late, mid, early, ...sameDay], 'due', ctx))).toEqual(ids(legacy));
  });

  it("'priority' orders critical first and breaks ties on the due date", () => {
    expect(ids(sortCareTasks([early, mid, late], 'priority', ctx))).toEqual([
      'late',
      'mid',
      'early',
    ]);
  });

  it("'priority' falls back to the due date within one priority band", () => {
    const flat = context({ plants, priorities: { late: 'high', mid: 'high', early: 'high' } });
    expect(ids(sortCareTasks([late, mid, early], 'priority', flat))).toEqual([
      'early',
      'mid',
      'late',
    ]);
  });

  it("'plant' orders by subject name, bed-level tasks included", () => {
    const beds = [makeBed({ id: 'b1', name: 'Bed 1', parent_location: 'Home farm' })];
    const localCtx = context({ plants, beds });
    const bedTask = makeTaskTemplate({ id: 'bed', plant_id: null, bed_id: 'b1' });
    expect(ids(sortCareTasks([late, mid, bedTask], 'plant', localCtx))).toEqual([
      'mid', // Amaranth
      'bed', // Bed 1
      'late', // Zucchini
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [late, mid, early];
    sortCareTasks(input, 'priority', ctx);
    expect(ids(input)).toEqual(['late', 'mid', 'early']);
  });
});

describe('countActiveCareFilters', () => {
  it('counts a populated dimension once, however many values it holds', () => {
    expect(countActiveCareFilters(emptyCareTaskFilters())).toBe(0);
    expect(
      countActiveCareFilters(filters({ taskTypes: new Set(['water', 'spray'] as const) }))
    ).toBe(1);
    expect(
      countActiveCareFilters(
        filters({
          dueStatuses: new Set<TaskDueStatus>(['overdue']),
          plotIds: new Set(['Home farm']),
          priorities: new Set<TaskPriority>(['high']),
        })
      )
    ).toBe(3);
  });
});

describe('toggleSetValue', () => {
  it('adds, removes and never mutates the source', () => {
    const source = new Set(['a']);
    const added = toggleSetValue(source, 'b');
    expect([...added]).toEqual(['a', 'b']);
    expect([...toggleSetValue(added, 'a')]).toEqual(['b']);
    expect([...source]).toEqual(['a']);
  });
});
