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
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
});
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/config/plants/catalogTaxonomy', () => ({
  CATALOG_GROUP_ORDER: [
    'vegetables',
    'greens',
    'fruits',
    'spices',
    'herbs_medicinal',
    'flowers',
    'farm_support',
    'plantation_timber',
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
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_ICON_KEYS } from '@/config/iconRegistry';
import type { CatalogGroup } from '@/types/database.types';

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
  toJSON: () => unknown;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const counts = Object.fromEntries(
  CATALOG_GROUP_ORDER.map((group, index) => [group, index + 1])
) as Record<CatalogGroup, number>;

describe('PlantCategoryTabs icons', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(onGroupChange = jest.fn()): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <PlantCategoryTabs
          activeGroup="herbs_medicinal"
          groupCounts={counts}
          onGroupChange={onGroupChange}
        />
      );
    });
    return rendered;
  }

  it('leads with a Sow Now pill before the groups', () => {
    const rendered = render();
    const pills = rendered.root.findAll((node) => node.type === 'TouchableOpacity');
    expect(pills).toHaveLength(CATALOG_GROUP_ORDER.length + 1);
    expect(JSON.stringify(rendered.toJSON())).toContain('Sow Now');
  });

  it('reports the sow-now selection separately from a group', () => {
    const onGroupChange = jest.fn();
    const rendered = render(onGroupChange);
    const pills = rendered.root.findAll((node) => node.type === 'TouchableOpacity');
    TestRenderer.act(() => pills[0]?.props.onPress?.());
    expect(onGroupChange).toHaveBeenCalledWith('sow_now');
  });

  it('renders a 14 px semantic icon for every browse group in pill order', () => {
    // GardenIcon is the group artwork; Sow Now uses an Ionicon, so it is absent.
    const icons = render().root.findAll((node) => node.type === 'GardenIcon');

    expect(icons).toHaveLength(8);
    expect(icons.map((node) => node.props.name)).toEqual(
      CATALOG_GROUP_ORDER.map((group) => CATALOG_GROUP_ICON_KEYS[group])
    );
    expect(icons.map((node) => node.props.size)).toEqual(CATALOG_GROUP_ORDER.map(() => 14));
  });

  it('uses the selected color and reports the group that was pressed', () => {
    const onGroupChange = jest.fn();
    const rendered = render(onGroupChange);
    const icons = rendered.root.findAll((node) => node.type === 'GardenIcon');
    const pills = rendered.root.findAll((node) => node.type === 'TouchableOpacity');
    const activeIndex = CATALOG_GROUP_ORDER.indexOf('herbs_medicinal');
    const otherIndex = CATALOG_GROUP_ORDER.indexOf('plantation_timber');

    expect(icons[activeIndex]?.props.color).toBe('#1a4a2e');
    expect(icons[otherIndex]?.props.color).toBe('#4a3828');
    // Sow Now occupies pills[0], so a group's pill sits one further along.
    TestRenderer.act(() => pills[otherIndex + 1]?.props.onPress?.());
    expect(onGroupChange).toHaveBeenCalledWith('plantation_timber');
  });
});
