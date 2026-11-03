import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createCarePlanSummaryStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', StyleSheet.hairlineWidth),
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
      ...shadow(theme, 'card'),
    },
    cardCompact: {
      padding: 12,
      marginBottom: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    headerIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      marginRight: 10,
    },
    title: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
      lineHeight: 18,
      ...font(theme, 'body'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    rowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    rowIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      marginRight: 12,
    },
    rowLabel: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    rowValueWrap: {
      alignItems: 'flex-end',
      maxWidth: '60%',
    },
    rowValue: {
      fontSize: 14,
      color: theme.text,
      textAlign: 'right',
      ...font(theme, 'bodyStrong', '600'),
    },
    rowDetail: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 1,
      textAlign: 'right',
      ...font(theme, 'body'),
    },
  });
