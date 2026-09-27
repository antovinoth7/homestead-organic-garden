/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary; the horizontal FlatList renders every item eagerly. */
/* eslint-disable import/first */
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
    FlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: string[];
      renderItem: (info: { item: string; index: number }) => React.ReactElement;
      keyExtractor: (item: string) => string;
    }) =>
      React.createElement(
        'FlatList',
        null,
        data.map((item, index) =>
          React.createElement(React.Fragment, { key: keyExtractor(item) }, renderItem({ item, index }))
        )
      ),
  };
});
jest.mock('react-native-svg', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    __esModule: true,
    default: host('Svg'),
    Defs: host('Defs'),
    LinearGradient: host('LinearGradient'),
    Stop: host('Stop'),
    Rect: host('Rect'),
  };
});
jest.mock('@/theme', () => ({ useTheme: () => ({ scrim: 'scrimGreen' }) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return function Ionicons(props: Record<string, unknown>) {
    return React.createElement('Ionicons', props);
  };
});
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/components/ReferenceThumb', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    ReferenceThumb: (props: Record<string, unknown>) =>
      React.createElement('ReferenceThumb', props),
  };
});
jest.mock('@/components/FloatingLabelInput', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return function FloatingLabelInput(props: Record<string, unknown>) {
    return React.createElement('FloatingLabelInput', props);
  };
});
jest.mock('@/components/forms/JournalMoreDetails', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    JournalMoreDetails: () => React.createElement('JournalMoreDetails'),
  };
});
jest.mock('@/config/referenceAssets', () => ({
  getPestImage: (id: string) => ({ testUri: id }),
  getDiseaseImage: (id: string) => ({ testUri: id }),
}));
jest.mock('@/styles/journalFormStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import {
  JournalPestDiseaseSection,
  type PestDiseaseFields,
} from '@/components/forms/JournalPestDiseaseSection';
import { getDefaultGroupedPests } from '@/utils/plantHelpers';
import { flattenSuggestionGroups } from '@/utils/journalEntryOptions';

interface RenderedNode {
  props: {
    onPress?: () => void;
    accessibilityLabel?: string;
    style?: unknown;
    children?: unknown;
    stopColor?: string;
  };
}

interface RenderedTree {
  root: {
    findAllByType: (type: string) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const baseValue: PestDiseaseFields = {
  kind: 'pest',
  name: '',
  severity: 'medium',
  status: 'active',
  occurredAt: '2026-09-27',
  affectedParts: [],
  treatment: '',
  treatmentEffectiveness: null,
};

function render(value: PestDiseaseFields, onChange = jest.fn()): RenderedTree {
  let tree!: RenderedTree;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <JournalPestDiseaseSection
        value={value}
        onChange={onChange}
        plantType={null}
        plantVariety={null}
      />
    );
  });
  return tree;
}

function tiles(tree: RenderedTree): RenderedNode[] {
  return tree.root
    .findAllByType('TouchableOpacity')
    .filter((node) => node.props.style === 'suggestionTile');
}

describe('JournalPestDiseaseSection suggestions', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // react-test-renderer logs its own deprecation notice on every create.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  it('renders one ungrouped tile per default pest when no plant is linked', () => {
    const tree = render(baseValue);
    const expected = flattenSuggestionGroups(getDefaultGroupedPests());

    expect(expected.length).toBeGreaterThan(0);
    expect(tiles(tree).map((tile) => tile.props.accessibilityLabel)).toEqual(expected);
    expect(
      tree.root.findAllByType('Text').filter((n) => n.props.style === 'suggestionGroupLabel')
    ).toHaveLength(0);
    expect(tree.root.findAllByType('ReferenceThumb')[0]?.props).toMatchObject({
      variant: 'square',
    });
  });

  it('lays each name over a theme-green scrim on its photo', () => {
    const tree = render(baseValue);
    const count = tiles(tree).length;
    const names = tree.root
      .findAllByType('Text')
      .filter((n) => n.props.style === 'suggestionTileName')
      .map((n) => n.props.children);

    expect(tree.root.findAllByType('ReferenceThumb')).toHaveLength(count);
    expect(tree.root.findAllByType('Svg')).toHaveLength(count);
    expect(names).toEqual(tiles(tree).map((tile) => tile.props.accessibilityLabel));
    expect(
      tree.root.findAllByType('Stop').every((stop) => stop.props.stopColor === 'scrimGreen')
    ).toBe(true);
  });

  it('fills the name when a tile is pressed', () => {
    const onChange = jest.fn();
    const tree = render(baseValue, onChange);
    const first = tiles(tree)[0];

    TestRenderer.act(() => first?.props.onPress?.());

    expect(onChange).toHaveBeenCalledWith({ name: first?.props.accessibilityLabel });
  });

  it('hides the row once the name is an exact preset', () => {
    const [firstName] = flattenSuggestionGroups(getDefaultGroupedPests());
    const tree = render({ ...baseValue, name: firstName ?? '' });

    expect(tiles(tree)).toHaveLength(0);
    expect(tree.root.findAllByType('FlatList')).toHaveLength(0);
  });
});
