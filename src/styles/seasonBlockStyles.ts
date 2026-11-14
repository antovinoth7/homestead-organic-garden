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
 * Each crop tile is a square photo with its name and one line of figures laid
 * over a gradient at its foot, the same tile the journal's new-entry form uses
 * for pest suggestions. A group is one horizontal row of them, bleeding past
 * the card's padding so the tiles scroll off its edge. Their width follows the
 * screen so that the row always ends part-way through a tile — see
 * `cropTileWidth`.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';
import { CARD_GUTTER } from './todayScreenStyles';

/** The card's side padding, which a tile row bleeds back out through. */
const CARD_PADDING = 15;

/** Between two tiles in a row. */
const TILE_GAP = 12;

/** As wide as a tile gets — the size it was when the width was a constant. */
const TILE_MAX = 148;

/**
 * Tiles on screen before the row scrolls: two whole and a third of the next.
 * The cut-off third is the cue that the row scrolls, so it has to be there at
 * every width.
 */
const TILES_VISIBLE = 2.33;

/**
 * A crop tile's width at this screen width.
 *
 * It was a fixed 148, which left the cue to chance: from the first tile's left
 * edge to the card's right edge there is `screenWidth − 47`pt, two tiles and
 * their gaps took 320 of it, and so a 390pt phone showed 23pt of the third tile,
 * the 377pt one 10, and a 360dp Android none at all. Dividing the space instead
 * shows the same share of the next tile everywhere.
 *
 * Capped at the old size: past about 416pt the tiles stop growing and the row
 * simply shows more of them.
 */
export function cropTileWidth(screenWidth: number): number {
  const visible = screenWidth - CARD_GUTTER * 2 - CARD_PADDING;
  const tile = (visible - TILE_GAP * Math.floor(TILES_VISIBLE)) / TILES_VISIBLE;
  return Math.min(TILE_MAX, Math.floor(tile));
}

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 18,
      marginBottom: 22,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', StyleSheet.hairlineWidth),
      borderColor: theme.border,
      borderRadius: radius(theme, 'card', 18),
      paddingHorizontal: CARD_PADDING,
      paddingVertical: 14,
      ...shadow(theme, 'card'),
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
      borderRadius: radius(theme, 'chip', 18),
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
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    subtitle: {
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
    // `primaryDark` rather than `primary` for the text: it is the token that
    // stays legible on `primaryLight` in both palettes, which invert it.
    daysLeftPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius(theme, 'chip', 999),
      backgroundColor: theme.primaryLight,
    },
    daysLeftText: {
      fontSize: 12,
      letterSpacing: 0.2,
      color: theme.primaryDark,
      ...font(theme, 'bodyBold', '700'),
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
      letterSpacing: 0.3,
      color: theme.textTertiary,
      ...font(theme, 'bodyStrong', '600'),
    },

    note: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.textSecondary,
      marginTop: 10,
      ...font(theme, 'body'),
    },

    // Splits the card into bands so the suggestions do not run on from the note.
    sectionRule: {
      marginTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
    },

    // ─── Plant now ───────────────────────────────────────────────────────────
    sowTitle: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 13,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 1.1, fontWeight: '600' }),
    },

    plantGroup: {
      marginTop: 12,
    },
    // The action and, when the row runs off screen, how many crops are in it.
    plantActionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    plantAction: {
      fontSize: 13,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    // The cut-off tile says the row scrolls; this says how far. A caption —
    // there is no list of its own for it to open.
    plantActionCount: {
      fontSize: 12,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
    // What the action actually asks of the grower. "Transplant" without this
    // silently assumes a nursery sown weeks ago.
    plantActionHint: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textTertiary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    // Bleeds past the card's padding; the content padding puts the first tile
    // back in line with the text above it.
    tileRow: {
      marginHorizontal: -CARD_PADDING,
      marginTop: 11,
    },
    tileRowContent: {
      paddingHorizontal: CARD_PADDING,
      gap: TILE_GAP,
    },
    // `overflow: 'hidden'` gives the unrounded square photo the tile's corners.
    // The width is not here: it depends on the screen, so the component merges
    // `cropTileWidth` over this.
    tile: {
      aspectRatio: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 14,
      overflow: 'hidden',
      elevation: 1,
    },
    // Lower part of the tile: the gradient's clear top keeps the subject
    // visible while its foot carries the name and figures.
    tileScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '55%',
    },
    // Tighter than a flat inset: with a square photo above it, the padding
    // should not compete with the picture for the tile's height. The extra
    // point at the foot keeps the meta line off the card's bottom radius.
    tileBody: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      gap: 2,
      paddingHorizontal: 10,
      paddingBottom: 9,
    },
    // One line: with only two lines of type under the photo, a name that
    // wrapped on one card and not its neighbour would leave the row ragged.
    tileName: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: theme.textInverse,
      textShadowColor: theme.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    // Days to harvest and spacing on one line. At the narrowest phone the body
    // is about 101pt wide — `(320 − 62) × 47% − 20` — which "25–40 days · 15 cm"
    // clears at this size.
    tileMeta: {
      fontSize: 11.5,
      lineHeight: 16,
      color: theme.textInverse,
      textShadowColor: theme.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },

    // Next month is context, not work, so it takes the same shape as perennial
    // care — rule, label, one line of body — rather than the fine-print tier it
    // used to sit in, where a tertiary sentence under two photo tiles read as
    // debris. The rule stays neutral: the green one marks perennial care alone.
    openingNext: {
      marginTop: 15,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
    },
    openingNextTitle: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 1.1, fontWeight: '600' }),
    },
    openingNextCrops: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 5,
      ...font(theme, 'body'),
    },

    // ─── Empty state ─────────────────────────────────────────────────────────
    emptyText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 10,
      ...font(theme, 'body'),
    },
    emptyLink: {
      fontSize: 13.5,
      color: theme.primary,
      marginTop: 6,
      ...font(theme, 'bodyStrong', '600'),
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
      textTransform: 'uppercase',
      color: theme.warningDark,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
    },
    riskText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
      ...font(theme, 'body'),
    },

    // ─── Perennial care ──────────────────────────────────────────────────────
    perennialCare: {
      marginTop: 15,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.successBorder,
    },
    perennialTitle: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 1.1, fontWeight: '600' }),
    },
    perennialText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 5,
      ...font(theme, 'body'),
    },
  });
