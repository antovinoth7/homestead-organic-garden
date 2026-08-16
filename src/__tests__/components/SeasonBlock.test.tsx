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
    accessibilityRole?: string;
  };
  findAll: (predicate: (node: RenderedNode) => boolean) => RenderedNode[];
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
  dayOfSeason: 78,
  daysRemaining: 44,
  elapsedFraction: 0.63,
};

function crop(overrides: Partial<PlantNowRecommendation> = {}): PlantNowRecommendation {
  return {
    key: 'vegetable:Amaranthus',
    label: 'Amaranthus',
    plantType: 'vegetable',
    action: 'sow',
    daysToHarvest: '25–40 days',
    harvestByLabel: 'harvest by Sep',
    spacingCm: 15,
    spacingLabel: '15 cm apart',
    windowLabel: 'July–August window',
    conditions: ['Use a well-drained home-garden bed.'],
    evidenceIds: ['tnau_home_garden'],
    reviewedOn: '2026-08-16',
    closing: false,
    ...overrides,
  };
}

const snakeGourd = crop({
  key: 'vegetable:Snake Gourd',
  label: 'Snake Gourd',
  daysToHarvest: '90–110 days',
  harvestByLabel: 'harvest by Dec',
  spacingCm: 150,
  spacingLabel: '150 cm apart',
  closing: true,
});

const brinjal = crop({
  key: 'vegetable:Brinjal',
  label: 'Brinjal',
  action: 'transplant',
  daysToHarvest: '60–80 days',
  harvestByLabel: 'harvest by Nov',
  spacingCm: 60,
  spacingLabel: '60 cm apart',
});

/** A full month's sow list, matching the widest the district calendar goes. */
const fiveSows = ['Amaranthus', 'Ladies Finger', 'Ash Gourd', 'Pumpkin', 'Snake Gourd'].map((label) =>
  crop({ key: `vegetable:${label}`, label })
);

interface Overrides {
  season?: SeasonProgress;
  recommendations?: PlantNowRecommendation[];
  district?: string | null;
  zoneLabel?: string | null;
  tip?: string;
  tipTitle?: string;
  openingNext?: string[];
  openingNextLabel?: string;
  perennialCare?: {
    count: number;
    message: string;
    evidenceIds: string[];
    reviewedOn: string;
  } | null;
  onPressCrop?: jest.Mock;
  onPressDistrict?: jest.Mock;
  plantingState?: 'available' | 'no_current_window' | 'missing_district' | 'unsupported_district' | 'review_expired';
}

