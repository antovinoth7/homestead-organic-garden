/**
 * Forecast overlay — one plot's seven days, opened from its weather chip.
 *
 * A full-bleed page rather than a sheet: it fills the screen above the list so
 * the safe-area insets and the floating tab bar keep behaving as they do on the
 * Today screen itself.
 *
 * Built in the Today screen's card language, because that is the screen this
 * one covers: `CARD_GUTTER` insets, hairline borders, radius 16–20, and no
 * shadows anywhere. Today's weather is the one block that leaves paper — it
 * carries the `hero*` tokens, matching the green header directly behind it.
 *
 * The six day cards stay on `card` and let a 3px rail carry the condition.
 * Tinting the whole card, as this once did, spends the loudest channel on the
 * least surprising fact: a monsoon week is six identical blue blocks, and the
 * one day that differs is the one that stops standing out.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { eyebrow, font, labelCase, radius, shadow } from '@/theme/styleTokens';
import { monoMeta } from '@/styles/typography';
import { CARD_GUTTER } from './todayScreenStyles';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background,
      zIndex: 2,
    },
    scroll: {
      flex: 1,
    },

    // ─── Plot name, in the shared header's right slot ─────────────────────────
    pill: {
      backgroundColor: theme.primaryLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.successBorder,
      borderRadius: radius(theme, 'chip', 999),
      paddingHorizontal: 11,
      paddingVertical: 5,
      maxWidth: 140,
    },
    pillText: {
      fontSize: 11.5,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },

    // ─── Notice cards ────────────────────────────────────────────────────────
    // Inset cards rather than full-bleed bands: they interrupt the card stack,
    // so they read as belonging to it rather than to the header.
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: CARD_GUTTER,
      marginTop: 14,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: theme.cautionLight,
      borderColor: theme.cautionBorder,
    },
    noticeStale: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warningBorder,
    },
    noticeText: {
      flex: 1,
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    retryLink: {
      fontSize: 12,
      color: theme.primary,
      paddingVertical: 4,
      ...font(theme, 'bodyBold', '700'),
    },

    // ─── Today card ──────────────────────────────────────────────────────────
    // The gradient is painted by an SVG rect underneath; `overflow: 'hidden'`
    // is what rounds it, so the radius lives here and not in the drawing.
    today: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 14,
      borderRadius: 20,
      overflow: 'hidden',
      padding: 16,
      backgroundColor: theme.heroGradientStart,
    },
    todayEyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    todayEyebrow: {
      ...monoMeta(theme, '600'),
      flex: 1,
      fontSize: 10.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.heroTextMuted,
      ...labelCase(theme),
    },
    todayCondition: {
      ...monoMeta(theme, '600'),
      fontSize: 10.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: theme.heroTextMuted,
    },
    todayFigureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 14,
      marginBottom: 16,
    },
    todayTemp: {
      ...monoMeta(theme, '700'),
      fontSize: 34,
      lineHeight: 40,
      color: theme.heroText,
    },

    // Three figures on a raised panel, the `todayScreenStyles.heroPanel` recipe.
    todayPanel: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: theme.heroSurface,
      borderRadius: 14,
      paddingVertical: 11,
    },
    todayStat: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    todayStatDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: theme.heroDivider,
      marginVertical: 2,
    },
    todayStatValue: {
      ...monoMeta(theme, '700'),
      fontSize: 20,
      lineHeight: 24,
      color: theme.heroText,
    },
    todayStatLabel: {
      textTransform: 'uppercase',
      color: theme.heroTextFaint,
      marginTop: 4,
      ...eyebrow(theme, { fontSize: 9.5, letterSpacing: 0.9, fontWeight: '600' }),
    },
    // Sits under the jobs figure. Overdue work is the one thing on this card
    // that is not weather, so it gets the one alert colour the hero ramp has.
    todayStatNote: {
      fontSize: 10.5,
      color: theme.heroTextMuted,
      marginTop: 3,
      textAlign: 'center',
      ...font(theme, 'bodyBold', '700'),
    },
    todayStatNoteAlert: {
      color: theme.heroTextAlert,
    },

    // ─── Six days ────────────────────────────────────────────────────────────
    sectionLabel: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      paddingHorizontal: CARD_GUTTER,
      paddingTop: 22,
      paddingBottom: 10,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 1.2, fontWeight: '600' }),
    },
    days: {
      paddingHorizontal: CARD_GUTTER,
      paddingBottom: 6,
    },
    // No fixed column widths anywhere below. The figures used to be aligned by
    // a hardcoded `width: 68` on the temperature and a `minWidth` on the rain,
    // which clipped at large font scales and squeezed the job text to a couple
    // of characters on a narrow phone. Row order does that work instead.
    dayCard: {
      marginBottom: 10,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderLight,
      paddingVertical: 12,
      paddingLeft: 16,
      paddingRight: 14,
    },
    dayRail: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    dayRailRain: { backgroundColor: theme.infoDark },
    dayRailShowers: { backgroundColor: theme.info },
    dayRailClear: { backgroundColor: theme.accent },
    dayRailHot: { backgroundColor: theme.warningDark },
    dayRailStorm: { backgroundColor: theme.purpleDark },
    dayRailNeutral: { backgroundColor: theme.borderLight },

    dayTopRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
    },
    dayName: {
      flex: 1,
      fontSize: 13.5,
      color: theme.text,
      letterSpacing: -0.2,
      ...font(theme, 'bodyStrong', '600'),
    },
    dayTemp: {
      ...monoMeta(theme, '600'),
      fontSize: 13.5,
      color: theme.text,
    },
    // The overnight low is the quieter half of the pair, so it is nested in the
    // same line rather than given a column of its own.
    dayTempMin: {
      color: theme.textTertiary,
      ...font(theme, 'bodyMedium', '500'),
    },
    dayMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 8,
    },
    dayConditionLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    dayRain: {
      ...monoMeta(theme, '500'),
      flexShrink: 1,
      textAlign: 'right',
      fontSize: 11.5,
      color: theme.textTertiary,
    },
    daySpacer: {
      flex: 1,
      minWidth: 8,
    },
    dayJob: {
      marginTop: 8,
      fontSize: 11.5,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    dayJobOverdue: {
      color: theme.errorDark,
    },

    // ─── Empty / retry ───────────────────────────────────────────────────────
    noData: {
      fontSize: 13,
      textAlign: 'center',
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    // Day-card placeholders while the first forecast is fetched.
    loadingDays: {
      paddingHorizontal: CARD_GUTTER,
      paddingTop: 0,
    },
    noDataBlock: {
      alignItems: 'center',
      gap: 12,
      marginHorizontal: CARD_GUTTER,
      paddingHorizontal: 20,
      paddingVertical: 28,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderLight,
    },
    retryButton: {
      minWidth: 88,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderRadius: radius(theme, 'button', 22),
      backgroundColor: theme.primary,
      ...shadow(theme, 'button'),
    },
    retryButtonText: {
      fontSize: 13,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },

    // ─── Source footer ───────────────────────────────────────────────────────
    footer: {
      paddingHorizontal: CARD_GUTTER,
      paddingTop: 16,
    },
    footerText: {
      ...monoMeta(theme, '500'),
      fontSize: 10,
      lineHeight: 17,
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },
    attributionLink: {
      marginTop: 6,
      paddingVertical: 10,
      fontSize: 11,
      color: theme.primary,
      textDecorationLine: 'underline',
      ...font(theme, 'bodyBold', '700'),
    },
  });
