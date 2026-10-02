import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanBandStyles';
import type { TodaySummary } from '@/utils/carePlanSections';

interface Props {
  summary: TodaySummary;
}

/** Narrowest fill shown, so a day just begun still reads as a bar. */
const MIN_FILL_PERCENT = 2;

/**
 * The card heading the Care Plan: "12 tasks today", "3 of 15 done", a bar,
 * and the shape of the day (overdue · plots · done).
 */
export function CarePlanProgressCard({ summary }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const percent = Math.max(MIN_FILL_PERCENT, Math.round(summary.progress * 100));
  const fillWidth = useMemo(() => ({ width: `${percent}%` as const }), [percent]);

  return (
    <View
      style={styles.progressCard}
      accessibilityRole="summary"
      accessibilityLabel={[summary.title, summary.progressLabel, summary.subtitle]
        .filter(Boolean)
        .join('. ')}
    >
      <View style={styles.progressTop}>
        <Text style={styles.progressTitle}>{summary.title}</Text>
        <Text style={styles.progressDoneOf}>{summary.progressLabel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, fillWidth]} />
      </View>
      {summary.subtitle !== '' && <Text style={styles.progressSubtitle}>{summary.subtitle}</Text>}
    </View>
  );
}
