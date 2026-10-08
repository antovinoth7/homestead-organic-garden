import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createEditStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Full-bleed editable hero photo at the top of the scroll, mirroring the
    // detail screen. Negative margins cancel the content container's padding so
    // it spans edge-to-edge and sits flush under the header.
    editHero: {
      marginHorizontal: -16,
      marginTop: -10,
      height: 240,
      backgroundColor: theme.primaryLight,
      overflow: 'hidden' as const,
    },
    editHeroCaption: {
      marginTop: 12,
      marginBottom: 4,
    },
    // In-flow tab bar sits below the hero; spans full-bleed like the header.
    inFlowTabBar: {
      marginHorizontal: -16,
    },
    // Pinned copy of the tab bar, shown below the header once the in-flow bar
    // scrolls away. Absolute so its appearance doesn't shift the scroll content.
    pinnedTabBar: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      backgroundColor: theme.background,
      zIndex: 5,
    },
    editHeaderTitleBlock: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    editHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    editHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      flexShrink: 1,
    },
    editHeaderSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    dataLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 10,
    },
    flexOne: {
      flex: 1,
    },
    // Horizontal/top padding lives on the content container (not the ScrollView
    // box) so the sticky tab bar can span full-bleed via a negative margin.
    scrollBody: {
      paddingHorizontal: 0,
      paddingTop: 0,
    },
    scrollContentPadding: {
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    // PlantSectionHeader carries its own 24px inset, so cancel the content
    // container's 16px padding to keep it aligned with the detail screen.
    sectionHeaderBleed: {
      marginHorizontal: -16,
    },
    spacerMedium: {
      marginTop: 12,
    },
    // Collapsed-by-default "Adjust schedule" expander inside Care & Schedule.
    adjustScheduleHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 12,
    },
    adjustScheduleHeaderText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
    },
    adjustScheduleHint: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 1,
    },
  });
