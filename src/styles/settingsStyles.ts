import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, labelCase, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
    headerSpacer: {
      width: 36,
    },
    title: {
      fontSize: 20,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      ...font(theme, 'title', '600'),
      ...labelCase(theme),
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
      ...font(theme, 'body'),
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 12),
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      ...shadow(theme, 'card'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowContent: {
      marginLeft: 16,
    },
    rowTitle: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '600'),
    },
    rowSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.text,
      marginLeft: 12,
      flex: 1,
      ...font(theme, 'body'),
    },
    backupButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRadius: radius(theme, 'button', 10),
      marginTop: 12,
    },
    exportButton: {
      backgroundColor: theme.primary,
    },
    importButton: {
      backgroundColor: theme.background,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    backupButtonText: {
      fontSize: 16,
      color: theme.textInverse,
      marginLeft: 8,
      ...font(theme, 'bodyStrong', '600'),
    },
    backupNoteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      marginTop: 12,
    },
    backupNoteText: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    helpText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 8,
      marginLeft: 32,
      lineHeight: 18,
      ...font(theme, 'body'),
    },
    backupButtonTextSuccess: {
      color: theme.primary,
    },
    backupProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backupProgressText: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyStrong', '600'),
    },
    backupProgressTextSuccess: {
      color: theme.primary,
    },
    paletteList: {
      gap: 12,
      marginBottom: 12,
    },
    themeLabel: {
      fontSize: 16,
      color: theme.text,
      marginBottom: 12,
      ...font(theme, 'bodyStrong', '600'),
    },
    themePills: {
      flexDirection: 'row',
      gap: 8,
    },
    themePill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.background,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    themePillActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    themePillText: {
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    themePillTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    themeHint: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 10,
      lineHeight: 18,
      ...font(theme, 'body'),
    },
  });
