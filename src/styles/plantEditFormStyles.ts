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
      ...StyleSheet.absoluteFillObject,
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
    // Circular "+" — mirrors sectionHeaderAction on the plant-catalog (care
    // default) screen so section add controls look the same across the app.
    sectionHeaderAction: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary + '30',
    },
    spaceTypeCardHint: {
      fontSize: 10,
      color: theme.textTertiary,
      marginTop: 2,
    },
    spacerSmall: {
      height: 8,
    },
    spacerTiny: {
      height: 4,
    },
    spacerMedium: {
      marginTop: 12,
    },
    // Compact pest/disease records: hairline-separated rows in one bordered card.
    pestListCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      overflow: 'hidden' as const,
      marginBottom: 12,
    },
    pestRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    pestRowLast: {
      borderBottomWidth: 0,
    },
    pestRowIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pestRowIconWrapActive: {
      backgroundColor: theme.errorLight,
    },
    pestRowIconWrapResolved: {
      backgroundColor: theme.successLight,
    },
    pestRowTextBlock: {
      flex: 1,
    },
    pestRowName: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.text,
    },
    pestRowNameResolved: {
      color: theme.textSecondary,
    },
    pestRowMeta: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 1,
    },
    pestRowDelete: {
      padding: 6,
    },
    pestEmpty: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      paddingVertical: 16,
      fontStyle: 'italic' as const,
    },
    carePlanCaption: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: -8,
      marginBottom: 12,
      lineHeight: 16,
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
