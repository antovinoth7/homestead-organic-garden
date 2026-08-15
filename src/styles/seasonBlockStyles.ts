/**
 * Season block — the card closing the Today screen: which season this is, how
 * far through it we are, what is worth planting now, and what the weather is
 * about to do to the crops already in the ground.
 *
 * The progress bar is one track with a green fill. Internally the fill is still
 * two flex segments rather than a measured width, so it needs no layout pass
 * and reflows with the card; the track clips them into a single rounded bar.
 *
 * The crop tiles carry no chrome: a rounded photo with the name set directly
 * beneath it on the card's own ground. A border around each one would be the
 * third box in a stack that already has the card and the photo, and the photo
 * is a strong enough tap target without it.
 *
 * They are a two-column wrap sized by `TILE_BASIS` rather than `flex: 1`, so a
 * lone tile in a group keeps the column width instead of stretching across the
 * card and reading as a banner.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { CARD_GUTTER } from './todayScreenStyles';

/**
 * Two columns with one `tileGrid` gap between them. Read together with that
 * gap: the pair only fits while `gap ≤ (1 - 2 × basis) × innerWidth`, and the
 * card's inner width is `screenWidth - 62` (gutter 16 ×2 + padding 15 ×2). At
 * 47% a 12px gap clears every phone size; at 48% it would collapse a 320pt
 * screen to a single column.
 */
const TILE_BASIS = '47%';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 18,
      marginBottom: 22,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
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
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: theme.primary,
    },
    week: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.9,
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },

    // ─── Progress bar ────────────────────────────────────────────────────────
    // The track: rounded and clipping, so the two segments inside it read as
    // one bar filling up rather than as two pills side by side.
    bar: {
      flexDirection: 'row',
      height: 5,
      marginTop: 9,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: theme.borderLight,
    },
    barElapsed: {
      backgroundColor: theme.primary,
    },
    barRemaining: {
      backgroundColor: theme.borderLight,
    },

    note: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.textSecondary,
      marginTop: 10,
    },

    // ─── Plant now ───────────────────────────────────────────────────────────
    sowTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 15,
    },

    plantGroup: {
      marginTop: 12,
    },
    plantAction: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    // What the action actually asks of the grower. "Transplant" without this
    // silently assumes a nursery sown weeks ago.
    plantActionHint: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textTertiary,
      marginTop: 2,
    },

    // Wider than the old bordered grid: without edges to separate them, the
    // tiles need the air the borders used to imply.
    tileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 11,
    },
    // Just a column of the grid — the photo brings its own corners.
    tile: {
      flexBasis: TILE_BASIS,
      flexGrow: 0,
    },
    tileBody: {
      gap: 2,
      paddingTop: 7,
    },
    tileName: {
      fontSize: 13.5,
      lineHeight: 18,
      fontWeight: '600',
      color: theme.text,
    },
    tileMeta: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    openingNext: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textTertiary,
      marginTop: 12,
    },

    // ─── Empty state ─────────────────────────────────────────────────────────
    emptyText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 10,
    },
    emptyLink: {
      fontSize: 13.5,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 6,
    },

    // ─── Seasonal risk ───────────────────────────────────────────────────────
    // The only sentence on the card with a consequence attached, so it gets a
    // ground of its own rather than closing the card as fine print.
    riskStrip: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 15,
      paddingVertical: 10,
      paddingHorizontal: 11,
      borderRadius: 10,
      backgroundColor: theme.warningLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.warningBorder,
    },
    riskBody: {
      flex: 1,
      gap: 3,
    },
    riskTitle: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.warningDark,
    },
    riskText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
    },

    // ─── Perennial care ──────────────────────────────────────────────────────
    perennialCare: {
      marginTop: 15,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.successBorder,
    },
    perennialTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    perennialText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 5,
    },
  });
