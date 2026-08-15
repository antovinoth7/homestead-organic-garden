/* The repository's Jest preset is Node-only, so this test supplies a minimal
 * native host boundary for the season card's layout and press handlers. */
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
jest.mock('@/theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/components/ReferenceThumb', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    ReferenceThumb: (props: Record<string, unknown>) =>
      React.createElement('ReferenceThumb', props),
  };
});
jest.mock('@/config/referenceAssets', () => ({
  getPlantImage: (name: string) => ({ testUri: name }),
}));
jest.mock('@/styles/seasonBlockStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

import React from 'react';
import { SeasonBlock } from '@/components/today/SeasonBlock';
import { PlantNowRecommendation, SeasonProgress } from '@/types/database.types';

interface RenderedNode {
  type: unknown;
  props: {
    onPress?: () => void;
    children?: unknown;
    style?: unknown;
    accessibilityLabel?: string;
  };
}

interface RenderedTree {
  toJSON: () => unknown;
  root: {
    findByProps: (props: Record<string, unknown>) => RenderedNode;
    findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
    findAllByProps: (props: Record<string, unknown>) => RenderedNode[];
  };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const season: SeasonProgress = {
  seasonId: 'sw_monsoon',
  seasonName: 'SW Monsoon',
  seasonLabel: 'SW Monsoon (Jun–Sep)',
  monthLabel: 'August',
  week: 11,
  totalWeeks: 18,
  elapsedDays: 77,
  totalDays: 122,
  elapsedFraction: 0.63,
};

function crop(overrides: Partial<PlantNowRecommendation> = {}): PlantNowRecommendation {
  return {
    key: 'vegetable:Amaranthus',
    label: 'Amaranthus',
    plantType: 'vegetable',
    action: 'sow',
    daysToHarvest: '25–40 days',
    spacingCm: 15,
    closing: false,
    ...overrides,
  };
}

const snakeGourd = crop({
  key: 'vegetable:Snake Gourd',
  label: 'Snake Gourd',
  daysToHarvest: '90–110 days',
  spacingCm: 150,
  closing: true,
});

const brinjal = crop({
  key: 'vegetable:Brinjal',
  label: 'Brinjal',
  action: 'transplant',
  daysToHarvest: '60–80 days',
  spacingCm: 60,
});

interface Overrides {
  recommendations?: PlantNowRecommendation[];
  district?: string | null;
  tip?: string;
  tipTitle?: string;
  openingNext?: string[];
  onPressCrop?: jest.Mock;
  onPressDistrict?: jest.Mock;
}

function render(overrides: Overrides = {}): RenderedTree {
  let rendered!: RenderedTree;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      <SeasonBlock
        season={season}
        note="Use raised, well-drained beds for monsoon crops."
        tip={overrides.tip ?? ''}
        tipTitle={overrides.tipTitle ?? ''}
        district={overrides.district === undefined ? 'Kanyakumari' : overrides.district}
        recommendations={overrides.recommendations ?? [crop(), snakeGourd, brinjal]}
        openingNext={overrides.openingNext ?? []}
        perennialCare={null}
        onPressCrop={overrides.onPressCrop ?? jest.fn()}
        onPressDistrict={overrides.onPressDistrict ?? jest.fn()}
      />
    );
  });
  return rendered;
}

const baseStyle = (style: unknown): unknown => (Array.isArray(style) ? style[0] : style);

const hostText = (rendered: RenderedTree, style: string): unknown[] =>
  rendered.root
    .findAll((node) => node.type === 'Text' && baseStyle(node.props.style) === style)
    .map((node) => node.props.children);

const tiles = (rendered: RenderedTree): RenderedNode[] =>
  rendered.root.findAll(
    (node) => node.type === 'TouchableOpacity' && baseStyle(node.props.style) === 'tile'
  );

// File-level rather than per-describe: every block below renders, and
// `react-test-renderer` logs its own deprecation notice on each `create`.
let consoleErrorSpy: jest.SpyInstance;

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterAll(() => consoleErrorSpy.mockRestore());

