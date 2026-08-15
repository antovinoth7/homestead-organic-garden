import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * SeasonPanel — formerly the seasonal-guidance card on the Today screen, which
 * now renders `SeasonBlock` instead. Kept with the card metrics the old
 * dashboard shared, pending a decision on retiring the component.
 */
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_MARGIN_TOP = 12;
const CARD_MARGIN_BOTTOM = 4;
const CARD_RADIUS = 12;
const CARD_PADDING = 14;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_MARGIN_HORIZONTAL,
      marginTop: CARD_MARGIN_TOP,
      marginBottom: CARD_MARGIN_BOTTOM,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: CARD_RADIUS,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    // Header doubles as the collapse toggle, so it carries the card padding
    // itself and stretches the full tap width.
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: CARD_PADDING,
      paddingVertical: 12,
    },
    headerBody: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    // Month headline, kept in both states so the shut card still says something.
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 2,
    },
    body: {
      paddingHorizontal: CARD_PADDING,
      paddingBottom: CARD_PADDING,
    },
    note: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    rhythmRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    rhythmLabel: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    rhythmLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    rhythmValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    // Sowing window — its own section on the card surface, set off by the same
    // divider rule used above the rhythm rows rather than a tint.
    sowingTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: 8,
    },
    sowingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    sowingRowBody: {
      flex: 1,
    },
    sowingName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    sowingMeta: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 1,
    },
    // Footer toggle for the remaining crops.
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 8,
    },
    linkText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
  });
