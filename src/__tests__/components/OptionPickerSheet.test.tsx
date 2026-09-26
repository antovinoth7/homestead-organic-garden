/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the sheet's layout, search input and list. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  interface FlatListProps {
    data: readonly unknown[];
    renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
    keyExtractor: (item: unknown, index: number) => string;
    ListEmptyComponent?: React.ReactNode;
  }
  function FlatList({
    data,
    renderItem,
    keyExtractor,
    ListEmptyComponent,
    ...props
  }: FlatListProps): React.ReactElement {
    const rows =
      data.length === 0
        ? [ListEmptyComponent ?? null]
        : data.map((item, index) =>
            React.createElement(
              React.Fragment,
              { key: keyExtractor(item, index) },
              renderItem({ item, index })
            )
          );
    return React.createElement('FlatList', props, ...rows);
  }
  return {
    FlatList,
    Text: host('Text'),
    TextInput: host('TextInput'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
    useWindowDimensions: () => ({ width: 400, height: 800 }),
  };
});
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
});
jest.mock('@/components/SheetHandle', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    SheetHandle: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('SheetHandle', null, children),
  };
});
jest.mock('@/components/BottomSheetModal', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    BottomSheetModal: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('BottomSheetModal', props, children),
  };
});
let mockKeyboardHeight = 0;
jest.mock('@/hooks/useKeyboardHeight', () => ({
  useKeyboardHeight: () => mockKeyboardHeight,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textTertiary: '#999', inputPlaceholder: '#999' }),
}));
jest.mock('@/styles/optionPickerSheetStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import type { PickerOption } from '@/components/OptionPickerSheet';

interface RenderedNode {
  type: unknown;
  props: {
    children?: unknown;
    keyboardAvoiding?: boolean;
    sheetStyle?: unknown;
    onChangeText?: (text: string) => void;
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

const OPTIONS: PickerOption[] = [
  { label: 'Tomato', value: 'p1', description: 'Bed 3' },
  { label: 'Tomato', value: 'p2', description: 'Pot · Terrace' },
  { label: 'Chilli', value: 'p3', description: 'Bed 3' },
];

describe('OptionPickerSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  beforeEach(() => {
    mockKeyboardHeight = 0;
  });

  function render(searchable: boolean): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <OptionPickerSheet
          visible
          onClose={jest.fn()}
          title="Link to plant"
          options={OPTIONS}
          selectedValue=""
          onSelect={jest.fn()}
          searchable={searchable}
        />
      );
    });
    return rendered;
  }

  const sheet = (rendered: RenderedTree): RenderedNode => {
    const [node] = rendered.root.findAll((n) => n.type === 'BottomSheetModal');
    if (!node) throw new Error('BottomSheetModal not rendered');
    return node;
  };

  const sizing = (rendered: RenderedTree): Record<string, number> =>
    (sheet(rendered).props.sheetStyle as unknown[])[1] as Record<string, number>;

  const texts = (rendered: RenderedTree): string[] =>
    rendered.root
      .findAll((n) => n.type === 'Text' && typeof n.props.children === 'string')
      .map((n) => n.props.children as string);

  const search = (rendered: RenderedTree, query: string): void => {
    const [input] = rendered.root.findAll((n) => n.type === 'TextInput');
    TestRenderer.act(() => input?.props.onChangeText?.(query));
  };

  it('lifts a searchable sheet above the keyboard', () => {
    expect(sheet(render(true)).props.keyboardAvoiding).toBe(true);
    expect(sheet(render(false)).props.keyboardAvoiding).toBe(false);
  });

  it('gives a searchable sheet a fixed height that fits beside the keyboard', () => {
    expect(sizing(render(true)).height).toBe(600);

    mockKeyboardHeight = 300;
    // 800 window − 24 top gap − 300 keyboard
    expect(sizing(render(true)).height).toBe(476);
  });

  it('keeps a plain sheet content-sized', () => {
    const style = sizing(render(false));
    expect(style.height).toBeUndefined();
    expect(style.maxHeight).toBe(776);
  });

  it('matches the search against descriptions as well as labels', () => {
    const rendered = render(true);
    search(rendered, 'terrace');

    expect(texts(rendered)).toEqual(expect.arrayContaining(['Tomato', 'Pot · Terrace']));
    expect(texts(rendered)).not.toContain('Chilli');
  });

  it('shows an empty state naming the query when nothing matches', () => {
    const rendered = render(true);
    search(rendered, 'okra');

    expect(texts(rendered)).toContain('No matches for "okra"');
  });
});