describe('SeasonBlock crop tiles', () => {
  it('gives every crop a tap target, split by how it is established', () => {
    const rendered = render();
    expect(tiles(rendered)).toHaveLength(3);
    expect(hostText(rendered, 'plantAction')).toEqual(['Sow', 'Transplant']);
    // The transplant group states the nursery it silently assumed before.
    expect(hostText(rendered, 'plantActionHint')).toEqual([
      'Seed straight into the ground',
      'Needs seedlings about 4 weeks old',
    ]);
  });

  it('opens the catalog entry for the crop that was tapped', () => {
    const onPressCrop = jest.fn();
    const rendered = render({ onPressCrop });
    TestRenderer.act(() => tiles(rendered)[1]?.props.onPress?.());
    expect(onPressCrop).toHaveBeenCalledWith('Snake Gourd', 'vegetable');
  });

  it('quotes the catalog figures on the tile', () => {
    const rendered = render();
    expect(hostText(rendered, 'tileMeta')).toEqual([
      '25–40 days · 15 cm apart',
      '90–110 days · 150 cm apart',
      '60–80 days · 60 cm apart',
    ]);
  });

  it('drops the meta line rather than printing a placeholder', () => {
    const rendered = render({
      recommendations: [crop({ daysToHarvest: null, spacingCm: null })],
    });
    expect(hostText(rendered, 'tileMeta')).toEqual([]);
    // The tile still renders and is still pressable.
    expect(tiles(rendered)).toHaveLength(1);
  });

  it('keeps whichever half of the meta the catalog does state', () => {
    const rendered = render({ recommendations: [crop({ daysToHarvest: null })] });
    expect(hostText(rendered, 'tileMeta')).toEqual(['15 cm apart']);
  });

  it('leads every tile with the crop photo at grid size', () => {
    const rendered = render();
    const thumbs = rendered.root.findAll((node) => node.type === 'ReferenceThumb');
    expect(thumbs).toHaveLength(3);
    expect(thumbs.map((node) => (node.props as { variant?: string }).variant)).toEqual([
      'tile',
      'tile',
      'tile',
    ]);
  });

  it('gives a closing crop the same tile as any other', () => {
    const rendered = render();
    // No warning tint, and no icon inside a tile — the card no longer marks a
    // closing window visually at all.
    expect(tiles(rendered).map((node) => node.props.style)).toEqual(['tile', 'tile', 'tile']);
    expect(rendered.root.findAll((node) => node.type === 'GardenIcon')).toHaveLength(0);
  });

  it('spells the whole tile out for a screen reader', () => {
    const rendered = render({ recommendations: [snakeGourd] });
    // The deadline survives in speech even though nothing on screen shows it.
    expect(tiles(rendered)[0]?.props.accessibilityLabel).toBe(
      'Snake Gourd, last month to start, 90–110 days · 150 cm apart. Opens the catalog entry.'
    );
  });
});

describe('SeasonBlock next month', () => {
  it('states next month as a line, not as tiles', () => {
    const rendered = render({ openingNext: ['Fenugreek', 'Palak'] });
    expect(hostText(rendered, 'openingNext')).toEqual([
      ['Opens next month: ', 'Fenugreek · Palak'],
    ]);
    expect(tiles(rendered)).toHaveLength(3);
  });
});

describe('SeasonBlock bed space', () => {
  it('leaves the free-bed count to the plot cards', () => {
    const rendered = render();
    // The heading stands alone: no bed figure, no link out to the Beds tab.
    expect(hostText(rendered, 'sowTitle')).toEqual(['Plant now in Kanyakumari']);
    expect(hostText(rendered, 'bedsLink')).toEqual([]);
  });
});

describe('SeasonBlock without a planting calendar', () => {
  it('explains the gap instead of dropping the section silently', () => {
    const rendered = render({ recommendations: [], district: 'Coimbatore' });
    expect(hostText(rendered, 'emptyText')).toEqual([
      'Planting suggestions are only set up for Kanyakumari, and this farm is in Coimbatore.',
    ]);
    expect(tiles(rendered)).toHaveLength(0);
  });

  it('asks for a district when none is set, and routes there', () => {
    const onPressDistrict = jest.fn();
    const rendered = render({ recommendations: [], district: null, onPressDistrict });
    expect(hostText(rendered, 'emptyText')).toEqual([
      'Planting suggestions need to know which district this farm is in.',
    ]);
    const link = rendered.root.findAll(
      (node) =>
        node.type === 'TouchableOpacity' && node.props.accessibilityLabel === 'Set your district. Opens my farm.'
    );
    TestRenderer.act(() => link[0]?.props.onPress?.());
    expect(onPressDistrict).toHaveBeenCalled();
  });
});

describe('SeasonBlock seasonal risk', () => {
  it('heads the risk and lifts it above perennial care', () => {
    const rendered = render({
      tipTitle: 'Anthracnose risk',
      tip: 'Humid conditions favour anthracnose. Remove infected parts promptly.',
    });
    expect(hostText(rendered, 'riskTitle')).toEqual(['Anthracnose risk']);
    expect(hostText(rendered, 'riskText')).toEqual([
      'Humid conditions favour anthracnose. Remove infected parts promptly.',
    ]);
  });

  it('renders nothing when there is no risk to state', () => {
    const rendered = render();
    expect(hostText(rendered, 'riskText')).toEqual([]);
  });

  it('still shows the message when the source alert had no title', () => {
    const rendered = render({ tip: 'Check drainage.', tipTitle: '' });
    expect(hostText(rendered, 'riskTitle')).toEqual([]);
    expect(hostText(rendered, 'riskText')).toEqual(['Check drainage.']);
  });
});
