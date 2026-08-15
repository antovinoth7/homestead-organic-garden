/* The repository's Jest preset is Node-only, so this test supplies the minimal
 * native host boundary needed to render and inspect the forecast component. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    ActivityIndicator: host('ActivityIndicator'),
    ScrollView: host('ScrollView'),
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
    BackHandler: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
    Linking: { openURL: jest.fn(async () => undefined) },
    StyleSheet: {
      absoluteFill: {},
      absoluteFillObject: {},
      hairlineWidth: 1,
      create: (value: unknown) => value,
    },
  };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
// The today card paints its gradient ground with SVG. Nothing here inspects it,
// but it has to render without a native host.
jest.mock('react-native-svg', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };
  return {
    __esModule: true,
    default: host('Svg'),
    Defs: host('Defs'),
    LinearGradient: host('LinearGradient'),
    Rect: host('Rect'),
    Stop: host('Stop'),
  };
});
jest.mock('@/components/GardenIcon', () => ({ GardenIcon: () => null }));
jest.mock('@/components/ScreenHeader', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    ScreenHeader: ({ title, right }: { title: string; right?: React.ReactNode }) =>
      React.createElement('ScreenHeader', { title }, right),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({
    primary: '#26734d',
    textInverse: '#fff',
    textTertiary: '#645242',
    textSecondary: '#4a3828',
    heroText: '#fff',
    heroGradientStart: '#1a4a2e',
    heroGradientEnd: '#0f2d1a',
    info: '#2196f3',
    infoDark: '#1565C0',
    accent: '#c8842a',
    warningDark: '#E65100',
    purpleDark: '#7B1FA2',
  }),
}));
jest.mock('@/styles/forecastOverlayStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));
jest.mock('@/components/FloatingTabBar', () => ({ TAB_BAR_HEIGHT: 64 }));
jest.mock('@/services/weather', () => ({ OPEN_METEO_ATTRIBUTION_URL: 'https://open-meteo.com/' }));

import React from 'react';
import { ForecastOverlay } from '@/components/today/ForecastOverlay';
import type { DayJobs } from '@/utils/upcomingJobs';
import { makeDailyWeather, makeWeatherForecast } from '../fixtures/today.fixtures';

interface RenderedTree {
  toJSON: () => unknown;
  root: { findByProps: (props: Record<string, unknown>) => unknown };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

function forecast() {
  return makeWeatherForecast(
    Array.from({ length: 7 }, (_, index) =>
      makeDailyWeather({
        date: `2026-08-${String(index + 9).padStart(2, '0')}`,
        weatherCode: index === 1 ? 80 : 2,
        precipitationMm: index === 1 ? 4 : 0,
        precipitationProbabilityPct: index === 1 ? 70 : 10,
      })
    ),
    { fetched_at: '2026-08-09T04:00:00.000Z' }
  );
}

const jobs = (count: number, overdue: number, topType: DayJobs['topType']): DayJobs => ({
  count,
  overdue,
  topType,
});

const baseProps = {
  plotName: 'North Plot',
  district: 'Kanyakumari',
  source: 'plot' as const,
  stale: false,
  loading: false,
  jobsByDate: new Map<string, DayJobs>([['2026-08-10', jobs(2, 0, 'water')]]),
  onRetry: jest.fn(),
  onClose: jest.fn(),
};

function render(props: Partial<typeof baseProps> & { forecast: unknown }): RenderedTree {
  let rendered!: RenderedTree;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      React.createElement(ForecastOverlay, { ...baseProps, ...props } as never)
    );
  });
  return rendered;
}

describe('ForecastOverlay', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-09T06:00:00.000Z'));
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    // React 19 deprecates this renderer, but it remains the installed renderer
    // for this Node-only Jest setup and is sufficient for static host output.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    jest.useRealTimers();
  });

  it('renders Today plus six future dates with garden-essential details and attribution', () => {
    const rendered = render({ forecast: forecast() });
    const output = JSON.stringify(rendered.toJSON());
    expect(output).toContain('Today');
    expect(output).toContain('Next six days');
    expect(output).toContain('Tomorrow');
    expect(output).toContain('Showers');
    expect(
      rendered.root.findByProps({
        accessibilityLabel:
          'Tomorrow, Showers, 31° / 24°, 70% chance of rain, 4 mm, 2 jobs · Water',
      })
    ).toBeTruthy();
    expect(output).toContain('4 mm');
    expect(output).toContain('2 jobs · Water');
    expect(output).toContain('Weather data by Open-Meteo · CC BY 4.0');
  });

  // A rainless day is a forecast, not a gap in one. It used to render the same
  // em dash `formatRainChance` uses for data that never arrived.
  it('words a dry day rather than dashing it', () => {
    const output = JSON.stringify(render({ forecast: forecast() }).toJSON());
    expect(output).toContain('dry');
  });

  // The total and its overdue share used to run together as "31 overdue · 46
  // jobs", which reads as seventy-seven pieces of work.
  it('sets the day total and its overdue share as separate figures', () => {
    const rendered = render({
      forecast: forecast(),
      jobsByDate: new Map<string, DayJobs>([['2026-08-09', jobs(46, 31, 'water')]]),
    });
    const output = JSON.stringify(rendered.toJSON());
    expect(output).toContain('31 overdue');
    expect(output).not.toContain('31 overdue · 46 jobs');
    expect(
      rendered.root.findByProps({
        accessibilityLabel:
          'Today, Partly cloudy, 31° / 24°, 10% chance of rain, dry, 46 jobs · Water · 31 overdue',
      })
    ).toBeTruthy();
  });

  // A cached forecast keeps the days it has already passed, so `selectForecastDays`
  // trims it. The heading used to be hardcoded and announced six days over four.
  it('matches the heading to a trimmed window from a stale cache', () => {
    const staleForecast = makeWeatherForecast(
      Array.from({ length: 7 }, (_, index) =>
        makeDailyWeather({ date: `2026-08-${String(index + 7).padStart(2, '0')}` })
      ),
      { fetched_at: '2026-08-07T04:00:00.000Z' }
    );

    const output = JSON.stringify(render({ forecast: staleForecast, stale: true }).toJSON());

    expect(output).toContain('Next four days');
    expect(output).not.toContain('Next six days');
    // The two days before today are dropped, not rendered above Today.
    expect(output).not.toContain('2026-08-07');
    expect(output).toContain('Today');
  });

  it('renders stale and retry states', () => {
    const rendered = render({ forecast: null, stale: true, loading: false });
    const output = JSON.stringify(rendered.toJSON());
    expect(output).toContain('Cached forecast');
    expect(output).toContain('No current forecast is available');
    expect(rendered.root.findByProps({ accessibilityLabel: 'Retry forecast' })).toBeTruthy();
  });
});
