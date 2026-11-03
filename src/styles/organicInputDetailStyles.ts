import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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

    // Hero — oversized emoji watermark behind the name, scrim, title overlay
    hero: {
      height: 250,
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
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
    heroCaption: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 16,
    },
    heroCategoryPill: {
      alignSelf: 'flex-start',
      borderRadius: radius(theme, 'chip', 8),
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: theme.primaryLight,
    },
    heroCategoryPillText: {
      fontSize: 10.5,
      letterSpacing: 0.5,
      color: theme.primary,
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

    // Rate / when / ideal-for stat strip
    statStrip: {
      marginHorizontal: 18,
      marginTop: 16,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      padding: 14,
      flexDirection: 'row',
      gap: 10,
      ...shadow(theme, 'card'),
    },
    statCell: {
      flex: 1,
      minWidth: 0,
    },
    statLabel: {
      fontSize: 9.5,
      letterSpacing: 0.8,
      color: theme.inputPlaceholder,
      ...font(theme, 'bodyBold', '700'),
    },
    statValue: {
      fontSize: 13,
      lineHeight: 17,
      color: theme.primary,
      marginTop: 3,
      ...font(theme, 'bodyStrong', '600'),
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
      ...font(theme, 'body'),
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
      lineHeight: 19,
      color: theme.text,
      marginTop: 6,
      ...font(theme, 'body'),
    },

    // Section headings
    sectionTitle: {
      fontSize: 15,
      color: theme.text,
      marginTop: 20,
      marginBottom: 10,
      ...font(theme, 'title', '700'),
    },

    // Benefit list ("What it does")
    listCard: {
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      paddingHorizontal: 14,
      ...shadow(theme, 'card'),
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
      ...font(theme, 'body'),
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
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'chip', 16),
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    idealChipText: {
      fontSize: 13,
      color: theme.text,
      ...font(theme, 'body'),
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
      color: theme.textInverse,
      ...font(theme, 'title', '700'),
    },
    recipeCtaSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.heroTextMuted,
      marginTop: 2,
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
