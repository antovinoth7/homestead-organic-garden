import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ── Standard List Card ──
    card: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 12),
      padding: 10,
      paddingLeft: 14,
      marginBottom: 8,
      alignItems: 'center',
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
      ...shadow(theme, 'card'),
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
      // Themed, so it works in dark mode. This used to be one of seven pastel
      // hex values picked per plant type and applied inline — light-mode only,
      // and it had no entry for `spinach`.
      backgroundColor: theme.primaryLight,
    },
    missingImageBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 20,
      height: 20,
      borderRadius: radius(theme, 'chip', 10),
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
      color: theme.text,
      flex: 1,
      ...font(theme, 'bodyStrong', '600'),
    },
    badge: {
      fontSize: 9,
      color: theme.accent,
      backgroundColor: theme.accentLight,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      textTransform: 'uppercase',
      maxWidth: 110,
      overflow: 'hidden',
      ...font(theme, 'bodyBold', '700'),
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
      ...font(theme, 'body'),
    },
    metaDot: {
      fontSize: 12,
      color: theme.border,
      marginHorizontal: 5,
      ...font(theme, 'body'),
    },
    ageText: {
      fontSize: 12,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
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
      borderRadius: radius(theme, 'chip', 6),
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
      ...font(theme, 'bodyStrong', '600'),
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
      color: theme.error,
      ...font(theme, 'bodyStrong', '600'),
    },
    bedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 6),
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary + '40',
    },
    bedChipText: {
      fontSize: 11,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    highlight: {
      color: theme.primary,
      backgroundColor: theme.primaryLight,
      ...font(theme, 'bodyBold', '700'),
    },
    chevron: {
      marginLeft: 4,
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
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
  });
