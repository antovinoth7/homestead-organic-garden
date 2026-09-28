/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the disclosure's toggle and body. */
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
  useTheme: () => ({ primary: '#26734d' }),
}));
jest.mock('@/styles/journalFormStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { Text } from 'react-native';
import { JournalMoreDetails } from '@/components/forms/JournalMoreDetails';

interface RenderedNode {
  type: unknown;
  props: {
    children?: unknown;
    onPress?: () => void;
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

describe('JournalMoreDetails', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  function render(initiallyExpanded?: boolean): RenderedTree {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <JournalMoreDetails initiallyExpanded={initiallyExpanded} summary="2 parts · Neem oil">
          <Text>Folded field</Text>
        </JournalMoreDetails>
      );
    });
    return rendered;
  }

  const texts = (rendered: RenderedTree): string[] =>
    rendered.root
      .findAll((n) => n.type === 'Text' && typeof n.props.children === 'string')
      .map((n) => n.props.children as string);

  const toggle = (rendered: RenderedTree): void => {
    const [button] = rendered.root.findAll((n) => n.type === 'TouchableOpacity');
    TestRenderer.act(() => button?.props.onPress?.());
  };

  it('starts collapsed, showing the summary but not the fields', () => {
    const shown = texts(render());
    expect(shown).toEqual(['More details', '2 parts · Neem oil']);
    expect(shown).not.toContain('Folded field');
  });

  it('starts open when a folded field already has a value', () => {
    const shown = texts(render(true));
    expect(shown).toContain('Fewer details');
    expect(shown).toContain('Folded field');
    expect(shown).not.toContain('2 parts · Neem oil');
  });

  it('toggles open and closed on tap', () => {
    const rendered = render();
    toggle(rendered);
    expect(texts(rendered)).toContain('Folded field');
    toggle(rendered);
    expect(texts(rendered)).not.toContain('Folded field');
  });
});
