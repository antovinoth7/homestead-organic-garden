import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** Tap target for the tick — field-friendly, wet or gloved hands. */
export const TASK_TICK_TARGET = 44;
/** Drawn size of the tick ring inside its target. */
export const TASK_TICK_SIZE = 26;

/**
 * Care Plan task card (v7): plant or bed first, the job and amount on the
 * second line, a coloured bar for the task type (red when overdue), and one
 * large tick on the right.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    wrap: {
      marginBottom: 6,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    cardSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    cardDone: {
      opacity: 0.65,
    },
    bar: {
      width: 5,
    },
    body: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 10,
      paddingLeft: 12,
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      flexShrink: 1,
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    titleDone: {
      color: theme.textTertiary,
      textDecorationLine: 'line-through',
    },
    badge: {
      flexShrink: 0,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
      overflow: 'hidden',
    },
    badgeCritical: {
      backgroundColor: theme.errorLight,
      color: theme.error,
    },
    badgeHigh: {
      backgroundColor: theme.warningLight,
      color: theme.warningDark,
    },
    rainChip: {
      flexShrink: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 5,
      backgroundColor: theme.infoLight,
    },
    rainChipText: {
      flexShrink: 1,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: theme.infoDark,
    },
    due: {
      flexShrink: 0,
      marginLeft: 'auto',
      paddingLeft: 6,
      fontSize: 13,
      color: theme.textSecondary,
    },
    dueOverdue: {
      color: theme.error,
      fontWeight: '600',
    },
    dueDone: {
      color: theme.success,
      fontWeight: '600',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
      minWidth: 0,
    },
    meta: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 13,
      color: theme.textSecondary,
    },
    metaLabel: {
      fontWeight: '700',
      color: theme.text,
    },
    metaAmount: {
      fontWeight: '500',
      color: theme.text,
    },
    timeChip: {
      flexShrink: 0,
      marginLeft: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    timeChipWarm: {
      backgroundColor: theme.timeWarmBg,
    },
    timeChipCool: {
      backgroundColor: theme.timeCoolBg,
    },
    timeChipText: {
      fontSize: 11,
      fontWeight: '700',
    },
    timeChipTextWarm: {
      color: theme.timeWarmText,
    },
    timeChipTextCool: {
      color: theme.timeCoolText,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 3,
    },
    hintText: {
      flexShrink: 1,
      fontSize: 12,
      color: theme.success,
      fontWeight: '600',
    },
    tick: {
      width: TASK_TICK_TARGET,
      height: TASK_TICK_TARGET,
      marginRight: 2,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tickBlocked: {
      opacity: 0.4,
    },
    tickRing: {
      width: TASK_TICK_SIZE,
      height: TASK_TICK_SIZE,
      borderRadius: TASK_TICK_SIZE / 2,
      borderWidth: 1.8,
      borderColor: theme.textTertiary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Selection mode turns the ring into a box — the ticks now pick, not finish.
    tickBox: {
      borderRadius: 6,
    },
    tickFilled: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    tickDone: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
  });
