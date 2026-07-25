import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 24,
      paddingTop: 12,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    accountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountText: {
      flex: 1,
      alignItems: 'flex-start',
    },
    accountEmail: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    signOutPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.error,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 20,
    },
    signOutPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textInverse,
      marginLeft: 6,
    },
    content: {
      padding: 16,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
  });