function render(overrides: Overrides = {}): RenderedTree {
  let rendered!: RenderedTree;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      <SeasonBlock
        season={overrides.season ?? season}
        note="Use raised, well-drained beds for monsoon crops."
        seasonIconKey="weather.rain"
        tip={overrides.tip ?? ''}
        tipTitle={overrides.tipTitle ?? ''}
        district={overrides.district === undefined ? 'Kanyakumari' : overrides.district}
        zoneLabel={overrides.zoneLabel === undefined ? 'High Rainfall Zone' : overrides.zoneLabel}
        plantingState={overrides.plantingState ?? 'available'}
        recommendations={overrides.recommendations ?? [crop(), snakeGourd, brinjal]}
        openingNext={overrides.openingNext ?? []}
        openingNextLabel={overrides.openingNextLabel ?? 'September'}
        perennialCare={overrides.perennialCare ?? null}
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

describe('SeasonBlock header', () => {
  it('states the season as the card subject, captioned by the zone', () => {
    const rendered = render();
    expect(hostText(rendered, 'title')).toEqual(['SW Monsoon']);
    expect(hostText(rendered, 'subtitle')).toEqual(['High Rainfall Zone']);
  });

  // Blanking the caption would leave its line height behind as a gap under the
  // title, which reads as a rendering fault rather than as an unset district.
  it('withholds the caption entirely when no zone is resolved', () => {
    const rendered = render({ zoneLabel: null });
    expect(hostText(rendered, 'title')).toEqual(['SW Monsoon']);
    expect(hostText(rendered, 'subtitle')).toEqual([]);
  });

  it('counts the season in days as well as weeks', () => {
    const rendered = render();
    expect(hostText(rendered, 'daysLeftText')).toEqual(['44 days left']);
    expect(hostText(rendered, 'barLabel')).toEqual([
      ['Day ', 78, ' of ', 122],
      ['Week ', 11, ' of ', 18],
    ]);
  });

  it('names the last day rather than counting zero days left', () => {
    const rendered = render({
      season: { ...season, dayOfSeason: 122, daysRemaining: 0, elapsedFraction: 1 },
    });
    expect(hostText(rendered, 'daysLeftText')).toEqual(['Last day']);
  });

  it('keeps the plural honest on the final full day', () => {
    const rendered = render({ season: { ...season, daysRemaining: 1 } });
    expect(hostText(rendered, 'daysLeftText')).toEqual(['1 day left']);
  });

  it('speaks the bar as days, not as a bare fraction', () => {
    const rendered = render();
    const bar = rendered.root.findAll(
      (node) => node.type === 'View' && baseStyle(node.props.style) === 'bar'
    );
    expect(bar[0]?.props.accessibilityLabel).toBe(
      'Day 78 of 122 of SW Monsoon, 44 days left'
    );
  });

  it("badges the header with the season's own icon", () => {
    const rendered = render();
    const icons = rendered.root.findAll((node) => node.type === 'GardenIcon');
    expect(icons).toHaveLength(1);
    expect((icons[0]?.props as unknown as { name: string }).name).toBe('weather.rain');
  });
});

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

  it('states the two figures that size a bed on one line, and nothing else', () => {
    const rendered = render();
    expect(hostText(rendered, 'tileMeta')).toEqual([
      '25–40 days · ⇄15 cm',
      '90–110 days · ⇄150 cm',
      '60–80 days · ⇄60 cm',
    ]);
    // The card header already names the month and season, and the harvest
    // month is what the days say counted forward. Neither is on the card, on
    // the tile or above the group.
    expect(hostText(rendered, 'tileHarvest')).toEqual([]);
    expect(hostText(rendered, 'tileWindow')).toEqual([]);
    expect(hostText(rendered, 'tileCondition')).toEqual([]);
    expect(hostText(rendered, 'plantWindow')).toEqual([]);
  });

  it('drops the figures line rather than printing a placeholder', () => {
    const rendered = render({
      recommendations: [
        crop({
          daysToHarvest: null,
          harvestByLabel: null,
          spacingCm: null,
          spacingLabel: null,
        }),
      ],
    });
    expect(hostText(rendered, 'tileMeta')).toEqual([]);
    // The tile is still a name and a photo, and is still pressable.
    expect(tiles(rendered)).toHaveLength(1);
    expect(hostText(rendered, 'tileName')).toEqual(['Amaranthus']);
  });

  it('keeps whichever figures the catalog does state', () => {
    const rendered = render({
      recommendations: [crop({ daysToHarvest: null, harvestByLabel: null })],
    });
    expect(hostText(rendered, 'tileMeta')).toEqual(['⇄15 cm']);
  });

  it('compacts the calendar phrasing to its leading measurement', () => {
    const rendered = render({
      recommendations: [crop({ spacingCm: null, spacingLabel: '1.5–2 m apart with a trellis' })],
    });
    expect(hostText(rendered, 'tileMeta')).toEqual(['25–40 days · ⇄1.5–2 m']);
  });

  it('shows one pitch where the calendar states two, and speaks both', () => {
    const rendered = render({
      recommendations: [
        crop({ spacingCm: null, spacingLabel: '15 cm apart in rows 45 cm apart' }),
      ],
    });
    // The card carries the distance between plants; the row pitch would not fit
    // beside it, so it stays in the spoken label and in the catalog entry.
    expect(hostText(rendered, 'tileMeta')).toEqual(['25–40 days · ⇄15 cm']);
    expect(tiles(rendered)[0]?.props.accessibilityLabel).toContain(
      '15 cm apart in rows 45 cm apart'
    );
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
    // No warning tint, and no icon inside a tile — the card still does not mark
    // a closing window visually. The only icon on the card is the header badge.
    expect(tiles(rendered).map((node) => node.props.style)).toEqual(['tile', 'tile', 'tile']);
    const iconsInTiles = tiles(rendered).flatMap((tile) =>
      tile.findAll((node) => node.type === 'GardenIcon')
    );
    expect(iconsInTiles).toHaveLength(0);
  });

  it('spells the whole tile out for a screen reader', () => {
    const rendered = render({ recommendations: [snakeGourd] });
    // The deadline survives in speech even though nothing on screen shows it.
    expect(tiles(rendered)[0]?.props.accessibilityLabel).toBe(
      'Snake Gourd, last month to start, yield in 90–110 days, harvest by Dec, 150 cm apart, July–August window, Use a well-drained home-garden bed. Opens the catalog entry.'
    );
  });
});

