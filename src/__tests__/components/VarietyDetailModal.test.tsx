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
    ScrollView: host('ScrollView'),
    Text: host('Text'),
    TextInput: host('TextInput'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
  };
});
jest.mock('@/components/SheetHandle', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    SheetHandle: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('SheetHandle', props, children),
  };
});
jest.mock('@/components/BottomSheetModal', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    BottomSheetModal: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('BottomSheetModal', props, children),
  };
});
jest.mock('@/components/FloatingLabelInput', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('FloatingLabelInput', props),
  };
});
jest.mock('@/components/VoiceDictation', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('VoiceDictation', props),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textInverse: '#fff', inputPlaceholder: '#999' }),
}));
jest.mock('@/styles/varietyDetailSheetStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { VarietyDetailModal } from '@/components/catalog/VarietyDetailModal';
import { GROWING_SEASON_OPTIONS } from '@/utils/plantLabels';
import type { VarietyDetail } from '@/types/database.types';

interface RenderedNode {
  type: unknown;
  props: {
    label?: string;
    style?: unknown;
    keyboardAvoiding?: boolean;
    compact?: boolean;
    onClose?: () => void;
    onPress?: () => void;
    children?: unknown;
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

describe('VarietyDetailModal', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(
    editingVariety: string,
    draft: VarietyDetail = {}
  ): { rendered: RenderedTree; onDraftChange: jest.Mock; onSave: jest.Mock } {
    const onDraftChange = jest.fn();
    const onSave = jest.fn();
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <VarietyDetailModal
          editingVariety={editingVariety}
          newVariety=""
          onNewVarietyChange={jest.fn()}
          draft={draft}
          onDraftChange={onDraftChange}
          onSave={onSave}
        />
      );
    });
    return { rendered, onDraftChange, onSave };
  }

  const pills = (rendered: RenderedTree): RenderedNode[] =>
    rendered.root.findAll(
      (node) =>
        node.type === 'TouchableOpacity' &&
        Array.isArray(node.props.style) &&
        node.props.style[0] === 'seasonChip'
    );

  const isActive = (pill: RenderedNode): boolean =>
    (pill.props.style as unknown[]).includes('seasonChipActive');

  it('renders on the keyboard-aware bottom sheet, not a KeyboardAvoidingView modal', () => {
    const { rendered } = render('');
    const sheets = rendered.root.findAll((node) => node.type === 'BottomSheetModal');

    expect(sheets).toHaveLength(1);
    expect(sheets[0]?.props.keyboardAvoiding).toBe(true);
  });

  it('asks for a name only when adding', () => {
    const nameField = (rendered: RenderedTree): RenderedNode[] =>
      rendered.root.findAll(
        (node) => node.type === 'FloatingLabelInput' && node.props.label === 'Variety name *'
      );

    expect(nameField(render('').rendered)).toHaveLength(1);
    expect(nameField(render('PKM 1').rendered)).toHaveLength(0);
  });

  it('offers one pill per season option', () => {
    expect(pills(render('').rendered)).toHaveLength(GROWING_SEASON_OPTIONS.length);
  });

  it('shows a retired Kharif value as its SW Monsoon replacement', () => {
    const { rendered } = render('PKM 1', { seasonSuitability: ['Kharif (Jun–Sep)'] });
    const swIndex = GROWING_SEASON_OPTIONS.findIndex((o) => o.value === 'SW Monsoon (Jun–Sep)');

    expect(pills(rendered).map(isActive)).toEqual(
      GROWING_SEASON_OPTIONS.map((_option, index) => index === swIndex)
    );
  });

  it('toggles a retired value off as its replacement instead of leaving it behind', () => {
    const { rendered, onDraftChange } = render('PKM 1', {
      seasonSuitability: ['Kharif (Jun–Sep)'],
    });
    const swIndex = GROWING_SEASON_OPTIONS.findIndex((o) => o.value === 'SW Monsoon (Jun–Sep)');

    TestRenderer.act(() => pills(rendered)[swIndex]?.props.onPress?.());

    const updater = onDraftChange.mock.calls[0]?.[0] as (prev: VarietyDetail) => VarietyDetail;
    expect(updater({ seasonSuitability: ['Kharif (Jun–Sep)'] }).seasonSuitability).toEqual([]);
  });

  it('uses the catalog’s compact mic | language pill for notes', () => {
    const { rendered } = render('PKM 1');
    const voice = rendered.root.findAll((node) => node.type === 'VoiceDictation');

    expect(voice).toHaveLength(1);
    expect(voice[0]?.props.compact).toBe(true);
  });

  it('saves on dismissal too, like the other catalog sheets', () => {
    const { rendered, onSave } = render('PKM 1');
    const sheet = rendered.root.findAll((node) => node.type === 'BottomSheetModal')[0];
    const handle = rendered.root.findAll((node) => node.type === 'SheetHandle')[0];

    TestRenderer.act(() => sheet?.props.onClose?.());
    TestRenderer.act(() => handle?.props.onClose?.());

    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it('saves from the Done button', () => {
    const { rendered, onSave } = render('PKM 1');
    const done = rendered.root.findAll(
      (node) => node.type === 'TouchableOpacity' && node.props.style === 'doneButton'
    );

    TestRenderer.act(() => done[0]?.props.onPress?.());

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
