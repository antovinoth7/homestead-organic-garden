import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      paddingHorizontal: 16,
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    sheetTitle: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      ...font(theme, 'bodyStrong', '600'),
    },
    helpText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
      marginBottom: 12,
      ...font(theme, 'body'),
    },
    rangeFields: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    rangeField: {
      flex: 1,
    },
    doneButton: {
      backgroundColor: theme.primary,
      borderRadius: radius(theme, 'button', 24),
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
      ...shadow(theme, 'button'),
    },
    doneButtonText: {
      fontSize: 15,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
  });
