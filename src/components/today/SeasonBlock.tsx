/**
 * SeasonBlock - the Today screen's compact seasonal guide.
 *
 * The crop groups deliberately consume a small, source-reviewed district
 * calendar. They never enumerate the user's whole plant catalogue.
 */

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import {
  PerennialCareBrief,
  PlantNowRecommendation,
  SeasonProgress,
} from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonBlockStyles';

interface Props {
  season: SeasonProgress;
  note: string;
  tip: string;
  district: string | null;
  recommendations: PlantNowRecommendation[];
  perennialCare: PerennialCareBrief | null;
}

export const SeasonBlock = React.memo(function SeasonBlock({
  season,
  note,
  tip,
  district,
  recommendations,
  perennialCare,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const elapsed = season.elapsedFraction;
  const sown = recommendations.filter((recommendation) => recommendation.action === 'sow');
  const transplanted = recommendations.filter(
    (recommendation) => recommendation.action === 'transplant'
  );

  const renderGroup = (
    title: string,
    items: PlantNowRecommendation[]
  ): React.JSX.Element | null => {
    if (items.length === 0) return null;
    return (
      <View style={styles.plantGroup}>
        <Text style={styles.plantAction}>{title}</Text>
        <View style={styles.chipRow}>
          {items.map((item) => (
            <View key={item.key} style={styles.chip}>
              <ReferenceThumb source={getPlantImage(item.label)} variant="chip" />
              <Text style={styles.chipText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {season.monthLabel} - {season.seasonName}
        </Text>
        <Text style={styles.week}>
          Week {season.week} of {season.totalWeeks}
        </Text>
      </View>

      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Week ${season.week} of ${season.totalWeeks} of ${season.seasonName}`}
      >
        <View style={[styles.barElapsed, { flex: Math.max(elapsed, 0.02) }]} />
        <View style={[styles.barRemaining, { flex: Math.max(1 - elapsed, 0.02) }]} />
      </View>

      {note.length > 0 && <Text style={styles.note}>{note}</Text>}

      {recommendations.length > 0 && (
        <>
          <Text style={styles.sowTitle}>
            {district ? `Plant now in ${district}` : 'Plant now'}
          </Text>
          {renderGroup('Sow', sown)}
          {renderGroup('Transplant', transplanted)}
        </>
      )}

      {perennialCare !== null && (
        <View style={styles.perennialCare}>
          <Text style={styles.perennialTitle}>Perennial care</Text>
          <Text style={styles.perennialText}>{perennialCare.message}</Text>
        </View>
      )}

      {tip.length > 0 && <Text style={styles.tip}>{tip}</Text>}
    </View>
  );
});
