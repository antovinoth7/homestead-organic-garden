import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    hero: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
      // Solid ground under the SVG gradient so the first frame — before
      // onLayout reports the hero's size — is already fully green.
      backgroundColor: theme.heroGradientStart,
    },
    dateLine: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.heroTextMuted,
    },
    greeting: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: theme.heroText,
      marginTop: 5,
    },

    // Donut + activity rows
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 13,
    },
    donutWrap: {
      alignItems: 'center',
    },
    donutContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    donutCount: {
      fontSize: 19,
      fontWeight: '700',
      color: theme.heroText,
    },
    donutLabel: {
      fontSize: 9,
      color: theme.heroTextFaint,
      marginTop: 2,
    },
    overduePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: theme.error,
    },
    overduePillText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textInverse,
    },

    rowsColumn: {
      flex: 1,
      marginLeft: 16,
    },
    activityRow: {
      marginBottom: 7,
    },
    activityRowDim: {
      opacity: 0.4,
    },
    rowLabelLine: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowLabel: {
      flex: 1,
      fontSize: 11.5,
      fontWeight: '500',
      color: theme.heroTextMuted,
    },
    rowOverdueFlag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginRight: 6,
    },
    rowOverdueFlagText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: theme.error,
    },
    rowCount: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.heroTextMuted,
    },
    rowTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.heroBarTrack,
      marginTop: 5,
      overflow: 'hidden',
    },
    rowFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 2,
    },
    rowOverdueFill: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: 2,
      backgroundColor: theme.error,
    },
    moreToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      gap: 2,
      paddingVertical: 2,
    },
    moreToggleText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.heroTextMuted,
    },

    // Garden health
    divider: {
      height: 1,
      backgroundColor: theme.heroDivider,
      marginTop: 12,
    },
    healthRow: {
      flexDirection: 'row',
      marginTop: 10,
    },
    healthColumn: {
      flex: 1,
      alignItems: 'center',
    },
    healthCount: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.heroText,
    },
    healthLabelLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 6,
    },
    healthDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    healthLabel: {
      fontSize: 10.5,
      color: theme.heroTextMuted,
    },
  });
