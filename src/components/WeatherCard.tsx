/**
 * WeatherCard (Phase C, C.3). Resolves the farm's plot locations and renders a
 * 7-day forecast for each: a single card for one plot, or a stacked swipeable
 * deck (`WeatherDeck`) when there are several.
 */

import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useWeatherLocations } from '@/hooks/useWeatherLocations';
import { WeatherPlotCard } from '@/components/WeatherPlotCard';
import { WeatherDeck } from '@/components/WeatherDeck';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/weatherCardStyles';

export const WeatherCard = React.memo(function WeatherCard(): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { plots, loading } = useWeatherLocations();

  // Nothing resolved yet: while the config loads, hold the card's space with a
  // spinner so the dashboard doesn't jump when the forecast arrives.
  if (plots.length === 0) {
    if (loading) {
      return (
        <View style={styles.outer}>
          <View style={[styles.card, styles.loadingCard]}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        </View>
      );
    }
    return null;
  }

  if (plots.length === 1) {
    return (
      <View style={styles.outer}>
        <WeatherPlotCard plot={plots[0]!} />
      </View>
    );
  }

  return <WeatherDeck plots={plots} />;
});
