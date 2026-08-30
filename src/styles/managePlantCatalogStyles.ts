import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_FONT } from './typography';

/** Inner browse-row height: a 36px thumb plus 10px of padding top and bottom. */
export const CATALOG_ROW_HEIGHT = 56;

/**
 * What `getItemLayout` must report: the inner row plus the 1px top and bottom
 * border `listCard` draws around it. `rowDivider` is positioned absolutely so it
 * contributes nothing. Keep this in step with `listCard.borderWidth` — if the two
 * drift apart the browse list mis-measures and scrolling leaves gaps.
 */
export const CATALOG_ROW_TOTAL_HEIGHT = CATALOG_ROW_HEIGHT + 2;

/**
 * Cached per theme. Both catalog row components call `createStyles` once per row
 * instance, so without this every row rebuilt this entire sheet — header, FAB and
 * all. `useTheme()` returns one of two module-level constants, so the key identity
 * is stable and the cache hits for the life of the process.
 */
const styleCache = new WeakMap<Theme, ReturnType<typeof StyleSheet.create>>();

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> => {
  const cached = styleCache.get(theme);
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: {
      width: 36,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },

    // ---- Search bar -------------------------------------------------------
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 14,
      minHeight: 46,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchBarActive: {
      borderColor: theme.primary,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.inputText,
      paddingVertical: 0,
    },

    // ---- Category pills ---------------------------------------------------
    categoryScroll: {
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
      marginBottom: 16,
    },
    plantRowCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      // Fixed, not minHeight: getItemLayout promises exactly this height.
      height: CATALOG_ROW_HEIGHT,
    },
    plantThumbWrap: {
      marginRight: 10,
    },
    plantInfo: {
      flex: 1,
      minWidth: 0,
    },
    plantName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
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
      // to the row's height — CATALOG_ROW_TOTAL_HEIGHT has to stay exact.
      position: 'absolute',
      left: 50,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.borderLight,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 32,
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

  styleCache.set(theme, styles);
  return styles;
};
