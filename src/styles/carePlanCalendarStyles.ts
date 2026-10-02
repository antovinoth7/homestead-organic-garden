import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** A day cell's date disc — the grid's visual unit. */
const DAY_DISC = 32;

/**
 * The Care Plan's month grid, which opens in a sheet from the date line in the
 * header. Busy days carry a dot under the date; the legend explains the colours.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    monthSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 18,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 6,
    },
    monthNav: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    monthWeekdays: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    monthWeekday: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    // A seventh of the row each, so seven always fit regardless of rounding.
    monthSlot: {
      width: `${100 / 7}%`,
    },
    monthCell: {
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDisc: {
      width: DAY_DISC,
      height: DAY_DISC,
      borderRadius: DAY_DISC / 2,
      borderWidth: 1.5,
      // The sheet's own ground: an invisible ring keeps every disc the same size.
      borderColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDiscToday: { borderColor: theme.primary },
    monthDiscSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    monthCellNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    monthCellNumberPast: { color: theme.textTertiary, opacity: 0.6 },
    monthCellNumberSelected: { color: theme.textInverse, fontWeight: '700' },
    // Overlaps the disc's lower edge so the dot reads as part of the date.
    monthDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginTop: -4,
    },
    monthDotSpacer: { height: 5, marginTop: -4 },
    monthDotLight: { backgroundColor: theme.calendarDotLight },
    monthDotBusy: { backgroundColor: theme.calendarDotBusy },
    monthDotOverdue: { backgroundColor: theme.error },
    monthDotOnSelected: { backgroundColor: theme.textInverse },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 14,
      rowGap: 4,
      marginTop: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
    },
  });
