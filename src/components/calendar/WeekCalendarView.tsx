import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskTemplate, TaskType } from '../../types/database.types';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/calendarStyles';
import { addCalendarDays, calendarDateKey, farmToday, formatFarmDate } from '@/utils/farmDate';

interface WeekCalendarViewProps {
  currentWeekStart: Date;
  selectedDate: Date | null;
  taskColors: Record<TaskType, string>;
  getTasksForDate: (date: Date) => TaskTemplate[];
  onSelectDate: (date: Date) => void;
  onNavigateWeek: (newStart: Date) => void;
}

export default function WeekCalendarView({
  currentWeekStart,
  selectedDate,
  taskColors,
  getTasksForDate,
  onSelectDate,
  onNavigateWeek,
}: WeekCalendarViewProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    return addCalendarDays(currentWeekStart, i);
  });

  return (
    <View style={styles.weekView}>
      <View style={styles.weekDaysRow}>
        <TouchableOpacity
          style={styles.weekNavBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() - 7);
            onNavigateWeek(newDate);
          }}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        {weekDays.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isToday = calendarDateKey(date) === calendarDateKey(farmToday());
          const isSelected = selectedDate
            ? calendarDateKey(selectedDate) === calendarDateKey(date)
            : false;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDay,
                isToday && styles.weekDayToday,
                isSelected && styles.weekDaySelected,
              ]}
              onPress={() => onSelectDate(date)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${formatFarmDate(
                date,
                {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }
              )}, ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}`}
            >
              <Text
                style={[
                  styles.weekDayName,
                  isToday && styles.weekDayNameToday,
                  isSelected && styles.weekDayNameSelected,
                ]}
              >
                {formatFarmDate(date, { weekday: 'narrow' })}
              </Text>
              <Text
                style={[
                  styles.weekDayNumber,
                  isToday && styles.weekDayNumberToday,
                  isSelected && styles.weekDayNumberSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              {dayTasks.length > 0 && (
                <View style={styles.weekDayDots}>
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <View
                      key={idx}
                      style={[styles.weekDayDot, { backgroundColor: taskColors[task.task_type] }]}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <Text style={styles.weekDayMore}>+{dayTasks.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.weekNavBtn}
          accessibilityRole="button"
          accessibilityLabel="Next week"
          onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + 7);
            onNavigateWeek(newDate);
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
