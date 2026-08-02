/**
 * Plot card — one per parent location on the Today screen.
 *
 * Five stacked rows: name + due/overdue counts, a facts line, a sentence of
 * context, a tappable weather chip, and the health triad. The chip's three
 * tints (wet / hot / neutral) come from the semantic chip tokens so both themes
 * are covered.
 *
 * The small label lines are uppercase with open letter-spacing rather than a
 * mono face — the same treatment the season card uses for its labels, so the
 * screen reads as one typeface.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { CARD_GUTTER } from './todayScreenStyles';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 12,
      backgroundColor: theme.card,
      borderRadius: 18,
      paddingHorizontal: 17,
      paddingVertical: 15,
      // On dark the shadow is invisible, so the card/background contrast and
      // the elevation carry the lift instead.
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    name: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: '700',
      color: theme.text,
    },
    counts: {
      fontSize: 11.5,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    countsDue: {
      color: theme.textSecondary,
    },
    countsOverdue: {
      color: theme.errorDark,
    },
    countsMuted: {
      color: theme.textTertiary,
    },

    meta: {
      fontSize: 10.5,
      fontWeight: '600',
      letterSpacing: 0.9,
      color: theme.textTertiary,
      marginTop: 5,
      textTransform: 'uppercase',
    },
    // The bed count inside the meta line — a link into the Beds tab, so it
    // carries the brand colour rather than the tertiary ramp.
    metaLink: {
      color: theme.primary,
      fontWeight: '700',
    },

    // ─── Context line ────────────────────────────────────────────────────────
    // Sentence case, and the only such text on the card. The contrast against
    // the uppercase label lines above and below is what makes this read as
    // prose rather than a third row of counts.
    line: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.textSecondary,
      marginTop: 7,
    },
    // The signal itself carries the weight; the freshness tail behind it is
    // background, so it drops to the tertiary ramp.
    lineStrong: {
      color: theme.text,
      fontWeight: '600',
    },
    lineMuted: {
      color: theme.textTertiary,
    },

    // ─── Weather chip ────────────────────────────────────────────────────────
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 11,
      minHeight: 44,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    chipWet: {
      backgroundColor: theme.infoLight,
      borderColor: theme.infoBorder,
    },
    chipHot: {
      backgroundColor: theme.cautionLight,
      borderColor: theme.cautionBorder,
    },
    chipNeutral: {
      backgroundColor: theme.backgroundTertiary,
      borderColor: theme.borderLight,
    },
    chipText: {
      flex: 1,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    chipLink: {
      fontSize: 10.5,
      fontWeight: '600',
    },
    chipTextWet: {
      color: theme.infoDark,
    },
    chipTextHot: {
      color: theme.cautionDark,
    },
    chipTextNeutral: {
      color: theme.textSecondary,
    },

    // ─── Health counts ───────────────────────────────────────────────────────
    // Four counts do not fit one line on a narrow phone, and RN's default
    // `flexShrink: 0` would paint the last one outside the card's radius rather
    // than compress it — so the row wraps.
    healthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 14,
      rowGap: 8,
      marginTop: 11,
    },
    healthItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    healthDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    healthDotHealthy: {
      backgroundColor: theme.primary,
    },
    healthDotStressed: {
      backgroundColor: theme.warning,
    },
    healthDotRecovering: {
      backgroundColor: theme.info,
    },
    healthDotSick: {
      backgroundColor: theme.error,
    },
    healthLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.7,
      color: theme.textSecondary,
      textTransform: 'uppercase',
    },
  });
