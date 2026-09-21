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
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
});
jest.mock('@/components/SheetHandle', () => ({ SheetHandle: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/referenceBrowseStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { ReferenceFilterSheet } from '@/components/reference/ReferenceFilterSheet';
import type { FacetSection } from '@/components/reference/ReferenceFilterSheet';

interface RenderedNode {
  type: unknown;
  props: {
    accessibilityHint?: string;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean };
    onPress?: () => void;
  };
  /** Rendered children, as react-test-renderer exposes them. */
  children?: unknown[];
}

interface RenderedTree {
  root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

function sections(over: Partial<FacetSection> = {}): FacetSection[] {
  return [
    {
      key: 'category',
      title: 'Category',
      icon: 'apps',
      selected: 'all',
      onSelect: jest.fn(),
      options: [
        { value: 'all', label: 'All', hint: 'Everything', icon: 'layers-outline', count: 7 },
        { value: 'mites', label: 'Mites', hint: 'Mites only', icon: 'bug', count: 0 },
      ],
      ...over,
    },
    {
      key: 'mode',
      title: 'Group By',
      icon: 'layers',
      selected: 'category',
      onSelect: jest.fn(),
      // No counts — a grouping does not narrow the list.
      options: [
        { value: 'category', label: 'Category', hint: 'By category', icon: 'apps' },
        { value: 'alpha', label: 'A–Z', hint: 'By letter', icon: 'text' },
      ],
    },
  ];
}

/**
 * Only the host nodes. The `react-native` mock renders each control as a
 * function component wrapping a string host element, so an unfiltered
 * `findAll` reports every chip twice.
 */
const chipsOf = (tree: RenderedTree): RenderedNode[] =>
  tree.root.findAll(
    (node) => node.type === 'TouchableOpacity' && node.props.accessibilityHint !== undefined
  );

/** Throws rather than returning undefined, so a missing chip fails loudly. */
function byLabel(tree: RenderedTree, label: string): RenderedNode {
  const found = tree.root.findAll(
    (node) => typeof node.type === 'string' && node.props.accessibilityLabel === label
  );
  const node = found[0];
  if (!node) throw new Error(`no node labelled "${label}"`);
  return node;
}

/**
 * The text a node renders, gathered from the rendered tree rather than from
 * `props.children` — those hold React elements, whose fiber back-references
 * make them impossible to serialise.
 */
function textOf(node: RenderedNode): string {
  const parts: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string' || typeof value === 'number') {
      parts.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object' && 'children' in value) {
      walk((value as { children?: unknown }).children);
    }
  };
  walk(node.children);
  return parts.join('');
}

describe('ReferenceFilterSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(over: Partial<React.ComponentProps<typeof ReferenceFilterSheet>> = {}): {
    tree: RenderedTree;
    props: React.ComponentProps<typeof ReferenceFilterSheet>;
  } {
    const props = {
      title: 'Filter pests',
      sections: sections(),
      isDefault: true,
      onReset: jest.fn(),
      onClose: jest.fn(),
      ...over,
    };
    let tree!: RenderedTree;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<ReferenceFilterSheet {...props} />);
    });
    return { tree, props };
  }

  it('renders a chip per option across every section', () => {
    const { tree } = render();
    expect(chipsOf(tree).map((c) => c.props.accessibilityLabel)).toEqual([
      'All',
      'Mites',
      'Category',
      'A–Z',
    ]);
  });

  it('marks only the selected chip in each section', () => {
    const { tree } = render();
    const selected = chipsOf(tree)
      .filter((c) => c.props.accessibilityState?.selected)
      .map((c) => c.props.accessibilityLabel);
    expect(selected).toEqual(['All', 'Category']);
  });

  it('shows a zero count rather than hiding the chip', () => {
    const { tree } = render();
    expect(textOf(byLabel(tree, 'Mites'))).toContain('(0)');
  });

  it('reports the choice and closes, so a category change stays at three taps', () => {
    const [categorySection, ...rest] = sections();
    const { tree, props } = render({ sections: [categorySection!, ...rest] });
    TestRenderer.act(() => byLabel(tree, 'Mites').props.onPress?.());
    expect(categorySection!.onSelect).toHaveBeenCalledWith('mites');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('hides Reset while every facet sits at its default', () => {
    const { tree } = render({ isDefault: true });
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === 'Reset filters')).toHaveLength(
      0
    );
  });

  it('offers Reset once something is off default, and closes after resetting', () => {
    const { tree, props } = render({ isDefault: false });
    TestRenderer.act(() => byLabel(tree, 'Reset filters').props.onPress?.());
    expect(props.onReset).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });
});
