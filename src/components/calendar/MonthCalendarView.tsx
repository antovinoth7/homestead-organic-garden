import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TaskTemplate } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanCalendarStyles';
import { calendarDateKey, farmToday, formatFarmDate } from '@/utils/farmDate';

interface MonthCalendarViewProps {
  currentMonth: Date;
  selectedDate: Date | null;
  /** Open work on a date — today's includes overdue, past dates have none. */
  getTasksForDate: (date: Date) => TaskTemplate[];
  /** Today carries overdue work: its dot turns red. */
  todayHasOverdue: boolean;
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (newMonth: Date) => void;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A day with this many open tasks or more is marked busy. */
export const BUSY_DAY_TASKS = 4;

/**
 * A month grid with a dot under each date that has work: light for a few
 * tasks, dark for a busy day, red for today when late work is waiting.
 * Past days are dimmed and cannot be picked — late work lives under Catch up.
 * Rendered inside `MonthCalendarSheet`; the sheet owns which month is showing.
 */
export default function MonthCalendarView({
  currentMonth,
  selectedDate,
  getTasksForDate,
  todayHasOverdue,
  onSelectDate,
  onNavigateMonth,
}: MonthCalendarViewProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: startDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayKey = calendarDateKey(farmToday());
  const selectedKey = selectedDate ? calendarDateKey(selectedDate) : null;

  // Noon, like every other calendar date here, so a timezone shift never
  // tips the day over.
  const goPrevious = (): void => onNavigateMonth(new Date(year, month - 1, 1, 12));
  const goNext = (): void => onNavigateMonth(new Date(year, month + 1, 1, 12));

  return (
    <View>
      <View style={styles.monthHeader}>
        <Text style={styles.monthTitle}>
          {formatFarmDate(currentMonth, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.monthNav}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={goPrevious}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.monthNav}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={goNext}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.monthWeekdays}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <Text key={`${letter}-${i}`} style={styles.monthWeekday}>
            {letter}
          </Text>
        ))}
      </View>

      <View style={styles.monthGrid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.monthSlot} />;

          const date = new Date(year, month, day, 12);
          const key = calendarDateKey(date);
          const isToday = key === todayKey;
          const isPast = key !== null && todayKey !== null && key < todayKey;
          const isSelected = key !== null && key === selectedKey;
          const count = isPast ? 0 : getTasksForDate(date).length;
          const dotStyle = isSelected
            ? styles.monthDotOnSelected
            : isToday && todayHasOverdue
              ? styles.monthDotOverdue
              : count >= BUSY_DAY_TASKS
                ? styles.monthDotBusy
                : styles.monthDotLight;

          return (
            <View key={day} style={styles.monthSlot}>
              <TouchableOpacity
                style={styles.monthCell}
                onPress={() => onSelectDate(date)}
                disabled={isPast}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: isPast }}
                accessibilityLabel={`${formatFarmDate(date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}${isPast ? '' : `, ${count} task${count === 1 ? '' : 's'}`}`}
              >
                <View
                  style={[
                    styles.monthDisc,
                    isToday && !isSelected && styles.monthDiscToday,
                    isSelected && styles.monthDiscSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthCellNumber,
                      isPast && styles.monthCellNumberPast,
                      isSelected && styles.monthCellNumberSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {count > 0 ? (
                  <View style={[styles.monthDot, dotStyle]} />
                ) : (
                  <View style={styles.monthDotSpacer} />
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
