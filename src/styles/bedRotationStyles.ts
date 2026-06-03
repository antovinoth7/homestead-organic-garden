import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Standalone screen chrome
    screenContainer: { flex: 1, backgroundColor: theme.background },
    screenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    screenTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 16 },
    emptySubtitle: { color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
    scrollContent: { padding: 12, paddingBottom: 120, gap: 12 },
    loader: { marginTop: 24 },
    bottomSpacer: { height: 12 },
    // Farm summary card
    summaryCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 10,
    },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryRowText: { flex: 1, fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
    // Farm legume bar
    legumeBlock: { gap: 6 },
    legumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    legumeLabel: { fontSize: 13, color: theme.text, fontWeight: '600' },
    legumeValue: { fontSize: 15, fontWeight: '700' },
    legumeTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    legumeFill: { height: 7, borderRadius: 4 },
    legumeHint: { fontSize: 11, color: theme.textTertiary },
    // Green manure banner
    greenManureBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    greenManureText: { flex: 1, fontSize: 12, color: theme.primary, lineHeight: 17 },
    // Per-bed block
    bedBlock: { gap: 6 },
    bedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    bedHeaderInfo: { flex: 1 },
    bedName: { fontSize: 15, fontWeight: '700', color: theme.text },
    bedType: {
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'capitalize',
      marginTop: 1,
    },
    viewBedLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewBedText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  });
