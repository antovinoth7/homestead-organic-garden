import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

const CHART_TRACK_HEIGHT = 90;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginTop: 8,
      marginBottom: 12,
    },
    title: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    barsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      gap: 8,
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    barValue: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.text,
    },
    barTrack: {
      width: '60%',
      height: CHART_TRACK_HEIGHT,
      justifyContent: 'flex-end',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 6,
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      backgroundColor: theme.primary,
      borderRadius: 6,
    },
    barLabel: {
      fontSize: 10,
      color: theme.textSecondary,
    },
  });
