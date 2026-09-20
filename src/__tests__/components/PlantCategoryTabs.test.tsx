/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the category tabs' static layout and press handlers. */
/* eslint-disable import/first */
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
  };
});
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/services/plantProfiles', () => ({
  PLANT_CATEGORIES: [
    'vegetable',
    'fruit_tree',
    'spinach',
    'coconut_tree',
    'herb',
    'timber_tree',
    'flower',
    'shrub',
  ],
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#1a4a2e', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/managePlantCatalogStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { PlantCategoryTabs } from '@/components/PlantCategoryTabs';
import { PLANT_CATEGORIES } from '@/services/plantProfiles';
import type { PlantType } from '@/types/database.types';

interface RenderedNode {
  type: unknown;
  props: {
    color?: string;
    name?: string;
    onPress?: () => void;
    size?: number;
  };
}

interface RenderedTree {
  root: {
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const counts = Object.fromEntries(
  PLANT_CATEGORIES.map((category, index) => [category, index + 1])
) as Record<PlantType, number>;

describe('PlantCategoryTabs icons', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(onCategoryChange = jest.fn()): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlantCategoryTabs
          activeCategory="herb"
          allCategoryCounts={counts}
          onCategoryChange={onCategoryChange}
        />
      );
    });
    return rendered;
  }

  it('renders a 14 px semantic icon for every category in catalog order', () => {
    const icons = render().root.findAll((node) => node.type === 'GardenIcon');

    expect(icons.map((node) => node.props.name)).toEqual(
      PLANT_CATEGORIES.map((category) => `plant.${category}`)
    );
    expect(icons.map((node) => node.props.size)).toEqual(PLANT_CATEGORIES.map(() => 14));
  });

  it('uses the selected color and keeps category selection behavior', () => {
    const onCategoryChange = jest.fn();
    const rendered = render(onCategoryChange);
    const icons = rendered.root.findAll((node) => node.type === 'GardenIcon');
    const pills = rendered.root.findAll((node) => node.type === 'TouchableOpacity');
    const herbIndex = PLANT_CATEGORIES.indexOf('herb');
    const timberIndex = PLANT_CATEGORIES.indexOf('timber_tree');

    expect(icons[herbIndex]?.props.color).toBe('#1a4a2e');
    expect(icons[timberIndex]?.props.color).toBe('#4a3828');
    TestRenderer.act(() => pills[timberIndex]?.props.onPress?.());
    expect(onCategoryChange).toHaveBeenCalledWith('timber_tree');
  });
});
