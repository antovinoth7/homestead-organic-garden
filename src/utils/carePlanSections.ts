/**
 * The Care Plan's list model — which bands the task list shows, in what order,
 * and what each header says.
 *
 * The screen hands in lists it has already filtered, sorted and windowed; this
 * module only arranges them. Keeping the arrangement pure means the order the
 * farmer walks the list in (a picked day → catch up → today band by band →
 * later days → done) is pinned by unit tests rather than by a 300-line memo.
 *
 * Pure — no React, no services.
 */

import type { TaskTemplate, TaskType } from '@/types/database.types';
import type { HarvestReadyItem } from '@/utils/harvestStats';
import { TASK_LABELS, TASK_TYPE_ORDER } from '@/utils/taskConstants';

export type CarePlanEmptyVariant =
  | 'loadError'
  | 'selectedDateFiltered'
  | 'searchNone'
  | 'filtersNone'
  | 'noUpcoming';

/** A task finished today: saved (from today's logs) or still inside its Undo window. */
export interface CarePlanDoneItem {
  /** Template id — also what Undo cancels while `pending`. */
  taskId: string;
  taskType: TaskType;
  plantId: string | null;
  /** The template when it is still loaded; a finished one-off is not. */
  task: TaskTemplate | null;
  /** True while the completion has not been saved yet and can still be undone. */
  pending: boolean;
}

/**
 * Where a row sits in the harvest-round card, which spans several rows: the
 * first one rounds its top corners, the last one its bottom corners.
 */
interface RoundEdges {
  first: boolean;
  last: boolean;
}

export type CarePlanRow =
  | { key: string; kind: 'task'; task: TaskTemplate }
  | { key: string; kind: 'done'; item: CarePlanDoneItem }
  /** Head of the harvest-round card: the ready checks, folded until opened. */
  | ({
      key: string;
      kind: 'harvestRound';
      readyCount: number;
      /** Ready checks already past their date, and the oldest one's days late. */
      lateCount: number;
      maxLateDays: number;
      expanded: boolean;
    } & RoundEdges)
  | ({ key: string; kind: 'harvest'; item: HarvestReadyItem } & RoundEdges)
  /** Disclosure row heading the look-ahead harvests; `fromDays`/`toDays` are its span. */
  | ({
      key: string;
      kind: 'harvestSoonToggle';
      count: number;
      fromDays: number;
      toDays: number;
      expanded: boolean;
    } & RoundEdges)
  | {
      key: string;
      kind: 'empty';
      variant: CarePlanEmptyVariant;
      rawCount?: number;
    };

/**
 * How a band reads on the timeline: the gutter dot, the title colour and
 * whether the band sits on a tinted panel.
 */
export type CarePlanBandTone = 'picked' | 'overdue' | 'band' | 'later' | 'done' | 'plain';

export interface CarePlanSectionHeader {
  title: string;
  /** Tasks in the band — shown beside the title; 0 shows nothing. */
  count: number;
  tone: CarePlanBandTone;
  /** One line under the title: why the band, or what a folded band holds. */
  subtitle?: string;
  /** Tasks the select-all box covers in selection mode; omitted when it has none. */
  selectableTasks?: TaskTemplate[];
  /** The header taps to open / close its rows. */
  collapsible?: boolean;
  expanded?: boolean;
  /** The farm clock is inside this band's window — it carries the NOW marker. */
  isNow?: boolean;
  /** Plots whose rain banner sits under this header. */
  rainPlots?: string[];
  /** Plot name when every task in the band is on that plot — cards then omit it. */
  plot?: string;
  /** The header carries "+ Add", which creates a task on the picked day. */
  addAction?: boolean;
}

/** The Catch-up band's "+N more / Show less" row under its cards. */
export interface CarePlanOverdueFooter {
  expanded: boolean;
  /** Cards the folded preview leaves out. */
  hiddenCount: number;
}

export interface CarePlanSection {
  key: string;
  header: CarePlanSectionHeader | null;
  data: CarePlanRow[];
  footer?: CarePlanOverdueFooter;
}

/** A run of tasks the screen has already grouped (one band, one plot, one day…). */
export interface CarePlanTaskGroup {
  key: string;
  title: string;
  tasks: TaskTemplate[];
  subtitle?: string;
  /** Later days fold away behind one row each; today's groups never do. */
  collapsible?: boolean;
  /** Plot name when the group is one plot — cards then omit it. */
  plot?: string;
  rainPlots?: string[];
  isNow?: boolean;
  /** Emit the band even with no tasks — it still has a rain banner to show. */
  keepWhenEmpty?: boolean;
}

