import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerActionSlot: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      width: '100%',
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      minWidth: 0,
      gap: 6,
    },
    headerMetaText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
      flexShrink: 1,
    },
    headerStatePill: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    headerStatePillCustom: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary + '40',
    },
    headerStatePillDefault: {
      backgroundColor: theme.background,
      borderColor: theme.border,
    },
    headerStatePillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    headerStatePillTextCustom: {
      color: theme.primary,
    },
    headerStatePillTextDefault: {
      color: theme.textSecondary,
    },
    /**
     * Save lives in the header rather than a footer bar so it stays reachable
     * from every tab. It remains pressable when clean — pressing it with no
     * changes just validates and leaves, rather than stranding someone who
     * edited and then reverted.
     */
    headerSaveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
    },
    headerSaveButtonDisabled: {
      opacity: 0.6,
    },
    headerSaveText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textInverse,
    },
    /** Amber dot marking unsaved edits. */
    headerSaveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.accent,
    },
    scroll: {
      flex: 1,
    },
    /** Tab bar as it scrolls with the content. */
    inFlowTabBar: {
      backgroundColor: theme.background,
      paddingBottom: 4,
    },
    /**
     * Pinned copy shown once the in-flow bar scrolls away. Rendered outside the
     * ScrollView because Android drops taps on translated sticky headers.
     */
    pinnedTabBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      backgroundColor: theme.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      paddingBottom: 4,
    },
    scrollContent: {
      padding: 16,
      gap: 10,
    },
    catalogHeroImage: {
      width: '100%',
      height: 180,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
    },
    fieldGroup: {
      marginBottom: 8,
    },
    input: {
      flex: 1,
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 12,
      height: 42,
      fontSize: 15,
      color: theme.inputText,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: 'italic',
    },
    fieldLabelRow: {
      marginBottom: 6,
    },
    rangeField: {
      flex: 1,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.textInverse,
    },
    pruningTipsLabel: {
      fontSize: 12,
      color: theme.textTertiary,
      marginBottom: 6,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
    },
    sectionHeaderAction: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary + '30',
    },
    savingOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    savingText: {
      fontSize: 14,
      color: theme.textInverse,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    modalHint: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
    },
    modalButtonSecondary: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonDanger: {
      backgroundColor: theme.error,
    },
    modalButtonTextSecondary: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    modalButtonTextPrimary: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textInverse,
    },
    reassignList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    reassignItem: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    reassignItemActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    reassignText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    reassignTextActive: {
      color: theme.primary,
    },
    pickerModalContent: {
      maxHeight: '75%',
      padding: 16,
    },
    pickerSearch: {
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      height: 42,
      fontSize: 14,
      color: theme.inputText,
      marginBottom: 10,
    },
    pickerList: {
      flexGrow: 0,
    },
    pickerRow: {
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    pickerRowText: {
      fontSize: 15,
      color: theme.text,
    },
    pickerSeparator: {
      height: 0,
    },
    modalButtonPrimary: {
      backgroundColor: theme.primary,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.primary,
    },
    seasonPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    seasonPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    seasonPillActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    seasonPillText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    seasonPillTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    modalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    varietyNotesInput: {
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 8,
      padding: 10,
      minHeight: 72,
      color: theme.text,
      fontSize: 14,
      textAlignVertical: 'top',
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 4,
    },
  });
