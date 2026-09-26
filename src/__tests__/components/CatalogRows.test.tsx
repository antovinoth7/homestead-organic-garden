/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the catalog detail rows. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
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
jest.mock('@expo/vector-icons/Ionicons', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/styles/catalogRowStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));
jest.mock('@/components/FieldHelp', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('FieldHelp', props),
  };
});
jest.mock('@/components/FieldErrorText', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/GardenIcon', () => ({ GardenIcon: () => null }));

import React from 'react';
import { CatalogDetailRow } from '@/components/catalog/CatalogDetailRow';
import { CatalogRangeRow } from '@/components/catalog/CatalogRangeRow';

interface RenderedNode {
  type: unknown;
  props: { onPress?: () => void; style?: unknown };
  parent: RenderedNode | null;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => {
    root: { findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[] };
  };
  act: (callback: () => void) => void;
};

function renderRow(element: React.ReactElement) {
  let rendered: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(element);
  });
  if (!rendered) throw new Error('not rendered');
  return rendered;
}

/** Web renders each target as a <button>; one inside another is invalid HTML. */
function expectNoTouchableAncestor(node: RenderedNode): void {
  for (let parent = node.parent; parent; parent = parent.parent) {
    expect(parent.type).not.toBe('TouchableOpacity');
  }
}

describe('catalog rows keep FieldHelp out of the row button', () => {
  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it.each([
    [
      'CatalogDetailRow',
      (onPress: () => void) => (
        <CatalogDetailRow
          label="Spacing"
          value="60 cm"
          kind="picker"
          helpText="Distance between plants"
          onPress={onPress}
        />
      ),
    ],
    [
      'CatalogRangeRow',
      (onPress: () => void) => (
        <CatalogRangeRow
          label="Temperature"
          min="20"
          max="35"
          unit="°C"
          helpText="Comfortable range"
          onPress={onPress}
        />
      ),
    ],
  ])('%s: the help and the row are sibling targets', (_name, build) => {
    const onPress = jest.fn();
    const rendered = renderRow(build(onPress));

    const help = rendered.root.findAll((node) => node.type === 'FieldHelp');
    expect(help).toHaveLength(1);
    expectNoTouchableAncestor(help[0]!);

    const targets = rendered.root.findAll((node) => node.type === 'TouchableOpacity');
    expect(targets).toHaveLength(1);
    expect(targets[0]?.props.style).toBe('rowTarget');
    TestRenderer.act(() => {
      targets[0]?.props.onPress?.();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws no row target on a read-only badge row', () => {
    const rendered = renderRow(
      <CatalogDetailRow label="Status" value="Active" kind="badge" helpText="Read only" />
    );
    expect(rendered.root.findAll((node) => node.type === 'TouchableOpacity')).toHaveLength(0);
  });
});
