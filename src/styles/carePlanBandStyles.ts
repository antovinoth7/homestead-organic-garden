import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font, radius, shadow, typeSize } from '@/theme/styleTokens';
import { mono } from '@/styles/typography';

/** The timeline gutter beside every band: its dot sits level with the title. */
export const BAND_GUTTER_WIDTH = 18;
const DOT = 12;
/** Height of a band's title row — the dot is centred on it. */
const HEADER_ROW_HEIGHT = 32;
/** Inner padding of a tinted band (Catch up, a picked day). */
const PANEL_PAD_X = 10;
const PANEL_PAD_TOP = 8;
const PANEL_PAD_BOTTOM = 4;
const PANEL_RADIUS = 14;

export const BAND_DOT_TOP = (HEADER_ROW_HEIGHT - DOT) / 2;
export const BAND_DOT_TOP_PANEL = PANEL_PAD_TOP + BAND_DOT_TOP;

/**
 * The Care Plan's 11a layout: the date line in the header, the progress card,
 * and the timeline of bands (a picked day, Catch up, today's time bands, later
 * days, Done today) with the harvest-round card inside the morning band.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ── Header date line ───────────────────────────────────────────────────
    headerTitleBlock: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    // No flex and no auto-fit: in this column a flexed, auto-fitting title
    // shrinks to its squeezed height, and Android ignores `minimumFontScale`.
    headerTitle: {
      fontSize: typeSize(theme, 'title', 22),
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    dateLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -8,
    },
    dateStep: {
      width: 32,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateStepDisabled: { opacity: 0.35 },
    dateLabelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 28,
      flexShrink: 1,
    },
    dateLabel: {
      fontSize: 14,
      color: theme.primary,
      flexShrink: 1,
      ...font(theme, 'bodyBold', '700'),
    },
    dateLabelPicked: { color: theme.warningDark },
    todayPill: {
      height: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.warningLight,
    },
    todayPillText: {
      fontSize: 13,
      color: theme.warningDark,
      ...font(theme, 'bodyBold', '700'),
    },

    // ── Progress card ──────────────────────────────────────────────────────
    progressCard: {
      gap: 8,
      marginHorizontal: 14,
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: theme.heroGradientStart,
    },
    progressTop: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    progressTitle: {
      flexShrink: 1,
      fontSize: 18,
      color: theme.heroText,
      ...font(theme, 'title', '700'),
    },
    progressDoneOf: {
      ...mono(theme, '600'),
      fontSize: 11,
      color: theme.heroTextMuted,
    },
    progressTrack: {
      height: 5,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: theme.heroBarTrack,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: theme.heroRingFill,
    },
    progressSubtitle: {
      fontSize: 12,
      color: theme.heroTextMuted,
      ...font(theme, 'bodyMedium', '500'),
    },

    // ── First-load skeleton ────────────────────────────────────────────────
    skeleton: {
      gap: 10,
      marginTop: 14,
      paddingHorizontal: 14,
    },
    skeletonBlock: {
      borderRadius: 14,
      backgroundColor: theme.backgroundTertiary,
    },
    skeletonSummary: { height: 64 },
    skeletonBand: { height: 120 },
    skeletonCard: { height: 64, borderRadius: 12 },
    skeletonFaded: { opacity: 0.6 },

    // Rows outside any band: the harvest round standing alone, state cards.
    standaloneRow: { paddingHorizontal: 14 },
    standaloneRowFirst: { marginTop: 14 },

    // ── Band chrome ────────────────────────────────────────────────────────
    // Every band row is gutter + body; the gutter's line runs the band's height.
    bandRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 14,
    },
    bandRowFirst: { marginTop: 14 },
    gutter: {
      width: BAND_GUTTER_WIDTH,
      alignItems: 'center',
    },
    gutterHeader: { paddingTop: BAND_DOT_TOP },
    gutterHeaderPanel: { paddingTop: BAND_DOT_TOP_PANEL },
    gutterLine: {
      flex: 1,
      width: 2,
      backgroundColor: theme.border,
    },
    gutterLineBelowDot: { marginTop: 4 },
    dot: {
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      borderWidth: 2.5,
      borderColor: theme.primary,
      backgroundColor: theme.background,
    },
    dotNow: { backgroundColor: theme.primary },
    dotPicked: { borderColor: theme.text, backgroundColor: theme.text },
    dotOverdue: { borderColor: theme.error, backgroundColor: theme.error },
    dotLater: { borderColor: theme.borderDark },
    dotDone: { borderColor: theme.success, backgroundColor: theme.success },
    body: {
      flex: 1,
      minWidth: 0,
    },
    bodyPanel: { paddingHorizontal: PANEL_PAD_X },
    bodyPanelTop: {
      paddingTop: PANEL_PAD_TOP,
      borderTopLeftRadius: PANEL_RADIUS,
      borderTopRightRadius: PANEL_RADIUS,
    },
    bodyPanelBottom: {
      paddingBottom: PANEL_PAD_BOTTOM,
      borderBottomLeftRadius: PANEL_RADIUS,
      borderBottomRightRadius: PANEL_RADIUS,
    },
    bodyOverdue: { backgroundColor: theme.errorLight },
    bodyPicked: { backgroundColor: theme.backgroundTertiary },

    // ── Band header ────────────────────────────────────────────────────────
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: HEADER_ROW_HEIGHT,
    },
    title: {
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    titleOverdue: { color: theme.error },
    titleDone: { color: theme.successDark },
    nowChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 999),
      backgroundColor: theme.primary,
    },
    nowChipText: {
      fontSize: 10,
      letterSpacing: 0.4,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
    spacer: { flex: 1 },
    addPill: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: radius(theme, 'chip', 16),
      backgroundColor: theme.card,
    },
    addPillText: {
      fontSize: 12,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    count: {
      ...mono(theme, '700'),
      fontSize: 12,
      color: theme.textSecondary,
    },
    subtitle: {
      marginBottom: 8,
      fontSize: 12,
      lineHeight: 17,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },

    // ── Catch-up more row ──────────────────────────────────────────────────
    moreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      minHeight: 32,
      paddingHorizontal: 2,
    },
    moreRowText: {
      fontSize: 13,
      color: theme.error,
      ...font(theme, 'bodyBold', '700'),
    },

    // ── Harvest round ──────────────────────────────────────────────────────
    // One card across several list rows: each row paints the card's ground,
    // the first rounds the top, the last rounds the bottom and leaves a gap.
    round: {
      backgroundColor: theme.successLight,
    },
    roundFirst: {
      borderTopLeftRadius: radius(theme, 'sheet', 14),
      borderTopRightRadius: radius(theme, 'sheet', 14),
    },
    roundLast: {
      marginBottom: 8,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    roundDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.successBorder,
    },
    roundHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 52,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    roundHeadBody: {
      flex: 1,
      minWidth: 0,
    },
    roundTitle: {
      fontSize: 15,
      color: theme.successDark,
      ...font(theme, 'title', '700'),
    },
    roundSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    roundItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 6,
    },
    roundItemBody: {
      flex: 1,
      minWidth: 0,
    },
    roundItemName: {
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    roundItemStatus: {
      fontSize: 12,
      color: theme.successDark,
      ...font(theme, 'bodyStrong', '600'),
    },
    roundItemStatusLate: { color: theme.warningDark },
    roundItemStatusSoon: { color: theme.textSecondary },
    roundItemSource: {
      color: theme.textTertiary,
      ...font(theme, 'body', '400'),
    },
    roundLog: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: radius(theme, 'card', 20),
      backgroundColor: theme.card,
      ...shadow(theme, 'card'),
    },
    roundLogText: {
      fontSize: 13,
      color: theme.successDark,
      ...font(theme, 'bodyBold', '700'),
    },
    soonToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 12,
    },
    soonToggleText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    soonToggleMeta: {
      fontSize: 12,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
  });
