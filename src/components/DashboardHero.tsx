/**
 * DashboardHero — the Today screen's opening block.
 *
 * A deep-green gradient hero with a rounded bottom that replaces what used to
 * be three separate pieces (inline greeting header, TodayProgressCard,
 * FarmHealthCard): date + greeting, a compact ring showing overall task
 * progress, per-activity progress bars, and the plant-health tiles.
 *
 * The ring encodes overdue directly — a red arc at its end — so an overdue
 * garden reads as such at a glance, not only from the badge. Activity rows are
 * ordered action-first by `buildActivityRows`, and only the first
 * HERO_VISIBLE_ROWS show until the user expands them.
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Path,
  Defs,
  Rect,
  Stop,
  LinearGradient as SvgLinearGradient,
  RadialGradient as SvgRadialGradient,
} from 'react-native-svg';
import { TaskTypeStat } from '@/utils/taskSummary';
import { PlantHealthSummary } from '@/utils/plantHealth';
import { buildActivityRows, fmtCount, HERO_VISIBLE_ROWS, ActivityRow } from '@/utils/activityRows';
import { TASK_LABELS, TASK_COLORS_ON_DARK } from '@/utils/taskConstants';
import { describeArc } from '@/utils/svgArc';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/dashboardHeroStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type HealthFilter = 'healthy' | 'stressed' | 'sick';

/** Hero-sized ring geometry (the card-sized DONUT_* exports are far too big). */
const RING_SIZE = 76;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CENTER = RING_SIZE / 2;

interface Props {
  greeting: string;
  dateLabel: string;
  completed: number;
  totalTasks: number;
  overdueCount: number;
  typeStats: TaskTypeStat[];
  health: PlantHealthSummary;
  /** Safe-area top inset — the hero paints behind the status bar. */
  topInset: number;
  onPressRing: () => void;
  onPressOverdue: () => void;
  onPressType: () => void;
  onPressHealth: (filter: HealthFilter) => void;
}

