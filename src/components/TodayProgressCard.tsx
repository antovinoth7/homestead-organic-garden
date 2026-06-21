/**
 * TodayProgressCard (Phase C, C.11).
 *
 * Segmented SVG progress donut (one arc per task type, solid = done) + the
 * full 6/8 task-type pills with done/total counts and status dots. Derived
 * data comes from the tested `taskSummary` util; the ring fades in on mount.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { TaskType } from '@/types/database.types';
import { TaskTypeStat, DonutSegment } from '@/utils/taskSummary';
import { TASK_EMOJIS, TASK_COLORS } from '@/utils/taskConstants';
import { describeArc, DONUT_SIZE, DONUT_STROKE, DONUT_RADIUS, DONUT_CENTER } from '@/utils/svgArc';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/todayProgressCardStyles';

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
  /** Label for the most-urgent remaining task, or null when nothing is pending. */
  upNextLabel?: string | null;
  onPressUpNext?: () => void;
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
  upNextLabel,
  onPressUpNext,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

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
          {(Object.keys(TASK_EMOJIS) as TaskType[]).map((type) => {
            const ts = typeStats.find((s) => s.type === type);
            const color = TASK_COLORS[type];
            const done = ts?.done ?? 0;
            const total = ts?.total ?? 0;
            const remaining = ts?.remaining ?? 0;
            const overdue = ts?.overdueCount ?? 0;
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
        </View>
      </View>

      {upNextLabel ? (
        <TouchableOpacity
          style={styles.upNextRow}
          activeOpacity={0.7}
          onPress={onPressUpNext}
          accessibilityRole="button"
        >
          <Text style={styles.upNextText} numberOfLines={1}>
            <Text style={styles.upNextLead}>Up next: </Text>
            {upNextLabel}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      ) : totalTasks > 0 ? (
        <Text style={styles.upNextDone}>All caught up 🎉</Text>
      ) : null}
    </View>
  );
});
