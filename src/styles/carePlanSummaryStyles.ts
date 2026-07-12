import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createCarePlanSummaryStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
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
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
      lineHeight: 18,
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
    },
    rowValueWrap: {
      alignItems: 'flex-end',
      maxWidth: '60%',
    },
    rowValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'right',
    },
    rowDetail: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 1,
      textAlign: 'right',
    },
  });
