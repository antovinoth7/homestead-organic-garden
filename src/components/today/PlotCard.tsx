/**
 * PlotCard — one plot's standing on the Today screen.
 *
 * A plot is a `LocationConfig.parentLocations` entry; the app has one farm, so
 * these are the units a grower actually walks between. The card answers, in
 * order: where this is and what the sky is doing, how much work is owed here,
 * what is going on, and what stands in the ground.
 *
 * The identity block — plot name and today's temperatures — sits above a
 * full-bleed hairline and reads as the card's header. The counts always own the
 * row under it, whatever the data, so one count and two produce the same card
 * skeleton and the plot name always gets its full width.
 *
 * The context lines are the only prose on the card, and the only part that is
 * not a standing total — see `utils/plotBriefLine`. The headline and the
 * freshness tail are two statements, so they take a row each. They are
 * deliberately not a tap target: the name, the forecast pill and the counts row
 * already own theirs.
 *
 * Two destinations, one chevron. The forecast pill opens the plot's seven-day
 * view; the `›` on the counts row means one thing only — open the plot.
 *
 * The inventory is two tiles side by side: plants left, beds right. Each states
 * its total — `cropCount` over the four health counts it is the sum of,
 * `bedCount` over the four lifecycles — then that total split into rows. Each
 * health row is a target that opens the plant list filtered to that status *and*
 * to this plot, so the list holds exactly the plants the row named; they run in
 * the order the plant list's filter sheet shows them. The bed rows are read-only
 * — no list is filtered by lifecycle — but the bed total is the link into the
 * Beds tab.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
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

/** The rows are 30px tall; this lifts each touch area clear of the 44px floor. */
const ROW_HIT_SLOP = { top: 7, bottom: 7, left: 0, right: 0 };

