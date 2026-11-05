import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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
      borderRadius: radius(theme, 'iconButton', 19),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    screenTitle: { fontSize: 20, color: theme.text, ...font(theme, 'title', '700') },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, color: theme.text, marginTop: 16, ...font(theme, 'title', '600') },
    emptySubtitle: { color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
    scrollContent: { padding: 12, paddingBottom: 120, gap: 12 },
    loader: { marginTop: 24 },
    bottomSpacer: { height: 12 },
    // Farm summary card
    summaryCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      padding: 14,
      gap: 10,
      ...shadow(theme, 'card'),
    },
    summaryTitle: { fontSize: 16, color: theme.text, ...font(theme, 'title', '700') },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    summaryRowText: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    // Farm legume bar
    legumeBlock: { gap: 6 },
    legumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    legumeLabel: { fontSize: 13, color: theme.text, ...font(theme, 'bodyStrong', '600') },
    legumeValue: { fontSize: 15, ...font(theme, 'bodyBold', '700') },
    legumeTrack: {
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.border,
      overflow: 'hidden',
    },
    legumeFill: { height: 7, borderRadius: 4 },
    legumeHint: { fontSize: 11, color: theme.textTertiary, ...font(theme, 'body') },
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
    greenManureText: {
      flex: 1,
      fontSize: 12,
      color: theme.primary,
      lineHeight: 17,
      ...font(theme, 'body'),
    },
    // Season countdown banner
    seasonBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.infoLight,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    seasonBannerText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    // Harvest-gap warnings
    gapBlock: { gap: 6 },
    gapTitle: { fontSize: 13, color: theme.text, ...font(theme, 'bodyBold', '700') },
    gapRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.warningLight,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    gapText: { flex: 1, fontSize: 12, color: theme.text, lineHeight: 17, ...font(theme, 'body') },
    // Per-bed transition-input prescription
    transitionBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.cautionLight,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    transitionText: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
      lineHeight: 17,
      ...font(theme, 'body'),
    },
    // Per-bed block
    bedBlock: { gap: 6 },
    bedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    bedHeaderInfo: { flex: 1 },
    bedName: { fontSize: 15, color: theme.text, ...font(theme, 'bodyBold', '700') },
    bedType: {
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'capitalize',
      marginTop: 1,
      ...font(theme, 'body'),
    },
    viewBedLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewBedText: { fontSize: 13, color: theme.primary, ...font(theme, 'bodyStrong', '600') },
  });
