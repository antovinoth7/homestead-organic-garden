import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Styles for the reusable VoiceDictation control. Carried over from the
 * journal's inline voice block so every notes/analysis field gets the same
 * compact segmented locale + mic + live-preview look.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    voiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 44,
      marginBottom: 4,
    },
    voiceLocaleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      position: 'relative',
    },
    voiceLocaleCapsule: {
      position: 'absolute',
      top: 6,
      right: 0,
      bottom: 6,
      left: 0,
      borderRadius: 16,
      backgroundColor: theme.backgroundTertiary,
    },
    voiceLocaleTouchTarget: {
      height: 44,
      paddingHorizontal: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceLocaleSegment: {
      height: 28,
      paddingHorizontal: 10,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceLocaleSegmentActive: {
      backgroundColor: theme.primaryLight,
    },
    voiceLocaleText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    voiceLocaleTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    voicePreview: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.textSecondary,
      marginBottom: 8,
    },
  });
