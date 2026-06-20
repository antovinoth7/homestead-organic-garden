/**
 * PlantNowSection (Phase C, C.1) — "What to Plant Now".
 *
 * Derives sowable varieties for the current Kanyakumari season from the
 * enriched care-profile growing seasons. Pure-logic in `plantingNow.ts`.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantNowSectionStyles';
import { getCurrentSeason, getSeasonLabel } from '@/utils/seasonHelpers';
import { getPlantingCandidates } from '@/utils/plantCareDefaults';
import { getWhatToPlantNow, KKSeasonId } from '@/utils/plantingNow';

const MAX_SUGGESTIONS = 8;

const TYPE_EMOJI: Record<string, string> = {
  vegetable: '🥕',
  herb: '🌿',
  flower: '🌼',
  fruit_tree: '🌳',
  timber_tree: '🪵',
  coconut_tree: '🥥',
  shrub: '🌱',
  spinach: '🥬',
};

export const PlantNowSection = React.memo(function PlantNowSection(): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { suggestions, seasonLabel } = useMemo(() => {
    const season = getCurrentSeason() as KKSeasonId;
    const all = getWhatToPlantNow(getPlantingCandidates(), season);
    return { suggestions: all.slice(0, MAX_SUGGESTIONS), seasonLabel: getSeasonLabel() };
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🌱 What to Plant Now</Text>
      <Text style={styles.subtitle}>Good sowing window for {seasonLabel}</Text>
      <View style={styles.chipsWrap}>
        {suggestions.map((s) => (
          <View key={`${s.plantType}:${s.variety}`} style={styles.chip}>
            <Text>{TYPE_EMOJI[s.plantType] ?? '🌱'}</Text>
            <Text style={styles.chipText}>{s.variety}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});
