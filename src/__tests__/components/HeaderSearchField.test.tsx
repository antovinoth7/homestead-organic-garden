/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the field's static layout and handlers. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    TextInput: host('TextInput'),
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
  useTheme: () => ({ primary: '#1a4a2e', textInverse: '#fff', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/headerActionStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { HeaderSearchField } from '@/components/header/HeaderSearchField';

interface RenderedNode {
  type: unknown;
  props: {
    accessibilityLabel?: string;
    placeholder?: string;
    value?: string;
    onPress?: () => void;
    onChangeText?: (next: string) => void;
    onSubmitEditing?: () => void;
  };
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

describe('HeaderSearchField', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(over: Partial<React.ComponentProps<typeof HeaderSearchField>> = {}): {
    tree: RenderedTree;
    props: React.ComponentProps<typeof HeaderSearchField>;
  } {
    const props: React.ComponentProps<typeof HeaderSearchField> = {
      value: '',
      onChangeText: jest.fn(),
      onClear: jest.fn(),
      onClose: jest.fn(),
      onSubmitEditing: jest.fn(),
      placeholder: 'Search beds...',
      accessibilityLabel: 'Search beds',
      ...over,
    };
    let tree!: RenderedTree;
    TestRenderer.act(() => {
      tree = TestRenderer.create(<HeaderSearchField {...props} />);
    });
    return { tree, props };
  }

  it('labels the field and shows the placeholder', () => {
    const field = byLabel(render().tree, 'Search beds');
    expect(field.type).toBe('TextInput');
    expect(field.props.placeholder).toBe('Search beds...');
  });

  it('passes typing and submit through to the caller', () => {
    const { tree, props } = render();
    const field = byLabel(tree, 'Search beds');
    TestRenderer.act(() => field.props.onChangeText?.('raised'));
    TestRenderer.act(() => field.props.onSubmitEditing?.());
    expect(props.onChangeText).toHaveBeenCalledWith('raised');
    expect(props.onSubmitEditing).toHaveBeenCalled();
  });

  it('collapses through the chevron', () => {
    const { tree, props } = render();
    TestRenderer.act(() => byLabel(tree, 'Close search').props.onPress?.());
    expect(props.onClose).toHaveBeenCalled();
  });

  it('offers a clear button only once something is typed', () => {
    expect(hosts(render().tree, 'Clear search')).toHaveLength(0);
    const { tree, props } = render({ value: 'raised' });
    TestRenderer.act(() => byLabel(tree, 'Clear search').props.onPress?.());
    expect(props.onClear).toHaveBeenCalled();
  });
});
