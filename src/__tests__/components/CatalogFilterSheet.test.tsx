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
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
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
import { CatalogFilterSheet } from '@/components/catalog/CatalogFilterSheet';
import {
  CATALOG_GROUP_MODES,
  DEFAULT_CATALOG_GROUP_MODE,
} from '@/components/catalog/catalogGroupModes';
import { CATALOG_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import { CATALOG_GROUP_LABELS } from '@/utils/plantLabels';
import { ALL_GROUPS } from '@/utils/catalogListItems';
import type { CatalogGroupFilter, CatalogGroupMode } from '@/utils/catalogListItems';

interface RenderedNode {
  type: unknown;
  props: {
    accessibilityHint?: string;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean };
    onPress?: () => void;
    style?: unknown;
  };
  children?: unknown[];
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

/** Counts are arbitrary here; only that they reach the chips matters. */
const COUNTS = CATALOG_GROUP_ORDER.reduce(
  (acc, group, index) => {
    acc[group] = index === 0 ? 0 : index * 3;
    return acc;
  },
  { [ALL_GROUPS]: 42 } as Record<CatalogGroupFilter, number>
);

describe('CatalogFilterSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(
    over: {
      group?: CatalogGroupFilter;
      mode?: CatalogGroupMode;
    } = {}
  ): {
    rendered: RenderedTree;
    onGroupChange: jest.Mock;
    onChange: jest.Mock;
    onClose: jest.Mock;
  } {
    const onGroupChange = jest.fn();
    const onChange = jest.fn();
    const onClose = jest.fn();
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <CatalogFilterSheet
          group={over.group ?? ALL_GROUPS}
          groupCounts={COUNTS}
          onGroupChange={onGroupChange}
          mode={over.mode ?? DEFAULT_CATALOG_GROUP_MODE}
          onChange={onChange}
          onClose={onClose}
        />
      );
    });
    return { rendered, onGroupChange, onChange, onClose };
  }

  /** Every chip in the sheet — the only pressables carrying a selected state. */
  function chipsOf(rendered: RenderedTree): RenderedNode[] {
    return rendered.root.findAll(
      (node) => node.type === 'TouchableOpacity' && node.props.accessibilityState !== undefined
    );
  }

  /**
   * Both sections render chips of the same shape, so they are told apart by
   * position: Category is rendered first, and always All plus every group.
   */
  const CATEGORY_CHIP_COUNT = CATALOG_GROUP_ORDER.length + 1;
  const categoryChipsOf = (rendered: RenderedTree): RenderedNode[] =>
    chipsOf(rendered).slice(0, CATEGORY_CHIP_COUNT);
  const modeChipsOf = (rendered: RenderedTree): RenderedNode[] =>
    chipsOf(rendered).slice(CATEGORY_CHIP_COUNT);

  it('offers an All chip ahead of one chip per category', () => {
    const chips = categoryChipsOf(render().rendered);

    expect(chips.map((chip) => chip.props.accessibilityLabel)).toEqual([
      'All',
      ...CATALOG_GROUP_ORDER.map((group) => CATALOG_GROUP_LABELS[group]),
    ]);
  });

  it('still offers one chip per grouping mode below them', () => {
    const chips = modeChipsOf(render().rendered);

    expect(chips.map((chip) => chip.props.accessibilityLabel)).toEqual(
      CATALOG_GROUP_MODES.map((entry) => entry.label)
    );
  });

  it('selects All by default, so the catalog opens on the whole list', () => {
    const selected = categoryChipsOf(render().rendered)
      .filter((chip) => chip.props.accessibilityState?.selected)
      .map((chip) => chip.props.accessibilityLabel);

    expect(selected).toEqual(['All']);
  });

  it('marks only the chosen category as selected', () => {
    const selected = categoryChipsOf(render({ group: 'greens' }).rendered)
      .filter((chip) => chip.props.accessibilityState?.selected)
      .map((chip) => chip.props.accessibilityLabel);

    expect(selected).toEqual([CATALOG_GROUP_LABELS.greens]);
  });

  /** The " (n)" nodes, in render order. Their text arrives in three pieces. */
  function countsOf(rendered: RenderedTree): RenderedNode[] {
    return rendered.root.findAll(
      (node) =>
        node.type === 'Text' &&
        /^ \(\d+\)$/.test(
          (node.children ?? []).filter((child) => typeof child === 'string').join('')
        )
    );
  }

  const countTextOf = (node: RenderedNode): string =>
    (node.children ?? []).filter((child) => typeof child === 'string').join('');

  it('shows a count on All and on every category', () => {
    const counts = countsOf(render().rendered).map(countTextOf);

    expect(counts).toEqual([' (42)', ...CATALOG_GROUP_ORDER.map((group) => ` (${COUNTS[group]})`)]);
  });

  it('mutes a zero rather than hiding it — an empty category is worth knowing', () => {
    const zeroes = countsOf(render().rendered).filter(
      (node) => node.props.style === 'sheetChipCountZero'
    );

    expect(zeroes.map(countTextOf)).toEqual([' (0)']);
  });

  it('reports the chosen category and closes', () => {
    const { rendered, onGroupChange, onClose } = render();
    const greens = categoryChipsOf(rendered).find(
      (chip) => chip.props.accessibilityLabel === CATALOG_GROUP_LABELS.greens
    );

    TestRenderer.act(() => greens?.props.onPress?.());

    expect(onGroupChange).toHaveBeenCalledWith('greens');
    expect(onClose).toHaveBeenCalled();
  });

  it('reports a return to All and closes', () => {
    const { rendered, onGroupChange, onClose } = render({ group: 'greens' });
    const all = categoryChipsOf(rendered).find((chip) => chip.props.accessibilityLabel === 'All');

    TestRenderer.act(() => all?.props.onPress?.());

    expect(onGroupChange).toHaveBeenCalledWith(ALL_GROUPS);
    expect(onClose).toHaveBeenCalled();
  });

  it('reports the chosen mode and closes', () => {
    const { rendered, onChange, onClose } = render();
    const alpha = modeChipsOf(rendered).find((chip) => chip.props.accessibilityLabel === 'A–Z');

    TestRenderer.act(() => alpha?.props.onPress?.());

    expect(onChange).toHaveBeenCalledWith('alpha');
    expect(onClose).toHaveBeenCalled();
  });

  it('still announces each mode hint, which the chip has no room to show', () => {
    expect(modeChipsOf(render().rendered).map((chip) => chip.props.accessibilityHint)).toEqual(
      CATALOG_GROUP_MODES.map((entry) => entry.hint)
    );
  });

  it('hides Reset while both facets are on their defaults', () => {
    expect(JSON.stringify(render().rendered.toJSON())).not.toContain('Reset');
  });

  it('offers Reset once the category alone has moved off its default', () => {
    expect(JSON.stringify(render({ group: 'greens' }).rendered.toJSON())).toContain('Reset');
  });

  it('offers Reset once the grouping alone has moved off its default', () => {
    expect(JSON.stringify(render({ mode: 'alpha' }).rendered.toJSON())).toContain('Reset');
  });

  it('clears both facets at once, so one Reset is enough', () => {
    const { rendered, onGroupChange, onChange, onClose } = render({
      group: 'greens',
      mode: 'alpha',
    });
    const resetBtn = rendered.root
      .findAll((node) => node.type === 'TouchableOpacity')
      .find((node) => node.props.accessibilityLabel === 'Reset filters');

    expect(resetBtn).toBeDefined();

    TestRenderer.act(() => resetBtn?.props.onPress?.());

    expect(onGroupChange).toHaveBeenCalledWith(ALL_GROUPS);
    expect(onChange).toHaveBeenCalledWith(DEFAULT_CATALOG_GROUP_MODE);
    expect(onClose).toHaveBeenCalled();
  });
});
