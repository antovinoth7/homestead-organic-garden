/**
 * TodayProgressCard (Phase C, C.11).
 *
 * Segmented SVG progress donut (one arc per task type, solid = done) + the
 * full 6/8 task-type pills with done/total counts and status dots. Derived
 * data comes from the tested `taskSummary` util; the ring fades in on mount.
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { TaskType } from '@/types/database.types';
import { TaskTypeStat, DonutSegment } from '@/utils/taskSummary';
import { TASK_EMOJIS, TASK_COLORS } from '@/utils/taskConstants';
import { describeArc, DONUT_SIZE, DONUT_STROKE, DONUT_RADIUS, DONUT_CENTER } from '@/utils/svgArc';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/todayProgressCardStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Chips kept visible when collapsed — ~3 rows, roughly the donut's height. */
const COLLAPSED_CHIP_COUNT = 6;

interface ChipStat {
  type: TaskType;
  done: number;
  total: number;
  remaining: number;
  overdue: number;
}

/**
 * Active-first priority so the most meaningful chips lead the grid:
 * 0 = has overdue, 1 = active today, 2 = done-only, 3 = empty.
 */
function chipPriority(c: ChipStat): number {
  if (c.overdue > 0) return 0;
  if (c.remaining > 0) return 1;
  if (c.total > 0) return 2;
  return 3;
}

interface Props {
  completionRate: number;
  completed: number;
  totalTasks: number;
  overdueCount: number;
  typeStats: TaskTypeStat[];
  donutSegments: DonutSegment[];
  onPressRing: () => void;
  onPressOverdue: () => void;
  onPressType: () => void;
}

/** Compact number display: 0-99 exact, 100-999 → "99+", 1000+ → "1k"/"1.5k". */
function fmtCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  if (n >= 100) return '99+';
  return String(n);
}

export const TodayProgressCard = React.memo(function TodayProgressCard({
  completionRate,
  completed,
  totalTasks,
  overdueCount,
  typeStats,
  donutSegments,
  onPressRing,
  onPressOverdue,
  onPressType,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fade = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  // All task types as chip stats, stable-sorted active-first (TASK_EMOJIS order within ties).
  const orderedChips = useMemo<ChipStat[]>(() => {
    const chips = (Object.keys(TASK_EMOJIS) as TaskType[]).map((type) => {
      const ts = typeStats.find((s) => s.type === type);
      return {
        type,
        done: ts?.done ?? 0,
        total: ts?.total ?? 0,
        remaining: ts?.remaining ?? 0,
        overdue: ts?.overdueCount ?? 0,
      };
    });
    return chips
      .map((chip, index) => ({ chip, index }))
      .sort((a, b) => chipPriority(a.chip) - chipPriority(b.chip) || a.index - b.index)
      .map((entry) => entry.chip);
  }, [typeStats]);

  const hiddenCount = orderedChips.length - COLLAPSED_CHIP_COUNT;
  const visibleChips = expanded ? orderedChips : orderedChips.slice(0, COLLAPSED_CHIP_COUNT);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📋 Today&apos;s Progress</Text>
      <View style={styles.row}>
        <View style={styles.donutWrap}>
          <TouchableOpacity activeOpacity={0.75} onPress={onPressRing}>
            <Animated.View style={[styles.donutContainer, { opacity: fade }]}>
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                <Circle
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  stroke={theme.border}
                  strokeWidth={DONUT_STROKE}
                  fill="none"
                />
                {donutSegments.map((seg) => {
                  const color = TASK_COLORS[seg.key] || '#999';
                  return (
                    <React.Fragment key={seg.key}>
                      {seg.sweep > 0.5 && (
                        <Path
                          d={describeArc(
                            DONUT_CENTER,
                            DONUT_CENTER,
                            DONUT_RADIUS,
                            seg.startAngle,
                            seg.startAngle + seg.sweep
                          )}
                          stroke={color + '40'}
                          strokeWidth={DONUT_STROKE}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                      {seg.doneSweep > 0.5 && (
                        <Path
                          d={describeArc(
                            DONUT_CENTER,
                            DONUT_CENTER,
                            DONUT_RADIUS,
                            seg.startAngle,
                            seg.startAngle + seg.doneSweep
                          )}
                          stroke={color}
                          strokeWidth={DONUT_STROKE}
                          strokeLinecap="round"
                          fill="none"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutPercent}>{completionRate}%</Text>
                <Text style={styles.donutSubtext}>
                  {completed}/{totalTasks}
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
          {overdueCount > 0 && (
            <TouchableOpacity style={styles.overdueBadge} activeOpacity={0.75} onPress={onPressOverdue}>
              <Ionicons name="alert-circle" size={11} color="#fff" />
              <Text style={styles.overdueBadgeText}>{overdueCount} overdue</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipColumn}>
          {visibleChips.map(({ type, done, total, remaining, overdue }) => {
            const color = TASK_COLORS[type];
            const hasNothing = total === 0;
            const allDone = !hasNothing && remaining === 0;
            const hasOverdue = overdue > 0;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  { backgroundColor: color + '14' },
                  hasNothing && styles.chipEmpty,
                  allDone && styles.chipDone,
                  hasOverdue && styles.chipOverdue,
                ]}
                activeOpacity={0.7}
                onPress={onPressType}
              >
                <Text style={styles.chipEmoji}>{TASK_EMOJIS[type]}</Text>
                <Text
                  style={[
                    styles.chipText,
                    { color: hasNothing ? theme.textSecondary : color },
                    allDone && styles.chipTextDone,
                  ]}
                >
                  {fmtCount(done)}/{fmtCount(total)}
                </Text>
                {hasOverdue && <Ionicons name="alert-circle" size={12} color={theme.error} />}
                {allDone && <Ionicons name="checkmark" size={13} color={color} />}
              </TouchableOpacity>
            );
          })}
          {hiddenCount > 0 && (
            <TouchableOpacity
              style={styles.chipToggle}
              activeOpacity={0.7}
              onPress={toggleExpanded}
            >
              <Text style={styles.chipToggleText}>
                {expanded ? 'Show less' : `+${hiddenCount} more`}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});
