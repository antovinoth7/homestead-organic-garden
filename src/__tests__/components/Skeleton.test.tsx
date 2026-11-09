/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary, plus an `Animated` whose loop it can watch. */
/* eslint-disable import/first */
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockSetValue = jest.fn();
const mockLoop = jest.fn(() => ({ start: mockStart, stop: mockStop }));
const mockReduceMotion = jest.fn<Promise<boolean>, []>(async () => false);

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  class Value {
    setValue = mockSetValue;
  }
  return {
    View: host('View'),
    Animated: {
      View: host('AnimatedView'),
      Value,
      loop: mockLoop,
      sequence: jest.fn(() => ({})),
      timing: jest.fn(() => ({})),
    },
    AccessibilityInfo: { isReduceMotionEnabled: mockReduceMotion },
  };
});
jest.mock('@/theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/styles/skeletonStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { Skeleton, SkeletonBlock, SkeletonCards, SkeletonList } from '@/components/skeleton';

interface RenderedNode {
  type: unknown;
  props: { accessibilityRole?: string; accessibilityLabel?: string; style?: unknown };
}

interface RenderedTree {
  root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
  unmount: () => void;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => Promise<void> | void) => Promise<void>;
};

/** Every host node whose style is (or contains) the given style key. */
const withStyle = (tree: RenderedTree, key: string): RenderedNode[] =>
  tree.root.findAll((node) => {
    if (typeof node.type !== 'string') return false;
    const style = node.props.style;
    return Array.isArray(style) ? style.flat().includes(key) : style === key;
  });

const progressBars = (tree: RenderedTree): RenderedNode[] =>
  tree.root.findAll(
    (node) => typeof node.type === 'string' && node.props.accessibilityRole === 'progressbar'
  );

async function render(element: React.ReactElement): Promise<RenderedTree> {
  let tree: RenderedTree | undefined;
  // Async act flushes the reduce-motion promise, so the loop decision lands.
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(element);
  });
  if (!tree) throw new Error('render failed');
  return tree;
}

let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  // react-test-renderer logs a deprecation notice on every create.
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => consoleErrorSpy.mockRestore());

describe('Skeleton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReduceMotion.mockImplementation(async () => false);
  });

  it('announces itself as a progress bar with its label', async () => {
    const tree = await render(
      <Skeleton label="Loading plants">
        <SkeletonBlock />
      </Skeleton>
    );
    const bars = progressBars(tree);
    expect(bars).toHaveLength(1);
    expect(bars[0]!.props.accessibilityLabel).toBe('Loading plants');
  });

  it('starts one pulse loop and stops it on unmount', async () => {
    const tree = await render(
      <Skeleton label="Loading">
        <SkeletonBlock />
        <SkeletonBlock />
      </Skeleton>
    );
    expect(mockLoop).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(1);

    await TestRenderer.act(() => tree.unmount());
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it('holds the pulse still when the OS asks to reduce motion', async () => {
    mockReduceMotion.mockImplementation(async () => true);
    await render(
      <Skeleton label="Loading">
        <SkeletonBlock />
      </Skeleton>
    );
    expect(mockLoop).not.toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(0.7);
  });

  it('shares the outer pulse and announcement when nested', async () => {
    const tree = await render(
      <Skeleton label="Loading your farm">
        <SkeletonCards label="Loading plots" />
        <SkeletonList label="Loading jobs" count={2} />
      </Skeleton>
    );
    const bars = progressBars(tree);
    expect(bars).toHaveLength(1);
    expect(bars[0]!.props.accessibilityLabel).toBe('Loading your farm');
    expect(mockLoop).toHaveBeenCalledTimes(1);
  });
});

describe('SkeletonList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReduceMotion.mockImplementation(async () => false);
  });

  it('draws the requested number of rows, each with a thumb', async () => {
    const tree = await render(<SkeletonList label="Loading plants" count={5} />);
    expect(withStyle(tree, 'row')).toHaveLength(5);
    expect(withStyle(tree, 'thumbSquare')).toHaveLength(5);
  });

  it('omits the thumb when asked', async () => {
    const tree = await render(<SkeletonList label="Loading history" count={3} thumb="none" />);
    expect(withStyle(tree, 'row')).toHaveLength(3);
    expect(withStyle(tree, 'thumbSquare')).toHaveLength(0);
    expect(withStyle(tree, 'thumbRound')).toHaveLength(0);
  });
});
