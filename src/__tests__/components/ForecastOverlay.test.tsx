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
    StyleSheet: { absoluteFillObject: {}, hairlineWidth: 1, create: (value: unknown) => value },
  };
});
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/components/GardenIcon', () => ({ GardenIcon: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/theme', () => ({
  useTheme: () => ({ primary: '#26734d', textInverse: '#fff' }),
}));
jest.mock('@/styles/forecastOverlayStyles', () => ({
  createStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));
jest.mock('@/components/FloatingTabBar', () => ({ TAB_BAR_HEIGHT: 64 }));
jest.mock('@/services/weather', () => ({ OPEN_METEO_ATTRIBUTION_URL: 'https://open-meteo.com/' }));

import React from 'react';
import { ForecastOverlay } from '@/components/today/ForecastOverlay';
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

const baseProps = {
  plotName: 'North Plot',
  district: 'Kanyakumari',
  source: 'plot' as const,
  stale: false,
  loading: false,
  jobsByDate: new Map([['2026-08-10', '2 watering jobs']]),
  onRetry: jest.fn(),
  onClose: jest.fn(),
};

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
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        React.createElement(ForecastOverlay, { ...baseProps, forecast: forecast() })
      );
    });
    const output = JSON.stringify(rendered.toJSON());
    expect(output).toContain('Today');
    expect(output).toContain('Next six days');
    expect(output).toContain('Tomorrow');
    expect(output).toContain('Showers');
    expect(
      rendered.root.findByProps({
        accessibilityLabel:
          'Tomorrow, Showers, 31° / 24°, 70% chance of rain, 4mm, 2 watering jobs',
      })
    ).toBeTruthy();
    expect(output).toContain('4mm');
    expect(output).toContain('2 watering jobs');
    expect(output).toContain('Weather data by Open-Meteo · CC BY 4.0');
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

    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        React.createElement(ForecastOverlay, {
          ...baseProps,
          forecast: staleForecast,
          stale: true,
        })
      );
    });
    const output = JSON.stringify(rendered.toJSON());

    expect(output).toContain('Next four days');
    expect(output).not.toContain('Next six days');
    // The two days before today are dropped, not rendered above Today.
    expect(output).not.toContain('2026-08-07');
    expect(output).toContain('Today');
  });

  it('renders stale and retry states', () => {
    let rendered!: RenderedTree;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        React.createElement(ForecastOverlay, {
          ...baseProps,
          forecast: null,
          stale: true,
          loading: false,
        })
      );
    });
    const output = JSON.stringify(rendered.toJSON());
    expect(output).toContain('Cached forecast');
    expect(output).toContain('No current forecast is available');
    expect(rendered.root.findByProps({ accessibilityLabel: 'Retry forecast' })).toBeTruthy();
  });
});
