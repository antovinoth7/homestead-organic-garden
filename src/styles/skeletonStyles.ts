import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { radius } from '@/theme/styleTokens';

/**
 * Loading placeholders (`src/components/skeleton/`).
 *
 * Blocks use `border` rather than a background tint: they pulse down to 40%
 * opacity, and the background tints all but vanish at that strength against
 * the screen ground. Each layout borrows the metrics of the content it stands
 * in for (list gutter, card radius, row thumb), so the screen does not jump
 * when the data lands.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ── Primitive ─────────────────────────────────────────────────────────
    block: {
      backgroundColor: theme.border,
      borderRadius: 8,
    },
    soft: {
      backgroundColor: theme.borderLight,
    },
    faded: { opacity: 0.6 },

    // ── Shared text lines ─────────────────────────────────────────────────
    lineWide: { height: 13, width: '62%', borderRadius: 6 },
    lineNarrow: { height: 11, width: '38%', borderRadius: 6 },
    lineFull: { height: 11, width: '92%', borderRadius: 6 },
    lineTitle: { height: 20, width: '55%', borderRadius: 8 },

    // ── SkeletonList: card rows, thumb + two lines ────────────────────────
    list: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    listFlush: {
      paddingHorizontal: 0,
      paddingTop: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 12),
      padding: 10,
      paddingLeft: 14,
      marginBottom: 8,
    },
    thumbSquare: { width: 56, height: 56, borderRadius: 10, marginRight: 12 },
    thumbRound: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
    rowBody: { flex: 1, gap: 8 },

    // ── SkeletonCards: a stack of plain card blocks ───────────────────────
    cards: {
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    card: { borderRadius: radius(theme, 'card', 12) },
    cardShort: { height: 64 },
    cardMedium: { height: 120 },
    cardTall: { height: 180 },

    // ── SkeletonDetail: hero, title, chips, sections ──────────────────────
    detail: { flex: 1 },
    hero: { height: 300, borderRadius: 0 },
    heroCompact: { height: 140, borderRadius: 0 },
    detailBody: {
      paddingHorizontal: 20,
      paddingTop: 18,
      gap: 10,
    },
    chipRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
      marginBottom: 8,
    },
    chip: { height: 26, width: 76, borderRadius: radius(theme, 'chip', 13) },
    section: { height: 110, borderRadius: radius(theme, 'card', 12), marginTop: 6 },

    // ── SkeletonForm: label + field pairs ─────────────────────────────────
    form: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    fieldLabel: { height: 12, width: '32%', borderRadius: 6, marginTop: 10 },
    field: { height: 48, borderRadius: radius(theme, 'input', 10) },

    // ── SkeletonGrid: square photo tiles, three across ────────────────────
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 22,
      paddingVertical: 2,
    },
    gridCell: {
      width: '33.333%',
      aspectRatio: 1,
      padding: 2,
    },
    gridTile: { flex: 1, borderRadius: 6 },

    // ── SkeletonTiles: a row of equal stat / suggestion tiles ─────────────
    tiles: {
      flexDirection: 'row',
      gap: 10,
    },
    // 84 = the Journal stat tile's minHeight.
    tile: { flex: 1, height: 84, borderRadius: radius(theme, 'tile', 12) },
    tileTall: { height: 132 },
  });
