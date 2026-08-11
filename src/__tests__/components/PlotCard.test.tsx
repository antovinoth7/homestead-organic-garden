/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the plot card's static layout and press handlers. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
  };
});
jest.mock('@/theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/styles/plotCardStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { PlotCard, PlotHealthFilter } from '@/components/today/PlotCard';
import { PlotBrief } from '@/types/database.types';

interface RenderedNode {
  type: unknown;
  props: { onPress?: () => void; children?: unknown; style?: unknown };
}

interface RenderedTree {
  toJSON: () => unknown;
  root: {
    findByProps: (props: Record<string, unknown>) => RenderedNode;
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
    findAllByProps: (props: Record<string, unknown>) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const plot: PlotBrief = {
  id: 'north-plot',
  name: 'North Plot',
  isConfigured: true,
  district: 'Kanyakumari',
  cropCount: 92,
  bedCount: 3,
  bedStatus: { growing: 2, resting: 1, empty: 0, permanent: 0, total: 3 },
  dueCount: 1,
  overdueCount: 0,
  health: { healthy: 77, stressed: 0, recovering: 12, sick: 3, total: 92 },
  weather: {
    lat: 8.08,
    lng: 77.55,
    source: 'plot',
    forecast: null,
    today: null,
    condition: 'clear',
    conditionLabel: 'Clear',
    conditionEmoji: '\u2600\ufe0f',
    fetched_at: '2026-08-10T00:00:00.000Z',
    stale: false,
    loading: false,
  },
  line: { headline: null, freshness: null },
};

describe('PlotCard health footer', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(onPressHealth = jest.fn(), brief: PlotBrief = plot) {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlotCard
          plot={brief}
          onPress={jest.fn()}
          onPressWeather={jest.fn()}
          onPressHealth={onPressHealth}
          onPressBeds={jest.fn()}
        />
      );
    });
    return rendered;
  }

  // Muted states are styled with an array, so the base key is the first entry.
  const baseStyle = (style: unknown) => (Array.isArray(style) ? style[0] : style);

  const hostText = (rendered: RenderedTree, style: string) =>
    rendered.root
      .findAll((node) => node.type === 'Text' && baseStyle(node.props.style) === style)
      .map((node) => node.props.children);

  const tiles = (rendered: RenderedTree) =>
    rendered.root.findAll((node) => node.type === 'View' && baseStyle(node.props.style) === 'tile');

  it('states each total over the rows it divides into', () => {
    const rendered = render();
    // Plants tile then beds tile: the total, then that total split up.
    expect(tiles(rendered)).toHaveLength(2);
    expect(hostText(rendered, 'tileTotal')).toEqual([92, 3]);
    expect(hostText(rendered, 'statusValue')).toEqual([77, 0, 12, 3, 2, 1, 0, 0]);
    expect(hostText(rendered, 'statusLabel')).toEqual([
      'Healthy',
      'Stressed',
      'Recovering',
      'Sick',
      'Growing',
      'Resting',
      'Ready',
      'Permanent',
    ]);
    expect(JSON.stringify(rendered.toJSON())).toContain('\u2600\ufe0f');
  });

  it('opens the forecast from the temperature pill and carries no second chevron', () => {
    const onPressWeather = jest.fn();
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlotCard
          plot={plot}
          onPress={jest.fn()}
          onPressWeather={onPressWeather}
          onPressHealth={jest.fn()}
          onPressBeds={jest.fn()}
        />
      );
    });

    const pills = rendered.root.findAll(
      (node) => node.type === 'TouchableOpacity' && baseStyle(node.props.style) === 'weatherPill'
    );
    expect(pills).toHaveLength(1);
    TestRenderer.act(() => {
      pills[0]?.props.onPress?.();
    });
    expect(onPressWeather).toHaveBeenCalledWith('north-plot');

    // The pill is the only way into the forecast, so the old trailing link is
    // gone and the one chevron left means "open the plot".
    expect(hostText(rendered, 'weatherLink')).toHaveLength(0);
    expect(hostText(rendered, 'chevron')).toHaveLength(1);
  });

  it('replaces the bed tile with a sentence when the plot has no beds', () => {
    const rendered = render(jest.fn(), {
      ...plot,
      bedCount: 0,
      bedStatus: { growing: 0, resting: 0, empty: 0, permanent: 0, total: 0 },
    });
    // The plants tile plus the empty-beds tile: the row still holds two objects.
    expect(tiles(rendered)).toHaveLength(2);
    expect(hostText(rendered, 'tileTotal')).toEqual([92]);
    expect(hostText(rendered, 'statusLabel')).toEqual([
      'Healthy',
      'Stressed',
      'Recovering',
      'Sick',
    ]);
    expect(hostText(rendered, 'emptyBedsLine')).toHaveLength(1);
    expect(hostText(rendered, 'emptyBedsLink')).toHaveLength(1);
  });

  it.each<[string, PlotHealthFilter]>([
    ['77 healthy plants in North Plot. Opens the plant list.', 'healthy'],
    ['0 stressed plants in North Plot. Opens the plant list.', 'stressed'],
    ['12 recovering plants in North Plot. Opens the plant list.', 'recovering'],
    ['3 sick plants in North Plot. Opens the plant list.', 'sick'],
  ])('keeps %s wired to the matching filter', (accessibilityLabel, filter) => {
    const onPressHealth = jest.fn();
    const rendered = render(onPressHealth);
    TestRenderer.act(() => {
      rendered.root.findByProps({ accessibilityLabel }).props.onPress?.();
    });
    expect(onPressHealth).toHaveBeenCalledWith('north-plot', filter);
  });
});
