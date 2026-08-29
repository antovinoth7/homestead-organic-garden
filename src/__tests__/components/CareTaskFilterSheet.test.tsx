/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the sheet's static layout and press handlers. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    Pressable: host('Pressable'),
    ScrollView: host('ScrollView'),
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
    StyleSheet: { absoluteFill: {} },
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props) };
});
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/components/SheetHandle', () => ({ SheetHandle: () => null }));
jest.mock('@/components/FloatingTabBar', () => ({ TAB_BAR_HEIGHT: 64 }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({
    primary: '#26734d',
    textSecondary: '#4a3828',
    error: '#c62828',
    warning: '#ef6c00',
    info: '#0277bd',
    border: '#d7ccc8',
  }),
}));
jest.mock('@/styles/calendarStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { CareTaskFilterSheet } from '@/components/CareTaskFilterSheet';
import type { CareTaskFilterSheetProps } from '@/components/CareTaskFilterSheet';
import { emptyCareTaskFilters, type CareTaskFacetCounts } from '@/utils/careTaskFilters';
import { UNASSIGNED_PLOT_ID } from '@/types/database.types';
import type { PlotGroup } from '@/utils/plotGrouping';
import { makeBed } from '../fixtures/bed.fixtures';

interface RenderedNode {
  type: unknown;
  props: {
    children?: unknown;
    name?: string;
    onPress?: () => void;
    testID?: string;
  };
}

interface RenderedTree {
  toJSON: () => unknown;
  root: {
    findByProps: (props: Record<string, unknown>) => RenderedNode;
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const facetCounts: CareTaskFacetCounts = {
  taskTypes: { water: 12, spray: 3 },
  dueStatuses: { overdue: 4, today: 7, upcoming: 21 },
  plotIds: { 'Home farm': 9, 'Paddy land': 6, [UNASSIGNED_PLOT_ID]: 1 },
  bedIds: { b1: 5, b2: 2 },
  priorities: { critical: 1, high: 4, medium: 9, low: 1 },
  times: { morning: 2, afternoon: 0, evening: 1, unset: 12 },
};

const plotGroup = (id: string, name: string): PlotGroup => ({
  id,
  name,
  isConfigured: true,
  plants: [],
  bedIds: [],
  tasks: [],
  logs: [],
  alerts: [],
});

const PLOTS = [plotGroup('Home farm', 'Home farm'), plotGroup('Paddy land', 'Paddy land')];

function render(overrides: Partial<CareTaskFilterSheetProps> = {}): RenderedTree {
  let rendered!: RenderedTree;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      <CareTaskFilterSheet
        filters={emptyCareTaskFilters()}
        facetCounts={facetCounts}
        groupBy="none"
        sortBy="due"
        plotGroups={PLOTS}
        beds={[]}
        showTimeFilter={false}
        hasActiveFilters={false}
        onToggleTaskType={jest.fn()}
        onToggleDueStatus={jest.fn()}
        onTogglePlot={jest.fn()}
        onToggleBed={jest.fn()}
        onTogglePriority={jest.fn()}
        onToggleTime={jest.fn()}
        onChangeGroupBy={jest.fn()}
        onChangeSortBy={jest.fn()}
        onClearAll={jest.fn()}
        onClose={jest.fn()}
        {...overrides}
      />
    );
  });
  return rendered;
}

/** A serialised node from `toJSON()` — plain data, unlike the fiber tree. */
type JsonNode = { type: string; props: Record<string, unknown>; children: (JsonNode | string)[] | null };

const isJsonNode = (node: JsonNode | string): node is JsonNode => typeof node !== 'string';

/** All the text a serialised subtree renders, concatenated. */
function textOf(node: JsonNode | string): string {
  if (!isJsonNode(node)) return node;
  return (node.children ?? []).map(textOf).join('');
}

function findByTestID(node: JsonNode | string, testID: string): JsonNode | null {
  if (!isJsonNode(node)) return null;
  if (node.props?.testID === testID) return node;
  for (const child of node.children ?? []) {
    const hit = findByTestID(child, testID);
    if (hit) return hit;
  }
  return null;
}

const testIDs = (rendered: RenderedTree, prefix: string): string[] =>
  rendered.root
    .findAll(
      (node) => node.type === 'TouchableOpacity' && (node.props.testID?.startsWith(prefix) ?? false)
    )
    .map((node) => node.props.testID as string);

