/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the strip's cells. */
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
  useTheme: () => ({
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'error',
    textTertiary: 'textTertiary',
  }),
}));
jest.mock('@/styles/statStripStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { StatStrip, type StatStripItem } from '@/components/StatStrip';

interface RenderedNode {
  type: unknown;
  props: {
    children?: unknown;
    style?: unknown;
    color?: string;
    onPress?: () => void;
    accessibilityState?: { selected: boolean };
    accessibilityLabel?: string;
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

describe('StatStrip', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(items: StatStripItem[]): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(<StatStrip items={items} />);
    });
    return rendered;
  }

  const byType = (rendered: RenderedTree, type: string): RenderedNode[] =>
    rendered.root.findAll((n) => n.type === type);

  const textValues = (rendered: RenderedTree): unknown[] =>
    byType(rendered, 'Text').map((n) => n.props.children);

  const flatStyle = (node: RenderedNode | undefined): unknown[] =>
    [node?.props.style].flat().filter(Boolean);

  it('renders value, unit and label for each item', () => {
    const rendered = render([
      { key: 'a', icon: 'basket', value: 3, label: 'Harvests' },
      { key: 'b', icon: 'scale', value: 2.5, unit: 'kg', label: 'Harvested' },
    ]);
    expect(textValues(rendered)).toEqual([3, 'Harvests', 2.5, 'kg', 'Harvested']);
  });

  it('shows display in place of the value and drops the unit', () => {
    const rendered = render([
      { key: 'h', icon: 'basket', value: 0, display: '—', unit: 'pcs', label: 'Harvest' },
    ]);
    expect(textValues(rendered)).toEqual(['—', 'Harvest']);
    const value = byType(rendered, 'Text')[0];
    expect(flatStyle(value)).toContain('valueMuted');
    expect(
      byType(rendered, 'View').find((n) => n.props.accessibilityLabel)?.props.accessibilityLabel
    ).toBe('Harvest: none');
  });

  it('is pressable only when onPress is given', () => {
    const onPress = jest.fn();
    const rendered = render([
      { key: 'a', icon: 'basket', value: 1, label: 'Harvests', onPress },
      { key: 'b', icon: 'bug', value: 1, label: 'Open issues' },
    ]);
    const buttons = byType(rendered, 'TouchableOpacity');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.props.accessibilityLabel).toBe('1 Harvests');
    TestRenderer.act(() => buttons[0]?.props.onPress?.());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('mutes a zero value and tints a non-zero one', () => {
    const rendered = render([
      { key: 'zero', icon: 'bug', value: 0, label: 'Open issues', tone: 'error' },
      { key: 'some', icon: 'bug', value: 2, label: 'Open issues', tone: 'error' },
    ]);
    const icons = byType(rendered, 'Ionicons');
    expect(icons.map((n) => n.props.color)).toEqual(['textTertiary', 'error']);

    const values = byType(rendered, 'Text').filter((n) => typeof n.props.children === 'number');
    expect(flatStyle(values[0])).toContain('valueMuted');
    expect(flatStyle(values[1])).toContain('valueError');
  });

  it('marks the selected cell', () => {
    const rendered = render([
      { key: 'a', icon: 'basket', value: 1, label: 'Harvests', selected: true, onPress: jest.fn() },
      { key: 'b', icon: 'bug', value: 1, label: 'Open issues', onPress: jest.fn() },
    ]);
    const [selected, plain] = byType(rendered, 'TouchableOpacity');
    expect(flatStyle(selected)).toContain('cellSelected');
    expect(selected?.props.accessibilityState).toEqual({ selected: true });
    expect(flatStyle(plain)).not.toContain('cellSelected');
    expect(plain?.props.accessibilityState).toEqual({ selected: false });
  });
});
