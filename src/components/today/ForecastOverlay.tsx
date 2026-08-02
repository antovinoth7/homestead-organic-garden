/**
 * ForecastOverlay — one plot's seven days, opened from its weather chip.
 *
 * Purely presentational: the forecast was already fetched when the plot cards
 * painted, so this opens instantly and works from cache offline. It renders as
 * a full-screen sibling of the Today list rather than an RN `Modal` — a Modal
 * gets its own native window, which breaks the floating tab bar's transform and
 * the safe-area insets.
 *
 * Open-Meteo gives daily aggregates only, so nothing here promises a time of
 * day; when the reading isn't actually this plot's, the banner says so.
 */

import React, { useEffect, useMemo } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeatherConditionId, WeatherForecast } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/forecastOverlayStyles';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import {
  describeDay,
  FALLBACK_BANNER_COPY,
  formatRain,
  formatTempRange,
  weekdayLabel,
} from '@/utils/weatherWords';

interface Props {
  plotName: string;
  district: string | null;
  /** 'plot' means a real pin; anything else needs the caveat banner. */
  source: 'plot' | 'district' | 'default';
  forecast: WeatherForecast | null;
  /** Whether the forecast is past its freshness window. */
  stale: boolean;
  /** Forecast date → job text, from `useTodayBrief().jobsByDateFor`. */
  jobsByDate: ReadonlyMap<string, string>;
  onClose: () => void;
}

/**
 * The card tint for a day, picked by its condition — the same style-object
 * lookup `PlotCard` uses for its weather chip, so no colour is computed in the
 * render path and every tint stays a theme token.
 */
function dayTone(
  styles: ReturnType<typeof createStyles>,
  condition: WeatherConditionId
): StyleProp<ViewStyle> {
  switch (condition) {
    case 'heavy_rain':
    case 'rain':
      return styles.dayToneRain;
    case 'showers':
      return styles.dayToneShowers;
    case 'hot':
      return styles.dayToneHot;
    default:
      return styles.dayToneNeutral;
  }
}

/** "05:50" from an ISO timestamp. */
function formatFetchedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export const ForecastOverlay = React.memo(function ForecastOverlay({
  plotName,
  district,
  source,
  forecast,
  stale,
  jobsByDate,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const days = forecast?.daily.slice(0, 7) ?? [];
  const today = days[0] ?? null;
  const todayDescription = describeDay(today);
  const fetchedAt = formatFetchedAt(forecast?.fetched_at ?? null);

  return (
    <View style={styles.overlay}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.back}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back to today"
        >
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forecast</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {plotName}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16,
        }}
      >
        {source !== 'plot' && (
          <View style={styles.banner}>
            <Text style={styles.bannerGlyph}>📍</Text>
            <Text style={styles.bannerText}>{FALLBACK_BANNER_COPY[source](district)}</Text>
          </View>
        )}

        {today !== null && (
          <View style={styles.today}>
            <Text style={styles.todayLabel}>Today · {weekdayLabel(today.date)}</Text>
            <View style={styles.todayRow}>
              <Text style={styles.todayEmoji}>{todayDescription.emoji}</Text>
              <Text style={styles.todayTemp}>{formatTempRange(today)}</Text>
              <Text style={styles.todayRain}>{formatRain(today)}</Text>
              <Text style={styles.todayCondition}>{todayDescription.label}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>Seven days</Text>

        {days.length === 0 ? (
          <Text style={styles.noData}>No forecast cached for this plot yet.</Text>
        ) : (
          <View style={styles.days}>
            {days.map((day) => {
              const description = describeDay(day);
              return (
                <View key={day.date} style={[styles.dayRow, dayTone(styles, description.id)]}>
                  <Text style={styles.dayName}>{weekdayLabel(day.date)}</Text>
                  <Text style={styles.dayEmoji}>{description.emoji}</Text>
                  <Text style={styles.dayTemp}>{formatTempRange(day)}</Text>
                  <Text style={styles.dayRain}>{formatRain(day)}</Text>
                  <Text style={styles.dayJob} numberOfLines={1}>
                    {jobsByDate.get(day.date) ?? '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Source · Open-Meteo
            {fetchedAt ? `\nFetched ${fetchedAt}${stale ? ' · cached offline' : ''}` : ''}
            {`\n${plotName}${district ? ` · ${district}` : ''}`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
});
