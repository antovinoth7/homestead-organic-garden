import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {},
    list: {},
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundSecondary,
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'title', '600'),
    },
    rowDetail: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
      ...font(theme, 'body'),
    },
    rowDate: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 56,
      gap: 10,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      ...font(theme, 'body'),
    },
  });
