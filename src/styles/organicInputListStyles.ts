import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

/**
 * Organic-input browse list — the "make your own" recipe banner, cards, count
 * line and empty state.
 *
 * The header bar, filter sheet and section dividers live in
 * `referenceBrowseStyles`, shared with the pest/disease list. What stays here
 * is what differs: the banner, and cards carrying a category pill, an
 * application rate and a DIY-recipe badge instead of a seasonal risk badge.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // "Make your own" recipe banner
    recipeBanner: {
      marginHorizontal: 18,
      marginTop: 14,
      backgroundColor: theme.primary,
      borderRadius: 16,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    recipeBannerIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.heroDivider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recipeBannerBody: {
      flex: 1,
      minWidth: 0,
    },
    recipeBannerTitle: {
      fontSize: 15,
      color: theme.textInverse,
      ...font(theme, 'title', '700'),
    },
    recipeBannerSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.heroTextMuted,
      marginTop: 2,
      ...font(theme, 'body'),
    },

    // List
    listContent: {
      paddingHorizontal: 18,
      paddingBottom: 28,
      gap: 9,
    },

    // Row card
    card: {
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 14),
      paddingVertical: 12,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      ...shadow(theme, 'card'),
    },
    cardTile: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    cardTileImage: {
      width: 44,
      height: 44,
      borderRadius: 14,
    },
    cardBody: {
      flex: 1,
      minWidth: 0,
    },
    cardNameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 7,
    },
    cardName: {
      fontSize: 14.5,
      color: theme.text,
      flexShrink: 1,
      ...font(theme, 'bodyBold', '700'),
    },
    cardTamil: {
      fontSize: 11,
      color: theme.inputPlaceholder,
      flexShrink: 1,
      ...font(theme, 'body'),
    },
    cardDescription: {
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.textSecondary,
      marginTop: 3,
      ...font(theme, 'body'),
    },
    cardMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    categoryPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 7),
      backgroundColor: theme.backgroundTertiary,
    },
    categoryPillText: {
      fontSize: 10.5,
      color: theme.textTertiary,
      ...font(theme, 'bodyStrong', '600'),
    },
    cardRate: {
      fontSize: 10.5,
      color: theme.inputPlaceholder,
      ...font(theme, 'body'),
    },
    recipeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 7),
      backgroundColor: theme.primaryLight,
    },
    recipeBadgeText: {
      fontSize: 10.5,
      letterSpacing: 0.4,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    cardChevron: {
      paddingTop: 12,
    },

    // Empty state
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 12,
      textAlign: 'center',
      ...font(theme, 'body'),
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
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
  });
