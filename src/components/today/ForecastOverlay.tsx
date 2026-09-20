/** Full-screen, cached seven-day forecast for one plot. */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  LayoutChangeEvent,
  Linking,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { GardenIcon } from '@/components/GardenIcon';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DailyWeather, WeatherForecast } from '@/types/database.types';
import { Theme } from '@/theme/colors';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/forecastOverlayStyles';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { OPEN_METEO_ATTRIBUTION_URL } from '@/services/weather';
import { DayJobs, formatJobText } from '@/utils/upcomingJobs';
import { TASK_LABELS } from '@/utils/taskConstants';
import { WeatherTone, weatherTone } from '@/utils/weatherTone';
import {
  describeDay,
  FALLBACK_BANNER_COPY,
  forecastDayLabel,
  formatForecastDate,
  formatRain,
  formatRainChance,
  formatTemp,
  formatTempRange,
  forecastSectionLabel,
  selectForecastDays,
} from '@/utils/weatherWords';

interface Props {
  plotName: string;
  district: string | null;
  source: 'plot' | 'district' | 'default';
  forecast: WeatherForecast | null;
  stale: boolean;
  loading: boolean;
  jobsByDate: ReadonlyMap<string, DayJobs>;
  onRetry: () => void;
  onClose: () => void;
}

type Styles = ReturnType<typeof createStyles>;

/**
 * The rail down the left edge of a day card, and the ink its icon borrows.
 *
 * One 3px stripe rather than a tinted card: the condition is worth marking, but
 * not worth the whole surface. `neutral` — cloud, fog, no forecast — draws a
 * hairline-coloured rail, which is to say it draws nothing, because a grey day
 * is not news.
 */
function railTone(styles: Styles, theme: Theme, tone: WeatherTone): { rail: StyleProp<ViewStyle>; ink: string } {
  switch (tone) {
    case 'rain':
      return { rail: styles.dayRailRain, ink: theme.infoDark };
    case 'showers':
      return { rail: styles.dayRailShowers, ink: theme.info };
    case 'clear':
      return { rail: styles.dayRailClear, ink: theme.accent };
    case 'hot':
      return { rail: styles.dayRailHot, ink: theme.warningDark };
    case 'storm':
      return { rail: styles.dayRailStorm, ink: theme.purpleDark };
    case 'neutral':
      return { rail: styles.dayRailNeutral, ink: theme.textTertiary };
  }
}

function formatFetchedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Spoken as one sentence, so a day is heard whole rather than as five fragments. */
function dayAccessibilityLabel(day: DailyWeather, dayLabel: string, jobText: string): string {
  const description = describeDay(day);
  return [
    dayLabel,
    description.label,
    formatTempRange(day),
    `${formatRainChance(day)} chance of rain`,
    formatRain(day),
    jobText === '—' ? 'no garden jobs scheduled' : jobText,
  ].join(', ');
}

interface TodayCardProps {
  day: DailyWeather;
  jobs: DayJobs | undefined;
  styles: Styles;
  theme: Theme;
}

/**
 * Today, on the hero green — the same ground as the header this overlay covers,
 * so the day the grower is standing in stays the brightest thing on screen.
 *
 * The jobs figure is the total. Overdue work sits beneath it in the alert ink
 * rather than in front of the total, because the two used to run together as
 * "31 overdue · 46 jobs" and read as seventy-seven pieces of work.
 */
const ForecastTodayCard = React.memo(function ForecastTodayCard({
  day,
  jobs,
  styles,
  theme,
}: TodayCardProps): React.JSX.Element {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const description = describeDay(day);
  const count = jobs?.count ?? 0;
  const overdue = jobs?.overdue ?? 0;
  const topLabel = jobs?.topType ? TASK_LABELS[jobs.topType] : null;

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  const note = overdue > 0 ? `${overdue} overdue` : topLabel;
  const noteStyle: StyleProp<TextStyle> = [
    styles.todayStatNote,
    overdue > 0 ? styles.todayStatNoteAlert : null,
  ];

  return (
    <View
      style={styles.today}
      onLayout={onLayout}
      accessible
      accessibilityLabel={dayAccessibilityLabel(day, 'Today', formatJobText(jobs))}
    >
      {size.width > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
          <Defs>
            <SvgLinearGradient id="forecastTodayGround" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={theme.heroGradientStart} />
              <Stop offset="1" stopColor={theme.heroGradientEnd} />
            </SvgLinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} fill="url(#forecastTodayGround)" />
        </Svg>
      )}

      <View style={styles.todayEyebrowRow}>
        <Text style={styles.todayEyebrow}>Today · {formatForecastDate(day.date)}</Text>
        <Text style={styles.todayCondition}>{description.label}</Text>
      </View>

      <View style={styles.todayFigureRow}>
        <GardenIcon name={description.iconKey} size={34} color={theme.heroText} />
        <Text style={styles.todayTemp}>{formatTempRange(day)}</Text>
      </View>

      <View style={styles.todayPanel}>
        <View style={styles.todayStat}>
          <Text style={styles.todayStatValue}>{formatRainChance(day)}</Text>
          <Text style={styles.todayStatLabel}>Chance</Text>
        </View>
        <View style={styles.todayStatDivider} />
        <View style={styles.todayStat}>
          <Text style={styles.todayStatValue}>{formatRain(day)}</Text>
          <Text style={styles.todayStatLabel}>Rainfall</Text>
        </View>
        <View style={styles.todayStatDivider} />
        <View style={styles.todayStat}>
          <Text style={styles.todayStatValue}>{count}</Text>
          <Text style={styles.todayStatLabel}>{count === 1 ? 'Job' : 'Jobs'}</Text>
          {note !== null && <Text style={noteStyle}>{note}</Text>}
        </View>
      </View>
    </View>
  );
});

