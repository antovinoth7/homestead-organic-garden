import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** Styles for the single-screen add-plant form (successor to the step wizard). */
export const createAddFormStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    content: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
    },
    dateCardLabelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    // Collapsible "Your care plan" section (successor to the review step).
    careSectionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
      padding: 14,
      marginBottom: 14,
    },
    careSectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    careSectionIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.primaryLight,
    },
    careSectionHeaderMeta: {
      flex: 1,
    },
    careSectionTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: theme.text,
    },
    careSectionSummary: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    careSectionBody: {
      marginTop: 12,
    },
    reviewFallbackBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginBottom: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: theme.infoLight,
    },
    reviewFallbackText: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
    },
    reviewFooterHint: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      marginTop: 4,
    },
    reviewFooterHintText: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      lineHeight: 17,
    },
  });
