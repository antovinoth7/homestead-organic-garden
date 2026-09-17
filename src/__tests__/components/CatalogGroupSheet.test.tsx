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
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
    StyleSheet: { absoluteFill: {} },
  };
});
jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return { Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props) };
});
jest.mock('@/components/SheetHandle', () => ({ SheetHandle: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textSecondary: '#4a3828' }),
}));
jest.mock('@/styles/managePlantCatalogStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { CatalogGroupSheet } from '@/components/catalog/CatalogGroupSheet';
import {
  CATALOG_GROUP_MODES,
  DEFAULT_CATALOG_GROUP_MODE,
} from '@/components/catalog/catalogGroupModes';
import type { CatalogGroupMode } from '@/utils/catalogListItems';

interface RenderedNode {
  type: unknown;
  props: {
    accessibilityHint?: string;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean };
    onPress?: () => void;
    style?: unknown;
  };
}

interface RenderedTree {
  toJSON: () => unknown;
  root: {
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

describe('CatalogGroupSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(
    mode: CatalogGroupMode = DEFAULT_CATALOG_GROUP_MODE,
    onChange = jest.fn(),
    onClose = jest.fn()
  ): { rendered: RenderedTree; onChange: jest.Mock; onClose: jest.Mock } {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <CatalogGroupSheet mode={mode} onChange={onChange} onClose={onClose} />
      );
    });
    return { rendered, onChange, onClose };
  }

  /** The mode chips, which are the only pressables carrying a selected state. */
  function chipsOf(rendered: RenderedTree): RenderedNode[] {
    return rendered.root.findAll(
      (node) => node.type === 'TouchableOpacity' && node.props.accessibilityState !== undefined
    );
  }

  it('offers one chip per grouping mode', () => {
    const chips = chipsOf(render().rendered);

    expect(chips).toHaveLength(CATALOG_GROUP_MODES.length);
    expect(chips.map((chip) => chip.props.accessibilityLabel)).toEqual(
      CATALOG_GROUP_MODES.map((entry) => entry.label)
    );
  });

  it('marks only the active mode as selected', () => {
    const chips = chipsOf(render('season').rendered);
    const selected = chips
      .filter((chip) => chip.props.accessibilityState?.selected)
      .map((chip) => chip.props.accessibilityLabel);

    expect(selected).toEqual(['Season']);
  });

  it('still announces each mode hint, which the chip has no room to show', () => {
    const chips = chipsOf(render().rendered);

    expect(chips.map((chip) => chip.props.accessibilityHint)).toEqual(
      CATALOG_GROUP_MODES.map((entry) => entry.hint)
    );
  });

  it('reports the chosen mode and closes', () => {
    const { rendered, onChange, onClose } = render();
    const alpha = chipsOf(rendered).find((chip) => chip.props.accessibilityLabel === 'A–Z');

    TestRenderer.act(() => alpha?.props.onPress?.());

    expect(onChange).toHaveBeenCalledWith('alpha');
    expect(onClose).toHaveBeenCalled();
  });

  it('hides Reset while the grouping is on its default', () => {
    expect(JSON.stringify(render().rendered.toJSON())).not.toContain('Reset');
  });

  it('offers Reset once the grouping has moved off its default', () => {
    const { rendered, onChange, onClose } = render('alpha');
    const resetBtn = rendered.root
      .findAll((node) => node.type === 'TouchableOpacity')
      .find((node) => node.props.accessibilityLabel === 'Reset grouping');

    expect(resetBtn).toBeDefined();

    TestRenderer.act(() => resetBtn?.props.onPress?.());

    expect(onChange).toHaveBeenCalledWith(DEFAULT_CATALOG_GROUP_MODE);
    expect(onClose).toHaveBeenCalled();
  });
});
