import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    section: {
      backgroundColor: theme.backgroundSecondary,
      paddingTop: 12,
      paddingBottom: 14,
      paddingLeft: 16,
      marginTop: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 10,
    },
    listContent: {
      paddingRight: 8,
    },
    card: {
      width: 150,
      padding: 12,
      borderRadius: 14,
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
  });