export const DashboardHero = React.memo(function DashboardHero({
  greeting,
  dateLabel,
  completed,
  totalTasks,
  overdueCount,
  typeStats,
  health,
  topInset,
  onPressRing,
  onPressOverdue,
  onPressType,
  onPressHealth,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fade = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  // The background gradient is sized from a measured layout rather than from
  // percentages: react-native-svg has no viewport to resolve "100%" against
  // here, and silently paints a rectangle short of the hero's real bounds.
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const onHeroLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setHeroSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, []);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  const rows = useMemo(() => buildActivityRows(typeStats), [typeStats]);
  const hiddenCount = rows.length - HERO_VISIBLE_ROWS;
  const visibleRows = expanded ? rows : rows.slice(0, HERO_VISIBLE_ROWS);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const onHealthy = useCallback(() => onPressHealth('healthy'), [onPressHealth]);
  const onStressed = useCallback(() => onPressHealth('stressed'), [onPressHealth]);
  const onSick = useCallback(() => onPressHealth('sick'), [onPressHealth]);

  // Ring arcs: done grows clockwise from 12 o'clock, overdue is parked at the
  // end of the circle so the two never overlap. Sub-degree sweeps are dropped —
  // they render as a dot from the round line cap rather than an arc.
  const doneSweep = totalTasks > 0 ? (completed / totalTasks) * 360 : 0;
  const overdueSweep = totalTasks > 0 ? (overdueCount / totalTasks) * 360 : 0;

  return (
    <View style={[styles.hero, { paddingTop: topInset + 14 }]} onLayout={onHeroLayout}>
      {heroSize.width > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={heroSize.width} height={heroSize.height}>
          <Defs>
            <SvgLinearGradient id="heroGround" x1="0" y1="0" x2="0.3" y2="1">
              <Stop offset="0" stopColor={theme.heroGradientStart} />
              <Stop offset="1" stopColor={theme.heroGradientEnd} />
            </SvgLinearGradient>
            <SvgRadialGradient id="heroGlow" cx="0.86" cy="0" rx="0.6" ry="0.85">
              <Stop offset="0" stopColor={theme.heroGlow} stopOpacity="0.22" />
              <Stop offset="1" stopColor={theme.heroGlow} stopOpacity="0" />
            </SvgRadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={heroSize.width}
            height={heroSize.height}
            fill="url(#heroGround)"
          />
          <Rect
            x={0}
            y={0}
            width={heroSize.width}
            height={heroSize.height}
            fill="url(#heroGlow)"
          />
        </Svg>
      )}

      <Text style={styles.dateLine}>{dateLabel}</Text>
      <Text style={styles.greeting}>{greeting}</Text>

      <View style={styles.progressRow}>
        <View style={styles.donutWrap}>
          <TouchableOpacity activeOpacity={0.75} onPress={onPressRing}>
            <Animated.View
              style={[
                styles.donutContainer,
                { width: RING_SIZE, height: RING_SIZE, opacity: fade },
              ]}
            >
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_CENTER}
                  cy={RING_CENTER}
                  r={RING_RADIUS}
                  stroke={theme.heroRingTrack}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                {doneSweep > 0.5 && (
                  <Path
                    d={describeArc(RING_CENTER, RING_CENTER, RING_RADIUS, 0, doneSweep)}
                    stroke={theme.heroRingFill}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                {overdueSweep > 0.5 && (
                  <Path
                    d={describeArc(
                      RING_CENTER,
                      RING_CENTER,
                      RING_RADIUS,
                      360 - overdueSweep,
                      360
                    )}
                    stroke={theme.error}
                    strokeWidth={RING_STROKE}
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutCount}>
                  {fmtCount(completed)}/{fmtCount(totalTasks)}
                </Text>
                <Text style={styles.donutLabel}>{totalTasks === 0 ? 'all clear' : 'tasks'}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {overdueCount > 0 && (
            <TouchableOpacity style={styles.overduePill} activeOpacity={0.75} onPress={onPressOverdue}>
              <Ionicons name="alert-circle" size={11} color={theme.textInverse} />
              <Text style={styles.overduePillText}>{fmtCount(overdueCount)} overdue</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rowsColumn}>
          {visibleRows.map((row: ActivityRow) => {
            const color = TASK_COLORS_ON_DARK[row.type];
            return (
              <TouchableOpacity
                key={row.type}
                style={[styles.activityRow, row.total === 0 && styles.activityRowDim]}
                activeOpacity={0.7}
                onPress={onPressType}
              >
                <View style={styles.rowLabelLine}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {TASK_LABELS[row.type]}
                  </Text>
                  {row.overdue > 0 && (
                    <View style={styles.rowOverdueFlag}>
                      <Ionicons name="alert-circle" size={11} color={theme.error} />
                      <Text style={styles.rowOverdueFlagText}>{fmtCount(row.overdue)}</Text>
                    </View>
                  )}
                  <Text style={styles.rowCount}>
                    {fmtCount(row.done)}/{fmtCount(row.total)}
                  </Text>
                </View>
                <View style={styles.rowTrack}>
                  {row.donePct > 0 && (
                    <View
                      style={[styles.rowFill, { width: `${row.donePct}%`, backgroundColor: color }]}
                    />
                  )}
                  {row.overduePct > 0 && (
                    <View style={[styles.rowOverdueFill, { width: `${row.overduePct}%` }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {hiddenCount > 0 && (
            <TouchableOpacity style={styles.moreToggle} activeOpacity={0.7} onPress={toggleExpanded}>
              <Text style={styles.moreToggleText}>
                {expanded ? 'Show less' : `+${hiddenCount} more`}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={13}
                color={theme.heroTextMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Health counts are plant populations in a third-of-screen column, so
          they render in full — "99+" would be hiding real information here. */}
      <View style={styles.healthRow}>
        <TouchableOpacity style={styles.healthColumn} activeOpacity={0.7} onPress={onHealthy}>
          <Text style={styles.healthCount}>{health.healthy}</Text>
          <View style={styles.healthLabelLine}>
            <View style={[styles.healthDot, { backgroundColor: theme.success }]} />
            <Text style={styles.healthLabel}>Healthy</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.healthColumn} activeOpacity={0.7} onPress={onStressed}>
          <Text style={styles.healthCount}>{health.stressed}</Text>
          <View style={styles.healthLabelLine}>
            <View style={[styles.healthDot, { backgroundColor: theme.warning }]} />
            <Text style={styles.healthLabel}>Stressed</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.healthColumn} activeOpacity={0.7} onPress={onSick}>
          <Text style={styles.healthCount}>{health.sick}</Text>
          <View style={styles.healthLabelLine}>
            <View style={[styles.healthDot, { backgroundColor: theme.error }]} />
            <Text style={styles.healthLabel}>Sick</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});
