import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Styles for the reusable VoiceDictation control. Carried over from the
 * journal's inline voice block so every notes/analysis field gets the same
 * compact locale-toggle + mic + live-preview look.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    voiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    voiceLocaleRow: {
      flexDirection: 'row',
      gap: 8,
    },
    voiceLocaleChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    voiceLocaleChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    voiceLocaleChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    voiceLocaleChipTextActive: {
      color: theme.primary,
    },
    voicePreview: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.textSecondary,
      marginBottom: 8,
    },
  });
