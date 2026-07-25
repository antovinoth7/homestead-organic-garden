import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Centred dialog card. Deliberately shares the geometry of
 * `confirmDeleteModalStyles` so the generic dialog and the delete dialog read as
 * the same surface — only the action layout differs, which is stacked here to
 * fit three actions without cramming.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      padding: 28,
      alignItems: 'center' as const,
      width: '100%',
      maxWidth: 340,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    title: {
      fontSize: 19,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    // What the dialog is about (e.g. "Water · Black Pepper 02 · due Mon, Jul 27").
    // Carried on its own line so the message below stays a single plain sentence.
    detail: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
      textAlign: 'center' as const,
      marginBottom: 6,
    },
    message: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 21,
      marginBottom: 24,
    },
    actions: {
      width: '100%',
      gap: 10,
    },
    action: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    actionGhost: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionText: {
      fontSize: 15,
      fontWeight: '700' as const,
      flexShrink: 1,
    },
  });
