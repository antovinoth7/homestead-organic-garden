/**
 * TodayHeader — the Today screen's opening lockup, on the hero green.
 *
 * The date opens the day, and the two figures that decide what happens next sit
 * beneath it on a raised panel: work still owed, and anything needing a
 * decision. Both figures are tappable shortcuts — into the Care Plan, and into
 * the needs-action list further down.
 *
 * The task figure is *remaining* work, so it falls as tasks are completed. The
 * plot count is deliberately absent: the cards below already name every plot.
 */

import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/todayScreenStyles';

interface Props {
  dateLabel: string;
  /** Work still owed today — due plus overdue, completions removed. */
  taskCount: number;
  needActionCount: number;
  /** Safe-area top inset — the header sits directly under the status bar. */
  topInset: number;
  onPressTasks: () => void;
  onPressNeedAction: () => void;
}

export const TodayHeader = React.memo(function TodayHeader({
  dateLabel,
  taskCount,
  needActionCount,
  topInset,
  onPressTasks,
  onPressNeedAction,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const taskWord = taskCount === 1 ? 'Task' : 'Tasks';

  return (
    <View style={[styles.hero, { paddingTop: topInset + 10 }]}>
      <Text style={styles.heroDate}>{dateLabel}</Text>

      <View style={[styles.heroPanel, needActionCount === 0 && styles.heroPanelSolo]}>
        <TouchableOpacity
          style={styles.heroStat}
          onPress={onPressTasks}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${taskCount} ${taskWord} left today. Opens the care plan.`}
        >
          <Text style={styles.heroStatValue}>{taskCount}</Text>
          <Text style={styles.heroStatLabel}>{taskWord}</Text>
        </TouchableOpacity>

        {/* Withheld at zero: a nothing-to-do day should say nothing, and the
            needs-action section below is hidden on the same terms. */}
        {needActionCount > 0 && (
          <>
            <View style={styles.heroPanelDivider} />

            <TouchableOpacity
              style={styles.heroStat}
              onPress={onPressNeedAction}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${needActionCount} need action`}
            >
              <Text style={[styles.heroStatValue, styles.heroStatValueAlert]}>
                {needActionCount}
              </Text>
              <Text style={[styles.heroStatLabel, styles.heroStatLabelAlert]}>Need action</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
});
