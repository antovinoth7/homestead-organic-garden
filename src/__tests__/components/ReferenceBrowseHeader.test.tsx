/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the header's static layout and press handlers. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    Text: host('Text'),
    TextInput: host('TextInput'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props) };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textInverse: '#fff', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/referenceBrowseStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { ReferenceBrowseHeader } from '@/components/reference/ReferenceBrowseHeader';

interface RenderedNode {
  type: unknown;
  props: { accessibilityLabel?: string; onPress?: () => void; style?: unknown };
  children?: unknown[];
}

interface RenderedTree {
  root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

/** Host nodes only — each control is a function component wrapping a host. */
const hosts = (tree: RenderedTree, label: string): RenderedNode[] =>
  tree.root.findAll(
    (node) => typeof node.type === 'string' && node.props.accessibilityLabel === label
  );

function byLabel(tree: RenderedTree, label: string): RenderedNode {
  const node = hosts(tree, label)[0];
  if (!node) throw new Error(`no node labelled "${label}"`);
  return node;
}

/** Whether any node in the tree carries the given style key. */
const hasStyle = (tree: RenderedTree, key: string): boolean =>
  tree.root.findAll((node) => {
    const style = node.props.style;
    return Array.isArray(style) ? style.includes(key) : style === key;
  }).length > 0;

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

describe('ReferenceBrowseHeader', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(
    over: Partial<React.ComponentProps<typeof ReferenceBrowseHeader>> = {}
  ): { tree: RenderedTree; props: React.ComponentProps<typeof ReferenceBrowseHeader> } {
    const props = {
      title: 'Pests',
      subtitle: '36 in the High Rainfall Zone',
      searchPlaceholder: 'What are you seeing?',
      searchAccessibilityLabel: 'Search pests',
      query: '',
      searchActive: false,
      showFilters: false,
      activeFilterCount: 0,
      onQueryChange: jest.fn(),
      onClearQuery: jest.fn(),
      onOpenSearch: jest.fn(),
      onCloseSearch: jest.fn(),
      onToggleFilters: jest.fn(),
      onBack: jest.fn(),
      ...over,
    };
    let tree!: RenderedTree;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<ReferenceBrowseHeader {...props} />);
    });
    return { tree, props };
  }

  it('shows the title, subtitle and both actions while collapsed', () => {
    const { tree } = render();
    expect(hasStyle(tree, 'title')).toBe(true);
    expect(hasStyle(tree, 'subtitle')).toBe(true);
    expect(hosts(tree, 'Search pests')).toHaveLength(1);
    expect(hosts(tree, 'Filter pests')).toHaveLength(1);
    // The field itself is not mounted until search is opened.
    expect(hasStyle(tree, 'searchBar')).toBe(false);
  });

  it('opens search rather than filtering when the magnifier is pressed', () => {
    const { tree, props } = render();
    TestRenderer.act(() => byLabel(tree, 'Search pests').props.onPress?.());
    expect(props.onOpenSearch).toHaveBeenCalled();
    expect(props.onToggleFilters).not.toHaveBeenCalled();
  });

  it('replaces the title row with the field once search is open', () => {
    const { tree } = render({ searchActive: true });
    expect(hasStyle(tree, 'searchBar')).toBe(true);
    expect(hasStyle(tree, 'title')).toBe(false);
    expect(hosts(tree, 'Close search')).toHaveLength(1);
  });

  it('marks a query still in force behind a collapsed bar', () => {
    expect(hasStyle(render({ query: 'aphid' }).tree, 'headerActiveDot')).toBe(true);
    expect(hasStyle(render({ query: '' }).tree, 'headerActiveDot')).toBe(false);
    // Whitespace alone is not a query worth flagging.
    expect(hasStyle(render({ query: '   ' }).tree, 'headerActiveDot')).toBe(false);
  });

  it('badges how many facets are off default', () => {
    const { tree } = render({ activeFilterCount: 3 });
    expect(textOf(byLabel(tree, 'Filter pests'))).toContain('3');
  });

  it('drops the badge while the sheet is open, since the facets are on screen', () => {
    const { tree } = render({ activeFilterCount: 3, showFilters: true });
    expect(hasStyle(tree, 'filterBadge')).toBe(false);
  });

  it('offers no clear button until something is typed', () => {
    expect(hosts(render({ searchActive: true }).tree, 'Clear search')).toHaveLength(0);
    expect(
      hosts(render({ searchActive: true, query: 'aphid' }).tree, 'Clear search')
    ).toHaveLength(1);
  });
});
