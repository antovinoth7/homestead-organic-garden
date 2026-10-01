import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import MonthCalendarView from '@/components/calendar/MonthCalendarView';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanCalendarStyles';
import type { TaskTemplate } from '@/types/database.types';
import { farmToday } from '@/utils/farmDate';

interface Props {
  visible: boolean;
  /** The day the month opens on — the picked day, else today. */
  anchorDate: Date | null;
  selectedDate: Date | null;
  getTasksForDate: (date: Date) => TaskTemplate[];
  /** A date was picked: the list jumps to it and the sheet closes. */
  onSelectDate: (date: Date) => void;
  onGoToToday: () => void;
  onClose: () => void;
  bottomInset: number;
}

/**
 * The month grid, moved off the main screen into a sheet so the list keeps its
 * height. Opens from the header's calendar button.
 */
export function MonthCalendarSheet({
  visible,
  anchorDate,
  selectedDate,
  getTasksForDate,
  onSelectDate,
  onGoToToday,
  onClose,
  bottomInset,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [month, setMonth] = useState<Date>(() => anchorDate ?? farmToday());

  // Each opening starts on the picked day's month, not wherever the farmer
  // last paged to.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-anchor on open
    if (visible) setMonth(anchorDate ?? farmToday());
  }, [visible, anchorDate]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={[styles.monthSheet, { paddingBottom: Math.max(bottomInset, 16) + 8 }]}
    >
      <SheetHandle onClose={onClose} accessibilityLabel="Close month calendar" />
      <MonthCalendarView
        currentMonth={month}
        selectedDate={selectedDate}
        getTasksForDate={getTasksForDate}
        onSelectDate={onSelectDate}
        onNavigateMonth={setMonth}
      />
      <View style={styles.monthFooter}>
        <Text style={styles.monthFooterNote}>Numbers show tasks due that day</Text>
        <TouchableOpacity
          style={styles.monthTodayButton}
          onPress={onGoToToday}
          accessibilityRole="button"
          accessibilityLabel="Go to today"
        >
          <Text style={styles.monthTodayButtonText}>Go to today</Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}
