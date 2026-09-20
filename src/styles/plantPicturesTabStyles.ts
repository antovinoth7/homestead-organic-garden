import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      // 22 + the cell's own 2px gutter lands photo edges on the 24px section
      // gutter used by PlantSectionHeader and the Care/Info sections.
      paddingHorizontal: 22,
      paddingVertical: 2,
    },
    cell: {
      width: '33.333%',
      aspectRatio: 1,
      padding: 2,
    },
    image: {
      flex: 1,
      borderRadius: 6,
      backgroundColor: theme.backgroundSecondary,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingVertical: 56,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
