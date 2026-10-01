import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TaskTemplate } from '../../types/database.types';
import { useTheme } from '../../theme';
import { createStyles } from '@/styles/carePlanCalendarStyles';
import { addCalendarDays, calendarDateKey, farmToday, formatFarmDate } from '@/utils/farmDate';

interface WeekCalendarViewProps {
  currentWeekStart: Date;
  selectedDate: Date | null;
  getTasksForDate: (date: Date) => TaskTemplate[];
  onSelectDate: (date: Date) => void;
  onNavigateWeek: (newStart: Date) => void;
}

/**
 * The slim week strip heading the Care Plan: weekday letter, date and how many
 * tasks fall on it. Today is filled green, the picked day amber. The month grid
 * lives in its own sheet (`MonthCalendarSheet`), so this stays one row tall.
 */
export default function WeekCalendarView({
  currentWeekStart,
  selectedDate,
  getTasksForDate,
  onSelectDate,
  onNavigateWeek,
}: WeekCalendarViewProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addCalendarDays(currentWeekStart, i)),
    [currentWeekStart]
  );
  const todayKey = calendarDateKey(farmToday());
  const selectedKey = selectedDate ? calendarDateKey(selectedDate) : null;

  const goPrevious = useCallback(
    () => onNavigateWeek(addCalendarDays(currentWeekStart, -7)),
    [currentWeekStart, onNavigateWeek]
  );
  const goNext = useCallback(
    () => onNavigateWeek(addCalendarDays(currentWeekStart, 7)),
    [currentWeekStart, onNavigateWeek]
  );

  return (
    <View style={styles.weekCard}>
      <View style={styles.weekRow}>
        <TouchableOpacity
          style={styles.weekNav}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          onPress={goPrevious}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        {weekDays.map((date) => {
          const key = calendarDateKey(date);
          const count = getTasksForDate(date).length;
          const isToday = key === todayKey;
          const isSelected = key !== null && key === selectedKey;
          const onFill = isToday || isSelected;
          return (
            <TouchableOpacity
              key={key ?? date.toISOString()}
              style={[
                styles.weekDay,
                isToday && styles.weekDayToday,
                isSelected && styles.weekDaySelected,
              ]}
              onPress={() => onSelectDate(date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${formatFarmDate(date, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}, ${count} task${count === 1 ? '' : 's'}`}
            >
              <Text style={[styles.weekDayName, onFill && styles.weekDayTextOnFill]}>
                {formatFarmDate(date, { weekday: 'narrow' })}
              </Text>
              <Text style={[styles.weekDayNumber, onFill && styles.weekDayTextOnFill]}>
                {date.getDate()}
              </Text>
              {count > 0 ? (
                <Text
                  style={[
                    styles.weekDayCount,
                    isToday && !isSelected && styles.weekDayCountOnToday,
                    isSelected && styles.weekDayCountOnSelected,
                  ]}
                >
                  {count}
                </Text>
              ) : (
                <View style={styles.weekDayCountSpacer} />
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.weekNav}
          accessibilityRole="button"
          accessibilityLabel="Next week"
          onPress={goNext}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
