import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: { fontSize: 18, fontWeight: '700', color: theme.text },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
    },
    tabActive: { borderBottomColor: theme.primary },
    tabText: { fontSize: 14, color: theme.textSecondary },
    tabTextActive: { color: theme.primary, fontWeight: '600' },
    list: { padding: 12, paddingBottom: 40 },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskInfo: { flex: 1 },
    taskType: { fontSize: 14, fontWeight: '600', color: theme.text, textTransform: 'capitalize' },
    taskFreq: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    logWeight: { fontSize: 12, color: theme.primary, fontWeight: '600' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyText: { color: theme.textSecondary, textAlign: 'center', fontSize: 14 },
    loader: { flex: 1 },
  });
