import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    section: {
      // No panel chrome: the rail sits directly on the page background like
      // every other block on the dashboard.
      paddingBottom: 4,
    },
    listContent: {
      paddingLeft: 16,
      // Cards carry marginRight: 10, so this tops the trailing gap up to 16.
      paddingRight: 6,
    },
    card: {
      width: 150,
      padding: 12,
      borderRadius: 12,
      marginRight: 10,
      borderWidth: 1,
    },
    cardCritical: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error + '40',
    },
    cardWarning: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning + '40',
    },
    cardInfo: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary + '40',
    },
    iconBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    iconBubbleCritical: {
      backgroundColor: theme.error + '22',
    },
    iconBubbleWarning: {
      backgroundColor: theme.warning + '22',
    },
    iconBubbleInfo: {
      backgroundColor: theme.primary + '22',
    },
    iconText: {
      fontSize: 16,
    },
    title2: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 3,
    },
    message: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 15,
    },
    // Small ✓/✕ action chip in the card's top-right corner (quick-complete a
    // fertilise alert, or dismiss the seasonal green-manure card for the month).
    actionChip: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
