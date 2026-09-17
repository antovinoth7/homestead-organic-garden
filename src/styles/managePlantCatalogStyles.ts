import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_FONT } from './typography';
import {
  catalogRowHeight,
  catalogSectionHeaderHeight,
  clampFontScale,
} from './catalogMetrics';

// Re-exported so existing importers keep working; the numbers themselves live
// in catalogMetrics, which the pure list-building util also reads.
export {
  catalogRowHeight,
  catalogRowTotalHeight,
  catalogSectionHeaderHeight,
} from './catalogMetrics';

/**
 * Cached per theme, then per font scale. Both catalog row components call
 * `createStyles` once per row instance, so without this every row rebuilt this
 * entire sheet — header, FAB and all. `useTheme()` returns one of two
 * module-level constants, so the outer key identity is stable and the cache hits
 * for the life of the process.
 *
 * The inner map is keyed by the *clamped* scale, so the handful of distinct
 * values the clamp can produce is all that is ever cached — and a device that
 * never changes its font size only ever holds one entry.
 */
const styleCache = new WeakMap<Theme, Map<number, ReturnType<typeof StyleSheet.create>>>();

export const createStyles = (
  theme: Theme,
  fontScale = 1
): ReturnType<typeof StyleSheet.create> => {
  const scale = clampFontScale(fontScale);

  let byScale = styleCache.get(theme);
  if (!byScale) {
    byScale = new Map();
    styleCache.set(theme, byScale);
  }
  const cached = byScale.get(scale);
  if (cached) return cached;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    /** Filled primary circle, matching the Plants screen's header controls. */
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconBtnActive: {
      backgroundColor: theme.accent,
    },
    /**
     * Dot on a header icon saying its state is no longer the default — a query
     * still held while search is collapsed, or a non-default grouping. Accent,
     * because the button beneath it is now filled with the primary colour.
     */
    headerActiveDot: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
    /** The chevron that collapses search, mirroring `plantsStyles`. */
    searchBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** Expanded search row — takes the place of the title in the header bar. */
    searchExpandedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },

    // ---- Search bar -------------------------------------------------------
    /**
     * The field lives inside the header bar, so it carries no outer margins —
     * the header owns its padding. `flex: 1` is what makes it fill the row
     * beside the back chevron; without it the pill shrank to its placeholder
     * and ran past the header's right edge on a narrow screen. Geometry copied
     * from `plantsStyles.searchExpandedWrapper` so the two screens match.
     */
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 40,
      borderRadius: 24,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.inputText,
      padding: 0,
    },

    // ---- Category pills ---------------------------------------------------
    categoryScroll: {
      // The search bar used to sit above and supply this gap; with search moved
      // into the header bar, the pill row owns its own breathing room.
      marginTop: 8,
      marginBottom: 8,
    },
    categoryScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryPillActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    categoryPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    categoryPillTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },
    categoryPillBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    categoryPillBadgeActive: {
      backgroundColor: theme.primary,
    },
    categoryPillBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textTertiary,
    },
    categoryPillBadgeTextActive: {
      color: theme.textInverse,
    },

    // ---- List -------------------------------------------------------------
    contentWrapper: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
    },
    listCard: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    listCardFirst: {
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    listCardLast: {
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      // No marginBottom: every letter group ends on this style, and a margin
      // here would be height getItemLayout cannot see. The gap between groups
      // lives in catalogSectionHeader's own height instead, and the list's
      // trailing space comes from contentContainerStyle's paddingBottom.
    },
    plantRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      // Fixed, not minHeight: getItemLayout promises exactly this height.
      height: catalogRowHeight(scale),
    },
    plantThumbWrap: {
      marginRight: 10,
    },
    plantInfo: {
      flex: 1,
      minWidth: 0,
    },
    /** Name and Tamil name share a line, aligned on their baselines. */
    plantNameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 7,
    },
    plantName: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '600',
      color: theme.text,
      // Shrinks rather than pushing the Tamil name off the row.
      flexShrink: 1,
    },
    plantTamil: {
      fontSize: 12.5,
      color: theme.inputPlaceholder,
      flexShrink: 1,
    },
    plantSubtitle: {
      fontSize: 12.5,
      // Explicit, so the two text lines sum to the height catalogRowHeight()
      // budgets for them rather than to whatever the platform picks.
      lineHeight: 16,
      color: theme.textSecondary,
      marginTop: 2,
    },
    /** Pressed feedback — TouchableOpacity's fade alone reads as nothing. */
    plantRowPressed: {
      backgroundColor: theme.backgroundTertiary,
    },

    // ---- Loading skeleton -------------------------------------------------
    skeletonHeader: {
      height: 14,
      width: 120,
      borderRadius: 7,
      backgroundColor: theme.border,
      marginTop: 14,
      marginBottom: 12,
    },
    skeletonThumb: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.border,
      marginRight: 10,
    },
    skeletonLineWide: {
      height: 13,
      width: '62%',
      borderRadius: 6,
      backgroundColor: theme.border,
    },
    skeletonLineNarrow: {
      height: 11,
      width: '38%',
      borderRadius: 6,
      backgroundColor: theme.borderLight,
      marginTop: 7,
    },

    // ---- Group headers (browse mode only) ---------------------------------
    catalogSectionHeader: {
      // Fixed height, and it carries the gap above the group it introduces —
      // see catalogSectionHeaderHeight().
      height: catalogSectionHeaderHeight(scale),
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingBottom: 8,
    },
    catalogSectionLetter: {
      fontSize: 13,
      fontWeight: '700',
      // Tight enough that "Pulses, Oilseeds & Cereals" fits at 400px; shrinks
      // rather than pushing the count off the row.
      letterSpacing: 0.3,
      color: theme.primary,
      flexShrink: 1,
      paddingRight: 8,
    },
    catalogSectionCount: {
      fontFamily: MONO_FONT,
      fontSize: 11,
      color: theme.textTertiary,
    },
    /**
     * Growth habit, rendered inline inside the subtitle line rather than as its
     * own row — catalogRowHeight() is a contract with getItemLayout, so the badge
     * must not add height.
     */
    plantHabit: {
      fontWeight: '700',
      color: theme.primary,
    },
    plantCountChip: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      marginRight: 4,
    },
    plantCountChipText: {
      fontFamily: MONO_FONT,
      fontSize: 11,
      color: theme.primary,
      fontWeight: '600',
    },
    rowDivider: {
      // Absolute so the hairline paints on the card's bottom edge without adding
      // to the row's height — catalogRowTotalHeight() has to stay exact.
      position: 'absolute',
      left: 50,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.borderLight,
    },
    /**
     * Empty state, matching the pest/disease lists: an icon, a line saying which
     * nothing this is, and — where one exists — the way out. The catalog used to
     * render a single italic line that could not tell a failed load from an
     * empty group, so a load failure read as "you have no plants".
     */
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginTop: 12,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      marginTop: 6,
      textAlign: 'center',
    },
    emptyAction: {
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 11,
      backgroundColor: theme.primary,
    },
    emptyActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textInverse,
    },

    // ---- Search results ---------------------------------------------------
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      marginTop: 12,
      marginBottom: 8,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: theme.textSecondary,
    },
    sectionLabelCount: {
      fontFamily: MONO_FONT,
      fontSize: 12,
      color: theme.textTertiary,
    },
    resultSub: {
      fontSize: 11.5,
      color: theme.textTertiary,
      marginTop: 2,
    },
    resultHighlight: {
      backgroundColor: theme.accentLight,
      color: theme.warningDark,
      fontWeight: '700',
    },

    // ---- Recent searches --------------------------------------------------
    recentHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      marginBottom: 8,
    },
    recentClearText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    recentChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    recentChipText: {
      fontSize: 13,
      color: theme.text,
    },

    // ---- "Add as new plant" call to action --------------------------------
    createCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
      marginBottom: 24,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primaryLight,
    },
    createCtaText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.primary,
    },
    createCtaStrong: {
      fontWeight: '700',
      textDecorationLine: 'underline',
    },

    // ---- Group & sort sheet -----------------------------------------------
    sheetOverlay: {
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    sheetSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    /** "Reset" pill — shown only while the grouping is off its default. */
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: theme.errorLight,
    },
    sheetClearText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.error,
    },
    sheetChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    sheetChipText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    sheetChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },

    // ---- FAB --------------------------------------------------------------
    fab: {
      position: 'absolute',
      right: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
      elevation: 6,
    },
  });

  byScale.set(scale, styles);
  return styles;
};
