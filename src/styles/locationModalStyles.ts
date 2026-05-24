import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ── Shared modal chrome ──────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalContentTall: {
      maxHeight: '88%',
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
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
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
    modalButtonPrimary: {
      backgroundColor: theme.primary,
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
    // ── Tab row ──────────────────────────────────────────────────────────────
    modalTabRow: {
      flexDirection: 'row',
      borderRadius: 999,
      backgroundColor: theme.background,
      padding: 3,
      marginBottom: 16,
    },
    modalTab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 999,
    },
    modalTabActive: {
      backgroundColor: theme.primary,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    modalTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
    modalTabTextActive: {
      color: theme.textInverse,
      fontWeight: '700',
    },
    // ── Scroll / footer ──────────────────────────────────────────────────────
    scrollContentPadding: {
      paddingTop: 10,
      paddingBottom: 4,
    },
    shortNameWrap: {
      marginTop: 8,
    },
    modalFooter: {
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginTop: 8,
    },
    modalFooterButton: {
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 10,
      marginHorizontal: 0,
    },
    modalFooterButtonPrimary: {
      backgroundColor: theme.primary,
    },
    modalFooterButtonTextPrimary: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textInverse,
    },
    // ── Plot tab ─────────────────────────────────────────────────────────────
    plotSection: {
      marginBottom: 20,
    },
    plotSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textTertiary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    plotStepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.background,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 4,
    },
    plotStepperLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    plotStepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    plotStepperButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plotStepperButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
    },
    plotStepperValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
      minWidth: 28,
      textAlign: 'center',
    },
    plotStepperUnit: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    coordRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 4,
    },
    coordField: {
      flex: 1,
    },
    coordLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    coordInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 12,
      height: 42,
      fontSize: 15,
      color: theme.inputText,
    },
    coordInputError: {
      borderColor: theme.error,
    },
    coordTip: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 8,
      lineHeight: 17,
    },
    // ── Profile editor (Soil tab) ─────────────────────────────────────────────
    profileSection: {
      marginBottom: 16,
    },
    profileSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textTertiary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    profileChipScroll: {
      flexGrow: 0,
    },
    profileChipRow: {
      flexDirection: 'row',
      gap: 8,
      paddingBottom: 4,
    },
    profileChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    profileChipSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    profileChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    profileChipTextSelected: {
      color: theme.textInverse,
      fontWeight: '600',
    },
    profileNpkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    profileNpkLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      width: 14,
    },
    profileNpkChips: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
    },
    profileNpkChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    profileNpkChipSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    profileNpkChipText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    profileNpkChipTextSelected: {
      color: theme.textInverse,
      fontWeight: '600',
    },
    profileDateCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: theme.borderLight,
      overflow: 'hidden',
    },
    profileDateCardTouchable: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    profileDateCardIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    profileDateCardContent: {
      flex: 1,
    },
    profileDateCardLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textTertiary,
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    profileDateCardValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    profileDateCardPlaceholder: {
      fontSize: 14,
      color: theme.inputPlaceholder,
    },
    profileNotesInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.inputText,
      minHeight: 72,
      textAlignVertical: 'top',
    },
    profileStaleDateHint: {
      fontSize: 12,
      color: theme.warning,
      marginTop: 4,
    },
    profileSectionDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
  });
