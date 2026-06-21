/**
 * WeatherPlotCard — a single plot's 7-day forecast. Owns its own `useWeather`
 * call (keyed by the plot's coordinates) so it can stand alone or be stacked in
 * the WeatherDeck, each card fetching/caching its own location.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { DailyWeather } from '@/types/database.types';
import { useWeather } from '@/hooks/useWeather';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/weatherCardStyles';

function weekdayLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function weatherEmoji(day: DailyWeather): string {
  if (day.precipitationMm >= 10) return '🌧️';
  if (day.precipitationMm >= 2) return '🌦️';
  if (day.tempMaxC >= 35) return '🔥';
  return '☀️';
}

interface Props {
  plot: WeatherPlot;
}

export const WeatherPlotCard = React.memo(function WeatherPlotCard({
  plot,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { forecast, rainSoon, loading, error } = useWeather(plot.lat, plot.lng);

  // Hide entirely when there's nothing useful to show (keeps dashboard clean offline).
  if ((!forecast || forecast.daily.length === 0) && !loading) {
    if (error) return null;
    return null;
  }

  const days = forecast?.daily.slice(0, 7) ?? [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🌤️ 7-Day Forecast</Text>
      <Text style={styles.locationLabel}>📍 {plot.name}</Text>
      {rainSoon && (
        <View style={styles.rainAlert}>
          <Text>🌧️</Text>
          <Text style={styles.rainAlertText}>Rain expected soon — you may skip watering.</Text>
        </View>
      )}
      {loading && days.length === 0 ? (
        <Text style={styles.muted}>Loading forecast…</Text>
      ) : (
        <View style={styles.daysRow}>
          {days.map((day) => (
            <View key={day.date} style={styles.dayCol}>
              <Text style={styles.dayLabel}>{weekdayLabel(day.date)}</Text>
              <Text style={styles.dayEmoji}>{weatherEmoji(day)}</Text>
              <Text style={styles.dayTemp}>
                {Math.round(day.tempMaxC)}°/{Math.round(day.tempMinC)}°
              </Text>
              {day.precipitationMm >= 1 && (
                <Text style={styles.dayRain}>{Math.round(day.precipitationMm)}mm</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});
