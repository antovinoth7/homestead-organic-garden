import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import MonthCalendarView, { BUSY_DAY_TASKS } from '@/components/calendar/MonthCalendarView';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanCalendarStyles';
import type { TaskTemplate } from '@/types/database.types';
import { farmToday } from '@/utils/farmDate';

interface Props {
  visible: boolean;
  /** The picked day; null means the plan is on today. */
  selectedDate: Date | null;
  getTasksForDate: (date: Date) => TaskTemplate[];
  todayHasOverdue: boolean;
  /** A date was picked: the list jumps to it and the sheet closes. */
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  bottomInset: number;
}

/**
 * The month grid, kept off the main screen so the list keeps its height.
 * Opens from the date line in the Care Plan header.
 */
export function MonthCalendarSheet({
  visible,
  selectedDate,
  getTasksForDate,
  todayHasOverdue,
  onSelectDate,
  onClose,
  bottomInset,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [month, setMonth] = useState<Date>(() => selectedDate ?? farmToday());

  // Each opening starts on the picked day's month, not wherever the farmer
  // last paged to.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-anchor on open
    if (visible) setMonth(selectedDate ?? farmToday());
  }, [visible, selectedDate]);

  // With no day picked the plan is showing today, so today is the marked day.
  const shownDate = useMemo(() => selectedDate ?? farmToday(), [selectedDate]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[styles.monthSheet, { paddingBottom: Math.max(bottomInset, 16) + 12 }]}
    >
      <SheetHandle onClose={onClose} accessibilityLabel="Close month calendar" />
      <MonthCalendarView
        currentMonth={month}
        selectedDate={shownDate}
        getTasksForDate={getTasksForDate}
        todayHasOverdue={todayHasOverdue}
        onSelectDate={onSelectDate}
        onNavigateMonth={setMonth}
      />
      <View style={styles.legend} accessibilityRole="text">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.monthDotLight]} />
          <Text style={styles.legendText}>{`1–${BUSY_DAY_TASKS - 1} tasks`}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.monthDotBusy]} />
          <Text style={styles.legendText}>{`${BUSY_DAY_TASKS} or more`}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.monthDotOverdue]} />
          <Text style={styles.legendText}>Today, includes overdue</Text>
        </View>
      </View>
    </BottomSheetModal>
  );
}
