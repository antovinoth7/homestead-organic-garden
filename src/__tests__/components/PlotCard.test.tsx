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

  function render(onPressHealth = jest.fn()) {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlotCard
          plot={plot}
          onPress={jest.fn()}
          onPressWeather={jest.fn()}
          onPressHealth={onPressHealth}
          onPressBeds={jest.fn()}
        />
      );
    });
    return rendered;
  }

  it('renders four two-line status columns in health-filter order', () => {
    const rendered = render();
    const hostText = (style: string) =>
      rendered.root
        .findAll((node) => node.type === 'Text' && node.props.style === style)
        .map((node) => node.props.children);
    expect(hostText('healthValue')).toEqual([77, 0, 12, 3]);
    expect(hostText('healthLabel')).toEqual(['Healthy', 'Stressed', 'Recovering', 'Sick']);
    expect(
      rendered.root.findAll((node) => node.type === 'View' && node.props.style === 'healthDivider')
    ).toHaveLength(3);
    expect(JSON.stringify(rendered.toJSON())).toContain('\u2600\ufe0f');
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
