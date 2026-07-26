import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * SeasonPanel — the single seasonal-guidance card on the Today screen. Shares
 * the dashboard card metrics (gutter / radius / padding) used by todayStyles so
 * the scroll reads as one surface.
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
    // Collapsed-only teaser line so the shut card still says something useful.
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
    highlight: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
    note: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      marginTop: 4,
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
    rhythmValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 12,
    },
    linkText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
  });
