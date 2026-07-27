import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Pest & disease browse list — chip-filtered flat list.
 * Separate from `referenceListStyles` because the organic-input list still
 * uses the older sectioned layout.
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
      width: 34,
      height: 34,
      borderRadius: 12,
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

    // Chip row
    chipRow: {
      paddingHorizontal: 18,
      paddingTop: 14,
      gap: 7,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    chipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    chipTextActive: {
      color: theme.textInverse,
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
