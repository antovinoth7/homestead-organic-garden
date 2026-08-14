/** Full-screen, cached seven-day forecast for one plot. */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
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
import { OPEN_METEO_ATTRIBUTION_URL } from '@/services/weather';
import {
  describeDay,
  FALLBACK_BANNER_COPY,
  forecastDayLabel,
  formatForecastDate,
  formatRain,
  formatRainChance,
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
  jobsByDate: ReadonlyMap<string, string>;
  onRetry: () => void;
  onClose: () => void;
}

function dayTone(
  styles: ReturnType<typeof createStyles>,
  condition: WeatherConditionId
): StyleProp<ViewStyle> {
  switch (condition) {
    case 'heavy_rain':
    case 'heavy_showers':
    case 'thunderstorm':
    case 'rain':
      return styles.dayToneRain;
    case 'showers':
    case 'drizzle':
      return styles.dayToneShowers;
    case 'hot':
      return styles.dayToneHot;
    default:
      return styles.dayToneNeutral;
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
  const todayDescription = describeDay(today);
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

        {stale && (
          <View style={styles.staleBanner}>
            <Text style={styles.staleText}>
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
          <View style={styles.today}>
            <Text style={styles.todayLabel}>Today · {formatForecastDate(today.date)}</Text>
            <View style={styles.todayRow}>
              <Text style={styles.todayEmoji}>{todayDescription.emoji}</Text>
              <View style={styles.todayWeather}>
                <Text style={styles.todayTemp}>{formatTempRange(today)}</Text>
                <Text style={styles.todayMetrics}>
                  {formatRainChance(today)} rain · {formatRain(today)}
                </Text>
              </View>
              <Text style={styles.todayCondition}>{todayDescription.label}</Text>
            </View>
            <Text style={styles.todayJob}>
              {jobsByDate.get(today.date) ?? 'No garden jobs scheduled'}
            </Text>
          </View>
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
            {rows.map((day) => {
              const description = describeDay(day);
              const accessibility = `${forecastDayLabel(day.date, todayKey)}, ${
                description.label
              }, ${formatTempRange(day)}, ${formatRainChance(day)} chance of rain, ${formatRain(
                day
              )}, ${jobsByDate.get(day.date) ?? 'no garden jobs scheduled'}`;
              return (
                <View
                  key={day.date}
                  style={[styles.dayRow, dayTone(styles, description.id)]}
                  accessible
                  accessibilityLabel={accessibility}
                >
                  <View style={styles.dayTopRow}>
                    <Text style={styles.dayName}>{forecastDayLabel(day.date, todayKey)}</Text>
                    <Text style={styles.dayEmoji}>{description.emoji}</Text>
                    <Text style={styles.dayCondition}>{description.label}</Text>
                  </View>
                  <View style={styles.dayDetailRow}>
                    <Text style={styles.dayTemp}>{formatTempRange(day)}</Text>
                    <Text style={styles.dayRain}>{formatRainChance(day)} rain</Text>
                    <Text style={styles.dayRain}>{formatRain(day)}</Text>
                    <Text style={styles.dayJob} numberOfLines={2}>
                      {jobsByDate.get(day.date) ?? 'No jobs'}
                    </Text>
                  </View>
                </View>
              );
            })}
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
