import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanBandStyles';
import { formatFarmDate } from '@/utils/farmDate';

interface Props {
  /** The day the plan is showing on top; null means today. */
  selectedDate: Date | null;
  today: Date;
  onPrevious: () => void;
  onNext: () => void;
  onOpenMonth: () => void;
}

const LABEL_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
};

/**
 * The line under the Care Plan title: "‹ Today · Sat, Oct 3 ⌄ ›". Tapping the
 * date opens the month sheet; the arrows step a day. There is no stepping into
 * the past — late work already sits under Catch up.
 */
export function CarePlanDateNav({
  selectedDate,
  today,
  onPrevious,
  onNext,
  onOpenMonth,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const onToday = selectedDate === null;
  const label = onToday
    ? `Today · ${formatFarmDate(today, LABEL_FORMAT)}`
    : formatFarmDate(selectedDate, LABEL_FORMAT);
  const labelColor = onToday ? theme.primary : theme.warningDark;

  return (
    <View style={styles.dateLine}>
      <TouchableOpacity
        style={[styles.dateStep, onToday && styles.dateStepDisabled]}
        onPress={onPrevious}
        disabled={onToday}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        accessibilityState={{ disabled: onToday }}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Ionicons name="chevron-back" size={18} color={theme.textTertiary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateLabelButton}
        onPress={onOpenMonth}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Open month calendar`}
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Text style={[styles.dateLabel, !onToday && styles.dateLabelPicked]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={15} color={labelColor} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.dateStep}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        hitSlop={{ top: 4, bottom: 4 }}
      >
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}
