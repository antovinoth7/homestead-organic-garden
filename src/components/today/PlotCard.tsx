/**
 * PlotCard — one plot's standing on the Today screen.
 *
 * A plot is a `LocationConfig.parentLocations` entry; the app has one farm, so
 * these are the units a grower actually walks between. The card answers, in
 * order: how much work is owed here, what this plot is, what is going on, what
 * the sky is doing, and how the plants are holding up.
 *
 * The context line is the only sentence on the card, and the only part that is
 * not a standing total — see `utils/plotBriefLine`. It is deliberately not a
 * tap target: the title and the weather chip already own theirs, and a third in
 * the middle would leave nowhere unambiguous to press.
 *
 * The weather chip is its own tap target — it opens the plot's forecast — so it
 * carries the 44px minimum rather than relying on the card behind it. The four
 * health counts are targets too: each opens the plant list filtered to that
 * status *and* to this plot, so the list it opens holds exactly the plants the
 * count named. They are one equal-width column per `HealthStatus`, in the order
 * the plant list's filter sheet shows them.
 */

import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PlotBrief } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plotCardStyles';
import { formatTempRange } from '@/utils/weatherWords';

/** The health buckets the plant list can be filtered by. */
export type PlotHealthFilter = 'healthy' | 'stressed' | 'recovering' | 'sick';

interface Props {
  plot: PlotBrief;
  onPress: (plotId: string) => void;
  onPressWeather: (plotId: string) => void;
  onPressHealth: (plotId: string, status: PlotHealthFilter) => void;
  onPressBeds: () => void;
}

/**
 * "1 DUE · 53 OVERDUE" — only what is non-zero, so a quiet plot states that it
 * is quiet instead of showing a row of noughts.
 */
function buildCounts(plot: PlotBrief): { key: string; label: string; tone: 'due' | 'overdue' }[] {
  const parts: { key: string; label: string; tone: 'due' | 'overdue' }[] = [];
  if (plot.dueCount > 0) parts.push({ key: 'due', label: `${plot.dueCount} due`, tone: 'due' });
  if (plot.overdueCount > 0) {
    parts.push({ key: 'overdue', label: `${plot.overdueCount} overdue`, tone: 'overdue' });
  }
  return parts;
}

