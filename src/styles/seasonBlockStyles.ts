/**
 * Season block — the mint-tinted card closing the Today screen: which season
 * this is, how far through it we are, what that means, and what is worth sowing.
 *
 * The progress bar is two flex segments rather than a measured width, so it
 * needs no layout pass and reflows with the card.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { CARD_GUTTER } from './todayScreenStyles';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 18,
      marginBottom: 22,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      borderTopWidth: 3,
      borderTopColor: theme.primary,
      borderRadius: 16,
      paddingHorizontal: 15,
      paddingVertical: 14,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: theme.primary,
    },
    week: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.9,
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },

    // ─── Progress bar ────────────────────────────────────────────────────────
    bar: {
      flexDirection: 'row',
      gap: 3,
      height: 5,
      marginTop: 9,
    },
    barElapsed: {
      borderRadius: 3,
      backgroundColor: theme.primary,
    },
    barRemaining: {
      borderRadius: 3,
      backgroundColor: theme.borderLight,
    },

    note: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.textSecondary,
      marginTop: 10,
    },

    // ─── Sow now ─────────────────────────────────────────────────────────────
    sowTitle: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 13,
    },
    plantGroup: {
      marginTop: 9,
    },
    plantAction: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 9,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    perennialCare: {
      marginTop: 13,
      paddingTop: 11,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.successBorder,
    },
    perennialTitle: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    perennialText: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.textSecondary,
      marginTop: 4,
    },

    tip: {
      fontSize: 11,
      lineHeight: 17,
      color: theme.textTertiary,
      marginTop: 11,
    },
  });
