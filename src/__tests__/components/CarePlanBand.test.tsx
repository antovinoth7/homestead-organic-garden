/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the Care Plan's band chrome and press handlers. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    Pressable: host('Pressable'),
    TouchableOpacity: host('TouchableOpacity'),
    Text: host('Text'),
    View: host('View'),
    StyleSheet: { create: <T,>(styles: T): T => styles, hairlineWidth: 1 },
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
    ReferenceThumb: (props: Record<string, unknown>) => React.createElement('Thumb', props),
  };
});
jest.mock('@/config/referenceAssets', () => ({ getPlantImage: () => null }));
jest.mock('@/theme', () => ({
  useTheme: () => new Proxy({}, { get: (_target, property) => `#${String(property)}` }),
}));
jest.mock('@/styles/carePlanBandStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { CarePlanDateNav } from '@/components/calendar/CarePlanDateNav';
import { CarePlanBandFooter, CarePlanBandHeader } from '@/components/calendar/CarePlanBand';
import { HarvestRoundRow } from '@/components/calendar/HarvestRoundRow';
import type { CarePlanRow, CarePlanSectionHeader } from '@/utils/carePlanSections';
import { makePlant } from '../fixtures/plant.fixtures';

interface Node {
  type: unknown;
  props: Record<string, unknown> & {
    accessibilityLabel?: string;
    disabled?: boolean;
    onPress?: () => void;
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

function render(element: React.ReactElement): RenderedTree {
  let tree!: RenderedTree;
  TestRenderer.act(() => {
    tree = TestRenderer.create(element);
  });
  return tree;
}

/** All rendered text, flattened — what a farmer reads. */
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

const byLabel = (tree: RenderedTree, label: string): Node | undefined =>
  tree.root.findAll((node) => node.props.accessibilityLabel === label)[0];

const touchables = (tree: RenderedTree): Node[] =>
  tree.root.findAll((node) => node.type === 'TouchableOpacity');

// Noon local, like every calendar date in the app.
const today = new Date(2026, 9, 3, 12);

describe('CarePlanDateNav', () => {
  const navProps = {
    today,
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onOpenMonth: jest.fn(),
  };

  it('reads "Today" with the date and cannot step into the past', () => {
    const tree = render(<CarePlanDateNav {...navProps} selectedDate={null} />);
    expect(text(tree)).toBe('Today · Sat, 3 Oct');
    expect(byLabel(tree, 'Previous day')?.props.disabled).toBe(true);
  });

  it('names a picked day and steps either way from it', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const tree = render(
      <CarePlanDateNav
        {...navProps}
        selectedDate={new Date(2026, 9, 5, 12)}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    );
    expect(text(tree)).toBe('Mon, 5 Oct');
    const previous = byLabel(tree, 'Previous day');
    expect(previous?.props.disabled).toBe(false);
    previous?.props.onPress?.();
    byLabel(tree, 'Next day')?.props.onPress?.();
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('opens the month sheet from the date', () => {
    const onOpenMonth = jest.fn();
    const tree = render(
      <CarePlanDateNav {...navProps} selectedDate={null} onOpenMonth={onOpenMonth} />
    );
    byLabel(tree, 'Today · Sat, 3 Oct. Open month calendar')?.props.onPress?.();
    expect(onOpenMonth).toHaveBeenCalled();
  });
});

describe('CarePlanBandHeader', () => {
  const header = (overrides: Partial<CarePlanSectionHeader> = {}): CarePlanSectionHeader => ({
    title: 'Before 10 AM',
    count: 3,
    tone: 'band',
    subtitle: 'Water while it is cool.',
    ...overrides,
  });
  const headerProps = {
    selectBox: null,
    nowLabel: '6:23',
    onToggle: jest.fn(),
    onAdd: jest.fn(),
    banners: null,
  };

  it('shows the title, NOW marker, count and why the band', () => {
    const tree = render(<CarePlanBandHeader {...headerProps} header={header({ isNow: true })} />);
    expect(text(tree)).toBe('Before 10 AMNOW · 6:233Water while it is cool.');
  });

  it('hides a zero count and the NOW marker outside the current band', () => {
    const tree = render(<CarePlanBandHeader {...headerProps} header={header({ count: 0 })} />);
    expect(text(tree)).toBe('Before 10 AMWater while it is cool.');
  });

  it('offers + Add on a picked day', () => {
    const onAdd = jest.fn();
    const tree = render(
      <CarePlanBandHeader
        {...headerProps}
        onAdd={onAdd}
        header={header({ title: 'Mon, Oct 5', tone: 'picked', addAction: true })}
      />
    );
    byLabel(tree, 'Create a task for Mon, Oct 5')?.props.onPress?.();
    expect(onAdd).toHaveBeenCalled();
  });

  it('folds and opens from its title when collapsible', () => {
    const onToggle = jest.fn();
    const tree = render(
      <CarePlanBandHeader
        {...headerProps}
        onToggle={onToggle}
        header={header({ title: 'Tomorrow', tone: 'later', collapsible: true, expanded: false })}
      />
    );
    const pressable = tree.root.findAll((node) => node.type === 'Pressable')[0];
    expect(pressable?.props.accessibilityLabel).toBe('Tomorrow, 3 tasks: Water while it is cool.');
    pressable?.props.onPress?.();
    expect(onToggle).toHaveBeenCalled();
  });
});

describe('CarePlanBandFooter', () => {
  it('says how many a folded Catch up holds back, and opens on tap', () => {
    const onToggle = jest.fn();
    const tree = render(
      <CarePlanBandFooter
        tone="overdue"
        footer={{ expanded: false, hiddenCount: 48 }}
        onToggle={onToggle}
      />
    );
    expect(text(tree)).toBe('+48 more overdue');
    const [more] = touchables(tree);
    expect(more?.props.accessibilityState).toEqual({ expanded: false });
    more?.props.onPress?.();
    expect(onToggle).toHaveBeenCalled();
  });

  it('says Show less once open', () => {
    const tree = render(
      <CarePlanBandFooter tone="overdue" footer={{ expanded: true, hiddenCount: 48 }} />
    );
    expect(text(tree)).toBe('Show less');
  });

  it('rounds off a panel that folds nothing, with no row of its own', () => {
    const tree = render(<CarePlanBandFooter tone="overdue" />);
    expect(tree.toJSON()).not.toBeNull();
    expect(text(tree)).toBe('');
    expect(touchables(tree)).toHaveLength(0);
  });

  it('draws nothing under a band without a panel', () => {
    const tree = render(<CarePlanBandFooter tone="band" />);
    expect(tree.toJSON()).toBeNull();
  });
});

describe('HarvestRoundRow', () => {
  const rowProps = {
    onToggleRound: jest.fn(),
    onToggleSoon: jest.fn(),
    onLogHarvest: jest.fn(),
  };

  it('heads the round with how many are ready and how late the worst are', () => {
    const row: CarePlanRow = {
      key: 'harvest-round',
      kind: 'harvestRound',
      readyCount: 17,
      lateCount: 2,
      maxLateDays: 6,
      expanded: false,
      first: true,
      last: true,
    };
    const tree = render(<HarvestRoundRow {...rowProps} row={row} />);
    expect(text(tree)).toBe('Harvest round · 17 readyPick before 9 AM · 2 are 6 days late');
  });

  it('logs a ready crop into the journal', () => {
    const onLogHarvest = jest.fn();
    const row: CarePlanRow = {
      key: 'harvest-p1',
      kind: 'harvest',
      item: {
        plant: makePlant({ id: 'p1', name: 'Black Pepper 02' }),
        nextDate: new Date('2026-09-27T00:00:00.000Z'),
        daysUntil: -6,
        isReady: true,
        source: 'scheduled_task',
      },
      first: false,
      last: false,
    };
    const tree = render(<HarvestRoundRow {...rowProps} row={row} onLogHarvest={onLogHarvest} />);
    expect(text(tree)).toBe('Black Pepper 02Overdue by 6 days · Scheduled+ Log');
    byLabel(tree, 'Log harvest for Black Pepper 02')?.props.onPress?.();
    expect(onLogHarvest).toHaveBeenCalledWith(
      expect.objectContaining({ plant: expect.objectContaining({ id: 'p1' }) })
    );
  });

  it('spans the look-ahead harvests in days', () => {
    const row: CarePlanRow = {
      key: 'harvest-soon-toggle',
      kind: 'harvestSoonToggle',
      count: 4,
      fromDays: 3,
      toDays: 9,
      expanded: false,
      first: false,
      last: true,
    };
    const tree = render(<HarvestRoundRow {...rowProps} row={row} />);
    expect(text(tree)).toBe('Harvest soon · 4 cropsin 3–9 days');
  });
});
