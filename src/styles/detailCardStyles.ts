import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Mirrors the form sectionCard tokens (plantFormStyles) so detail and
    // form screens share one card language.
    card: {
      backgroundColor: theme.card,
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      padding: 14,
      marginBottom: 14,
      ...shadow(theme, 'card'),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      marginRight: 8,
    },
    title: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
  });
