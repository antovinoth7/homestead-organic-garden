import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * The search / filter controls every browse header shares — `HeaderIconButton`
 * and `HeaderSearchField`.
 *
 * Plants, Beds, Journal, Care Plan, the catalog and the reference screens each
 * used to carry their own copy of these keys, and the copies drifted: 38, 40
 * and 44px buttons, badges painted the same colour as the button beneath them,
 * an outline magnifier on one screen only. One sheet now, so the nine headers
 * cannot drift apart again.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    /** Filled primary circle — the 44px minimum touch target, drawn in full. */
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** The control's own panel is open. Applied filters are the badge's job. */
    iconBtnActive: {
      backgroundColor: theme.accent,
    },
    /**
     * How many facets are off default. Accent on the primary button, ringed in
     * the header colour so the disc reads on any fill rather than leaving a
     * floating number.
     */
    badge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.tabBarBackground,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    badgeText: {
      fontSize: 10,
      color: theme.textInverse,
      fontWeight: '700',
      lineHeight: 13,
    },
    /**
     * Dot saying the magnifier hides a query that is still in force — the bar
     * collapses without clearing what was typed, and a filtered list with no
     * visible cause is the thing this layout risks.
     */
    dot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.tabBarBackground,
      backgroundColor: theme.accent,
    },

    // ---- Expanded search --------------------------------------------------
    /** Takes over the whole bar — title and actions step aside for it. */
    searchRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    /** The chevron that collapses search, the same circle as the actions. */
    searchBackBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /**
     * The flex is what makes the pill fill the row beside the chevron; without
     * it the field shrinks to its placeholder and runs past the header's right
     * edge on a narrow screen.
     */
    searchField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.background,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.inputText,
      padding: 0,
    },
  });