export interface CarePlanSectionsInput {
  /** Load failed with nothing cached to show. */
  loadFailed: boolean;
  initialLoading: boolean;
  isSearching: boolean;
  /** All matches while searching (sorted). */
  searchResults: TaskTemplate[];
  filtersActive: boolean;
  /** The day picked from the date line or month sheet, when it is not today. */
  selectedDate: {
    key: string;
    title: string;
    tasks: TaskTemplate[];
    rawCount: number;
  } | null;
  harvestsReadyNow: HarvestReadyItem[];
  harvestsSoon: HarvestReadyItem[];
  harvestSoonExpanded: boolean;
  /**
   * Today's group the harvest round goes in (the morning band). When no such
   * group is emitted, the round stands on its own at the top.
   */
  harvestHostKey?: string;
  /** Overdue work, most urgent first — the Catch-up band shows the head of it. */
  overdue: TaskTemplate[];
  /** Days late of the oldest overdue task, and how many are critical. */
  overdueOldestDays: number;
  overdueCriticalCount: number;
  /** Today's open work — one group per time band, per plot, or one in all. */
  todayGroups: CarePlanTaskGroup[];
  /** Everything after today in the window — per day, or per group. */
  restGroups: CarePlanTaskGroup[];
  done: CarePlanDoneItem[];
  /** Keys of collapsible sections the farmer has opened. */
  openSections: ReadonlySet<string>;
}

/** Section key of the Catch-up band — also a deep-link target. */
export const OVERDUE_SECTION_KEY = 'overdue';
export const DONE_SECTION_KEY = 'done-today';
/** `openSections` key of the harvest-round card. */
export const HARVEST_ROUND_KEY = 'harvest-round';
/** Overdue cards the folded Catch-up band still shows. */
export const CATCH_UP_PREVIEW_COUNT = 2;

/**
 * "Water ×2 · Spray" — what a folded section holds, in the fixed task-type
 * order so the same day always reads the same way.
 */
export function taskTypePreview(tasks: readonly Pick<TaskTemplate, 'task_type'>[]): string {
  const counts = new Map<TaskType, number>();
  for (const task of tasks) counts.set(task.task_type, (counts.get(task.task_type) ?? 0) + 1);
  return TASK_TYPE_ORDER.filter((type) => counts.has(type))
    .map((type) => {
      const count = counts.get(type) ?? 0;
      return count > 1 ? `${TASK_LABELS[type]} ×${count}` : TASK_LABELS[type];
    })
    .join(' · ');
}

export interface TodaySummary {
  title: string;
  subtitle: string;
  /** "3 of 12 done" — today's done work against all of today's work. */
  progressLabel: string;
  /** 0–1 share of today's work that is done. */
  progress: number;
}

/**
 * The progress card at the top of the list: how much is on today, and the
 * shape of it. Overdue work counts as today's — it is due now, and it is what
 * the farmer has to get through before the day is done.
 */
