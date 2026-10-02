import {
  CATCH_UP_PREVIEW_COUNT,
  DONE_SECTION_KEY,
  HARVEST_ROUND_KEY,
  OVERDUE_SECTION_KEY,
  buildCarePlanSections,
  groupTasksBy,
  harvestRoundRows,
  summarizeToday,
  taskTypePreview,
  type CarePlanSectionsInput,
  type CarePlanTaskGroup,
} from '@/utils/carePlanSections';
import type { TaskTemplate, TaskType } from '@/types/database.types';
import type { HarvestReadyItem } from '@/utils/harvestStats';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const t = (id: string, task_type: TaskType = 'water'): TaskTemplate =>
  makeTaskTemplate({ id, task_type });

const base = (overrides: Partial<CarePlanSectionsInput> = {}): CarePlanSectionsInput => ({
  loadFailed: false,
  initialLoading: false,
  isSearching: false,
  searchResults: [],
  filtersActive: false,
  selectedDate: null,
  harvestsReadyNow: [],
  harvestsSoon: [],
  harvestSoonExpanded: false,
  overdue: [],
  overdueOldestDays: 0,
  overdueCriticalCount: 0,
  todayGroups: [],
  restGroups: [],
  done: [],
  openSections: new Set(),
  ...overrides,
});

const harvest = (id: string, daysUntil: number): HarvestReadyItem => ({
  plant: makePlant({ id, name: `Plant ${id}` }),
  nextDate: new Date('2026-08-19T00:00:00.000Z'),
  daysUntil,
  isReady: daysUntil <= 0,
  source: 'scheduled_task',
});

const bands = (
  morning: TaskTemplate[],
  any: TaskTemplate[] = [],
  evening: TaskTemplate[] = []
): CarePlanTaskGroup[] => [
  { key: 'morning', title: 'Before 10 AM', tasks: morning, isNow: true },
  { key: 'any', title: 'Any time', tasks: any },
  { key: 'evening', title: 'After 4 PM', tasks: evening },
];

describe('taskTypePreview', () => {
  it('counts types in the fixed task order', () => {
    expect(taskTypePreview([t('a', 'spray'), t('b', 'water'), t('c', 'water')])).toBe(
      'Water ×2 · Spray'
    );
  });

  it('is empty for no tasks', () => {
    expect(taskTypePreview([])).toBe('');
  });
});

describe('summarizeToday', () => {
  it('counts work due now, describes it and measures progress', () => {
    expect(summarizeToday([t('a'), t('b'), t('c')], 1, 2, 1)).toEqual({
      title: '3 tasks today',
      subtitle: '1 overdue · 2 plots · 1 done',
      progressLabel: '1 of 4 done',
      progress: 0.25,
    });
  });

  it('uses the singular and drops empty parts', () => {
    expect(summarizeToday([t('a')], 0, 1, 0)).toMatchObject({
      title: '1 task today',
      subtitle: '1 plot',
      progress: 0,
    });
  });

  it('says the day is done when nothing is due', () => {
    expect(summarizeToday([], 0, 0, 3)).toMatchObject({
      title: 'All done for today',
      progressLabel: '3 of 3 done',
      progress: 1,
    });
  });

  it('has no progress when the day had nothing in it', () => {
    expect(summarizeToday([], 0, 0, 0).progress).toBe(0);
  });
});

describe('groupTasksBy', () => {
  it('keeps the given order first, then first appearance, and drops empty keys', () => {
    const tasks = [
      makeTaskTemplate({ id: '1', plant_id: 'coconut' }),
      makeTaskTemplate({ id: '2', plant_id: 'home' }),
      makeTaskTemplate({ id: '3', plant_id: 'stray' }),
      makeTaskTemplate({ id: '4', plant_id: 'home' }),
    ];
    const groups = groupTasksBy(tasks, (task) => task.plant_id ?? '', ['home', 'empty', 'coconut']);
    expect(groups.map((g) => [g.key, g.tasks.map((x) => x.id)])).toEqual([
      ['home', ['2', '4']],
      ['coconut', ['1']],
      ['stray', ['3']],
    ]);
  });
});

