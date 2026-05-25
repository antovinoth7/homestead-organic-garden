import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

const LEFT_COL_W = 80;
const ROW_HEIGHT = 22;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginTop: 4,
    },
    timelineRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    // Fixed left column with plant names
    leftCol: {
      width: LEFT_COL_W,
      paddingRight: 6,
    },
    leftLabel: {
      height: ROW_HEIGHT,
      justifyContent: 'center' as const,
    },
    leftLabelText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: theme.text,
    },
    leftLabelGm: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: theme.accent,
    },
    leftLabelGmSub: {
      fontSize: 8,
      color: theme.accent,
      fontStyle: 'italic' as const,
    },
    // Season band strips
    band: {
      position: 'absolute' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 4,
      overflow: 'hidden' as const,
    },
    bandCoolDry: {
      backgroundColor: theme.backgroundTertiary,
    },
    bandSummer: {
      backgroundColor: theme.warningLight,
    },
    bandSwMonsoon: {
      backgroundColor: theme.infoLight,
    },
    bandNeMonsoon: {
      backgroundColor: theme.successLight,
    },
    bandLabel: {
      fontSize: 9,
      fontWeight: '700' as const,
    },
    bandLabelCoolDry: {
      color: theme.textSecondary,
    },
    bandLabelSummer: {
      color: theme.warning,
    },
    bandLabelSwMonsoon: {
      color: theme.infoDark,
    },
    bandLabelNeMonsoon: {
      color: theme.success,
    },
    // Month tick labels
    monthLabel: {
      position: 'absolute' as const,
      fontSize: 8,
      color: theme.textTertiary,
      fontWeight: '500' as const,
    },
    // Harvest bars
    harvestBar: {
      position: 'absolute' as const,
      backgroundColor: theme.success,
      borderRadius: 4,
      opacity: 0.8,
    },
    // Green manure fallow bar
    greenManureBar: {
      position: 'absolute' as const,
      backgroundColor: theme.accent,
      borderRadius: 4,
      opacity: 0.75,
    },
    // Today vertical line
    todayLine: {
      position: 'absolute' as const,
      width: 2,
      backgroundColor: theme.primary,
    },
    todayTick: {
      position: 'absolute' as const,
      fontSize: 8,
      color: theme.primary,
      fontWeight: '700' as const,
    },
    // Legend row below the canvas
    legendRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
      marginTop: 8,
      marginLeft: LEFT_COL_W,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendDotGreen: {
      backgroundColor: theme.success,
    },
    legendDotAccent: {
      backgroundColor: theme.accent,
    },
    legendDotToday: {
      backgroundColor: theme.primary,
    },
    legendText: {
      fontSize: 10,
      color: theme.textSecondary,
    },
    // Green manure rationale text
    gmRationale: {
      marginTop: 8,
      marginLeft: LEFT_COL_W,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderLeftWidth: 2,
      borderLeftColor: theme.accent,
    },
    gmRationaleText: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 16,
    },
    // Next crop rotation card
    nextCropCard: {
      marginTop: 10,
      backgroundColor: theme.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderLeftWidth: 3,
      borderLeftColor: theme.primary,
    },
    nextCropLabel: {
      fontSize: 9,
      fontWeight: '700' as const,
      color: theme.primary,
      letterSpacing: 1,
      marginBottom: 3,
    },
    nextCropText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500' as const,
      lineHeight: 17,
    },
  });
