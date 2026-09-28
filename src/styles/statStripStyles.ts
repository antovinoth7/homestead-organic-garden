import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { MONO_META } from '@/styles/typography';

/**
 * StatStrip — one bordered card of summary cells. Numbers use the mono meta
 * face so they read like the Today plot tiles; labels sit underneath in
 * sentence case so a quarter-width cell fits "Open issues" without truncating.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      overflow: 'hidden',
    },
    cell: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    cellDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.border,
    },
    cellSelected: {
      backgroundColor: theme.primaryLight,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 4,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexShrink: 1,
    },
    label: {
      marginTop: 2,
      fontSize: 11,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    labelSelected: {
      color: theme.primary,
    },
    value: {
      ...MONO_META,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '500',
      color: theme.text,
    },
    valueMuted: {
      color: theme.textTertiary,
    },
    valueError: {
      color: theme.error,
    },
    unit: {
      ...MONO_META,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
      color: theme.textSecondary,
    },
  });
