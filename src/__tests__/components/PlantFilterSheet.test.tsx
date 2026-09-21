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
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
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
  // Keyed by browse group: the chips filter by the group a plant card shows, so
  // filtering by care model would put Turmeric under "Herb" while its own card
  // read "Spices".
  type: {
    vegetables: 1,
    greens: 4,
    fruits: 23,
    spices: 2,
    herbs_medicinal: 3,
    flowers: 0,
    farm_support: 0,
    plantation_timber: 59,
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
      'plant-type-filter-vegetables',
      'plant-type-filter-greens',
      'plant-type-filter-fruits',
      'plant-type-filter-spices',
      'plant-type-filter-herbs_medicinal',
      'plant-type-filter-flowers',
      'plant-type-filter-farm_support',
      'plant-type-filter-plantation_timber',
    ]);
    expect(icons.map((node) => node.props.name)).toEqual([
      'plant.vegetable',
      'plant.spinach',
      'plant.fruit_tree',
      'plant.herb',
      'plant.herb',
      'plant.flower',
      'plant.shrub',
      'plant.coconut_tree',
    ]);
  });

  it('shows the Greens count and selects the Greens filter', () => {
    const updateFilter = jest.fn();
    const rendered = render(updateFilter);
    const greensChip = rendered.root.findByProps({ testID: 'plant-type-filter-greens' });
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

    // "Greens", never "Spinach": the sheet used to carry its own label list that
    // disagreed with the catalog's.
    expect(JSON.stringify(rendered.toJSON())).toContain('Greens');
    expect(JSON.stringify(rendered.toJSON())).not.toContain('Spinach');
    expect(countLabels).toHaveLength(1);
    TestRenderer.act(() => greensChip.props.onPress?.());
    expect(updateFilter).toHaveBeenCalledWith('type', 'greens');
  });
});
