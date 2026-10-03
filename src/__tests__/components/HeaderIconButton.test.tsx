/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the button's static layout and press handler. */
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
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
});
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#1a4a2e', textInverse: '#fff' }),
}));
jest.mock('@/styles/headerActionStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { HeaderIconButton } from '@/components/header/HeaderIconButton';

interface RenderedNode {
  type: unknown;
  props: {
    accessibilityLabel?: string;
    accessibilityRole?: string;
    color?: string;
    onPress?: () => void;
    style?: unknown;
  };
  children?: unknown[];
}

interface RenderedTree {
  root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

/** Whether any node in the tree carries the given style key. */
const hasStyle = (tree: RenderedTree, key: string): boolean =>
  tree.root.findAll((node) => {
    const style = node.props.style;
    return Array.isArray(style) ? style.includes(key) : style === key;
  }).length > 0;

const button = (tree: RenderedTree): RenderedNode => {
  const node = tree.root.findAll((n) => n.type === 'TouchableOpacity')[0];
  if (!node) throw new Error('no button rendered');
  return node;
};

const icon = (tree: RenderedTree): RenderedNode => {
  const node = tree.root.findAll((n) => n.type === 'Ionicons')[0];
  if (!node) throw new Error('no icon rendered');
  return node;
};

describe('HeaderIconButton', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(over: Partial<React.ComponentProps<typeof HeaderIconButton>> = {}): {
    tree: RenderedTree;
    props: React.ComponentProps<typeof HeaderIconButton>;
  } {
    const props: React.ComponentProps<typeof HeaderIconButton> = {
      icon: 'funnel',
      onPress: jest.fn(),
      accessibilityLabel: 'Filter beds',
      ...over,
    };
    let tree!: RenderedTree;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<HeaderIconButton {...props} />);
    });
    return { tree, props };
  }

  it('is a labelled button that fires onPress', () => {
    const { tree, props } = render();
    expect(button(tree).props.accessibilityRole).toBe('button');
    expect(button(tree).props.accessibilityLabel).toBe('Filter beds');
    TestRenderer.act(() => button(tree).props.onPress?.());
    expect(props.onPress).toHaveBeenCalledTimes(1);
  });

  it('is a filled circle with an inverse icon at rest', () => {
    const { tree } = render();
    expect(hasStyle(tree, 'iconBtn')).toBe(true);
    expect(hasStyle(tree, 'iconBtnActive')).toBe(false);
    expect(icon(tree).props.color).toBe('#fff');
  });

  it('switches fill and icon colour only while its panel is open', () => {
    const { tree } = render({ active: true });
    expect(hasStyle(tree, 'iconBtnActive')).toBe(true);
    expect(icon(tree).props.color).toBe('#1a4a2e');
  });

  it('badges the facet count and speaks it', () => {
    const { tree } = render({ badgeCount: 2 });
    expect(hasStyle(tree, 'badge')).toBe(true);
    expect(button(tree).props.accessibilityLabel).toBe('Filter beds, 2 active');
    // Applied filters do not recolour the button — that is the badge's job.
    expect(hasStyle(tree, 'iconBtnActive')).toBe(false);
  });

  it('drops the badge while the panel is open, since the facets are on screen', () => {
    expect(hasStyle(render({ badgeCount: 2, active: true }).tree, 'badge')).toBe(false);
  });

  it('hides the badge at zero', () => {
    expect(hasStyle(render({ badgeCount: 0 }).tree, 'badge')).toBe(false);
  });

  it('shows the query dot on request', () => {
    expect(hasStyle(render({ icon: 'search', showDot: true }).tree, 'dot')).toBe(true);
    expect(hasStyle(render({ icon: 'search' }).tree, 'dot')).toBe(false);
  });
});
