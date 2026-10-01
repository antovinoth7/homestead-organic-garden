/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the card's layout and press handlers. */
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
    View: host('View'),
    StyleSheet: { create: <T,>(styles: T): T => styles },
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
jest.mock('@/theme', () => ({
  useTheme: () => new Proxy({}, { get: (_target, property) => `#${String(property)}` }),
}));
jest.mock('@/styles/carePlanTaskCardStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import {
  CarePlanTaskCard,
  type CarePlanTaskCardProps,
} from '@/components/calendar/CarePlanTaskCard';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

interface Node {
  type: unknown;
  props: Record<string, unknown> & {
    accessibilityLabel?: string;
    onPress?: () => void;
    onLongPress?: () => void;
  };
}

interface RenderedTree {
  root: { findAll: (predicate: (node: Node) => boolean) => Node[] };
  toJSON: () => unknown;
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const task = makeTaskTemplate({
  id: 't1',
  task_type: 'fertilise',
  amount: '2 kg compost',
  preferred_time: null,
});

const baseProps = (): CarePlanTaskCardProps => ({
  task,
  subject: 'Banana',
  context: ' · Coconut Plot',
  dueText: 'Aug 19',
  overdue: false,
  priority: 'medium',
  selectionMode: false,
  selected: false,
  blocked: false,
  onPress: jest.fn(),
  onLongPress: jest.fn(),
  onTick: jest.fn(),
});

function render(overrides: Partial<CarePlanTaskCardProps> = {}): {
  tree: RenderedTree;
  props: CarePlanTaskCardProps;
} {
  const props = { ...baseProps(), ...overrides };
  let tree!: RenderedTree;
  TestRenderer.act(() => {
    tree = TestRenderer.create(<CarePlanTaskCard {...props} />);
  });
  return { tree, props };
}

const pressables = (tree: RenderedTree): Node[] =>
  tree.root.findAll((node) => node.type === 'Pressable');

/** All rendered text, flattened — what a farmer reads on the card. */
const text = (tree: RenderedTree): string => {
  const out: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object' && 'children' in value) {
      walk((value as { children: unknown }).children);
    }
  };
  walk(tree.toJSON());
  return out.join('');
};

describe('CarePlanTaskCard', () => {
  it('leads with the plant, then the job and the amount', () => {
    const { tree } = render();
    const shown = text(tree);
    expect(shown.indexOf('Banana')).toBeLessThan(shown.indexOf('Fertilise'));
    expect(shown).toContain('Fertilise · 2 kg compost · Coconut Plot');
  });

  it('shows the best-time chip for the task type', () => {
    expect(text(render().tree)).toContain('After watering');
  });

  it('opens details on tap and starts selecting on a long press', () => {
    const { tree, props } = render();
    const [body] = pressables(tree);
    TestRenderer.act(() => body?.props.onPress?.());
    TestRenderer.act(() => body?.props.onLongPress?.());
    expect(props.onPress).toHaveBeenCalledWith(task);
    expect(props.onLongPress).toHaveBeenCalledWith(task);
  });

  it('finishes the task from the tick', () => {
    const { tree, props } = render();
    const tick = pressables(tree)[1];
    expect(tick?.props.accessibilityLabel).toBe('Mark Fertilise Banana done');
    TestRenderer.act(() => tick?.props.onPress?.());
    expect(props.onTick).toHaveBeenCalledWith(task);
  });

  it('turns the tick into a select box while selecting', () => {
    const { tree } = render({ selectionMode: true });
    expect(pressables(tree)[1]?.props.accessibilityLabel).toBe('Select Fertilise Banana');
  });

  it('says overdue once — on the date — and flags urgent work', () => {
    const shown = text(render({ overdue: true, dueText: '3d late', priority: 'critical' }).tree);
    expect(shown).toContain('3d late');
    expect(shown).toContain('Critical');
  });

  it('explains instead of finishing a blocked task', () => {
    const { tree } = render({ blocked: true });
    expect(pressables(tree)[1]?.props.accessibilityLabel).toContain('not due yet');
  });

  it('shows a done row without chips, undoable only while pending', () => {
    const pending = render({ done: 'pending', priority: 'high' });
    const shown = text(pending.tree);
    expect(shown).toContain('Done');
    expect(shown).not.toContain('High');
    expect(shown).not.toContain('After watering');
    expect(pressables(pending.tree)[1]?.props.accessibilityLabel).toBe('Undo Fertilise Banana');
    expect(pressables(pending.tree)[1]?.props.disabled).toBe(false);

    const saved = render({ done: 'saved' });
    expect(pressables(saved.tree)[1]?.props.disabled).toBe(true);
    expect(pressables(saved.tree)[0]?.props.onLongPress).toBeUndefined();
  });

  it('names a preferred time only when no clock chip already does', () => {
    const shown = text(
      render({ task: { ...task, task_type: 'mulch', preferred_time: 'evening' } }).tree
    );
    expect(shown).toContain('Mulch · 2 kg compost · Coconut Plot · Evening');
  });
});
