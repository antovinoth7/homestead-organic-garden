/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the filter sheet's static layout and press handlers. */
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
  useTheme: () => ({ primary: '#26734d', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/plantsStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { PlantFilterSheet } from '@/components/PlantFilterSheet';
import { EMPTY_FILTERS } from '@/utils/plantFilters';
import type { PlantFacetCounts } from '@/utils/plantFilters';

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

const plantCounts: PlantFacetCounts = {
  type: {
    vegetable: 1,
    spinach: 4,
    fruit_tree: 23,
    coconut_tree: 59,
    herb: 3,
    timber_tree: 7,
    flower: 0,
    shrub: 0,
  },
  health: { healthy: 90, stressed: 3, recovering: 1, sick: 2 },
  space: { pot: 5, bed: 8, ground: 83 },
  sunlight: { full_sun: 80, partial_sun: 15, shade: 1 },
  water: { low: 10, medium: 70, high: 16 },
  pestActive: 2,
  pestNone: 94,
  segment: { bed: 8, other: 88 },
};

describe('PlantFilterSheet plant types', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(updateFilter = jest.fn()): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlantFilterSheet
          sortBy="newest"
          setSortBy={jest.fn()}
          filters={EMPTY_FILTERS}
          updateFilter={updateFilter}
          clearAllFilters={jest.fn()}
          hasActiveFilters={false}
          plantCounts={plantCounts}
          parentLocations={[]}
          childLocations={[]}
          onClose={jest.fn()}
        />
      );
    });
    return rendered;
  }

  it('shows every plant type in the intended order with distinct semantic icons', () => {
    const rendered = render();
    const chips = rendered.root.findAll(
      (node) =>
        node.type === 'TouchableOpacity' &&
        (node.props.testID?.startsWith('plant-type-filter-') ?? false)
    );
    const icons = rendered.root.findAll((node) => node.type === 'GardenIcon');

    expect(chips.map((node) => node.props.testID)).toEqual([
      'plant-type-filter-all',
      'plant-type-filter-vegetable',
      'plant-type-filter-spinach',
      'plant-type-filter-fruit_tree',
      'plant-type-filter-coconut_tree',
      'plant-type-filter-herb',
      'plant-type-filter-timber_tree',
      'plant-type-filter-flower',
      'plant-type-filter-shrub',
    ]);
    expect(icons.map((node) => node.props.name)).toEqual([
      'plant.vegetable',
      'plant.spinach',
      'plant.fruit_tree',
      'plant.coconut_tree',
      'plant.herb',
      'plant.timber_tree',
      'plant.flower',
      'plant.shrub',
    ]);
  });

  it('shows the Spinach count and selects the Spinach filter', () => {
    const updateFilter = jest.fn();
    const rendered = render(updateFilter);
    const spinachChip = rendered.root.findByProps({ testID: 'plant-type-filter-spinach' });
    const countLabels = rendered.root.findAll((node) => {
      const children = node.props.children;
      return (
        node.type === 'Text' &&
        Array.isArray(children) &&
        children[0] === ' (' &&
        children[1] === 4 &&
        children[2] === ')'
      );
    });

    expect(JSON.stringify(rendered.toJSON())).toContain('Spinach');
    expect(countLabels).toHaveLength(1);
    TestRenderer.act(() => spinachChip.props.onPress?.());
    expect(updateFilter).toHaveBeenCalledWith('type', 'spinach');
  });
});
