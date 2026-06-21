import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 10,
    },
    rainAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.infoLight,
      borderWidth: 1,
      borderColor: theme.info + '40',
      marginBottom: 10,
    },
    rainAlertText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayCol: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
    },
    dayLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    dayEmoji: {
      fontSize: 18,
    },
    dayTemp: {
      fontSize: 11,
      color: theme.text,
      fontWeight: '600',
    },
    dayRain: {
      fontSize: 10,
      color: theme.info,
    },
    muted: {
      fontSize: 12,
      color: theme.textSecondary,
    },
  });
