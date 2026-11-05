import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createEnrichedSectionStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ─── Stat Grid (Quick Info) ────────────────────────────────────────────────
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statGridItem: {
      width: '48%' as unknown as number,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 12),
      padding: 12,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      ...shadow(theme, 'card'),
    },
    statIconRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginBottom: 4,
      // Reserve two label lines so wrapped labels ("Years to First Harvest")
      // never overflow the card and every value below stays row-aligned.
      minHeight: 32,
    },
    statLabel: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: theme.textTertiary,
      ...font(theme, 'bodyMedium', '500'),
    },
    statValue: {
      fontSize: 16,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },

    // ─── Chip Sections (shared by Relationships, Nutrition, CareGuidance) ──────
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    // ─── Companion / Incompatible Chips ────────────────────────────────────────
    companionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.successLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius(theme, 'chip', 16),
      borderWidth: 1,
      borderColor: theme.successBorder,
    },
    companionChipText: {
      fontSize: 13,
      color: theme.successDark,
      ...font(theme, 'bodyMedium', '500'),
    },
    incompatibleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.errorLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius(theme, 'chip', 16),
      borderWidth: 1,
      borderColor: theme.errorBorder,
    },
    incompatibleChipText: {
      fontSize: 13,
      color: theme.errorDark,
      ...font(theme, 'bodyMedium', '500'),
    },

    // ─── Pest / Disease Chips (tappable) ───────────────────────────────────────
    pestChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.warningLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius(theme, 'chip', 16),
      borderWidth: 1,
      borderColor: theme.warningBorder,
    },
    pestChipText: {
      fontSize: 13,
      color: theme.warningDark,
      ...font(theme, 'bodyMedium', '500'),
    },
    diseaseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.cautionLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius(theme, 'chip', 16),
      borderWidth: 1,
      borderColor: theme.cautionBorder,
    },
    diseaseChipText: {
      fontSize: 13,
      color: theme.cautionDark,
      ...font(theme, 'bodyMedium', '500'),
    },

    // ─── Safety Banner ─────────────────────────────────────────────────────────
    safetyBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.errorLight,
      borderRadius: 12,
      padding: 14,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.errorBorder,
      gap: 12,
    },
    safetyIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.errorBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    safetyContent: {
      flex: 1,
    },
    safetyTitle: {
      fontSize: 15,
      color: theme.errorDark,
      marginBottom: 2,
      ...font(theme, 'title', '700'),
    },
    safetyText: {
      fontSize: 13,
      color: theme.errorDarkest,
      lineHeight: 18,
      ...font(theme, 'body'),
    },

    // ─── Narrative Blocks (Care Guidance) ──────────────────────────────────────
    narrativeBlock: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    narrativeText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
      ...font(theme, 'body'),
    },
    bulletRow: {
      flexDirection: 'row',
      paddingLeft: 4,
      marginBottom: 4,
    },
    bullet: {
      fontSize: 14,
      color: theme.textTertiary,
      marginRight: 8,
      lineHeight: 20,
      ...font(theme, 'body'),
    },
    bulletText: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
      lineHeight: 20,
      ...font(theme, 'body'),
    },
    techniqueRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    techniqueTitle: {
      fontSize: 14,
      color: theme.text,
      lineHeight: 20,
      ...font(theme, 'bodyStrong', '600'),
    },
    techniqueTiming: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    flexOne: {
      flex: 1,
    },

    // ─── Care Toggle (B.9) ────────────────────────────────────────────────────
    toggleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    toggleDisabledText: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: 'italic',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    stepperCardDisabled: {
      opacity: 0.5,
    },

    // ─── Bed Context Section (B2) ─────────────────────────────────────────────
    bedLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    bedLinkText: {
      fontSize: 15,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    bedDims: {
      fontSize: 12,
      color: theme.textTertiary,
      marginLeft: 2,
      ...font(theme, 'body'),
    },
    bedInfoRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    bedInfoLabel: {
      fontSize: 12,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
    bedInfoValue: {
      fontSize: 12,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
  });