export const PlotCard = React.memo(function PlotCard({
  plot,
  onPress,
  onPressWeather,
  onPressHealth,
  onPressBeds: handlePressBeds,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => onPress(plot.id), [onPress, plot.id]);
  const handlePressWeather = useCallback(() => onPressWeather(plot.id), [onPressWeather, plot.id]);
  const handlePressHealthy = useCallback(
    () => onPressHealth(plot.id, 'healthy'),
    [onPressHealth, plot.id]
  );
  const handlePressStressed = useCallback(
    () => onPressHealth(plot.id, 'stressed'),
    [onPressHealth, plot.id]
  );
  const handlePressRecovering = useCallback(
    () => onPressHealth(plot.id, 'recovering'),
    [onPressHealth, plot.id]
  );
  const handlePressSick = useCallback(
    () => onPressHealth(plot.id, 'sick'),
    [onPressHealth, plot.id]
  );

  const { weather, health } = plot;
  const counts = buildCounts(plot);
  const countsLabel = counts.length > 0 ? counts.map((c) => c.label).join(', ') : 'nothing due';
  const isWet =
    weather.condition === 'heavy_rain' ||
    weather.condition === 'rain' ||
    weather.condition === 'showers' ||
    weather.condition === 'heavy_showers' ||
    weather.condition === 'drizzle' ||
    weather.condition === 'thunderstorm';
  const isHot = weather.condition === 'hot';
  const chipTone = isWet ? styles.chipWet : isHot ? styles.chipHot : styles.chipNeutral;
  const chipTextTone = isWet
    ? styles.chipTextWet
    : isHot
    ? styles.chipTextHot
    : styles.chipTextNeutral;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.titleRow}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${plot.name}, ${countsLabel}`}
      >
        <Text style={styles.name} numberOfLines={1}>
          {plot.name}
        </Text>
        <Text style={styles.counts}>
          {counts.length === 0 && <Text style={styles.countsMuted}>Nothing due</Text>}
          {counts.map((part, index) => (
            <Text key={part.key}>
              {index > 0 && <Text style={styles.countsMuted}> · </Text>}
              <Text style={part.tone === 'overdue' ? styles.countsOverdue : styles.countsDue}>
                {part.label}
              </Text>
            </Text>
          ))}
          <Text style={styles.countsMuted}> ›</Text>
        </Text>
      </TouchableOpacity>

      {/* The bed count is a link into the Beds tab, and the crop figure names
          its scope: everything on this card counts pots and ground only, which
          is exactly what the plant list shows when a health count is tapped. */}
      <Text style={styles.meta} numberOfLines={2}>
        {plot.district !== null && `${plot.district} · `}
        {plot.bedCount > 0 && (
          <>
            <Text
              style={styles.metaLink}
              onPress={handlePressBeds}
              accessibilityRole="button"
              accessibilityLabel={`${plot.bedCount} ${
                plot.bedCount === 1 ? 'bed' : 'beds'
              }. Opens the beds tab.`}
            >
              {plot.bedCount} {plot.bedCount === 1 ? 'bed' : 'beds'} ›
            </Text>
            {' · '}
          </>
        )}
        {plot.cropCount} in pots & ground
      </Text>

      {(plot.line.headline !== null || plot.line.freshness !== null) && (
        <Text style={styles.line} numberOfLines={2}>
          {plot.line.headline !== null && (
            <Text style={styles.lineStrong}>{plot.line.headline}</Text>
          )}
          {plot.line.headline !== null && plot.line.freshness !== null && ' '}
          {plot.line.freshness !== null && (
            <Text style={styles.lineMuted}>{plot.line.freshness}</Text>
          )}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.chip, chipTone]}
        onPress={handlePressWeather}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Forecast for ${plot.name}. ${
          weather.conditionLabel
        }, ${formatTempRange(weather.today)}${weather.stale ? ', cached forecast' : ''}`}
      >
        <Text style={[styles.chipText, chipTextTone]} numberOfLines={1}>
          {weather.conditionEmoji} {formatTempRange(weather.today)} · {weather.conditionLabel}
          {weather.stale ? ' · Cached' : ''}
        </Text>
        <Text style={[styles.chipLink, chipTextTone]}>7 days ›</Text>
      </TouchableOpacity>

      <View style={styles.healthRow}>
        <TouchableOpacity
          style={styles.healthItem}
          onPress={handlePressHealthy}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${health.healthy} healthy plants in ${plot.name}. Opens the plant list.`}
        >
          <View style={styles.healthValueRow}>
            <View style={[styles.healthDot, styles.healthDotHealthy]} />
            <Text style={styles.healthValue}>{health.healthy}</Text>
          </View>
          <Text style={styles.healthLabel}>Healthy</Text>
        </TouchableOpacity>
        <View style={styles.healthDivider} />
        <TouchableOpacity
          style={styles.healthItem}
          onPress={handlePressStressed}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${health.stressed} stressed plants in ${plot.name}. Opens the plant list.`}
        >
          <View style={styles.healthValueRow}>
            <View style={[styles.healthDot, styles.healthDotStressed]} />
            <Text style={styles.healthValue}>{health.stressed}</Text>
          </View>
          <Text style={styles.healthLabel}>Stressed</Text>
        </TouchableOpacity>
        <View style={styles.healthDivider} />
        <TouchableOpacity
          style={styles.healthItem}
          onPress={handlePressRecovering}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${health.recovering} recovering plants in ${plot.name}. Opens the plant list.`}
        >
          <View style={styles.healthValueRow}>
            <View style={[styles.healthDot, styles.healthDotRecovering]} />
            <Text style={styles.healthValue}>{health.recovering}</Text>
          </View>
          <Text style={styles.healthLabel}>Recovering</Text>
        </TouchableOpacity>
        <View style={styles.healthDivider} />
        <TouchableOpacity
          style={styles.healthItem}
          onPress={handlePressSick}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${health.sick} sick plants in ${plot.name}. Opens the plant list.`}
        >
          <View style={styles.healthValueRow}>
            <View style={[styles.healthDot, styles.healthDotSick]} />
            <Text style={styles.healthValue}>{health.sick}</Text>
          </View>
          <Text style={styles.healthLabel}>Sick</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});
