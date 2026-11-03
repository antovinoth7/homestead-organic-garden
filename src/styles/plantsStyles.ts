import { StyleSheet, Dimensions } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, eyebrow, font, radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 22,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sheetOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 1000,
      elevation: 1000,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetTitle: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius(theme, 'button', 14),
      backgroundColor: theme.errorLight,
    },
    sheetClearText: {
      fontSize: 13,
      color: theme.error,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetScroll: {
      paddingHorizontal: 20,
      maxHeight: Dimensions.get('window').height * 0.55,
    },
    sheetSectionTitle: {
      color: theme.textSecondary,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
      ...eyebrow(theme, { fontSize: 13, letterSpacing: 0.5, fontWeight: '700' }),
    },
    sheetSubSectionTitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 8,
      marginBottom: 6,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    // Repeated icons (e.g. water droplets) read as one glyph, so they sit tighter
    // together than the chip's own icon-to-label gap.
    sheetChipIconGroup: {
      flexDirection: 'row',
      gap: 1,
    },
    sheetChipText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    sheetChipTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    // A facet that would empty the list still shows its "(0)", muted.
    sheetChipCountZero: {
      color: theme.textTertiary,
    },
    // Health-status tone quartet — mirrors the edit form's chips (plantFormStyles)
    // so a status reads identically wherever it appears.
    sheetChipActiveSuccess: {
      backgroundColor: theme.successLight,
      borderColor: theme.successBorder,
    },
    sheetChipActiveWarning: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warningBorder,
    },
    sheetChipActiveInfo: {
      backgroundColor: theme.infoLight,
      borderColor: theme.infoBorder,
    },
    sheetChipActiveError: {
      backgroundColor: theme.errorLight,
      borderColor: theme.errorBorder,
    },
    sheetChipTextSuccess: {
      color: theme.successDark,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetChipTextWarning: {
      color: theme.warningDark,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetChipTextInfo: {
      color: theme.infoDark,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetChipTextError: {
      color: theme.errorDark,
      ...font(theme, 'bodyStrong', '600'),
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusDotSuccess: { backgroundColor: theme.success },
    statusDotWarning: { backgroundColor: theme.warning },
    statusDotInfo: { backgroundColor: theme.info },
    statusDotError: { backgroundColor: theme.error },

    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.background,
    },
    segmentRow: {
      flexDirection: 'row',
      flex: 1,
      gap: 2,
      padding: 2,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      overflow: 'hidden',
    },
    segmentChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius(theme, 'chip', 12),
    },
    segmentChipActive: {
      backgroundColor: theme.primaryLight,
    },
    segmentChipText: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    segmentChipTextActive: {
      color: theme.primary,
    },
    segmentBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: radius(theme, 'chip', 9),
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    segmentBadgeActive: {
      backgroundColor: theme.primary,
    },
    segmentBadgeText: {
      fontSize: 10,
      color: theme.textTertiary,
      ...font(theme, 'bodyBold', '700'),
    },
    segmentBadgeTextActive: {
      color: theme.textInverse,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 120,
    },
    loadingMore: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    loadMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      marginVertical: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: radius(theme, 'button', 12),
      gap: 8,
    },
    loadMoreText: {
      fontSize: 14,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      color: theme.text,
      marginTop: 16,
      ...font(theme, 'bodyStrong', '600'),
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
      ...font(theme, 'body'),
    },
    clearFiltersEmptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radius(theme, 'button', 20),
      backgroundColor: theme.primaryLight,
    },
    clearFiltersEmptyText: {
      fontSize: 14,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    undoToast: {
      position: 'absolute',
      left: 16,
      right: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      elevation: 6,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      zIndex: 100,
    },
    undoToastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    undoToastLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    undoToastText: {
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyMedium', '500'),
    },
    undoToastAction: {
      fontSize: 14,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    undoProgressTrack: {
      height: 3,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 8,
    },
    undoProgressBar: {
      height: 3,
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
    filterBottomSpacer: {
      height: 12,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
      paddingVertical: 8,
      marginTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 4,
    },
    groupHeaderText: {
      color: theme.textSecondary,
      textTransform: 'uppercase',
      ...eyebrow(theme, { fontSize: 13, letterSpacing: 0.5, fontWeight: '700' }),
    },
  });
