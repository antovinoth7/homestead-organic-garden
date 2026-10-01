import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** Height of a day cell in the week strip — the strip's whole visual height. */
export const WEEK_STRIP_CELL_HEIGHT = 48;

/**
 * The Care Plan's calendar: the slim week strip that heads the list, and the
 * month grid that opens in a sheet from the header's calendar button.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ── Week strip ───────────────────────────────────────────────────────────
    weekCard: {
      marginHorizontal: 12,
      marginVertical: 4,
      backgroundColor: theme.card,
      borderRadius: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    weekRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },
    weekNav: {
      width: 28,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekDay: {
      flex: 1,
      minWidth: 0,
      height: WEEK_STRIP_CELL_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      borderRadius: 10,
      backgroundColor: theme.background,
    },
    weekDayToday: { backgroundColor: theme.primary },
    weekDaySelected: { backgroundColor: theme.accent },
    weekDayName: {
      fontSize: 10,
      lineHeight: 11,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    weekDayNumber: {
      fontSize: 15,
      lineHeight: 17,
      fontWeight: '700',
      color: theme.text,
    },
    weekDayTextOnFill: { color: theme.textInverse },
    weekDayCount: {
      minWidth: 14,
      height: 12,
      paddingHorizontal: 4,
      borderRadius: 6,
      overflow: 'hidden',
      fontSize: 9,
      lineHeight: 12,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    weekDayCountSpacer: { height: 12 },
    weekDayCountOnToday: { backgroundColor: theme.card, color: theme.primary },
    weekDayCountOnSelected: { backgroundColor: theme.card, color: theme.accent },

    // ── Month sheet ──────────────────────────────────────────────────────────
    monthSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    monthNav: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: {
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
      fontWeight: '700',
      color: theme.textSecondary,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    // A seventh of the row each; the inner cell carries the gap as padding so
    // seven always fit regardless of rounding.
    monthSlot: {
      width: `${100 / 7}%`,
      padding: 2,
    },
    monthCell: {
      height: 46,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    monthCellToday: {
      backgroundColor: theme.primaryLight,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    monthCellSelected: { backgroundColor: theme.primary },
    monthCellNumber: {
      fontSize: 15,
      lineHeight: 17,
      fontWeight: '600',
      color: theme.text,
    },
    monthCellNumberToday: { color: theme.primary, fontWeight: '700' },
    monthCellNumberSelected: { color: theme.textInverse, fontWeight: '700' },
    monthCellCount: {
      minHeight: 10,
      fontSize: 10,
      lineHeight: 10,
      fontWeight: '700',
      color: theme.accent,
    },
    monthCellCountSelected: { color: theme.textInverse },
    monthFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 14,
    },
    monthFooterNote: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
    },
    monthTodayButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: theme.primaryLight,
    },
    monthTodayButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
    },
  });