/**
 * "1 due", "53 overdue" — only what is non-zero, so a quiet plot states that it
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

  const { weather, health, bedStatus } = plot;
  const counts = buildCounts(plot);
  const countsLabel = counts.length > 0 ? counts.map((c) => c.label).join(', ') : 'nothing due';
  // The visible unit is capitalised to match the status words under it; the
  // spoken one stays lowercase so the label reads as a sentence.
  const bedWord = plot.bedCount === 1 ? 'Bed' : 'Beds';
  const bedWordSpoken = plot.bedCount === 1 ? 'bed' : 'beds';

  /**
   * A status row: the dot, the count, the word. A zero mutes only its text —
   * the dot keeps its status colour so the tile stays readable as a legend.
   */
  const statusRow = (
    key: string,
    value: number,
    label: string,
    dotStyle: StyleProp<ViewStyle>,
    press?: { onPress: () => void; accessibilityLabel: string }
  ): React.JSX.Element => {
    const zero = value === 0;
    const body = (
      <>
        <View style={[styles.statusDot, dotStyle]} />
        <Text style={[styles.statusValue, zero && styles.statusMuted]}>{value}</Text>
        <Text style={[styles.statusLabel, zero && styles.statusMuted]}>{label}</Text>
      </>
    );
    return press === undefined ? (
      <View key={key} style={styles.statusRow}>
        {body}
      </View>
    ) : (
      <TouchableOpacity
        key={key}
        style={styles.statusRow}
        hitSlop={ROW_HIT_SLOP}
        onPress={press.onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={press.accessibilityLabel}
      >
        {body}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      {plot.district !== null && <Text style={styles.eyebrow}>{plot.district}</Text>}

      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.nameTouch}
          onPress={handlePress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${plot.name}, ${countsLabel}`}
        >
          <Text style={styles.name} numberOfLines={1}>
            {plot.name}
          </Text>
        </TouchableOpacity>

        {/* Temperatures only — the emoji carries the condition, and the stale
            state is stated in the forecast itself rather than on the card. */}
        <TouchableOpacity
          style={styles.weatherPill}
          onPress={handlePressWeather}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Forecast for ${plot.name}. ${
            weather.conditionLabel
          }, ${formatTempRange(weather.today)}${weather.stale ? ', cached forecast' : ''}`}
        >
          <Text style={styles.weatherPillEmoji}>{weather.conditionEmoji}</Text>
          <Text style={styles.weatherPillText}>{formatTempRange(weather.today)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.countsRow}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${plot.name}, ${countsLabel}`}
      >
        {counts.length === 0 && <Text style={styles.countsMuted}>Nothing due</Text>}
        {counts.map((part) => (
          <Text
            key={part.key}
            style={[styles.pill, part.tone === 'overdue' ? styles.pillOverdue : styles.pillDue]}
          >
            {part.label}
          </Text>
        ))}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {(plot.line.headline !== null || plot.line.freshness !== null) && (
        <View style={styles.lines}>
          {plot.line.headline !== null && (
            <Text style={[styles.line, styles.lineStrong]} numberOfLines={2}>
              {plot.line.headline}
            </Text>
          )}
          {plot.line.freshness !== null && (
            <Text style={[styles.line, styles.lineMuted]} numberOfLines={1}>
              {plot.line.freshness}
            </Text>
          )}
        </View>
      )}

      <View style={styles.tiles}>
        {/* Plants: the total, then the four conditions it divides into. */}
        <View style={styles.tile}>
          <View style={styles.tileHead}>
            <Text style={styles.tileTotal}>{plot.cropCount}</Text>
            <Text style={styles.tileUnit}>Plants</Text>
          </View>
          <View style={styles.statusRows}>
            {statusRow('healthy', health.healthy, 'Healthy', styles.statusDotHealthy, {
              onPress: handlePressHealthy,
              accessibilityLabel: `${health.healthy} healthy plants in ${plot.name}. Opens the plant list.`,
            })}
            {statusRow('stressed', health.stressed, 'Stressed', styles.statusDotStressed, {
              onPress: handlePressStressed,
              accessibilityLabel: `${health.stressed} stressed plants in ${plot.name}. Opens the plant list.`,
            })}
            {statusRow('recovering', health.recovering, 'Recovering', styles.statusDotRecovering, {
              onPress: handlePressRecovering,
              accessibilityLabel: `${health.recovering} recovering plants in ${plot.name}. Opens the plant list.`,
            })}
            {statusRow('sick', health.sick, 'Sick', styles.statusDotSick, {
              onPress: handlePressSick,
              accessibilityLabel: `${health.sick} sick plants in ${plot.name}. Opens the plant list.`,
            })}
          </View>
        </View>

        {plot.bedCount === 0 ? (
          <View style={[styles.tile, styles.emptyBedsTile]}>
            <Text style={styles.emptyBedsLine}>
              No beds here — everything is in pots &amp; ground.
            </Text>
            <Text
              style={styles.emptyBedsLink}
              onPress={handlePressBeds}
              accessibilityRole="button"
              accessibilityLabel="Add a bed. Opens the beds tab."
            >
              Add a bed ›
            </Text>
          </View>
        ) : (
          /* Beds: the same shape again. Lifecycles come from `getBedLifecycle`,
             so a bed reads here as it does on the bed list. */
          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <Text style={styles.tileTotal}>{plot.bedCount}</Text>
              <Text
                style={[styles.tileUnit, styles.tileUnitLink]}
                onPress={handlePressBeds}
                accessibilityRole="button"
                accessibilityLabel={`${plot.bedCount} ${bedWordSpoken}. Opens the beds tab.`}
              >
                {bedWord} ›
              </Text>
            </View>
            <View style={styles.statusRows}>
              {statusRow('growing', bedStatus.growing, 'Growing', styles.statusDotGrowing)}
              {statusRow('resting', bedStatus.resting, 'Resting', styles.statusDotResting)}
              {statusRow('ready', bedStatus.empty, 'Ready', styles.statusDotReady)}
              {statusRow('permanent', bedStatus.permanent, 'Permanent', styles.statusDotPermanent)}
            </View>
          </View>
        )}
      </View>
    </View>
  );
});
