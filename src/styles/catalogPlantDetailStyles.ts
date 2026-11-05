import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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
      ...font(theme, 'body'),
    },
    sectionNote: {
      fontSize: 12,
      lineHeight: 17,
      color: theme.textTertiary,
      paddingHorizontal: 14,
      paddingBottom: 12,
      ...font(theme, 'body'),
    },
    loadErrorActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    loadErrorButton: {
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: radius(theme, 'button', 22),
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadErrorButtonPrimary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    loadErrorButtonText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    loadErrorButtonTextPrimary: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
    /**
     * Absolute bar that fades in as the hero scrolls away, mirroring the pest
     * and disease detail screens. It overlays the ScrollView rather than sitting
     * above it, so the hero image can run full-bleed to the top of the screen.
     */
    stickyHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 10,
      gap: 10,
      backgroundColor: theme.tabBarBackground,
    },
    stickyHeaderTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: 17,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radius(theme, 'iconButton', 18),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
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
      borderRadius: radius(theme, 'button', 20),
      ...shadow(theme, 'button'),
    },
    headerSaveButtonDisabled: {
      opacity: 0.6,
    },
    headerSaveText: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
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
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 10,
    },
    /**
     * Cancels `scrollContent`'s inset so the hero runs full-bleed. Done with a
     * negative margin rather than by un-padding the container, so every section
     * keeps measuring its offset against the same parent and the scroll-spy
     * offsets stay correct.
     */
    heroBleed: {
      marginHorizontal: -16,
    },
    sectionHeaderAction: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.borderLight,
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
      ...font(theme, 'bodyStrong', '600'),
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
      borderRadius: radius(theme, 'card', 16),
      padding: 20,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    modalHint: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 12,
      ...font(theme, 'body'),
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
      borderRadius: radius(theme, 'button', 10),
    },
    modalButtonSecondary: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonDanger: {
      backgroundColor: theme.error,
    },
    modalButtonDisabled: {
      opacity: 0.45,
    },
    // A big category (vegetables) would otherwise push Cancel off screen.
    reassignScroll: {
      maxHeight: 280,
      marginBottom: 12,
    },
    modalButtonTextSecondary: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    modalButtonTextPrimary: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyStrong', '600'),
    },
    reassignList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
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
      ...font(theme, 'bodyStrong', '600'),
    },
    reassignTextActive: {
      color: theme.primary,
    },
    modalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: radius(theme, 'iconButton', 15),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
  });
