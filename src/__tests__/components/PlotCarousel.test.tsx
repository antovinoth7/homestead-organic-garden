/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the rail's layout and its indicator. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    ScrollView: host('ScrollView'),
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  };
});
jest.mock('@/theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/components/GardenIcon', () => ({ GardenIcon: () => null }));
jest.mock('@/styles/plotCardStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));
jest.mock('@/styles/plotCarouselStyles', () => ({
  CARD_GAP: 12,
  CARD_PEEK: 26,
  plotCardWidth: (width: number) => width - 32 - 26,
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { PlotCarousel } from '@/components/today/PlotCarousel';
import { PlotBrief } from '@/types/database.types';
import { makePlotBrief } from '../fixtures/today.fixtures';

interface RenderedNode {
  type: unknown;
  props: { style?: unknown; children?: unknown; accessibilityLabel?: string };
}

interface RenderedTree {
  toJSON: () => unknown;
  root: {
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const home = makePlotBrief({ id: 'home', name: 'Velliavilai Home', overdueCount: 1 });
const pond = makePlotBrief({
  id: 'pond',
  name: 'Near Pond',
  dueCount: 0,
  overdueCount: 0,
});

describe('PlotCarousel', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(plots: PlotBrief[]) {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlotCarousel
          plots={plots}
          onPressPlot={jest.fn()}
          onPressWeather={jest.fn()}
          onPressHealth={jest.fn()}
          onPressBeds={jest.fn()}
        />
      );
    });
    return rendered;
  }

  const baseStyle = (style: unknown) => (Array.isArray(style) ? style[0] : style);

  const nodes = (rendered: RenderedTree, type: string, style?: string) =>
    rendered.root.findAll(
      (node) => node.type === type && (style === undefined || baseStyle(node.props.style) === style)
    );

  it('renders one plot as a plain card, with no rail and no indicator', () => {
    const rendered = render([home]);
    expect(nodes(rendered, 'ScrollView')).toHaveLength(0);
    expect(nodes(rendered, 'View', 'dot')).toHaveLength(0);
    // The card itself keeps its own gutter — nothing overrides its frame.
    expect(baseStyle(nodes(rendered, 'View', 'card')[0]?.props.style)).toBe('card');
  });

  it('pages several plots and sizes each card to the screen less its peek', () => {
    const rendered = render([home, pond]);
    const rail = nodes(rendered, 'ScrollView')[0];
    expect(rail).toBeTruthy();

    const cards = nodes(rendered, 'View', 'card');
    expect(cards).toHaveLength(2);
    // 390 − 2×16 gutter − 26 peek = 332, and the snap interval adds the gap.
    expect(cards[0]?.props.style).toContainEqual(
      expect.objectContaining({ width: 332, marginHorizontal: 0 })
    );
  });

  it('marks one dot per plot, with the first page active and its position spoken', () => {
    const rendered = render([home, pond]);
    const dots = nodes(rendered, 'View', 'dot');
    expect(dots).toHaveLength(2);
    expect(dots[0]?.props.style).toContain('dotActive');
    expect(dots[1]?.props.style).toContain(null);

    const row = nodes(rendered, 'View', 'dots')[0];
    expect(row?.props.accessibilityLabel).toBe('Plot 1 of 2.');
  });
});
