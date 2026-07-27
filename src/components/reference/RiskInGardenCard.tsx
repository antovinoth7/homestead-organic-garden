import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import {
  getRiskColor,
  getSeasonRiskBars,
  type SeasonalRisk,
} from '@/utils/riskHelpers';

interface Props {
  seasonalRisk?: SeasonalRisk;
  plantsAffected: string[];
}

/**
 * "Risk in your garden" — one bar per zone season in calendar order, plus the
 * plants this entry affects. Replaces the old 2×2 seasonal grid and the
 * separate plant-tag cloud.
 */
export function RiskInGardenCard({ seasonalRisk, plantsAffected }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const bars = useMemo(() => getSeasonRiskBars(seasonalRisk), [seasonalRisk]);
  const current = bars.find((bar) => bar.isCurrent);
  const currentColors = current?.level ? getRiskColor(current.level, theme) : undefined;

  return (
    <View style={styles.riskCard}>
      <View style={styles.riskCardHeader}>
        <Text style={styles.riskCardTitle}>Risk in your garden</Text>
        <Text
          style={[
            styles.riskCardReadout,
            { color: currentColors?.text ?? theme.textTertiary },
          ]}
        >
          {current?.level
            ? `${current.level.toUpperCase()} · ${current.name.toUpperCase()}`
            : `NOT ACTIVE · ${current?.name.toUpperCase() ?? ''}`.trim()}
        </Text>
      </View>

      <View style={styles.riskBars}>
        {bars.map((bar) => {
          const colors = bar.level ? getRiskColor(bar.level, theme) : undefined;
          return (
            <View key={bar.seasonId} style={styles.riskBarColumn}>
              <View
                style={[styles.riskBarTrack, colors ? { backgroundColor: colors.text } : null]}
              />
              <Text style={[styles.riskBarLabel, bar.isCurrent && styles.riskBarLabelCurrent]}>
                {bar.monthLabel}
              </Text>
            </View>
          );
        })}
      </View>

      {plantsAffected.length > 0 ? (
        <View style={styles.riskAffectsRow}>
          <Text style={styles.riskAffectsLabel}>Affects</Text>
          <Text style={styles.riskAffectsValue}>{plantsAffected.join(' · ')}</Text>
        </View>
      ) : null}
    </View>
  );
}