interface DayCardProps {
  day: DailyWeather;
  dayLabel: string;
  jobs: DayJobs | undefined;
  styles: Styles;
  theme: Theme;
}

const ForecastDayCard = React.memo(function ForecastDayCard({
  day,
  dayLabel,
  jobs,
  styles,
  theme,
}: DayCardProps): React.JSX.Element {
  const description = describeDay(day);
  const tone = railTone(styles, theme, weatherTone(description.id));
  const jobText = formatJobText(jobs);
  const jobStyle: StyleProp<TextStyle> = [
    styles.dayJob,
    jobs && jobs.overdue > 0 ? styles.dayJobOverdue : null,
  ];

  return (
    <View
      style={styles.dayCard}
      accessible
      accessibilityLabel={dayAccessibilityLabel(day, dayLabel, jobText)}
    >
      <View style={[styles.dayRail, tone.rail]} />

      <View style={styles.dayTopRow}>
        <Text style={styles.dayName}>{dayLabel}</Text>
        <Text style={styles.dayTemp}>
          {formatTemp(day.tempMaxC)}
          <Text style={styles.dayTempMin}> / {formatTemp(day.tempMinC)}</Text>
        </Text>
      </View>

      <View style={styles.dayMetaRow}>
        <GardenIcon name={description.iconKey} size={15} color={tone.ink} />
        <Text style={styles.dayConditionLabel}>{description.label}</Text>
        <View style={styles.daySpacer} />
        <Text style={styles.dayRain} numberOfLines={1}>
          {formatRainChance(day)} chance · {formatRain(day)}
        </Text>
      </View>

      {jobText !== '—' && <Text style={jobStyle}>{jobText}</Text>}
    </View>
  );
});

export const ForecastOverlay = React.memo(function ForecastOverlay({
  plotName,
  district,
  source,
  forecast,
  stale,
  loading,
  jobsByDate,
  onRetry,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { today, future, available, todayKey } = selectForecastDays(forecast);
  const fetchedAt = formatFetchedAt(forecast?.fetched_at ?? null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const openAttribution = useCallback(() => {
    void Linking.openURL(OPEN_METEO_ATTRIBUTION_URL).catch(() => undefined);
  }, []);

  const rows = today ? future : available;

  return (
    <View style={styles.overlay}>
      <ScreenHeader
        title="Forecast"
        onBack={onClose}
        backAccessibilityLabel="Back to today"
        right={
          <View style={styles.pill}>
            <Text style={styles.pillText} numberOfLines={1}>
              {plotName}
            </Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16,
        }}
      >
        {source !== 'plot' && (
          <View style={styles.notice}>
            <GardenIcon name="general.location" size={16} color={theme.textSecondary} />
            <Text style={styles.noticeText}>{FALLBACK_BANNER_COPY[source](district)}</Text>
          </View>
        )}

        {stale && (
          <View style={[styles.notice, styles.noticeStale]}>
            <Text style={styles.noticeText}>
              Cached forecast · reconnect and retry for current data
            </Text>
            <TouchableOpacity
              onPress={onRetry}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Refresh forecast"
            >
              <Text style={styles.retryLink}>{loading ? 'Refreshing…' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {today !== null && (
          <ForecastTodayCard
            day={today}
            jobs={jobsByDate.get(today.date)}
            styles={styles}
            theme={theme}
          />
        )}

        <Text style={styles.sectionLabel}>
          {forecastSectionLabel(today !== null, rows.length)}
        </Text>

        {available.length === 0 ? (
          <View style={styles.noDataBlock}>
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <Text style={styles.noData}>No current forecast is available for this plot.</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={onRetry}
                  accessibilityRole="button"
                  accessibilityLabel="Retry forecast"
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.days}>
            {rows.map((day) => (
              <ForecastDayCard
                key={day.date}
                day={day}
                dayLabel={forecastDayLabel(day.date, todayKey)}
                jobs={jobsByDate.get(day.date)}
                styles={styles}
                theme={theme}
              />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {fetchedAt ? `Updated ${fetchedAt}${stale ? ' · cached offline' : ''}\n` : ''}
            {plotName}
            {district ? ` · ${district}` : ''}
          </Text>
          <Text
            style={styles.attributionLink}
            onPress={openAttribution}
            accessibilityRole="link"
            accessibilityLabel="Weather data by Open-Meteo, licensed CC BY 4.0"
          >
            Weather data by Open-Meteo · CC BY 4.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
});
