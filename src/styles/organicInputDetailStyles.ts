import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Organic-input detail — emoji-watermark hero, a rate/when/ideal-for stat
 * strip, then a tinted panel holding the benefit, precaution and ideal-for
 * sections. Same skeleton as `pestDiseaseDetailStyles`, different sections.
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

    // Hero — oversized emoji watermark behind the name, scrim, title overlay
    hero: {
      height: 250,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
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
    heroCategoryPill: {
      alignSelf: 'flex-start',
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: theme.primaryLight,
    },
    heroCategoryPillText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: theme.primary,
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

    // Rate / when / ideal-for stat strip
    statStrip: {
      marginHorizontal: 18,
      marginTop: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      gap: 10,
    },
    statCell: {
      flex: 1,
      minWidth: 0,
    },
    statLabel: {
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: theme.inputPlaceholder,
    },
    statValue: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 3,
    },

    // Lower panel
    panel: {
      backgroundColor: theme.backgroundTertiary,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      marginTop: 18,
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 24,
    },
    lead: {
      fontSize: 14.5,
      lineHeight: 22,
      color: theme.text,
    },

    // Made from / storage pair
    pairRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
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
      lineHeight: 19,
      color: theme.text,
      marginTop: 6,
    },

    // Section headings
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      marginTop: 20,
      marginBottom: 10,
    },

    // Benefit list ("What it does")
    listCard: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      paddingHorizontal: 14,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 11,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    listRowFirst: {
      borderTopWidth: 0,
    },
    listText: {
      flex: 1,
      minWidth: 0,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.text,
    },

    // Precaution list ("Watch out for")
    warnCard: {
      backgroundColor: theme.accentLight,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 16,
      paddingHorizontal: 14,
    },
    warnRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 11,
      borderTopWidth: 1,
      borderTopColor: theme.accent,
    },

    // Ideal-for chips
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    idealChip: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    idealChipText: {
      fontSize: 13,
      color: theme.text,
    },

    // "Make your own" recipe CTA
    recipeCta: {
      marginTop: 20,
      backgroundColor: theme.primary,
      borderRadius: 16,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    recipeCtaIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.heroDivider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipeCtaBody: {
      flex: 1,
      minWidth: 0,
    },
    recipeCtaTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textInverse,
    },
    recipeCtaSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.heroTextMuted,
      marginTop: 2,
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
