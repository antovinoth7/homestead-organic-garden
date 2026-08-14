/**
 * Today screen shell — the hero header, the "Needs action" section rule, and
 * the list's empty/loading rows.
 *
 * The screen is one scroll surface on paper: the header and the section labels
 * sit directly on `background`, the plot cards and season block are inset
 * cards, and the needs-action list runs edge to edge on `card`. Only the list
 * rows and their dividers live in `needsActionListStyles`.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/** Gutter shared by the plot cards and the season block. */
export const CARD_GUTTER = 16;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    list: {
      flex: 1,
    },

    // ─── Hero header ─────────────────────────────────────────────────────────
    // The one block that is not on paper: it sits on the deep-green hero ground
    // and so carries light content, using the `hero*` tokens rather than the
    // text ramp. The date opens the day; the two figures that decide what
    // happens next sit beneath it on a raised panel.
    //
    // The bottom padding is what stays green behind the plot card: the card
    // rides up over it by `plotsLift`, leaving a band under the panel rather
    // than letting the card touch the figures.
    hero: {
      paddingHorizontal: 20,
      paddingBottom: 26,
      backgroundColor: theme.heroGradientStart,
    },
    heroDate: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.heroText,
      letterSpacing: -0.2,
    },
    heroPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.heroSurface,
      borderRadius: 14,
      paddingVertical: 11,
      marginTop: 18,
    },
    // One figure does not need the full width — the panel shrinks to it rather
    // than stranding a number in the middle of an empty band.
    heroPanelSolo: {
      alignSelf: 'flex-start',
      paddingHorizontal: 26,
    },
    // Each figure is its own target, so the panel needs the tap height rather
    // than the text.
    heroStat: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingHorizontal: 4,
    },
    heroPanelDivider: {
      width: StyleSheet.hairlineWidth,
      height: 30,
      backgroundColor: theme.heroDivider,
    },
    heroStatValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.heroText,
      lineHeight: 28,
    },
    heroStatValueAlert: {
      color: theme.heroTextAlert,
    },
    heroStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.heroTextFaint,
      marginTop: 4,
    },
    heroStatLabelAlert: {
      color: theme.heroTextAlert,
    },

    // The plot card riding up onto the green. The green ends in a straight
    // edge and the card overlaps it, so the card reads as sitting *on* the
    // hero rather than on a rounded panel floating over it.
    //
    // A bare offset, deliberately: no ground and no radius, so the green shows
    // around the card and `container`'s paper shows below it. The card brings
    // its own 12px top margin — `plotCardStyles.card` on the single-plot path,
    // `plotCarouselStyles.rail` on the rail — so -26 lands the card 14px onto
    // the green either way.
    plotsLift: {
      marginTop: -26,
    },

    // ─── "Needs action" section label ────────────────────────────────────────
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 9,
    },
    sectionTitle: {
      flex: 1,
      fontSize: 15.5,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    sectionCount: {
      fontSize: 11.5,
      fontWeight: '600',
      letterSpacing: 0.6,
      color: theme.errorDark,
    },

    // Indented past the icon tile (36 + 20 padding + 12 gap) so the eye follows
    // the titles down the column rather than the full-width rule.
    divider: {
      height: StyleSheet.hairlineWidth,
      marginLeft: 68,
      backgroundColor: theme.borderLight,
    },

    // ─── List states ─────────────────────────────────────────────────────────
    // An all-clear day has no empty row: the section heading is withheld too,
    // so the screen runs plot cards straight into the season block.
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 64,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    errorText: {
      fontSize: 13,
      color: theme.errorDark,
      paddingHorizontal: 20,
      paddingTop: 12,
    },
  });
