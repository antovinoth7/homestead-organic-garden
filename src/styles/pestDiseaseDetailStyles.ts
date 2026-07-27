import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Pest & disease detail — hero-behind-name layout with a seasonal risk card,
 * spot/damage pair, and a numbered action plan.
 * Separate from `referenceDetailStyles`, which the organic-input detail keeps.
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
    stickyHeaderEmoji: {
      fontSize: 22,
    },
    stickyHeaderTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
    },
    stickyBackButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Hero — image or oversized emoji watermark, scrim, title overlay
    hero: {
      height: 250,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
    },
    heroWatermark: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroWatermarkText: {
      fontSize: 190,
      lineHeight: 210,
      opacity: 0.16,
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
      left: 18,
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
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
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    heroRiskPillText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: 32,
      lineHeight: 36,
      fontWeight: '700',
      color: theme.text,
      marginTop: 8,
    },
    heroSubtitle: {
      fontSize: 13.5,
      color: theme.textSecondary,
      marginTop: 3,
    },

    // "Risk in your garden" card
    riskCard: {
      marginHorizontal: 18,
      marginTop: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      padding: 14,
    },
    riskCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    riskCardTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    riskCardReadout: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    riskBars: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 11,
    },
    riskBarColumn: {
      flex: 1,
    },
    riskBarTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.borderLight,
    },
    riskBarLabel: {
      fontSize: 9.5,
      color: theme.inputPlaceholder,
      marginTop: 5,
    },
    riskBarLabelCurrent: {
      color: theme.text,
      fontWeight: '700',
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
    },
    riskAffectsValue: {
      flex: 1,
      minWidth: 0,
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.primary,
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
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 13,
    },
    microLabel: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: theme.textTertiary,
    },
    pairText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.text,
      marginTop: 6,
    },

    // Action plan
    planTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    planSubtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginBottom: 14,
    },
    planCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      marginBottom: 11,
      overflow: 'hidden',
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
      fontWeight: '700',
      color: theme.textInverse,
    },
    planCardBody: {
      flex: 1,
      minWidth: 0,
    },
    planName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 19,
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
      borderRadius: 7,
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
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'capitalize',
    },
    planChipMethodText: {
      color: theme.primary,
    },
    planChipEffortText: {
      color: theme.accent,
    },
    planChipDoseText: {
      color: theme.textTertiary,
      fontWeight: '600',
      textTransform: 'none',
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
    },
    planAddButton: {
      marginTop: 12,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: theme.primary,
      borderRadius: 11,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    planAddButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textInverse,
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
      fontWeight: '700',
      color: theme.primary,
    },
    preventionItem: {
      fontSize: 12.5,
      lineHeight: 19,
      color: theme.primary,
      marginTop: 6,
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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fallbackTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
  });
