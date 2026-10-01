import {
  DONE_SECTION_KEY,
  OVERDUE_SECTION_KEY,
  buildCarePlanSections,
  groupTasksBy,
  summarizeToday,
  taskTypePreview,
  type CarePlanSectionsInput,
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
  it('counts work due now and describes it', () => {
    expect(summarizeToday([t('a'), t('b'), t('c')], 1, 2, 4)).toEqual({
      title: '3 tasks today',
      subtitle: '1 overdue · 2 plots · 4 done',
    });
  });

  it('uses the singular and drops empty parts', () => {
    expect(summarizeToday([t('a')], 0, 1, 0)).toEqual({
      title: '1 task today',
      subtitle: '1 plot',
    });
  });

  it('says the day is done when nothing is due', () => {
    expect(summarizeToday([], 0, 0, 3).title).toBe('All done for today');
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

describe('buildCarePlanSections', () => {
  it('shows only the load error when nothing could load', () => {
    const sections = buildCarePlanSections(base({ loadFailed: true, overdue: [t('a')] }));
    expect(sections.map((s) => s.key)).toEqual(['load-error']);
  });

  it('orders harvest → overdue → today by plot → harvest soon → later days → done', () => {
    const sections = buildCarePlanSections(
      base({
        harvestsReadyNow: [harvest('h1', 0)],
        harvestsSoon: [harvest('h2', 9)],
        overdue: [t('o1')],
        todayGroups: [
          { key: 'Home Plot', title: 'Today · Home Plot', plot: 'Home Plot', tasks: [t('a')] },
          { key: 'Coconut Plot', title: 'Today · Coconut Plot', tasks: [t('b')] },
        ],
        restGroups: [{ key: '2026-08-20', title: 'Tomorrow', collapsible: true, tasks: [t('c')] }],
        done: [{ taskId: 'd1', taskType: 'water', plantId: null, task: null, pending: false }],
      })
    );
    expect(sections.map((s) => s.key)).toEqual([
      'harvest-ready',
      OVERDUE_SECTION_KEY,
      'today-Home Plot',
      'today-Coconut Plot',
      'harvest-soon',
      'rest-2026-08-20',
      DONE_SECTION_KEY,
    ]);
    expect(sections[1]?.header?.overdue).toBe(true);
    expect(sections[2]?.header?.showDoneChip).toBe(true);
    expect(sections[2]?.header?.plot).toBe('Home Plot');
    expect(sections[3]?.header?.showDoneChip).toBe(false);
  });

  it('folds later days behind a preview until opened', () => {
    const rest = [
      { key: 'd1', title: 'Tomorrow', collapsible: true, tasks: [t('a'), t('b', 'spray')] },
    ];
    const closed = buildCarePlanSections(base({ restGroups: rest }))[0];
    expect(closed?.data).toEqual([]);
    expect(closed?.header?.preview).toBe('Water · Spray');
    expect(closed?.header?.selectableTasks).toBeUndefined();

    const open = buildCarePlanSections(
      base({ restGroups: rest, openSections: new Set(['rest-d1']) })
    )[0];
    expect(open?.data).toHaveLength(2);
    expect(open?.header?.expanded).toBe(true);
    expect(open?.header?.preview).toBeUndefined();
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
    expect(doneSection?.header?.preview).toBe('Water');

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

  it('puts a picked day on top', () => {
    const sections = buildCarePlanSections(
      base({
        selectedDate: {
          key: '2026-08-22',
          title: 'Sat, Aug 22',
          isToday: false,
          tasks: [t('s')],
          rawCount: 1,
        },
        todayGroups: [{ key: 'all', title: 'Today', tasks: [t('a')] }],
      })
    );
    expect(sections.map((s) => s.key)).toEqual(['selected-date', 'today-all']);
  });

  it('explains a picked day emptied by filters', () => {
    const [first] = buildCarePlanSections(
      base({
        filtersActive: true,
        selectedDate: { key: 'k', title: 'Sat', isToday: false, tasks: [], rawCount: 2 },
        overdue: [t('o')],
      })
    );
    expect(first?.data[0]).toMatchObject({ variant: 'selectedDateFiltered', rawCount: 2 });
  });

  it('shows one full empty card when nothing is due, not a compact one too', () => {
    const sections = buildCarePlanSections(
      base({ selectedDate: { key: 'k', title: 'Sat', isToday: false, tasks: [], rawCount: 0 } })
    );
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
