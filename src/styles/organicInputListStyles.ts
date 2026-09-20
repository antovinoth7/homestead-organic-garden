import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Organic-input browse list — chip-filtered flat list with a "make your own"
 * recipe banner above the chips. Mirrors the pest/disease list layout but the
 * cards carry a category pill, an application rate and a DIY-recipe badge
 * instead of a seasonal risk badge.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Header block — back button, title + subtitle, search field
    headerBlock: {
      paddingHorizontal: 18,
      paddingBottom: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleGroup: {
      flex: 1,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.inputPlaceholder,
      marginTop: 1,
    },
    searchField: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 13,
      paddingHorizontal: 13,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.inputText,
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
      fontWeight: '700',
      color: theme.textInverse,
    },
    recipeBannerSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.heroTextMuted,
      marginTop: 2,
    },

    // Count line
    countRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 6,
    },
    countText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
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
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    cardTile: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    cardTileEmoji: {
      fontSize: 21,
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
      fontWeight: '700',
      color: theme.text,
      flexShrink: 1,
    },
    cardTamil: {
      fontSize: 11,
      color: theme.inputPlaceholder,
      flexShrink: 1,
    },
    cardDescription: {
      fontSize: 12.5,
      lineHeight: 17,
      color: theme.textSecondary,
      marginTop: 3,
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
      borderRadius: 7,
      backgroundColor: theme.backgroundTertiary,
    },
    categoryPillText: {
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    cardRate: {
      fontSize: 10.5,
      color: theme.inputPlaceholder,
    },
    recipeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: theme.primaryLight,
    },
    recipeBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: theme.primary,
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
  });
