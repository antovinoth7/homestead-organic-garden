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
 * The forecast pill opens the plot's seven-day view. On the counts row the `›`
 * means one thing only — open the plot at the top of its plan — but the overdue
 * figure is a target of its own, on the same principle as the inventory rows
 * below: a count opens the list at the thing it just named, so tapping "53
 * Overdue" lands on the Care Plan's Overdue section rather than above it.
 *
 * The inventory is two tiles side by side: plants left, beds right. Each states
 * its total — `cropCount` over the four health counts it is the sum of,
 * `bedCount` over the four lifecycles — then that total split into rows. Every
 * row on both tiles is a target that opens its list filtered to that state *and*
 * to this plot, so the list holds exactly the records the row named; they run in
 * the order each list's own filter sheet shows them. The totals above them are
 * captions, not links: the counts are the facts, so they own the taps.
 */

import React, { useCallback, useMemo } from 'react';
import { StyleProp, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { PlotBrief, PlotBriefLineKind } from '@/types/database.types';
import { BedLifecycle } from '@/utils/bedStatus';
import { GardenIcon } from '@/components/GardenIcon';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plotCardStyles';
import { formatTempRange } from '@/utils/weatherWords';
import { WeatherTone, weatherTone } from '@/utils/weatherTone';

/** The health buckets the plant list can be filtered by. */
export type PlotHealthFilter = 'healthy' | 'stressed' | 'recovering' | 'sick';

interface Props {
  plot: PlotBrief;
  onPress: (plotId: string) => void;
  /** The overdue count's own target — opens the plan at its Overdue section. */
  onPressOverdue: (plotId: string) => void;
  onPressWeather: (plotId: string) => void;
  onPressHealth: (plotId: string, status: PlotHealthFilter) => void;
  onPressBedStatus: (plotId: string, lifecycle: BedLifecycle) => void;
  /** The no-beds tile's "Add a bed" link — the only place this tile opens the tab unfiltered. */
  onPressBeds: () => void;
  /**
   * Merged over the card's own frame. `PlotCarousel` uses it to size a page and
   * drop the card's gutter; a card rendered on its own leaves it undefined and
   * keeps the full-width layout.
   */
  containerStyle?: StyleProp<ViewStyle>;
}

/** The rows are 30px tall; this lifts each touch area clear of the 44px floor. */
const ROW_HIT_SLOP = { top: 7, bottom: 7, left: 0, right: 0 };

/**
 * The tag before the context sentence. Short enough to sit on the sentence's own
 * line: it says which kind of signal this is, not what the signal is.
 */
const RUNG_LABEL: Record<PlotBriefLineKind, string> = {
  overdue: 'Late',
  rain: 'Rain',
  load: 'Load',
};

function rungTone(
  styles: ReturnType<typeof createStyles>,
  kind: PlotBriefLineKind
): StyleProp<TextStyle> {
  switch (kind) {
    case 'overdue':
      return styles.rungTagOverdue;
    case 'rain':
      return styles.rungTagRain;
    case 'load':
      return styles.rungTagLoad;
  }
}

/** The pill's ground and its ink move together, so they are picked together. */
function pillTone(
  styles: ReturnType<typeof createStyles>,
  tone: WeatherTone
): { pill: StyleProp<ViewStyle>; text: StyleProp<TextStyle> } {
  switch (tone) {
    case 'rain':
      return { pill: styles.weatherPillRain, text: styles.weatherPillTextRain };
    case 'showers':
      return { pill: styles.weatherPillShowers, text: styles.weatherPillTextShowers };
    case 'clear':
      return { pill: styles.weatherPillClear, text: styles.weatherPillTextClear };
    case 'hot':
      return { pill: styles.weatherPillHot, text: styles.weatherPillTextHot };
    case 'storm':
      return { pill: styles.weatherPillStorm, text: styles.weatherPillTextStorm };
    case 'neutral':
      return { pill: styles.weatherPillNeutral, text: styles.weatherPillTextNeutral };
  }
}

/**
 * "1 Due", "53 Overdue" — only what is non-zero, so a quiet plot states that it
 * is quiet instead of showing a row of noughts.
 */
function buildCounts(plot: PlotBrief): { key: string; label: string; tone: 'due' | 'overdue' }[] {
  const parts: { key: string; label: string; tone: 'due' | 'overdue' }[] = [];
  if (plot.dueCount > 0) parts.push({ key: 'due', label: `${plot.dueCount} Due`, tone: 'due' });
  if (plot.overdueCount > 0) {
    parts.push({ key: 'overdue', label: `${plot.overdueCount} Overdue`, tone: 'overdue' });
  }
  return parts;
}

export const PlotCard = React.memo(function PlotCard({
  plot,
  onPress,
  onPressOverdue,
  onPressWeather,
  onPressHealth,
  onPressBedStatus,
  onPressBeds: handlePressBeds,
  containerStyle,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback(() => onPress(plot.id), [onPress, plot.id]);
  const handlePressOverdue = useCallback(
    () => onPressOverdue(plot.id),
    [onPressOverdue, plot.id]
  );
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
  const handlePressGrowing = useCallback(
    () => onPressBedStatus(plot.id, 'growing'),
    [onPressBedStatus, plot.id]
  );
  const handlePressResting = useCallback(
    () => onPressBedStatus(plot.id, 'resting'),
    [onPressBedStatus, plot.id]
  );
  const handlePressReady = useCallback(
    () => onPressBedStatus(plot.id, 'empty'),
    [onPressBedStatus, plot.id]
  );
  const handlePressPermanent = useCallback(
    () => onPressBedStatus(plot.id, 'permanent'),
    [onPressBedStatus, plot.id]
  );

  const { weather, health, bedStatus } = plot;
  const pill = pillTone(styles, weatherTone(weather.condition));
  const counts = buildCounts(plot);
  const countsLabel =
    counts.length > 0 ? counts.map((c) => c.label.toLowerCase()).join(', ') : 'nothing due';
  const bedWord = plot.bedCount === 1 ? 'Bed' : 'Beds';
  // Only the reader sees these — the visible rows are a number beside a word, and
  // do not inflect. The phrase carries the noun because "ready" takes it first:
  // "2 growing beds", but "1 bed ready to plant".
  const bedNoun = (count: number): string => (count === 1 ? 'bed' : 'beds');
  const bedRowLabel = (count: number, phrase: string): string =>
    `${count} ${phrase} in ${plot.name}. Opens the bed list.`;

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
    <View style={[styles.card, containerStyle]}>
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

        {/* Temperatures only — the icon and the tint carry the condition, and
            the stale state is stated in the forecast itself rather than here. */}
        <TouchableOpacity
          style={[styles.weatherPill, pill.pill]}
          onPress={handlePressWeather}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Forecast for ${plot.name}. ${
            weather.conditionLabel
          }, ${formatTempRange(weather.today)}${weather.stale ? ', cached forecast' : ''}`}
        >
          <GardenIcon name={weather.conditionIconKey} size={14} color={theme.textSecondary} />
          <Text style={[styles.weatherPillText, pill.text]}>{formatTempRange(weather.today)}</Text>
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
        {counts.length === 0 && <Text style={[styles.pill, styles.pillNone]}>Nothing Due</Text>}
        {counts.map((part) => {
          const pill = (
            <Text
              key={part.key}
              style={[styles.pill, part.tone === 'overdue' ? styles.pillOverdue : styles.pillDue]}
            >
              {part.label}
            </Text>
          );
          // The overdue figure takes its own tap inside the row: the row means
          // "open the plot", this means "open it at the work that is late".
          return part.tone === 'overdue' ? (
            <TouchableOpacity
              key={part.key}
              hitSlop={ROW_HIT_SLOP}
              onPress={handlePressOverdue}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${plot.overdueCount} overdue tasks in ${plot.name}. Opens the care plan at Overdue.`}
            >
              {pill}
            </TouchableOpacity>
          ) : (
            pill
          );
        })}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {(plot.line.headline !== null || plot.line.freshness !== null) && (
        <View style={styles.lines}>
          {plot.line.headline !== null && (
            <View style={styles.lineRow}>
              {/* The tag is decoration for a sighted reader and the sentence's
                  first word for everyone else, so it is hidden from the reader
                  and spoken as part of the headline instead. */}
              {plot.line.kind !== null && (
                <Text
                  style={[styles.rungTag, rungTone(styles, plot.line.kind)]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {RUNG_LABEL[plot.line.kind]}
                </Text>
              )}
              <Text
                style={[styles.line, styles.lineStrong, styles.lineHeadline]}
                numberOfLines={2}
                accessibilityLabel={
                  plot.line.kind !== null
                    ? `${RUNG_LABEL[plot.line.kind]}. ${plot.line.headline}`
                    : plot.line.headline
                }
              >
                {plot.line.headline}
              </Text>
            </View>
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
          /* Beds: the same shape again, rows and all. Lifecycles come from
             `getBedLifecycle`, so a bed reads here as it does on the bed list —
             which is what lets each row open that list filtered to its own bucket. */
          <View style={styles.tile}>
            <View style={styles.tileHead}>
              <Text style={styles.tileTotal}>{plot.bedCount}</Text>
              <Text style={styles.tileUnit}>{bedWord}</Text>
            </View>
            <View style={styles.statusRows}>
              {statusRow('growing', bedStatus.growing, 'Growing', styles.statusDotGrowing, {
                onPress: handlePressGrowing,
                accessibilityLabel: bedRowLabel(
                  bedStatus.growing,
                  `growing ${bedNoun(bedStatus.growing)}`
                ),
              })}
              {statusRow('resting', bedStatus.resting, 'Resting', styles.statusDotResting, {
                onPress: handlePressResting,
                accessibilityLabel: bedRowLabel(
                  bedStatus.resting,
                  `resting ${bedNoun(bedStatus.resting)}`
                ),
              })}
              {statusRow('ready', bedStatus.empty, 'Ready', styles.statusDotReady, {
                onPress: handlePressReady,
                accessibilityLabel: bedRowLabel(
                  bedStatus.empty,
                  `${bedNoun(bedStatus.empty)} ready to plant`
                ),
              })}
              {statusRow('permanent', bedStatus.permanent, 'Permanent', styles.statusDotPermanent, {
                onPress: handlePressPermanent,
                accessibilityLabel: bedRowLabel(
                  bedStatus.permanent,
                  `permanent ${bedNoun(bedStatus.permanent)}`
                ),
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
});
