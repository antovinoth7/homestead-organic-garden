import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 16,
      marginTop: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.3,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    donutWrap: {
      alignItems: 'center',
      width: 140,
    },
    donutContainer: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    donutPercent: {
      fontSize: 26,
      fontWeight: 'bold',
      color: theme.text,
    },
    donutSubtext: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    overdueBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: theme.error,
      marginTop: 6,
    },
    overdueBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textInverse,
    },
    chipColumn: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginLeft: 14,
      alignContent: 'center',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 14,
      gap: 3,
      width: '47%',
    },
    chipEmpty: {
      opacity: 0.35,
    },
    chipDone: {
      opacity: 0.55,
    },
    chipOverdue: {
      borderWidth: 1.5,
      borderColor: theme.error + '70',
    },
    chipToggle: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 2,
      marginTop: 2,
      paddingVertical: 2,
    },
    chipToggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    chipEmoji: {
      fontSize: 14,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '700',
    },
    chipTextDone: {
      textDecorationLine: 'line-through',
    },
  });
