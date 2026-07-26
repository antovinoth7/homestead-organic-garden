/**
 * PlantNowSection (Phase C, C.1) — "What to Plant Now".
 *
 * Derives sowable varieties for the current Kanyakumari season from the
 * enriched care-profile growing seasons. Pure-logic in `plantingNow.ts`.
 *
 * Collapsed by default: the header names the season and the summary line names
 * the first few varieties, so the card costs two rows until the user opens it.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantNowSectionStyles';
import { getCurrentSeason, getSeasonLabel } from '@/utils/seasonHelpers';
import { getPlantingCandidates } from '@/utils/plantCareDefaults';
import { getWhatToPlantNow, formatSuggestionSummary, KKSeasonId } from '@/utils/plantingNow';
import { getPlantEmoji } from '@/utils/plantHelpers';

// Enable LayoutAnimation on Android only for the old architecture.
const isNewArchitectureEnabled =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager != null;

if (Platform.OS === 'android' && !isNewArchitectureEnabled) {
  try {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  } catch {
    // Silently ignore if unavailable.
  }
}

const MAX_SUGGESTIONS = 8;

/** Fallback tier when a variety has no entry in the catalog emoji map. */
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

const GENERIC_EMOJI = '🌱';

export const PlantNowSection = React.memo(function PlantNowSection(): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expanded, setExpanded] = useState(false);

  const { suggestions, seasonLabel } = useMemo(() => {
    const season = getCurrentSeason() as KKSeasonId;
    const all = getWhatToPlantNow(getPlantingCandidates(), season);
    return { suggestions: all.slice(0, MAX_SUGGESTIONS), seasonLabel: getSeasonLabel() };
  }, []);

  // "SW Monsoon (Jun–Sep)" → "SW Monsoon": the months would push the toggle off the row.
  const shortSeason = useMemo(() => seasonLabel.replace(/\s*\([^)]*\)\s*$/, ''), [seasonLabel]);
  const summary = useMemo(() => formatSuggestionSummary(suggestions), [suggestions]);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          Good sowing window · {shortSeason}
        </Text>
        <TouchableOpacity
          style={styles.link}
          onPress={toggleExpanded}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? 'Hide sowing suggestions'
              : `See all ${suggestions.length} sowing suggestions`
          }
        >
          <Text style={styles.linkText}>{expanded ? 'Hide' : 'See all'}</Text>
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.chipsWrap}>
          {suggestions.map((s) => {
            const emoji = getPlantEmoji(s.variety);
            const icon = emoji === GENERIC_EMOJI ? TYPE_EMOJI[s.plantType] ?? GENERIC_EMOJI : emoji;
            return (
              <View key={`${s.plantType}:${s.variety}`} style={styles.chip}>
                <Text>{icon}</Text>
                <Text style={styles.chipText}>{s.variety}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.summary} numberOfLines={2}>
          {summary}
        </Text>
      )}
    </View>
  );
});
