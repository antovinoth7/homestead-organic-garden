import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ── Standard List Card ──
    card: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 10,
      paddingLeft: 14,
      marginBottom: 8,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    healthStripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    imageContainer: {
      position: 'relative',
      marginRight: 12,
    },
    image: {
      width: 64,
      height: 64,
      borderRadius: 10,
    },
    placeholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: {
      fontSize: 32,
    },
    missingImageBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.textInverse + 'D9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    badge: {
      fontSize: 9,
      color: theme.accent,
      backgroundColor: theme.accentLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      fontWeight: '700',
      textTransform: 'uppercase',
      maxWidth: 110,
      overflow: 'hidden',
    },
    variety: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: 'italic',
      marginTop: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      minWidth: 0,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      fontSize: 12,
      color: theme.textTertiary,
      flexShrink: 1,
    },
    metaDot: {
      fontSize: 12,
      color: theme.border,
      marginHorizontal: 5,
    },
    ageText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 6,
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: theme.info + '20',
      borderWidth: 1,
      borderColor: theme.info + '40',
    },
    statusChipOverdue: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error + '30',
    },
    statusChipText: {
      fontSize: 11,
      color: theme.info,
      fontWeight: '600',
    },
    statusChipTextOverdue: {
      color: theme.error,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    pestStatusChip: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error + '40',
    },
    pestStatusChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.error,
    },
    bedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },
    bedChipText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: '600',
    },
    highlight: {
      fontWeight: '700',
      color: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    moreBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 4,
    },

    // ── Swipe action buttons (list mode only) ──
    swipeActions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 8,
      borderRadius: 12,
      overflow: 'hidden',
    },
    swipeEditAction: {
      width: 64,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.info,
    },
    swipeDeleteAction: {
      width: 64,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.error,
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },
    swipeActionText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textInverse,
    },

    // ── Plant action menu (bottom sheet) ──
    menuOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    menuBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    menuSheet: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
      paddingBottom: 8,
    },
    menuHandle: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    menuHandlePill: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
    },
    menuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
    },
    menuPlantAvatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuPlantEmoji: {
      fontSize: 26,
    },
    menuPlantInfo: {
      flex: 1,
    },
    menuPlantName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    menuPlantMeta: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 0,
    },
    menuAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuActionDestructive: {
      // no extra background; icon color signals destructive intent
    },
    menuActionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuActionIconDestructive: {
      backgroundColor: theme.errorLight,
    },
    menuActionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
    },
    menuActionTextDestructive: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.error,
    },
    menuCancelBtn: {
      alignItems: 'center',
      paddingVertical: 14,
    },
    menuCancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textSecondary,
    },

  });
