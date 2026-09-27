import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { formatEntryDateLabel } from '@/utils/journalEntryOptions';
import { toLocalDateString } from '@/utils/dateHelpers';

interface Props {
  visible: boolean;
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const QUICK_PICKS: readonly { label: string; daysAgo: number }[] = [
  { label: 'Today', daysAgo: 0 },
  { label: 'Yesterday', daysAgo: 1 },
  { label: '2 days ago', daysAgo: 2 },
];

const daysBefore = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

/**
 * Entry date: three quick picks cover nearly every late log ("harvested
 * yesterday"); anything older goes through the platform's own date picker.
 * Future days can't be picked either way.
 */
export function JournalDateSheet({ visible, value, onSelect, onClose }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // iOS shows its calendar inside the sheet; Android opens its own dialog.
  const [showInline, setShowInline] = useState(false);

  const close = useCallback((): void => {
    setShowInline(false);
    onClose();
  }, [onClose]);

  const choose = useCallback(
    (date: Date): void => {
      onSelect(date);
      close();
    },
    [onSelect, close]
  );

  const quickHandlers = useMemo(
    () => QUICK_PICKS.map((pick) => () => choose(daysBefore(pick.daysAgo))),
    [choose]
  );

  const handleNativeChange = useCallback(
    (event: DateTimePickerEvent, selected?: Date): void => {
      if (event.type === 'set' && selected) choose(selected);
    },
    [choose]
  );

  const openPicker = useCallback((): void => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate: new Date(),
        onChange: handleNativeChange,
      });
      return;
    }
    setShowInline(true);
  }, [value, handleNativeChange]);

  const selectedDay = toLocalDateString(value);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={close}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}
    >
      <SheetHandle onClose={close} />
      <View style={styles.body}>
        <Text style={styles.title}>Entry date</Text>
        <View style={styles.quickRow}>
          {QUICK_PICKS.map((pick, index) => {
            const active = toLocalDateString(daysBefore(pick.daysAgo)) === selectedDay;
            return (
              <TouchableOpacity
                key={pick.label}
                style={[styles.quickPick, active && styles.quickPickActive]}
                onPress={quickHandlers[index]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.quickPickText, active && styles.quickPickTextActive]}>
                  {pick.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {showInline ? (
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            onChange={handleNativeChange}
            accentColor={theme.primary}
          />
        ) : (
          <TouchableOpacity style={styles.pickRow} onPress={openPicker} accessibilityRole="button">
            <Ionicons name="calendar-outline" size={21} color={theme.primary} />
            <Text style={styles.pickRowLabel}>Pick a date…</Text>
            <Text style={styles.pickRowValue}>{formatEntryDateLabel(value)}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
        <Text style={styles.footnote}>Future dates can&apos;t be picked.</Text>
      </View>
    </BottomSheetModal>
  );
}