export function summarizeToday(
  dueNow: readonly TaskTemplate[],
  overdueCount: number,
  plotCount: number,
  doneCount: number,
  /** Crops in the harvest round — their tasks are counted there, not in `dueNow`. */
  harvestCount = 0
): TodaySummary {
  const n = dueNow.length;
  const title = n > 0 ? `${n} task${n === 1 ? '' : 's'} today` : 'All done for today';
  const subtitle = [
    overdueCount > 0 ? `${overdueCount} overdue` : '',
    plotCount > 0 ? `${plotCount} plot${plotCount === 1 ? '' : 's'}` : '',
    harvestCount > 0 ? `${harvestCount} to harvest` : '',
    doneCount > 0 ? `${doneCount} done` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const total = n + doneCount;
  return {
    title,
    subtitle,
    progressLabel: `${doneCount} of ${total} done`,
    progress: total > 0 ? doneCount / total : 0,
  };
}

/**
 * Splits tasks into one group per key, keeping the order keys first appear in
 * `order` and then in the list itself. Used for plots (configured order), days
 * (chronological), types (fixed order) and time bands.
 */
export function groupTasksBy(
  tasks: readonly TaskTemplate[],
  keyOf: (task: TaskTemplate) => string,
  order: readonly string[] = []
): { key: string; tasks: TaskTemplate[] }[] {
  const buckets = new Map<string, TaskTemplate[]>();
  for (const key of order) buckets.set(key, []);
  for (const task of tasks) {
    const key = keyOf(task);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(task);
    else buckets.set(key, [task]);
  }
  return [...buckets.entries()]
    .filter(([, list]) => list.length > 0)
    .map(([key, list]) => ({ key, tasks: list }));
}

const taskRows = (prefix: string, tasks: readonly TaskTemplate[]): CarePlanRow[] =>
  tasks.map((task) => ({ key: `${prefix}-${task.id}`, kind: 'task' as const, task }));

const emptySection = (
  key: string,
  variant: CarePlanEmptyVariant,
  extra: { rawCount?: number } = {}
): CarePlanSection => ({
  key,
  header: null,
  data: [{ key, kind: 'empty', variant, ...extra }],
});

/**
 * The harvest-round card as rows: its head, then (when open) every ready check
 * and the look-ahead toggle with its crops. With nothing ready, the look-ahead
 * toggle stands alone as the card. Edges are set last, once the rows are known.
 */
export function harvestRoundRows(
  ready: readonly HarvestReadyItem[],
  soon: readonly HarvestReadyItem[],
  roundExpanded: boolean,
  soonExpanded: boolean
): CarePlanRow[] {
  type RoundRow = Extract<CarePlanRow, { kind: 'harvestRound' | 'harvest' | 'harvestSoonToggle' }>;
  // Distributes over the union — a plain `Omit` would merge its members.
  type WithoutEdges<T> = T extends unknown ? Omit<T, 'first' | 'last'> : never;
  const rows: WithoutEdges<RoundRow>[] = [];

  const soonRows = (): void => {
    const firstSoon = soon[0];
    const lastSoon = soon[soon.length - 1];
    if (!firstSoon || !lastSoon) return;
    rows.push({
      key: 'harvest-soon-toggle',
      kind: 'harvestSoonToggle',
      count: soon.length,
      fromDays: firstSoon.daysUntil,
      toDays: lastSoon.daysUntil,
      expanded: soonExpanded,
    });
    if (!soonExpanded) return;
    // Keyed apart from the ready rows' `harvest-<id>`: a crop can legitimately
    // move between the two lists across a re-render.
    for (const item of soon) {
      rows.push({ key: `harvest-soon-${item.plant.id}`, kind: 'harvest', item });
    }
  };

  if (ready.length > 0) {
    const late = ready.filter((item) => item.daysUntil < 0);
    rows.push({
      key: HARVEST_ROUND_KEY,
      kind: 'harvestRound',
      readyCount: ready.length,
      lateCount: late.length,
      maxLateDays: late.reduce((max, item) => Math.max(max, -item.daysUntil), 0),
      expanded: roundExpanded,
    });
    if (roundExpanded) {
      for (const item of ready)
        rows.push({ key: `harvest-${item.plant.id}`, kind: 'harvest', item });
      soonRows();
    }
  } else {
    soonRows();
  }

  return rows.map(
    (row, index) => ({ ...row, first: index === 0, last: index === rows.length - 1 }) as RoundRow
  );
}

/** Builds the full section list for the Care Plan's SectionList. */
export function buildCarePlanSections(input: CarePlanSectionsInput): CarePlanSection[] {
  const {
    loadFailed,
    initialLoading,
    isSearching,
    searchResults,
    filtersActive,
    selectedDate,
    harvestsReadyNow,
    harvestsSoon,
    harvestSoonExpanded,
    harvestHostKey,
    overdue,
    overdueOldestDays,
    overdueCriticalCount,
    todayGroups,
    restGroups,
    done,
    openSections,
  } = input;

  if (loadFailed) return [emptySection('load-error', 'loadError')];

  const sections: CarePlanSection[] = [];
  const roundOpen = openSections.has(HARVEST_ROUND_KEY);

  // Search replaces the whole plan with one flat result list.
  if (isSearching) {
    const round = harvestRoundRows(harvestsReadyNow, [], roundOpen, false);
    if (round.length > 0) sections.push({ key: HARVEST_ROUND_KEY, header: null, data: round });
    if (searchResults.length === 0) {
      if (!initialLoading) sections.push(emptySection('search-empty', 'searchNone'));
    } else {
      sections.push({
        key: 'search-results',
        header: {
          title: 'Search results',
          count: searchResults.length,
          tone: 'plain',
          selectableTasks: searchResults,
        },
        data: taskRows('search', searchResults),
      });
    }
    return sections;
  }

  // A picked day sits on top, so the jump from the date line lands somewhere.
  if (selectedDate) {
    const { tasks } = selectedDate;
    sections.push({
      key: 'selected-date',
      header: {
        title: selectedDate.title,
        count: tasks.length,
        tone: 'picked',
        subtitle:
          tasks.length > 0
            ? 'The day you picked. Today’s work is below.'
            : 'Nothing planned for this date.',
        selectableTasks: tasks.length > 0 ? tasks : undefined,
        addAction: true,
      },
      data:
        tasks.length === 0 && selectedDate.rawCount > 0 && filtersActive && !initialLoading
          ? [
              {
                key: 'selected-date-empty',
                kind: 'empty',
                variant: 'selectedDateFiltered',
                rawCount: selectedDate.rawCount,
              },
            ]
          : taskRows('selected', tasks),
    });
  }

  const round = harvestRoundRows(harvestsReadyNow, harvestsSoon, roundOpen, harvestSoonExpanded);
  const emittedToday = todayGroups.filter(
    (group) =>
      group.tasks.length > 0 ||
      group.keepWhenEmpty === true ||
      (group.key === harvestHostKey && round.length > 0)
  );
  const roundHosted = round.length > 0 && emittedToday.some((g) => g.key === harvestHostKey);

  // No band to carry it: the round stands at the top, as harvest checks did.
  if (round.length > 0 && !roundHosted) {
    sections.push({ key: HARVEST_ROUND_KEY, header: null, data: round });
  }

  if (overdue.length > 0) {
    const foldable = overdue.length > CATCH_UP_PREVIEW_COUNT;
    const expanded = !foldable || openSections.has(OVERDUE_SECTION_KEY);
    const oldest = `Oldest ${overdueOldestDays} day${overdueOldestDays === 1 ? '' : 's'}`;
    const critical = overdueCriticalCount > 0 ? ` · ${overdueCriticalCount} critical` : '';
    sections.push({
      key: OVERDUE_SECTION_KEY,
      header: {
        title: 'Catch up',
        count: overdue.length,
        tone: 'overdue',
        subtitle:
          foldable && !expanded
            ? `${oldest}${critical} · most urgent shown`
            : 'All overdue work, most urgent first.',
        selectableTasks: overdue,
        collapsible: foldable,
        expanded,
      },
      data: taskRows('overdue', expanded ? overdue : overdue.slice(0, CATCH_UP_PREVIEW_COUNT)),
      footer: foldable
        ? { expanded, hiddenCount: overdue.length - CATCH_UP_PREVIEW_COUNT }
        : undefined,
    });
  }

  for (const group of emittedToday) {
    const hostsRound = roundHosted && group.key === harvestHostKey;
    sections.push({
      key: `today-${group.key}`,
      header: {
        title: group.title,
        count: group.tasks.length,
        tone: 'band',
        subtitle: group.subtitle,
        selectableTasks: group.tasks.length > 0 ? group.tasks : undefined,
        isNow: group.isNow,
        rainPlots: group.rainPlots,
        plot: group.plot,
      },
      data: [...(hostsRound ? round : []), ...taskRows(`today-${group.key}`, group.tasks)],
    });
  }

  for (const group of restGroups) {
    const key = `rest-${group.key}`;
    const collapsible = group.collapsible === true;
    const expanded = !collapsible || openSections.has(key);
    sections.push({
      key,
      header: {
        title: group.title,
        count: group.tasks.length,
        tone: 'later',
        subtitle: group.subtitle ?? (collapsible ? taskTypePreview(group.tasks) : undefined),
        selectableTasks: expanded ? group.tasks : undefined,
        collapsible,
        expanded,
        plot: group.plot,
      },
      data: expanded ? taskRows(key, group.tasks) : [],
    });
  }

  const hasOpenWork =
    overdue.length > 0 ||
    todayGroups.some((group) => group.tasks.length > 0) ||
    restGroups.some((group) => group.tasks.length > 0) ||
    (selectedDate?.tasks.length ?? 0) > 0;

  if (!hasOpenWork && !initialLoading) {
    sections.push(emptySection('upcoming-empty', filtersActive ? 'filtersNone' : 'noUpcoming'));
  }

  if (done.length > 0) {
    const expanded = openSections.has(DONE_SECTION_KEY);
    const anyPending = done.some((item) => item.pending);
    sections.push({
      key: DONE_SECTION_KEY,
      header: {
        title: 'Done today',
        count: done.length,
        tone: 'done',
        subtitle: anyPending
          ? 'Undo works until the toast closes.'
          : taskTypePreview(done.map((item) => ({ task_type: item.taskType }))),
        collapsible: true,
        expanded,
      },
      data: expanded
        ? done.map((item) => ({ key: `done-${item.taskId}`, kind: 'done' as const, item }))
        : [],
    });
  }

  return sections;
}
