/**
 * WeatherPlotCard — a single plot's 7-day forecast. Owns its own `useWeather`
 * call (keyed by the plot's coordinates) so it can stand alone or be stacked in
 * the WeatherDeck, each card fetching/caching its own location.
 *
 * Every row here is rendered unconditionally (dry days still get a rain slot,
 * dry weeks still get an advice line, the loading state reuses the real day
 * columns). The card's height must not depend on its weather data: WeatherDeck
 * stacks several plots' cards on top of each other, and a card that is taller
 * than the one in front of it spills out of the deck.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useWeather } from '@/hooks/useWeather';
import { wateringAdvice } from '@/services/weather';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/weatherCardStyles';
import { selectForecastDays, weatherEmoji, weekdayLabel } from '@/utils/weatherWords';

/** Placeholder glyph for a slot with nothing to show — holds the row's height. */
const EMPTY_SLOT = '–';
const SKELETON_DAYS = [0, 1, 2, 3, 4, 5, 6];

interface Props {
  plot: WeatherPlot;
  /** Set by WeatherDeck to the tallest card's height, so stacked cards align. */
  minHeight?: number;
}

export const WeatherPlotCard = React.memo(function WeatherPlotCard({
  plot,
  minHeight,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { forecast, rainSoon, loading, error } = useWeather(plot.lat, plot.lng);

  // Hide entirely when there's nothing useful to show (keeps dashboard clean offline).
  if ((!forecast || forecast.daily.length === 0) && !loading) {
    if (error) return null;
    return null;
  }

  const days = selectForecastDays(forecast).available;
  const advice = wateringAdvice(rainSoon);

  return (
    <View style={[styles.card, minHeight ? { minHeight } : null]}>
      <Text style={styles.title}>🌤️ 7-Day Forecast</Text>
      <Text style={styles.locationLabel}>📍 {plot.name}</Text>

      {/* Always rendered, in both states, so the card is the same height either way. */}
      <View style={[styles.weatherLine, rainSoon ? styles.weatherLineRain : styles.weatherLineDry]}>
        <Text style={styles.weatherLineEmoji}>{advice.emoji}</Text>
        <Text style={styles.weatherLineText} numberOfLines={1}>
          {advice.text}
        </Text>
      </View>

      <View style={styles.daysRow}>
        {loading && days.length === 0
          ? SKELETON_DAYS.map((i) => (
              <View key={`skeleton-${i}`} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{EMPTY_SLOT}</Text>
                <Text style={styles.dayEmoji}> </Text>
                <Text style={styles.dayTemp}>{EMPTY_SLOT}</Text>
                <Text style={[styles.dayRain, styles.dayRainEmpty]}>{EMPTY_SLOT}</Text>
              </View>
            ))
          : days.map((day) => (
              <View key={day.date} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{weekdayLabel(day.date)}</Text>
                <Text style={styles.dayEmoji}>{weatherEmoji(day)}</Text>
                <Text style={styles.dayTemp}>
                  {Math.round(day.tempMaxC)}°/{Math.round(day.tempMinC)}°
                </Text>
                <Text
                  style={[styles.dayRain, day.precipitationMm < 1 && styles.dayRainEmpty]}
                  numberOfLines={1}
                >
                  {day.precipitationMm >= 1 ? `${Math.round(day.precipitationMm)}mm` : EMPTY_SLOT}
                </Text>
              </View>
            ))}
      </View>
    </View>
  );
});
