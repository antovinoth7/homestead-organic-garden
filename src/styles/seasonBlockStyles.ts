/**
 * Season block — the card closing the Today screen: which season this is, how
 * far through it we are, what is worth planting now, and what the weather is
 * about to do to the crops already in the ground.
 *
 * The header is a band of its own, closed by a hairline: an icon badge, the
 * season at title size, and the days left as a pill. It carries the card's
 * subject, so it gets the weight the rest of the card does not — everything
 * below it stays at label and body sizes.
 *
 * The progress bar is one track with a green fill. Internally the fill is still
 * two flex segments rather than a measured width, so it needs no layout pass
 * and reflows with the card; the track clips them into a single rounded bar.
 * Its day and week counts sit beneath it rather than inside it, because a 8pt
 * bar cannot hold type and a bar with a number in it is a gauge, not a rule.
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
      borderRadius: 18,
      paddingHorizontal: 15,
      paddingVertical: 14,
    },

    // ─── Header band ─────────────────────────────────────────────────────────
    header: {
      paddingBottom: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.textTertiary,
    },
    // `primaryDark` rather than `primary` for the text: it is the token that
    // stays legible on `primaryLight` in both palettes, which invert it.
    daysLeftPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.primaryLight,
    },
    daysLeftText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
      color: theme.primaryDark,
    },

    // ─── Progress bar ────────────────────────────────────────────────────────
    // The track: rounded and clipping, so the two segments inside it read as
    // one bar filling up rather than as two pills side by side.
    bar: {
      flexDirection: 'row',
      height: 8,
      marginTop: 14,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: theme.borderLight,
    },
    barElapsed: {
      backgroundColor: theme.primary,
    },
    barRemaining: {
      backgroundColor: theme.borderLight,
    },
    barLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 7,
    },
    barLabel: {
      fontSize: 11.5,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: theme.textTertiary,
    },

    note: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.textSecondary,
      marginTop: 10,
    },

    // Splits the card into bands so the suggestions do not run on from the note.
    sectionRule: {
      marginTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
    },

    // ─── Plant now ───────────────────────────────────────────────────────────
    sowTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 13,
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
    // The figure that decides whether the crop fits the bed and the season that
    // is left, so it outranks the spacing it used to share a line with.
    tileYield: {
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '600',
      color: theme.text,
    },
    tileHarvest: {
      fontSize: 11.5,
      lineHeight: 16,
      color: theme.textTertiary,
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
