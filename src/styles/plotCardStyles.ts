/**
 * Plot card — one per parent location on the Today screen.
 *
 * The card is border-defined rather than shadowed, and carries no tinted bands:
 * the district eyebrow, the plot name with its forecast pill, the due/overdue
 * counts and the context sentence all sit directly on the card ground, so the
 * two tiles below them are the only filled surfaces and read as the card's
 * subject.
 *
 * One full-bleed hairline separates the identity block — where this is and what
 * the sky is doing — from the plot's state below it. It is the only rule on the
 * card: the tiles already separate themselves by being a different surface.
 *
 * Those tiles are the inventory: plants on the left, beds on the right, each a
 * total set large in mono over its states stacked as rows. A state with nothing
 * in it keeps its row and its dot colour — the tile stays readable as a legend —
 * but the number and the word drop to the tertiary ramp, so the shape of the
 * tile is stable while the eye still goes straight to what is there.
 *
 * Status rows are tap targets, so they carry a 30px minimum and the component
 * adds vertical hitSlop on top of it.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_META } from './typography';
import { CARD_GUTTER } from './todayScreenStyles';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: CARD_GUTTER,
      marginTop: 12,
      backgroundColor: theme.card,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderLight,
      padding: 15,
    },

    // ─── Header ──────────────────────────────────────────────────────────────
    eyebrow: {
      fontSize: 10.5,
      fontWeight: '600',
      letterSpacing: 1.1,
      color: theme.textTertiary,
      textTransform: 'uppercase',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 4,
    },
    // The name takes what the forecast pill leaves and ellipsises inside it, so
    // a long plot name never pushes the pill off the row.
    nameTouch: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.2,
      color: theme.text,
    },

    // ─── Forecast pill ───────────────────────────────────────────────────────
    // Today's temperatures beside the plot name, sized to their content. The
    // emoji names the condition and the tint states it a second time in colour,
    // so a wet plot is legible in a glance across a rail of cards. The pill
    // stays the same width whatever the sky is doing — only its ground moves.
    // Tapping it opens the seven-day view — the card's one other destination,
    // and the reason nothing here is a second chevron.
    weatherPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 26,
      paddingHorizontal: 9,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    weatherPillEmoji: {
      fontSize: 12.5,
    },
    weatherPillText: {
      fontSize: 11.5,
      fontWeight: '500',
    },

    // One pair per `WeatherTone`. Cloud, fog and a missing forecast take
    // `neutral`, which is the plain hairline pill the card carried before the
    // tints existed — nothing to report, nothing to colour.
    weatherPillRain: {
      backgroundColor: theme.infoLight,
      borderColor: theme.infoBorder,
    },
    weatherPillTextRain: {
      color: theme.infoDark,
    },
    weatherPillShowers: {
      backgroundColor: theme.infoLight,
      borderColor: theme.borderLight,
    },
    weatherPillTextShowers: {
      color: theme.infoDark,
    },
    // The ochre ramp has no dark ink of its own, so clear borrows warning's —
    // the same family, and the only token pitched to read on `accentLight`.
    weatherPillClear: {
      backgroundColor: theme.accentLight,
      borderColor: theme.warningBorder,
    },
    weatherPillTextClear: {
      color: theme.warningDark,
    },
    weatherPillHot: {
      backgroundColor: theme.errorLight,
      borderColor: theme.errorBorder,
    },
    weatherPillTextHot: {
      color: theme.errorDark,
    },
    weatherPillStorm: {
      backgroundColor: theme.purpleLight,
      borderColor: theme.purpleBorder,
    },
    weatherPillTextStorm: {
      color: theme.purpleDark,
    },
    weatherPillNeutral: {
      borderColor: theme.border,
    },
    weatherPillTextNeutral: {
      color: theme.textSecondary,
    },

    // ─── Identity rule ───────────────────────────────────────────────────────
    // Full-bleed against the card's 15px padding: the name row reads as the
    // card's header, everything under it is the plot's state.
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
      marginHorizontal: -15,
      marginTop: 12,
      marginBottom: 10,
    },

    // ─── Counts ──────────────────────────────────────────────────────────────
    // Due and overdue are different states, so they are separate pills rather
    // than one string with a separator. They always own this row, whatever the
    // data, so one count and two produce the same card skeleton. The row packs
    // to the right, so the counts sit against the chevron that opens them and a
    // quiet plot's "Nothing Due" pill lands where a count would.
    countsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      minHeight: 34,
    },
    pill: {
      overflow: 'hidden',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      fontSize: 11.5,
      fontWeight: '700',
    },
    pillDue: {
      backgroundColor: theme.successLight,
      color: theme.successDark,
    },
    pillOverdue: {
      backgroundColor: theme.errorLight,
      color: theme.errorDark,
    },
    // A quiet plot still gets a pill, so the row keeps one shape whatever the
    // data. The neutral ground is what holds it below the green and the red —
    // present, but not claiming any work is owed.
    pillNone: {
      backgroundColor: theme.borderLight,
      color: theme.textTertiary,
    },
    // Outside the pills: the row opens the Care Plan, not either count. The one
    // chevron on the card, so it means exactly one thing.
    chevron: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textTertiary,
    },

    // ─── Context lines ───────────────────────────────────────────────────────
    // The only prose on the card, and the only part that is not a standing
    // total. Two statements, so two rows: what is wrong now, then when this plot
    // was last worked. Running them together made the second read as a tail of
    // the first.
    lines: {
      marginTop: 2,
      gap: 2,
    },
    // The headline shares its row with the rung tag. Baseline-aligned so the
    // small uppercase tag sits on the sentence's line rather than floating above
    // it, and the sentence wraps beside the tag instead of under it.
    lineRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 7,
    },
    line: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.textSecondary,
    },
    lineHeadline: {
      flex: 1,
      minWidth: 0,
    },
    // The signal itself carries the weight; the freshness line under it is
    // background, so it drops to the tertiary ramp.
    lineStrong: {
      color: theme.text,
      fontWeight: '600',
    },
    lineMuted: {
      color: theme.textTertiary,
    },

    // ─── Rung tag ────────────────────────────────────────────────────────────
    // Which rung of `plotBriefLine`'s ladder produced the sentence, so the kind
    // of signal is scannable before the sentence is read. It carries the
    // urgency and the colour, which is what lets the sentence itself stay plain
    // prose in every state — a late job, a closing weather window and a day's
    // work mix have nothing in common but this row.
    rungTag: {
      overflow: 'hidden',
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontSize: 9.5,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    rungTagOverdue: {
      backgroundColor: theme.errorLight,
      color: theme.errorDark,
    },
    rungTagRain: {
      backgroundColor: theme.infoLight,
      color: theme.infoDark,
    },
    // The day's work mix is not a warning — it is what today weighs. `background`
    // is the same recess the tiles use, so the tag reads as a label, not an alarm.
    rungTagLoad: {
      backgroundColor: theme.background,
      color: theme.textTertiary,
    },

    // ─── Inventory tiles ─────────────────────────────────────────────────────
    tiles: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 13,
    },
    // `background` is the tile ground in both themes: near-white on the white
    // card in light, and a genuine recess against `card` in dark.
    // `backgroundTertiary` is green in dark and cannot be used here.
    tile: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.background,
      borderRadius: 14,
      padding: 12,
    },
    tileHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    tileTotal: {
      ...MONO_META,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '500',
      color: theme.text,
    },
    // Both totals are captions over the rows that divide them up — the rows are
    // the tap targets, so neither unit takes a link colour.
    tileUnit: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textTertiary,
    },

    // ─── Status rows ─────────────────────────────────────────────────────────
    // The rows read as one list, so they sit close: the 30px row height is what
    // separates them, not the gap. The component's vertical hitSlop keeps each
    // one comfortably tappable at this density.
    statusRows: {
      marginTop: 9,
      gap: 2,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 30,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    // Health dots track `HEALTH_STATUS_TONE` in `utils/plantLabels`, the same
    // mapping the plant list and its filter sheet use — these rows open that
    // list, so a status has to be the same colour on both sides of the tap.
    statusDotHealthy: {
      backgroundColor: theme.success,
    },
    statusDotStressed: {
      backgroundColor: theme.warning,
    },
    statusDotRecovering: {
      backgroundColor: theme.info,
    },
    statusDotSick: {
      backgroundColor: theme.error,
    },
    // Bed lifecycles, matching `LIFECYCLE_STRIPE_TOKEN` so a bed reads the same
    // colour here as it does on the bed list.
    statusDotGrowing: {
      backgroundColor: theme.success,
    },
    statusDotResting: {
      backgroundColor: theme.purpleDark,
    },
    statusDotReady: {
      backgroundColor: theme.accent,
    },
    statusDotPermanent: {
      backgroundColor: theme.info,
    },
    statusValue: {
      fontSize: 12.5,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    statusLabel: {
      fontSize: 12.5,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    statusMuted: {
      fontWeight: '400',
      color: theme.textTertiary,
    },

    // ─── Empty beds ──────────────────────────────────────────────────────────
    // Stands in for the bed tile on a plot with no beds: a tile of noughts would
    // imply beds that do not exist.
    emptyBedsTile: {
      justifyContent: 'center',
    },
    emptyBedsLine: {
      fontSize: 12.5,
      lineHeight: 18,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    emptyBedsLink: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 9,
    },
  });
