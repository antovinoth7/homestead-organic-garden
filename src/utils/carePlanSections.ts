/**
 * The Care Plan's list model — which sections the task list shows, in what
 * order, and what each header says.
 *
 * The screen hands in lists it has already filtered, sorted and windowed; this
 * module only arranges them. Keeping the arrangement pure means the order the
 * farmer walks the list in (harvest checks → overdue → today plot by plot →
 * later days → done) is pinned by unit tests rather than by a 300-line memo.
 *
 * Pure — no React, no services.
 */

import type { TaskTemplate, TaskType } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import type { HarvestReadyItem } from '@/utils/harvestStats';
import { TASK_LABELS, TASK_TYPE_ORDER } from '@/utils/taskConstants';

export type CarePlanEmptyVariant =
  | 'loadError'
  | 'selectedDateFiltered'
  | 'selectedDateNone'
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

export type CarePlanRow =
  | { key: string; kind: 'task'; task: TaskTemplate }
  | { key: string; kind: 'done'; item: CarePlanDoneItem }
  | { key: string; kind: 'harvest'; item: HarvestReadyItem }
  /** Disclosure row heading the look-ahead harvests; `fromDays`/`toDays` are its span. */
  | { key: string; kind: 'harvestSoonToggle'; count: number; fromDays: number; toDays: number }
  | {
      key: string;
      kind: 'empty';
      variant: CarePlanEmptyVariant;
      rawCount?: number;
      isToday?: boolean;
    };

export interface CarePlanSectionHeader {
  title: string;
  iconKey?: VisualIconKey;
  count: number;
  /** Tasks the select-all box covers in selection mode; omitted when it has none. */
  selectableTasks?: TaskTemplate[];
  overdue?: boolean;
  /** Carries the "✓ N done" chip — the first Today section only. */
  showDoneChip?: boolean;
  /** Title stretches to push the count right (default true). */
  titleFlex?: boolean;
  /** The header taps to open / close its rows. */
  collapsible?: boolean;
  expanded?: boolean;
  /** One-line type summary shown under a closed header, e.g. "Water ×2 · Spray". */
  preview?: string;
  /** Plot name for the per-plot weather banner. */
  plot?: string;
}

export interface CarePlanSection {
  key: string;
  header: CarePlanSectionHeader | null;
  data: CarePlanRow[];
}

/** A run of tasks the screen has already grouped (one plot, one day, one type…). */
export interface CarePlanTaskGroup {
  key: string;
  title: string;
  tasks: TaskTemplate[];
  iconKey?: VisualIconKey;
  /** Later days fold away behind one row each; today's groups never do. */
  collapsible?: boolean;
  /** Plot name when the group is one plot — drives the weather banner. */
  plot?: string;
}

export interface CarePlanSectionsInput {
  /** Load failed with nothing cached to show. */
  loadFailed: boolean;
  initialLoading: boolean;
  isSearching: boolean;
  /** All matches while searching (sorted). */
  searchResults: TaskTemplate[];
  filtersActive: boolean;
  /** The day picked on the calendar, when it is not part of the normal flow. */
  selectedDate: {
    key: string;
    title: string;
    isToday: boolean;
    tasks: TaskTemplate[];
    rawCount: number;
  } | null;
  harvestsReadyNow: HarvestReadyItem[];
  harvestsSoon: HarvestReadyItem[];
  harvestSoonExpanded: boolean;
  overdue: TaskTemplate[];
  /** Today's open work — one group, or one per plot when grouped by location. */
  todayGroups: CarePlanTaskGroup[];
  /** Everything after today in the window — per day, or per group. */
  restGroups: CarePlanTaskGroup[];
  done: CarePlanDoneItem[];
  /** Keys of collapsible sections the farmer has opened. */
  openSections: ReadonlySet<string>;
}

/** Section key of the overdue block — also a deep-link target. */
export const OVERDUE_SECTION_KEY = 'overdue';
export const DONE_SECTION_KEY = 'done-today';

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
}

/**
 * The line at the top of the list: how much is on today, and the shape of it.
 * Overdue work counts as today's — it is due now, and it is what the farmer has
 * to get through before the day is done.
 */
