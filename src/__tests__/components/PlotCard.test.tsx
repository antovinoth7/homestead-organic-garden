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
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/styles/plotCardStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { PlotCard, PlotHealthFilter } from '@/components/today/PlotCard';
import { PlotBrief } from '@/types/database.types';
import { makePlotBrief } from '../fixtures/today.fixtures';

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

const plot: PlotBrief = makePlotBrief();

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
    expect(rendered.root.findByProps({ name: 'weather.clear' })).toBeDefined();
    expect(JSON.stringify(rendered.toJSON())).not.toContain('\u2600\ufe0f');
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

  // The pill's second style entry is the tone, so it is the tail of the array
  // rather than the base key `baseStyle` reads.
  const pillStyle = (rendered: RenderedTree) => {
    const pill = rendered.root.findAll(
      (node) => node.type === 'TouchableOpacity' && baseStyle(node.props.style) === 'weatherPill'
    )[0];
    return Array.isArray(pill?.props.style) ? pill.props.style : [];
  };

  it.each([
    ['rain', 'weatherPillRain'],
    ['drizzle', 'weatherPillShowers'],
    ['clear', 'weatherPillClear'],
    ['hot', 'weatherPillHot'],
    ['thunderstorm', 'weatherPillStorm'],
    ['cloudy', 'weatherPillNeutral'],
  ] as const)('tints the forecast pill for %s', (condition, toneKey) => {
    const rendered = render(
      jest.fn(),
      makePlotBrief({ weather: { ...plot.weather, condition } })
    );
    expect(pillStyle(rendered)).toContain(toneKey);
  });

  it('tags the context sentence with the rung that produced it', () => {
    const rendered = render(
      jest.fn(),
      makePlotBrief({
        line: {
          kind: 'overdue',
          headline: 'Watering on Carrot (VVH) is 4 days late.',
          freshness: 'Last worked 2 weeks ago.',
        },
      })
    );

    expect(hostText(rendered, 'rungTag')).toEqual(['Late']);
    // The tag is hidden from the reader and folded into the sentence instead,
    // so the row is one utterance rather than two.
    expect(
      rendered.root.findByProps({
        accessibilityLabel: 'Late. Watering on Carrot (VVH) is 4 days late.',
      })
    ).toBeTruthy();
  });

  it('leaves the sentence untagged on a rung-less plot', () => {
    const rendered = render(
      jest.fn(),
      makePlotBrief({ line: { kind: null, headline: null, freshness: 'Worked today.' } })
    );
    expect(hostText(rendered, 'rungTag')).toHaveLength(0);
    expect(hostText(rendered, 'line')).toEqual(['Worked today.']);
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
