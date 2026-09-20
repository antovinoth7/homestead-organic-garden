import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Pest & disease browse list — cards, count line and empty state.
 *
 * The header bar, filter sheet and section dividers live in
 * `referenceBrowseStyles`, shared with the organic-input list. What stays here
 * is what genuinely differs between the two: these cards carry a seasonal risk
 * badge and an affected-plants label.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      overflow: 'hidden',
    },
    cardTileEmoji: {
      fontSize: 21,
    },
    cardTileImage: {
      width: 44,
      height: 44,
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
    cardSymptom: {
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
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
    },
    riskBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    cardPlantsLabel: {
      fontSize: 10.5,
      color: theme.inputPlaceholder,
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
