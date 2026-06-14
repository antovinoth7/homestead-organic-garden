import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    toast: {
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { fontSize: 14, color: theme.text, fontWeight: '500' },
    action: { fontSize: 14, fontWeight: '700', color: theme.primary },
    progressTrack: {
      height: 3,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBar: { height: 3, backgroundColor: theme.primary, borderRadius: 2 },
  });
