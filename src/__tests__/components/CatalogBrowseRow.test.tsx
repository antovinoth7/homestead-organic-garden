/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the browse row's layout, press handler and labels. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    Pressable: function Pressable({
      children,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      style?: unknown;
    }) {
      // Resolve the pressed-state style function so the unpressed branch renders.
      const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
      return React.createElement('Pressable', { ...props, style: resolved }, children);
    },
    Text: host('Text'),
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
jest.mock('@/components/ReferenceThumb', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    ReferenceThumb: (props: Record<string, unknown>) =>
      React.createElement('ReferenceThumb', props),
  };
});
jest.mock('@/config/referenceAssets', () => ({ getPlantImage: () => undefined }));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#1a4a2e', textTertiary: '#645242' }),
}));
jest.mock('@/styles/managePlantCatalogStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_t, property) => String(property) }),
}));

const tapFeedback = jest.fn();
jest.mock('@/utils/haptics', () => ({ tapFeedback: () => tapFeedback() }));

import React from 'react';
import { CatalogBrowseRow } from '@/components/catalog/CatalogBrowseRow';

interface RenderedNode {
  type: unknown;
  props: { accessibilityLabel?: string; onPress?: () => void; children?: unknown };
}

interface RenderedTree {
  root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
  toJSON: () => unknown;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

describe('CatalogBrowseRow', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  beforeEach(() => tapFeedback.mockClear());

  function render(overrides: Record<string, unknown> = {}, onPress = jest.fn()): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <CatalogBrowseRow
          plantName="Bitter Gourd"
          plantType="vegetable"
          habit="vine"
          count={2}
          subtitle="55–70 days"
          isFirst
          isLast
          onPress={onPress}
          {...overrides}
        />
      );
    });
    return rendered;
  }

  const row = (tree: RenderedTree): RenderedNode =>
    tree.root.findAll((node) => node.type === 'Pressable')[0]!;

  it('renders the Tamil name beside the English one', () => {
    const json = JSON.stringify(render({ tamilName: 'பாகற்காய்' }).toJSON());
    expect(json).toContain('Bitter Gourd');
    expect(json).toContain('பாகற்காய்');
  });

  it('omits the Tamil node entirely when there is none', () => {
    const json = JSON.stringify(render().toJSON());
    expect(json).toContain('Bitter Gourd');
    expect(json).not.toContain('plantTamil');
  });

  // Without one label the row reads as four disconnected fragments.
  it('announces name, Tamil name, meta and count as one label', () => {
    const label = row(render({ tamilName: 'பாகற்காய்' })).props.accessibilityLabel ?? '';
    expect(label).toContain('Bitter Gourd');
    expect(label).toContain('பாகற்காய்');
    expect(label).toContain('55–70 days');
    expect(label).toContain('2 in your garden');
  });

  it('leaves the count out of the label when nothing is planted', () => {
    const label = row(render({ count: 0 })).props.accessibilityLabel ?? '';
    expect(label).not.toContain('in your garden');
  });

  it('fires a haptic and reports the row own type on press', () => {
    const onPress = jest.fn();
    row(render({ plantType: 'spinach' }, onPress)).props.onPress?.();

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith('Bitter Gourd', 'spinach');
  });
});
