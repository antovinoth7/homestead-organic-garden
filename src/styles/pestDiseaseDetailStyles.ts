import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

/**
 * Pest & disease detail — hero-behind-name layout with a seasonal risk card,
 * spot/damage pair, and a numbered action plan.
 * The organic-input detail mirrors this skeleton in `organicInputDetailStyles`
 * with its own sections.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: 32,
    },

    // Sticky animated header (absolute, fades in on scroll)
    stickyHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 10,
      gap: 8,
    },
    stickyHeaderTitle: {
      fontSize: 17,
      color: theme.text,
      flex: 1,
      ...font(theme, 'title', '700'),
    },
    stickyBackButton: {
      width: 40,
      height: 40,
      borderRadius: radius(theme, 'iconButton', 20),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },

    // Hero — image or oversized emoji watermark, scrim, title overlay
    hero: {
      height: 250,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
    },
    heroImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    heroImageInner: {
      width: '100%',
      height: '100%',
    },
    heroWatermark: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.14,
    },
    heroScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 150,
    },
    heroBackButton: {
      position: 'absolute',
      left: 16,
      width: 40,
      height: 40,
      borderRadius: radius(theme, 'iconButton', 20),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      ...shadow(theme, 'iconButton'),
    },
    /**
     * Slot opposite the back button for a screen-specific action (the catalog
     * puts its Save button here). Sized to clear the 40px back button, but the
     * child owns its own width.
     */
    heroHeaderRight: {
      position: 'absolute',
      right: 16,
      minHeight: 40,
      justifyContent: 'center',
      zIndex: 5,
    },
    heroCaption: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 16,
    },
    heroRiskPill: {
      alignSelf: 'flex-start',
      borderRadius: radius(theme, 'chip', 8),
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    heroRiskPillText: {
      fontSize: 10.5,
      letterSpacing: 0.5,
      ...font(theme, 'bodyBold', '700'),
    },
    heroTitle: {
      fontSize: 32,
      lineHeight: 36,
      color: theme.text,
      marginTop: 8,
      ...font(theme, 'title', '700'),
    },
    heroSubtitle: {
      fontSize: 13.5,
      color: theme.textSecondary,
      marginTop: 3,
      ...font(theme, 'body'),
    },

    // "Risk in your garden" card
    riskCard: {
      marginHorizontal: 18,
      marginTop: 16,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      padding: 14,
      ...shadow(theme, 'card'),
    },
    riskCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    riskCardTitle: {
      fontSize: 12,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    riskCardReadout: {
      fontSize: 11,
      letterSpacing: 0.5,
      ...font(theme, 'bodyBold', '700'),
    },
    riskBars: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 11,
    },
    riskBarColumn: {
      // flex weight is set per-bar from the season's month count
      minWidth: 0,
    },
    riskBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.borderLight,
    },
    riskBarLabel: {
      fontSize: 9,
      color: theme.inputPlaceholder,
      marginTop: 5,
      ...font(theme, 'body'),
    },
    riskBarLabelCurrent: {
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    riskAffectsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginTop: 13,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    riskAffectsLabel: {
      fontSize: 11.5,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    riskAffectsValue: {
      flex: 1,
      minWidth: 0,
      fontSize: 11.5,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },

    // Lower panel (spot/damage + action plan + prevention)
    panel: {
      backgroundColor: theme.backgroundTertiary,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      marginTop: 18,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 24,
    },

    // Spot it / Damage pair
    pairRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    pairCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 14),
      paddingVertical: 12,
      paddingHorizontal: 13,
      ...shadow(theme, 'card'),
    },
    microLabel: {
      fontSize: 10,
      letterSpacing: 0.8,
      color: theme.textTertiary,
      ...font(theme, 'bodyBold', '700'),
    },
    pairText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.text,
      marginTop: 6,
      ...font(theme, 'body'),
    },

    // Action plan
    planTitle: {
      fontSize: 15,
      color: theme.text,
      marginBottom: 4,
      ...font(theme, 'title', '700'),
    },
    planSubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginBottom: 14,
      ...font(theme, 'body'),
    },
    planCard: {
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      marginBottom: 11,
      overflow: 'hidden',
      ...shadow(theme, 'card'),
    },
    planCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 14,
    },
    planNumber: {
      width: 26,
      height: 26,
      borderRadius: 9,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    planNumberText: {
      fontSize: 12.5,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
    planCardBody: {
      flex: 1,
      minWidth: 0,
    },
    planName: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 19,
      ...font(theme, 'bodyBold', '700'),
    },
    planChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 7,
    },
    planChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 7),
    },
    planChipMethod: {
      backgroundColor: theme.primaryLight,
    },
    planChipEffort: {
      backgroundColor: theme.accentLight,
    },
    planChipDose: {
      backgroundColor: theme.backgroundTertiary,
    },
    planChipText: {
      fontSize: 10.5,
      letterSpacing: 0.3,
      textTransform: 'capitalize',
      ...font(theme, 'bodyBold', '700'),
    },
    planChipMethodText: {
      color: theme.primary,
    },
    planChipEffortText: {
      color: theme.accent,
    },
    planChipDoseText: {
      color: theme.textTertiary,
      textTransform: 'none',
      ...font(theme, 'bodyStrong', '600'),
    },
    planCardChevron: {
      paddingTop: 3,
    },

    // Expanded action-plan body
    planDetail: {
      paddingLeft: 52,
      paddingRight: 14,
      paddingBottom: 14,
    },
    planDetailDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginBottom: 12,
    },
    planDetailText: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
      marginTop: 5,
      ...font(theme, 'body'),
    },
    planDetailColumns: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
    },
    planDetailColumn: {
      flex: 1,
      minWidth: 0,
    },
    planDetailValue: {
      fontSize: 12.5,
      color: theme.text,
      marginTop: 3,
      ...font(theme, 'body'),
    },
    planNote: {
      marginTop: 12,
      backgroundColor: theme.background,
      borderRadius: 11,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    planNoteText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    planAddButton: {
      marginTop: 12,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: theme.primary,
      borderRadius: radius(theme, 'button', 11),
      paddingVertical: 9,
      paddingHorizontal: 14,
      ...shadow(theme, 'button'),
    },
    planAddButtonText: {
      fontSize: 13,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },

    // Prevention card
    preventionCard: {
      backgroundColor: theme.primaryLight,
      borderRadius: 16,
      padding: 14,
      marginTop: 6,
    },
    preventionTitle: {
      fontSize: 12.5,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    preventionItem: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.primary,
      marginTop: 6,
      ...font(theme, 'body'),
    },

    // "Not found" fallback header
    fallbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    fallbackBackButton: {
      width: 40,
      height: 40,
      borderRadius: radius(theme, 'iconButton', 20),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    fallbackTitle: {
      fontSize: 22,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
  });