describe('SeasonBlock at the calendar\'s widest', () => {
  it('renders every crop the month offers, in both groups', () => {
    // July is the fullest month the district calendar holds. The card states
    // the whole set rather than truncating it.
    const rendered = render({ recommendations: [...fiveSows, brinjal] });
    expect(tiles(rendered)).toHaveLength(6);
    expect(hostText(rendered, 'plantAction')).toEqual(['Sow', 'Transplant']);
  });
});

describe('SeasonBlock next month', () => {
  it('names the month it means, as a labelled line and not as tiles', () => {
    const rendered = render({ openingNext: ['Fenugreek', 'Palak'] });
    // Worded as the "Plant now in …" heading is, one date later.
    expect(hostText(rendered, 'openingNextTitle')).toEqual(['Plant in September']);
    expect(hostText(rendered, 'openingNextCrops')).toEqual(['Fenugreek · Palak']);
    // Still context: next month's crops never become cards of their own.
    expect(tiles(rendered)).toHaveLength(3);
  });

  it('falls back to "next month" when the calendar names no month', () => {
    const rendered = render({ openingNext: ['Fenugreek'], openingNextLabel: '' });
    expect(hostText(rendered, 'openingNextTitle')).toEqual(['Plant next month']);
  });

  it('stays inside the planting section rather than closing an empty month', () => {
    // Nothing is plantable, so the card explains the gap and stops there — a
    // next-month line under that copy would answer a question it did not raise.
    const rendered = render({
      plantingState: 'no_current_window',
      recommendations: [],
      openingNext: ['Fenugreek', 'Palak'],
    });
    expect(hostText(rendered, 'openingNextTitle')).toEqual([]);
    expect(hostText(rendered, 'openingNextCrops')).toEqual([]);
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
    const rendered = render({
      recommendations: [],
      district: 'Coimbatore',
      plantingState: 'no_current_window',
    });
    expect(hostText(rendered, 'emptyText')).toEqual([
      'No reviewed home-garden crop window is open in Coimbatore this month.',
    ]);
    expect(tiles(rendered)).toHaveLength(0);
  });

  it('asks for a district when none is set, and routes there', () => {
    const onPressDistrict = jest.fn();
    const rendered = render({
      recommendations: [],
      district: null,
      plantingState: 'missing_district',
      onPressDistrict,
    });
    expect(hostText(rendered, 'emptyText')).toEqual([
      'Planting suggestions need to know which Tamil Nadu district this farm is in.',
    ]);
    const link = rendered.root.findAll(
      (node) =>
        node.type === 'TouchableOpacity' && node.props.accessibilityLabel === 'Set your district. Opens my farm.'
    );
    TestRenderer.act(() => link[0]?.props.onPress?.());
    expect(onPressDistrict).toHaveBeenCalled();
  });

  it('explains when the source review has expired', () => {
    const rendered = render({
      recommendations: [],
      plantingState: 'review_expired',
    });
    expect(hostText(rendered, 'emptyText')).toEqual([
      'Planting guidance is hidden until its TNAU source review is renewed.',
    ]);
  });
});

describe('SeasonBlock evidence', () => {
  // The citations live in `TODAY_AGRONOMY_EVIDENCE` and in
  // `docs/tamil-nadu-reference-audit.md`, and the catalog entry each tile opens
  // states them. The daily card prints none of it — four lines of fine print
  // under the crops was the same fact a tap away from where it belongs.
  it('prints no source attribution on the card', () => {
    const rendered = render();
    expect(hostText(rendered, 'sourceMeta')).toEqual([]);
    expect(hostText(rendered, 'sourceLink')).toEqual([]);
    expect(rendered.root.findAll((node) => node.props.accessibilityRole === 'link')).toEqual([]);
  });

  // The review dates still govern the card even though they are not printed.
  it('still withholds guidance when the source review has lapsed', () => {
    const rendered = render({
      recommendations: [],
      plantingState: 'review_expired',
    });
    expect(tiles(rendered)).toHaveLength(0);
    expect(hostText(rendered, 'emptyText')).toEqual([
      'Planting guidance is hidden until its TNAU source review is renewed.',
    ]);
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

describe('SeasonBlock perennial care', () => {
  it('heads the reminder without counting the plants behind it', () => {
    const rendered = render({
      perennialCare: {
        count: 3,
        message: 'Mulch the banana circle before the rain sets in.',
        evidenceIds: ['tnau_kitchen_garden'],
        reviewedOn: '2026-08-16',
      },
    });
    expect(hostText(rendered, 'perennialTitle')).toEqual(['Perennial care']);
    expect(hostText(rendered, 'perennialText')).toEqual([
      'Mulch the banana circle before the rain sets in.',
    ]);
  });
});
