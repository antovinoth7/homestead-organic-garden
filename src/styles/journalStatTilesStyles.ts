import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_META } from '@/styles/typography';

/**
 * Journal summary tiles — three separate cards, number over label. The numbers
 * are weight 700: Android's `monospace` face has no medium or semi-bold, so
 * anything lighter renders as regular and reads thin next to the labels.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    tile: {
      flex: 1,
      minWidth: 0,
      minHeight: 84,
      padding: 12,
      borderRadius: 16,
      justifyContent: 'space-between',
      gap: 4,
      backgroundColor: theme.card,
      // Same colour as the tile, so selecting only recolours it — no layout shift.
      borderWidth: 1.5,
      borderColor: theme.card,
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    tileSelected: {
      borderColor: theme.primary,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      minWidth: 0,
    },
    value: {
      ...MONO_META,
      flexShrink: 1,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '700',
    },
    unit: {
      ...MONO_META,
      fontSize: 13,
      fontWeight: '700',
    },
    toneNeutral: { color: theme.text },
    toneHarvest: { color: theme.warningDark },
    toneIssues: { color: theme.errorDark },
    toneZero: { color: theme.textTertiary },
    label: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
  });
