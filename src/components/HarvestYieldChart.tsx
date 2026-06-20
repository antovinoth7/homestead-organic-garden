import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import type { Theme } from '../theme/colors';
import { createStyles } from '../styles/harvestYieldChartStyles';
import type { YieldBucket } from '../utils/harvestStats';

interface Props {
  data: YieldBucket[];
  unit: string;
}

/** Simple View-based bar chart of harvest yield per season. */
export default function HarvestYieldChart({ data, unit }: Props): React.JSX.Element | null {
  const theme = useTheme() as Theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  // A single season carries no comparison value — only chart 2+ buckets.
  if (data.length < 2) return null;

  const max = Math.max(...data.map((d) => d.total));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yield by season ({unit})</Text>
      <View style={styles.barsRow}>
        {data.map((d) => {
          const heightPct = max > 0 ? Math.max(6, Math.round((d.total / max) * 100)) : 0;
          return (
            <View key={d.key} style={styles.barColumn}>
              <Text style={styles.barValue}>
                {Number.isInteger(d.total) ? d.total : d.total.toFixed(1)}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${heightPct}%` }]} />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
