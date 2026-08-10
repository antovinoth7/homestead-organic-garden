/**
 * Forecast overlay — one plot's seven days, opened from its weather chip.
 *
 * A full-bleed page rather than a sheet: it fills the screen above the list so
 * the safe-area insets and the floating tab bar keep behaving as they do on the
 * Today screen itself.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_META } from './typography';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background,
      zIndex: 2,
    },
    scroll: {
      flex: 1,
    },

    // ─── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    // The circular primary chip every other screen's back button uses — see
    // `plantDetailStyles.floatingCircleButton` / `plantFormStyles.headerIconButton`.
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 15.5,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    pill: {
      backgroundColor: theme.primaryLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.successBorder,
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 5,
    },
    pillText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.primary,
    },

    // ─── "Not this plot's reading" banner ────────────────────────────────────
    banner: {
      flexDirection: 'row',
      gap: 11,
      paddingHorizontal: 20,
      paddingVertical: 13,
      backgroundColor: theme.cautionLight,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.cautionBorder,
    },
    bannerGlyph: {
      fontSize: 14,
      lineHeight: 18,
    },
    bannerText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.warningLight,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.warningBorder,
    },
    staleText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textSecondary,
    },
    retryLink: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },

    // ─── Today block ─────────────────────────────────────────────────────────
    today: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    todayLabel: {
      ...MONO_META,
      fontSize: 10.5,
      fontWeight: '500',
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },
    todayRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      marginTop: 7,
    },
    todayWeather: {
      flex: 1,
    },
    todayEmoji: {
      fontSize: 24,
    },
    todayTemp: {
      ...MONO_META,
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
    },
    todayMetrics: {
      ...MONO_META,
      marginTop: 3,
      fontSize: 11,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    todayCondition: {
      ...MONO_META,
      flex: 1,
      fontSize: 10.5,
      fontWeight: '500',
      color: theme.textTertiary,
      textAlign: 'right',
      textTransform: 'uppercase',
    },
    todayJob: {
      marginTop: 9,
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    // ─── Seven days ──────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      paddingHorizontal: 20,
      paddingTop: 13,
      paddingBottom: 6,
    },
    days: {
      paddingHorizontal: 20,
      paddingTop: 2,
      paddingBottom: 14,
    },
    // Each day is its own card, tinted by its weather — `dayTone` in the
    // component picks the tone. The column widths below keep the cards' figures
    // in a straight line despite the tints changing nothing about the grid.
    dayRow: {
      paddingHorizontal: 13,
      paddingVertical: 11,
      marginBottom: 8,
      borderRadius: 14,
      borderWidth: 1,
    },
    dayTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dayDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 7,
    },
    dayToneRain: {
      backgroundColor: theme.infoLight,
      borderColor: theme.infoBorder,
    },
    dayToneShowers: {
      backgroundColor: theme.infoLight,
      borderColor: theme.borderLight,
    },
    dayToneHot: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warningBorder,
    },
    dayToneNeutral: {
      backgroundColor: theme.card,
      borderColor: theme.borderLight,
    },
    dayName: {
      flex: 1,
      fontSize: 11.5,
      fontWeight: '600',
      color: theme.text,
    },
    dayEmoji: {
      fontSize: 14,
    },
    dayCondition: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    dayTemp: {
      ...MONO_META,
      width: 68,
      fontSize: 11,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    dayRain: {
      ...MONO_META,
      minWidth: 42,
      fontSize: 11,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    dayJob: {
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      fontSize: 10.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    noData: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    noDataBlock: {
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    retryButton: {
      minWidth: 88,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: 22,
      backgroundColor: theme.primary,
    },
    retryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textInverse,
    },

    // ─── Source footer ───────────────────────────────────────────────────────
    footer: {
      paddingHorizontal: 20,
      paddingTop: 13,
    },
    footerText: {
      ...MONO_META,
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 17,
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },
    attributionLink: {
      marginTop: 7,
      paddingVertical: 8,
      fontSize: 11,
      fontWeight: '700',
      color: theme.primary,
      textDecorationLine: 'underline',
    },
  });
