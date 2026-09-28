import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Styles for the reusable VoiceDictation control. Carried over from the
 * journal's inline voice block so every notes/analysis field gets the same
 * compact segmented locale + mic + live-preview look. The `compact*` keys are
 * the split-pill variant that sits inside a field label row instead.
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

    // ---- Compact split pill (label-row variant) ---------------------------
    // Borrows the catalog chip's language (background ground + 1px border) so
    // the pill reads as a native affordance of the card it sits in. 28/14
    // matches voiceLocaleSegment, keeping both variants on the same metrics.
    compactPill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      overflow: 'hidden',
    },
    compactPillListening: {
      borderColor: theme.error,
    },
    compactMic: {
      width: 34,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactMicListening: {
      backgroundColor: theme.error,
    },
    compactMicMuted: {
      backgroundColor: theme.backgroundSecondary,
    },
    // A full 1px, not hairlineWidth: a hairline reads as a rendering artifact
    // rather than as the seam between two independently tappable halves.
    compactDivider: {
      width: 1,
      height: 18,
      backgroundColor: theme.border,
    },
    compactLocale: {
      minWidth: 34,
      height: 28,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactLocaleText: {
      fontSize: 11.5,
      lineHeight: 18,
      letterSpacing: 0.3,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    // Tamil needs more optical size than Latin to stay legible at this scale.
    // The line box stays 18 so swapping scripts never resizes the pill.
    compactLocaleTextTamil: {
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: '600',
    },
    compactLocaleTextMuted: {
      color: theme.textTertiary,
    },
    // Sits left of the pill inside the label row; flex:1 absorbs the free space
    // so the row's justifyContent has nothing left to redistribute mid-session.
    compactPreview: {
      flex: 1,
      marginLeft: 8,
      fontSize: 11.5,
      fontStyle: 'italic',
      color: theme.textSecondary,
      textAlign: 'right',
    },
  });
