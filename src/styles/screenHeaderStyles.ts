import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font, radius, shadow, typeSize } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radius(theme, 'iconButton', 20),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    title: {
      flex: 1,
      fontSize: typeSize(theme, 'compactTitle', 20),
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });
