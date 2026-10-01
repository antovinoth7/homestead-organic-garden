import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TaskTemplate } from '../../types/database.types';
import { useTheme } from '../../theme';
import { createStyles } from '@/styles/carePlanCalendarStyles';
import { calendarDateKey, farmToday, formatFarmDate } from '@/utils/farmDate';

interface MonthCalendarViewProps {
  currentMonth: Date;
  selectedDate: Date | null;
  getTasksForDate: (date: Date) => TaskTemplate[];
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (newMonth: Date) => void;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * A month grid with the number of tasks due under each date. Rendered inside
 * `MonthCalendarSheet`; the sheet owns which month is showing.
 */
export default function MonthCalendarView({
  currentMonth,
  selectedDate,
  getTasksForDate,
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
        <TouchableOpacity
          style={styles.monthNav}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={goPrevious}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {formatFarmDate(currentMonth, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.monthNav}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={goNext}
        >
          <Ionicons name="chevron-forward" size={22} color={theme.text} />
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
          const count = getTasksForDate(date).length;
          const isToday = key === todayKey;
          const isSelected = key !== null && key === selectedKey;

          return (
            <View key={day} style={styles.monthSlot}>
              <TouchableOpacity
                style={[
                  styles.monthCell,
                  isToday && !isSelected && styles.monthCellToday,
                  isSelected && styles.monthCellSelected,
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
                <Text
                  style={[
                    styles.monthCellNumber,
                    isToday && styles.monthCellNumberToday,
                    isSelected && styles.monthCellNumberSelected,
                  ]}
                >
                  {day}
                </Text>
                <Text style={[styles.monthCellCount, isSelected && styles.monthCellCountSelected]}>
                  {count > 0 ? count : ''}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}