export function summarizeToday(
  dueNow: readonly TaskTemplate[],
  overdueCount: number,
  plotCount: number,
  doneCount: number
): TodaySummary {
  const n = dueNow.length;
  const title = n > 0 ? `${n} task${n === 1 ? '' : 's'} today` : 'All done for today';
  const subtitle = [
    overdueCount > 0 ? `${overdueCount} overdue` : '',
    plotCount > 0 ? `${plotCount} plot${plotCount === 1 ? '' : 's'}` : '',
    doneCount > 0 ? `${doneCount} done` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return { title, subtitle };
}

/**
 * Splits tasks into one group per key, keeping the order keys first appear in
 * `order` and then in the list itself. Used for plots (configured order), days
 * (chronological) and types (fixed order).
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
  extra: { rawCount?: number; isToday?: boolean } = {}
): CarePlanSection => ({
  key,
  header: null,
  data: [{ key, kind: 'empty', variant, ...extra }],
});

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
    overdue,
    todayGroups,
    restGroups,
    done,
    openSections,
  } = input;

  if (loadFailed) return [emptySection('load-error', 'loadError')];

  const sections: CarePlanSection[] = [];

  // Search replaces the whole plan with one flat result list.
  if (isSearching) {
    if (harvestsReadyNow.length > 0) sections.push(harvestReadySection(harvestsReadyNow));
    if (searchResults.length === 0) {
      if (!initialLoading) sections.push(emptySection('search-empty', 'searchNone'));
    } else {
      sections.push({
        key: 'search-results',
        header: {
          title: 'Search Results',
          count: searchResults.length,
          selectableTasks: searchResults,
        },
        data: taskRows('search', searchResults),
      });
    }
    return sections;
  }

  // A picked day sits on top, so the jump from the calendar lands somewhere.
  if (selectedDate) {
    if (selectedDate.tasks.length > 0) {
      sections.push({
        key: 'selected-date',
        header: {
          title: selectedDate.title,
          count: selectedDate.tasks.length,
          selectableTasks: selectedDate.tasks,
          showDoneChip: selectedDate.isToday,
        },
        data: taskRows('selected', selectedDate.tasks),
      });
    } else if (!initialLoading) {
      sections.push(
        selectedDate.rawCount > 0 && filtersActive
          ? emptySection('selected-date-empty', 'selectedDateFiltered', {
              rawCount: selectedDate.rawCount,
            })
          : emptySection('selected-date-empty', 'selectedDateNone', {
              isToday: selectedDate.isToday,
            })
      );
    }
  }

  // Harvest checks that are due: only the ready half earns a pinned section.
  if (harvestsReadyNow.length > 0) sections.push(harvestReadySection(harvestsReadyNow));

  if (overdue.length > 0) {
    sections.push({
      key: OVERDUE_SECTION_KEY,
      header: {
        title: 'Overdue',
        iconKey: 'general.warning',
        count: overdue.length,
        selectableTasks: overdue,
        overdue: true,
      },
      data: taskRows('overdue', overdue),
    });
  }

  todayGroups.forEach((group, index) => {
    sections.push({
      key: `today-${group.key}`,
      header: {
        title: group.title,
        iconKey: group.iconKey,
        count: group.tasks.length,
        selectableTasks: group.tasks,
        showDoneChip: index === 0,
        plot: group.plot,
      },
      data: taskRows(`today-${group.key}`, group.tasks),
    });
  });

  // Look-ahead harvests — below the due work, folded behind one row. The list
  // arrives sorted, so its first and last entries are the day span.
  const firstSoon = harvestsSoon[0];
  const lastSoon = harvestsSoon[harvestsSoon.length - 1];
  if (firstSoon && lastSoon) {
    sections.push({
      key: 'harvest-soon',
      header: null,
      data: [
        {
          key: 'harvest-soon-toggle',
          kind: 'harvestSoonToggle',
          count: harvestsSoon.length,
          fromDays: firstSoon.daysUntil,
          toDays: lastSoon.daysUntil,
        },
        // Keyed apart from the pinned section's `harvest-<id>`: a crop can
        // legitimately appear in either list across a re-render.
        ...(harvestSoonExpanded
          ? harvestsSoon.map((item) => ({
              key: `harvest-soon-${item.plant.id}`,
              kind: 'harvest' as const,
              item,
            }))
          : []),
      ],
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
        iconKey: group.iconKey,
        count: group.tasks.length,
        selectableTasks: expanded ? group.tasks : undefined,
        collapsible,
        expanded,
        preview: collapsible && !expanded ? taskTypePreview(group.tasks) : undefined,
        plot: group.plot,
      },
      data: expanded ? taskRows(key, group.tasks) : [],
    });
  }

  const hasOpenWork =
    overdue.length > 0 ||
    todayGroups.some((group) => group.tasks.length > 0) ||
    restGroups.some((group) => group.tasks.length > 0);

  if (!hasOpenWork && !initialLoading) {
    sections.push(emptySection('upcoming-empty', filtersActive ? 'filtersNone' : 'noUpcoming'));
    // Both empty cards fire on "nothing due" — the full card says the same and
    // carries the Create action, so the compact one is the one to drop.
    const withoutCompact = sections.filter(
      (section) =>
        !section.data.some((row) => row.kind === 'empty' && row.variant === 'selectedDateNone')
    );
    sections.length = 0;
    sections.push(...withoutCompact);
  }

  if (done.length > 0) {
    const expanded = openSections.has(DONE_SECTION_KEY);
    sections.push({
      key: DONE_SECTION_KEY,
      header: {
        title: 'Done today',
        iconKey: 'general.success',
        count: done.length,
        collapsible: true,
        expanded,
        preview: expanded
          ? undefined
          : taskTypePreview(done.map((item) => ({ task_type: item.taskType }))),
      },
      data: expanded
        ? done.map((item) => ({ key: `done-${item.taskId}`, kind: 'done' as const, item }))
        : [],
    });
  }

  return sections;
}

function harvestReadySection(items: HarvestReadyItem[]): CarePlanSection {
  return {
    key: 'harvest-ready',
    header: {
      title: 'Harvest Ready',
      iconKey: 'task.harvest',
      count: items.length,
      titleFlex: false,
    },
    data: items.map((item) => ({
      key: `harvest-${item.plant.id}`,
      kind: 'harvest' as const,
      item,
    })),
  };
}
