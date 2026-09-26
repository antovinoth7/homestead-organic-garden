/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * host boundary for the SVG glyphs and switches Platform.OS per case. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
const mockPlatform = { OS: 'android' };
jest.mock('react-native', () => ({ Platform: mockPlatform }));
jest.mock('@expo/vector-icons/Ionicons', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('react-native-svg', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    __esModule: true,
    default: host('Svg'),
    Circle: host('Circle'),
    Line: host('Line'),
    Path: host('Path'),
    Rect: host('Rect'),
  };
});

import React from 'react';
import { GardenIcon } from '@/components/GardenIcon';
import type { VisualIconKey } from '@/types/visual.types';

interface RenderedNode {
  type: unknown;
  props: Record<string, unknown>;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => {
    root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
  };
  act: (callback: () => void) => void;
};

function svgProps(name: VisualIconKey, accessibilityLabel?: string): Record<string, unknown> {
  let rendered: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      <GardenIcon name={name} size={14} color="#000" accessibilityLabel={accessibilityLabel} />
    );
  });
  const svg = rendered?.root.findAll((node) => node.type === 'Svg')[0];
  if (!svg) throw new Error('no Svg rendered');
  return svg.props;
}

const rnKeys = (props: Record<string, unknown>) =>
  Object.keys(props).filter((key) => key.startsWith('accessibility'));

const GLYPHS: VisualIconKey[] = ['plant.vegetable', 'bed.leafy'];

describe('GardenIcon glyph accessibility', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(() => {
    mockPlatform.OS = 'android';
  });

  it.each(GLYPHS)('%s: web gets DOM attributes, never RN accessibility props', (name) => {
    mockPlatform.OS = 'web';
    // react-native-svg forwards these onto the DOM <svg>, where React rejects RN names.
    const labelled = svgProps(name, 'Fruits');
    expect(labelled).toMatchObject({ role: 'img', 'aria-label': 'Fruits' });
    expect(rnKeys(labelled)).toEqual([]);

    const decorative = svgProps(name);
    expect(decorative).toMatchObject({ 'aria-hidden': true });
    expect(rnKeys(decorative)).toEqual([]);
  });

  it.each(GLYPHS)('%s: native keeps the RN accessibility props', (name) => {
    expect(svgProps(name, 'Fruits')).toMatchObject({
      accessibilityRole: 'image',
      accessibilityLabel: 'Fruits',
      accessibilityElementsHidden: false,
    });
    expect(svgProps(name)).toMatchObject({ accessibilityElementsHidden: true });
  });
});
