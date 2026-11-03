import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

/** The card itself, drawn in the active theme. */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      backgroundColor: theme.card,
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    cardActive: {
      borderWidth: 2,
      borderColor: theme.primary,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 17,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    note: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 16,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
  });

/**
 * The thumbnail, drawn in the palette it previews (not the active one), so
 * each card shows its own background, card, ink, primary and accent.
 */
export const createPreviewStyles = (preview: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    frame: {
      width: 92,
      height: 76,
      padding: 8,
      borderRadius: Math.max(4, Math.round(radius(preview, 'card', 12) * 0.4)),
      backgroundColor: preview.background,
      borderWidth: 1,
      borderColor: preview.border,
    },
    inner: {
      flex: 1,
      padding: 6,
      borderRadius: Math.max(4, Math.round(radius(preview, 'card', 12) * 0.45)),
      backgroundColor: preview.card,
      borderWidth: border(preview, 'card', StyleSheet.hairlineWidth),
      borderColor: preview.border,
    },
    line: {
      height: 5,
      width: '70%',
      borderRadius: 2,
      backgroundColor: preview.text,
    },
    lineShort: {
      height: 4,
      width: '46%',
      marginTop: 4,
      borderRadius: 2,
      backgroundColor: preview.text,
      opacity: 0.45,
    },
    swatches: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 9,
    },
    primary: {
      width: 26,
      height: 10,
      borderRadius: radius(preview, 'chip', 3) === 999 ? 8 : 3,
      backgroundColor: preview.primary,
    },
    accent: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: preview.accent,
    },
  });
