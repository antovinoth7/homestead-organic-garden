import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { MONO_FONT } from '@/styles/typography';

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
    },
    dateLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: -8,
    },
    dateStep: {
      width: 32,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateStepDisabled: { opacity: 0.35 },
    dateLabelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 36,
      flexShrink: 1,
    },
    dateLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
      flexShrink: 1,
    },
    dateLabelPicked: { color: theme.warningDark },
    todayPill: {
      height: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: theme.warningLight,
    },
    todayPillText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.warningDark,
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
      fontWeight: '700',
      color: theme.heroText,
    },
    progressDoneOf: {
      fontFamily: MONO_FONT,
      fontSize: 11,
      fontWeight: '600',
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
      fontWeight: '500',
      color: theme.heroTextMuted,
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
      fontWeight: '700',
      color: theme.text,
    },
    titleOverdue: { color: theme.error },
    titleDone: { color: theme.successDark },
    nowChip: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    nowChipText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.textInverse,
    },
    spacer: { flex: 1 },
    addPill: {
      minHeight: 32,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: 16,
      backgroundColor: theme.card,
    },
    addPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
    count: {
      fontFamily: MONO_FONT,
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    subtitle: {
      marginBottom: 8,
      fontSize: 12,
      lineHeight: 17,
      color: theme.textTertiary,
    },

    // ── Catch-up footer ────────────────────────────────────────────────────
    footerActions: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 6,
    },
    footerButton: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    footerButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    footerButtonStrong: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    footerButtonStrongText: { color: theme.textInverse },

    // ── Harvest round ──────────────────────────────────────────────────────
    // One card across several list rows: each row paints the card's ground,
    // the first rounds the top, the last rounds the bottom and leaves a gap.
    round: {
      backgroundColor: theme.successLight,
    },
    roundFirst: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
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
      fontWeight: '700',
      color: theme.successDark,
    },
    roundSubtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
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
      fontWeight: '700',
      color: theme.text,
    },
    roundItemStatus: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.successDark,
    },
    roundItemStatusLate: { color: theme.warningDark },
    roundItemStatusSoon: { color: theme.textSecondary },
    roundItemSource: {
      fontWeight: '400',
      color: theme.textTertiary,
    },
    roundLog: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: theme.card,
    },
    roundLogText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.successDark,
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
      fontWeight: '600',
      color: theme.text,
    },
    soonToggleMeta: {
      fontSize: 12,
      color: theme.textTertiary,
    },
  });
