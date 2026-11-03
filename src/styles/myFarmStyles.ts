import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingBottom: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    // Circular 36px primary — the shared back/add treatment on every stack
    // screen (Plants, Manage catalog, Archived plants). The comp drew rounded
    // squares; matching the rest of the app wins over matching the comp.
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radius(theme, 'iconButton', 18),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    title: { fontSize: 22, color: theme.text, letterSpacing: -0.2, ...font(theme, 'title', '700') },
    content: { flex: 1 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: theme.textSecondary, ...font(theme, 'body') },

    // ── Section headers ──────────────────────────────────────────────────────
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 18,
    },
    sectionHeaderSpaced: { paddingTop: 22 },
    sectionHeaderText: { flex: 1 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sectionTitle: {
      color: theme.textTertiary,
      textTransform: 'uppercase',
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 1, fontWeight: '700' }),
    },
    sectionSubtitle: {
      fontSize: 11.5,
      color: theme.textTertiary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    sectionAddButton: {
      width: 36,
      height: 36,
      borderRadius: radius(theme, 'iconButton', 18),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 3,
      ...shadow(theme, 'iconButton'),
    },

    // ── Plot cards ───────────────────────────────────────────────────────────
    plotList: { paddingHorizontal: 18, paddingTop: 12, gap: 10 },
    plotCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: theme.card,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      padding: 13,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      ...shadow(theme, 'card'),
    },
    plotAvatar: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plotAvatarText: {
      fontSize: 14,
      color: theme.primary,
      letterSpacing: 0.5,
      ...font(theme, 'bodyBold', '700'),
    },
    plotBody: { flex: 1, minWidth: 0 },
    plotTitleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
    },
    plotName: { flex: 1, fontSize: 15.5, color: theme.text, ...font(theme, 'bodyBold', '700') },
    plotCents: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    plotMeta: { fontSize: 12, color: theme.textSecondary, marginTop: 2, ...font(theme, 'body') },
    chipStrip: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 9,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.background,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.borderLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 8),
    },
    chipText: { fontSize: 11, color: theme.textTertiary, ...font(theme, 'bodyStrong', '600') },
    // Drainage only. Not folded into `chipText`: the pH chip shares that key and
    // 'capitalize' would render "pH 5.0" as "PH 5.0".
    chipTextCapitalized: { textTransform: 'capitalize' },
    coordChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 8),
    },
    coordChipText: {
      fontSize: 11,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    npkDotRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    npkDot: { width: 7, height: 7, borderRadius: 4 },
    plotActions: { gap: 7 },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 11),
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 11),
      backgroundColor: theme.errorLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Section tiles ────────────────────────────────────────────────────────
    sectionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 18,
      paddingTop: 12,
      gap: 10,
    },
    sectionTile: {
      width: '48%',
      flexGrow: 1,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 14,
      paddingHorizontal: 13,
      paddingVertical: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionTileTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 6,
    },
    sectionTileName: {
      flex: 1,
      fontSize: 14.5,
      color: theme.text,
      lineHeight: 17,
      ...font(theme, 'bodyBold', '700'),
    },
    sectionTileActions: { flexDirection: 'row', gap: 7 },
    // Matches `plotMeta` — both render the same "N plants" line.
    sectionTileCount: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 8,
      ...font(theme, 'body'),
    },

    // ── Empty states ─────────────────────────────────────────────────────────
    emptyStateCard: {
      alignItems: 'center',
      marginHorizontal: 18,
      marginTop: 12,
      paddingVertical: 24,
      paddingHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: radius(theme, 'card', 14),
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderStyle: 'dashed',
      ...shadow(theme, 'card'),
    },
    emptyStateIcon: { marginBottom: 10 },
    emptyStateTitle: {
      fontSize: 15,
      color: theme.text,
      marginBottom: 4,
      textAlign: 'center',
      ...font(theme, 'title', '700'),
    },
    emptyStateSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      ...font(theme, 'body'),
    },

    // ── Saving overlay ───────────────────────────────────────────────────────
    savingOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    savingText: { fontSize: 14, color: theme.textInverse, ...font(theme, 'bodyStrong', '600') },
  });