describe('harvestRoundRows', () => {
  it('folds the ready checks behind one head row', () => {
    const rows = harvestRoundRows(
      [harvest('a', -6), harvest('b', 0)],
      [harvest('c', 3)],
      false,
      false
    );
    expect(rows).toEqual([
      expect.objectContaining({
        kind: 'harvestRound',
        readyCount: 2,
        lateCount: 1,
        maxLateDays: 6,
        expanded: false,
        first: true,
        last: true,
      }),
    ]);
  });

  it('opens to the ready checks, then Harvest soon with its crops', () => {
    const rows = harvestRoundRows(
      [harvest('a', 0)],
      [harvest('c', 3), harvest('d', 9)],
      true,
      true
    );
    expect(rows.map((row) => row.key)).toEqual([
      HARVEST_ROUND_KEY,
      'harvest-a',
      'harvest-soon-toggle',
      'harvest-soon-c',
      'harvest-soon-d',
    ]);
    expect(rows[2]).toMatchObject({ fromDays: 3, toDays: 9, count: 2 });
    expect(rows.map((row) => ('last' in row ? row.last : null))).toEqual([
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it('shows Harvest soon alone when nothing is ready', () => {
    const rows = harvestRoundRows([], [harvest('c', 3)], false, false);
    expect(rows).toEqual([
      expect.objectContaining({ kind: 'harvestSoonToggle', first: true, last: true }),
    ]);
  });

  it('is empty with no harvests', () => {
    expect(harvestRoundRows([], [], true, true)).toEqual([]);
  });
});

describe('buildCarePlanSections', () => {
  it('shows only the load error when nothing could load', () => {
    const sections = buildCarePlanSections(base({ loadFailed: true, overdue: [t('a')] }));
    expect(sections.map((s) => s.key)).toEqual(['load-error']);
  });

  it('orders catch up → time bands → later days → done, round inside the morning band', () => {
    const sections = buildCarePlanSections(
      base({
        harvestsReadyNow: [harvest('h1', 0)],
        harvestHostKey: 'morning',
        overdue: [t('o1')],
        overdueOldestDays: 1,
        todayGroups: bands([t('a')], [], [t('b', 'spray')]),
        restGroups: [{ key: '2026-08-20', title: 'Tomorrow', collapsible: true, tasks: [t('c')] }],
        done: [{ taskId: 'd1', taskType: 'water', plantId: null, task: null, pending: false }],
      })
    );
    expect(sections.map((s) => s.key)).toEqual([
      OVERDUE_SECTION_KEY,
      'today-morning',
      'today-evening',
      'rest-2026-08-20',
      DONE_SECTION_KEY,
    ]);
    expect(sections.map((s) => s.header?.tone)).toEqual([
      'overdue',
      'band',
      'band',
      'later',
      'done',
    ]);
    expect(sections[1]?.header?.isNow).toBe(true);
    expect(sections[1]?.data.map((row) => row.kind)).toEqual(['harvestRound', 'task']);
  });

  it('keeps the morning band for the harvest round when it has no tasks', () => {
    const sections = buildCarePlanSections(
      base({
        harvestsReadyNow: [harvest('h1', 0)],
        harvestHostKey: 'morning',
        todayGroups: bands([], [t('a', 'mulch')]),
      })
    );
    expect(sections.map((s) => s.key)).toEqual(['today-morning', 'today-any']);
    expect(sections[0]?.header?.count).toBe(0);
    expect(sections[0]?.header?.selectableTasks).toBeUndefined();
  });

  it('keeps an empty band that still has a rain banner', () => {
    const sections = buildCarePlanSections(
      base({
        todayGroups: [
          {
            key: 'morning',
            title: 'Before 10 AM',
            tasks: [],
            rainPlots: ['River'],
            keepWhenEmpty: true,
          },
          { key: 'any', title: 'Any time', tasks: [t('a')] },
        ],
      })
    );
    expect(sections.map((s) => s.key)).toEqual(['today-morning', 'today-any']);
    expect(sections[0]?.header?.rainPlots).toEqual(['River']);
  });

  it('stands the harvest round on its own when no band hosts it', () => {
    const sections = buildCarePlanSections(
      base({
        harvestsReadyNow: [harvest('h1', 0)],
        overdue: [t('o1')],
        todayGroups: [{ key: 'Home', title: 'Today · Home', plot: 'Home', tasks: [t('a')] }],
      })
    );
    expect(sections.map((s) => s.key)).toEqual([
      HARVEST_ROUND_KEY,
      OVERDUE_SECTION_KEY,
      'today-Home',
    ]);
    expect(sections[0]?.header).toBeNull();
    expect(sections[2]?.header?.plot).toBe('Home');
  });

  describe('Catch up', () => {
    const overdue = [t('o1'), t('o2'), t('o3'), t('o4')];

    it('folds to the most urgent cards and offers Show all / Select all', () => {
      const [section] = buildCarePlanSections(
        base({ overdue, overdueOldestDays: 6, overdueCriticalCount: 1 })
      );
      expect(section?.key).toBe(OVERDUE_SECTION_KEY);
      expect(section?.data.map((row) => row.key)).toEqual(['overdue-o1', 'overdue-o2']);
      expect(section?.data).toHaveLength(CATCH_UP_PREVIEW_COUNT);
      expect(section?.header).toMatchObject({
        title: 'Catch up',
        count: 4,
        collapsible: true,
        expanded: false,
        subtitle: 'Oldest 6 days · 1 critical · most urgent shown',
      });
      expect(section?.header?.selectableTasks).toHaveLength(4);
      expect(section?.footer).toEqual({ expanded: false, total: 4 });
    });

    it('opens to all of it', () => {
      const [section] = buildCarePlanSections(
        base({ overdue, overdueOldestDays: 1, openSections: new Set([OVERDUE_SECTION_KEY]) })
      );
      expect(section?.data).toHaveLength(4);
      expect(section?.header?.subtitle).toBe('All overdue work, most urgent first.');
      expect(section?.footer).toEqual({ expanded: true, total: 4 });
    });

    it('does not fold two or fewer', () => {
      const [section] = buildCarePlanSections(base({ overdue: [t('o1')], overdueOldestDays: 1 }));
      expect(section?.data).toHaveLength(1);
      expect(section?.header?.collapsible).toBe(false);
      expect(section?.footer).toBeUndefined();
    });
  });

  it('folds later days behind a type preview until opened', () => {
    const rest = [
      { key: 'd1', title: 'Tomorrow', collapsible: true, tasks: [t('a'), t('b', 'spray')] },
    ];
    const closed = buildCarePlanSections(base({ restGroups: rest }))[0];
    expect(closed?.data).toEqual([]);
    expect(closed?.header?.subtitle).toBe('Water · Spray');
    expect(closed?.header?.selectableTasks).toBeUndefined();

    const open = buildCarePlanSections(
      base({ restGroups: rest, openSections: new Set(['rest-d1']) })
    )[0];
    expect(open?.data).toHaveLength(2);
    expect(open?.header?.expanded).toBe(true);
  });

  it('keeps non-collapsible groups open', () => {
    const [section] = buildCarePlanSections(
      base({ restGroups: [{ key: 'spray', title: 'Spray', tasks: [t('a', 'spray')] }] })
    );
    expect(section?.data).toHaveLength(1);
    expect(section?.header?.collapsible).toBe(false);
  });

  it('collapses Done today until opened, with Undo still possible while pending', () => {
    const done = [
      { taskId: 'x', taskType: 'water' as const, plantId: null, task: null, pending: true },
    ];
    const closed = buildCarePlanSections(
      base({ todayGroups: [{ key: 'all', title: 'Today', tasks: [t('a')] }], done })
    );
    const doneSection = closed.find((s) => s.key === DONE_SECTION_KEY);
    expect(doneSection?.data).toEqual([]);
    expect(doneSection?.header?.subtitle).toBe('Undo works until the toast closes.');

    const opened = buildCarePlanSections(
      base({ done, openSections: new Set([DONE_SECTION_KEY]) })
    ).find((s) => s.key === DONE_SECTION_KEY);
    expect(opened?.data[0]).toMatchObject({ kind: 'done', item: { pending: true } });
  });

  it('flattens to search results while searching', () => {
    const sections = buildCarePlanSections(
      base({ isSearching: true, searchResults: [t('a')], overdue: [t('o')] })
    );
    expect(sections.map((s) => s.key)).toEqual(['search-results']);
  });

  it('shows the search empty state', () => {
    const sections = buildCarePlanSections(base({ isSearching: true }));
    expect(sections[0]?.data[0]).toMatchObject({ kind: 'empty', variant: 'searchNone' });
  });

  it('puts a picked day on top with + Add', () => {
    const sections = buildCarePlanSections(
      base({
        selectedDate: { key: '2026-08-22', title: 'Sat, Aug 22', tasks: [t('s')], rawCount: 1 },
        todayGroups: [{ key: 'all', title: 'Today', tasks: [t('a')] }],
      })
    );
    expect(sections.map((s) => s.key)).toEqual(['selected-date', 'today-all']);
    expect(sections[0]?.header).toMatchObject({
      tone: 'picked',
      addAction: true,
      subtitle: 'The day you picked. Today’s work is below.',
    });
  });

  it('keeps a picked day with nothing on it, saying so', () => {
    const [first] = buildCarePlanSections(
      base({
        selectedDate: { key: 'k', title: 'Mon, Oct 5', tasks: [], rawCount: 0 },
        overdue: [t('o')],
      })
    );
    expect(first?.key).toBe('selected-date');
    expect(first?.data).toEqual([]);
    expect(first?.header?.subtitle).toBe('Nothing planned for this date.');
  });

  it('explains a picked day emptied by filters', () => {
    const [first] = buildCarePlanSections(
      base({
        filtersActive: true,
        selectedDate: { key: 'k', title: 'Sat', tasks: [], rawCount: 2 },
        overdue: [t('o')],
      })
    );
    expect(first?.data[0]).toMatchObject({ variant: 'selectedDateFiltered', rawCount: 2 });
  });

  it('shows the full empty card when nothing is due', () => {
    const sections = buildCarePlanSections(base());
    expect(sections.map((s) => s.data[0])).toEqual([
      expect.objectContaining({ variant: 'noUpcoming' }),
    ]);
  });

  it('blames the filters when they emptied the plan', () => {
    const [section] = buildCarePlanSections(base({ filtersActive: true }));
    expect(section?.data[0]).toMatchObject({ variant: 'filtersNone' });
  });

  it('shows no empty card while the first load is running', () => {
    expect(buildCarePlanSections(base({ initialLoading: true }))).toEqual([]);
  });
});
