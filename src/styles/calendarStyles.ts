import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
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
      // The View Options sheet now carries location, priority, time-of-day and
      // bed sections on top of the task types, so it has to stop growing before
      // it swallows the screen. Same cap the Plants filter sheet uses.
      maxHeight: Dimensions.get('window').height * 0.55,
    },
    sheetScrollContent: {
      paddingBottom: 20,
    },
    sheetSectionTitle: {
      color: theme.textSecondary,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 8,
      ...eyebrow(theme, { fontSize: 13, letterSpacing: 0.5, fontWeight: '700' }),
    },
    sheetChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 44,
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
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
    /** A facet count of zero — still shown, but visibly inert. */
    sheetChipCountZero: {
      color: theme.textTertiary,
    },
    content: {
      // Bottom clearance lives on contentContainerStyle so the list scrolls
      // *under* the floating tab bar instead of ending 120px short of it.
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyStateText: {
      fontSize: 18,
      color: theme.text,
      marginTop: 16,
      textAlign: 'center',
      ...font(theme, 'bodyStrong', '600'),
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      marginBottom: 16,
      textAlign: 'center',
      ...font(theme, 'body'),
    },
    // Compact variant for a single empty *day* inside an otherwise populated
    // list — the full-size emptyState above is for whole-screen empties only.
    emptyStateCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: 'dashed',
    },
    emptyStateCompactBody: {
      flex: 1,
    },
    emptyStateCompactText: {
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    emptyStateCompactSubtext: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    emptyStateCompactAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: theme.primaryLight,
      borderRadius: 16,
    },
    emptyStateCompactActionText: {
      fontSize: 13,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    clearSearchButton: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: theme.primary,
      borderRadius: radius(theme, 'button', 8),
      ...shadow(theme, 'button'),
    },
    clearSearchText: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyStrong', '600'),
    },
    addTaskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.primaryLight,
      borderRadius: radius(theme, 'button', 20),
    },
    addTaskButtonText: {
      fontSize: 14,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: radius(theme, 'sheet', 24),
      borderTopRightRadius: radius(theme, 'sheet', 24),
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    modalCloseButton: {
      width: 44,
      height: 44,
      borderRadius: radius(theme, 'iconButton', 18),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    modalTitle: {
      fontSize: 20,
      color: theme.text,
      ...font(theme, 'title', 'bold'),
    },
    modalTitleWrap: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    modalSaveButton: {
      minHeight: 44,
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius(theme, 'button', 20),
      ...shadow(theme, 'button'),
    },
    modalSaveButtonDisabled: {
      backgroundColor: theme.borderDark,
    },
    modalSaveText: {
      fontSize: 14,
      color: theme.buttonText,
      ...font(theme, 'bodyBold', '700'),
    },
    modalSaveTextDisabled: {
      color: theme.textTertiary,
    },
    modalBody: {
      padding: 24,
      paddingBottom: 24,
    },
    // ScrollView shrinks (rather than pushing the footer off) when the sheet is
    // clamped to maxHeight or the keyboard reduces the available space.
    modalScroll: {
      flexShrink: 1,
    },
    label: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
      ...font(theme, 'bodyStrong', '600'),
    },

    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: radius(theme, 'input', 12),
      marginBottom: 16,
      borderWidth: border(theme, 'input', 1),
      borderColor: theme.inputBorder,
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.text,
      ...font(theme, 'bodyMedium', '500'),
    },
    timeButtons: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    timeButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: radius(theme, 'button', 12),
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      alignItems: 'center',
    },
    timeButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    timeButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    timeButtonTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    taskTypeToggle: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: radius(theme, 'button', 12),
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      alignItems: 'center',
    },
    toggleButtonActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    toggleButtonText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    toggleButtonTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    presets: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    presetButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: radius(theme, 'button', 20),
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    presetButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    presetText: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    presetTextActive: {
      color: theme.primary,
    },
    preview: {
      backgroundColor: theme.accentLight,
      padding: 16,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.accent,
    },
    previewTitle: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 8,
      ...font(theme, 'bodyBold', 'bold'),
    },
    previewText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
      lineHeight: 20,
      ...font(theme, 'body'),
    },
    helperText: {
      fontSize: 12,
      color: theme.textTertiary,
      marginBottom: 24,
      ...font(theme, 'body'),
    },
    selectedTaskInfo: {
      backgroundColor: theme.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    selectedTaskTitle: {
      fontSize: 18,
      color: theme.text,
      marginBottom: 4,
      ...font(theme, 'title', 'bold'),
    },
    selectedTaskPlant: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.warning + '60',
      backgroundColor: theme.warning + '12',
    },
    staleBannerBody: {
      flex: 1,
    },
    staleBannerTitle: {
      color: theme.text,
      fontSize: 13,
      ...font(theme, 'bodyBold', '700'),
    },
    staleBannerText: {
      color: theme.textSecondary,
      fontSize: 11,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    staleBannerRetry: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    staleBannerRetryText: {
      color: theme.warning,
      fontSize: 12,
      ...font(theme, 'bodyBold', '700'),
    },
    earlyCompletionNotice: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.warningLight,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    earlyCompletionNoticeText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.text,
      ...font(theme, 'body'),
    },
    farmDetailsToggle: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    farmDetailsToggleText: {
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    farmDetailsFields: {
      marginTop: 12,
      gap: 4,
    },
    farmDetailsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    farmDetailsField: {
      flex: 1,
    },
    // Skip Modal (Calendar)
    skipModalSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      ...font(theme, 'body'),
    },
    // Shows the exact date a skip will land on, so the 6 PM convention and the
    // "never earlier than the current due date" clamp are both visible up front.
    skipPreviewText: {
      fontSize: 13,
      color: theme.warning,
      marginBottom: 16,
      ...font(theme, 'bodyStrong', '600'),
    },
    skipModalInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: radius(theme, 'input', 12),
      padding: 12,
      fontSize: 15,
      color: theme.inputText,
      minHeight: 80,
      textAlignVertical: 'top',
      marginBottom: 12,
      borderWidth: border(theme, 'input', 1),
      borderColor: theme.inputBorder,
      ...font(theme, 'body'),
    },
    skipReasonChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    // Unselected chips stay neutral so the selected reason is actually legible
    // as a selection rather than every chip reading as "on".
    skipReasonChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.background,
      borderRadius: radius(theme, 'chip', 16),
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    skipReasonChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    skipReasonChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    skipReasonChipTextActive: {
      color: theme.primary,
    },
    // Full-width, `pointerEvents="box-none"` layer whose only job is to centre
    // the pill — taps either side of it fall through to the list.
    selectionBarWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 100,
    },
    // Self-sizing pill: usually one task is selected, so stretching edge to edge
    // overstated it. Width follows the actions instead.
    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: theme.card,
      borderRadius: 999,
      padding: 8,
      gap: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectionBarCancel: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectionBarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.primary,
      paddingVertical: 10,
      minHeight: 44,
      paddingHorizontal: 18,
      borderRadius: radius(theme, 'button', 999),
      ...shadow(theme, 'button'),
    },
    selectionBarBtnText: {
      color: theme.textInverse,
      fontSize: 13,
      ...font(theme, 'bodyBold', '700'),
    },
    previewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    // Tinted fill only — a border on top of the tint read as a second, competing
    // outline next to the solid primary action.
    selectionBarSecondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: radius(theme, 'button', 999),
      backgroundColor: theme.backgroundSecondary,
    },
    selectionBarSecondaryBtnText: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    skipDaysRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    skipDayChip: {
      flex: 1,
      minHeight: 44,
      paddingVertical: 10,
      borderRadius: radius(theme, 'chip', 10),
      alignItems: 'center',
      backgroundColor: theme.background,
      borderWidth: border(theme, 'chip', 1.5),
      borderColor: theme.border,
    },
    skipDayChipActive: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning,
    },
    skipDayChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    skipDayChipTextActive: {
      color: theme.warning,
    },
    flexOne: {
      flex: 1,
    },
    // Clips the collapsible header as it slides up out of view. The list fills
    // this area and is padded down by the header's measured height.
    listArea: {
      flex: 1,
      overflow: 'hidden',
    },
    // Narrow so the header text keeps its place; hitSlop restores 44 px.
    sectionSelectButton: {
      width: 28,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