describe('CareTaskFilterSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  it('offers one chip per configured plot, in the order given', () => {
    expect(testIDs(render(), 'care-filter-plot-')).toEqual([
      'care-filter-plot-Home farm',
      'care-filter-plot-Paddy land',
    ]);
  });

  // One plot is the whole farm, so a chip narrowing to it would be a no-op.
  it('hides the Location section when there is only one plot', () => {
    const rendered = render({ plotGroups: [plotGroup('Home farm', 'Home farm')] });
    expect(testIDs(rendered, 'care-filter-plot-')).toEqual([]);
  });

  it('offers the three due statuses, most urgent first', () => {
    expect(testIDs(render(), 'care-filter-status-')).toEqual([
      'care-filter-status-overdue',
      'care-filter-status-today',
      'care-filter-status-upcoming',
    ]);
  });

  it('offers the four priorities, most urgent first', () => {
    expect(testIDs(render(), 'care-filter-priority-')).toEqual([
      'care-filter-priority-critical',
      'care-filter-priority-high',
      'care-filter-priority-medium',
      'care-filter-priority-low',
    ]);
  });

  it('labels each chip with its facet count', () => {
    const tree = render().toJSON() as JsonNode;
    const chipText = (testID: string): string => {
      const chip = findByTestID(tree, testID);
      expect(chip).not.toBeNull();
      return textOf(chip as JsonNode);
    };
    expect(chipText('care-filter-plot-Paddy land')).toContain('Paddy land (6)');
    expect(chipText('care-filter-priority-critical')).toContain('Critical (1)');
    expect(chipText('care-filter-status-overdue')).toContain('Overdue (4)');
    expect(chipText('care-filter-status-today')).toContain('Due today (7)');
    // A count of zero is still shown — the chip stays visible, just inert.
    expect(chipText('care-filter-type-mulch')).toContain('Mulch (0)');
  });

  // Every synced template has a null preferred_time, so on most farms the
  // section would only ever offer "Any time".
  it('hides the Time of Day section unless a task names a time', () => {
    expect(testIDs(render(), 'care-filter-time-')).toEqual([]);
    expect(testIDs(render({ showTimeFilter: true }), 'care-filter-time-')).toEqual([
      'care-filter-time-morning',
      'care-filter-time-afternoon',
      'care-filter-time-evening',
      'care-filter-time-unset',
    ]);
  });

  // The Pots & Ground segment holds no bed tasks, so the screen passes none.
  it('shows the Bed section only when beds are supplied', () => {
    expect(testIDs(render(), 'care-filter-bed-')).toEqual([]);
    const beds = [makeBed({ id: 'b1', name: 'Bed 1' }), makeBed({ id: 'b2', name: 'Bed 2' })];
    expect(testIDs(render({ beds }), 'care-filter-bed-')).toEqual([
      'care-filter-bed-b1',
      'care-filter-bed-b2',
    ]);
  });

  it('offers Group By and Sort By options', () => {
    const rendered = render();
    expect(testIDs(rendered, 'care-group-')).toEqual([
      'care-group-none',
      'care-group-location',
      'care-group-type',
      'care-group-plant',
    ]);
    expect(testIDs(rendered, 'care-sort-')).toEqual([
      'care-sort-due',
      'care-sort-priority',
      'care-sort-plant',
    ]);
  });

  it('reports the tapped value back to the screen', () => {
    const onToggleDueStatus = jest.fn();
    const onTogglePlot = jest.fn();
    const onTogglePriority = jest.fn();
    const onChangeSortBy = jest.fn();
    const rendered = render({ onToggleDueStatus, onTogglePlot, onTogglePriority, onChangeSortBy });

    TestRenderer.act(() => {
      rendered.root.findByProps({ testID: 'care-filter-status-today' }).props.onPress?.();
      rendered.root.findByProps({ testID: 'care-filter-plot-Home farm' }).props.onPress?.();
      rendered.root.findByProps({ testID: 'care-filter-priority-critical' }).props.onPress?.();
      rendered.root.findByProps({ testID: 'care-sort-priority' }).props.onPress?.();
    });

    expect(onToggleDueStatus).toHaveBeenCalledWith('today');
    expect(onTogglePlot).toHaveBeenCalledWith('Home farm');
    expect(onTogglePriority).toHaveBeenCalledWith('critical');
    expect(onChangeSortBy).toHaveBeenCalledWith('priority');
  });

  it('shows Clear All only when something is active', () => {
    const hasClear = (rendered: RenderedTree): boolean =>
      rendered.root.findAll(
        (node) => node.type === 'Text' && node.props.children === 'Clear All'
      ).length > 0;
    expect(hasClear(render())).toBe(false);
    expect(hasClear(render({ hasActiveFilters: true }))).toBe(true);
  });
});
