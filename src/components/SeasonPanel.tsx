/**
 * SeasonPanel. One card answering "what does this time of year need?" — merging the former season-rhythm card (inline in TodayScreen),
 * AlmanacHighlight (C.4) and PlantNowSection (C.1), which all duplicated each
 * other's calendar framing.
 *
 * Order: month headline → note → care rhythm rows → children (green-manure
 * prompt) → the crops worth sowing this season.
 *
 * Always expanded — the card is reference the grower scans, not a control.
 * Only the crop list itself collapses, to a three-row preview.
 */

import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonPanelStyles';
import { getMonthlyHighlight } from '@/config/almanac';
import { getCurrentSeason, shortenSeasonLabel } from '@/utils/seasonHelpers';
import { getPlantingCandidates } from '@/utils/plantCareDefaults';
import { getWhatToPlantNow, KKSeasonId } from '@/utils/plantingNow';
import { formatDaysToHarvest } from '@/utils/growSpecFormat';
import { getPlantImage } from '@/config/referenceAssets';
import { GardenIcon } from '@/components/GardenIcon';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import type { VisualIconKey } from '@/types/visual.types';
import type { SeasonalFrequency } from '@/config/organicInputs/seasonalAdaptations';

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

/** Ceiling on the sowing list — past this the card stops being a dashboard row. */
const MAX_SUGGESTIONS = 8;
/** Rows shown before the grower taps "All N crops". */
const SOWING_PREVIEW_ROWS = 3;

interface Props {
  /** Current-season care cadences; the rhythm rows are hidden when null. */
  rhythm: SeasonalFrequency | null;
  /** Full season label, e.g. "SW Monsoon (Jun–Sep)". */
  seasonLabel: string;
  /** Rendered inside the card, below the rhythm rows. */
  children?: React.ReactNode;
}

export const SeasonPanel = React.memo(function SeasonPanel({
  rhythm,
  seasonLabel,
  children,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const month = useMemo(() => getMonthlyHighlight(), []);
  const [showAllCrops, setShowAllCrops] = useState(false);

  const toggleShowAllCrops = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllCrops((prev) => !prev);
  }, []);

  const rhythmRows = useMemo(
    () =>
      rhythm === null
        ? []
        : [
            { key: 'water', iconKey: 'task.water' as VisualIconKey, label: 'Water', value: rhythm.waterInterval },
            { key: 'mulch', iconKey: 'task.mulch' as VisualIconKey, label: 'Mulch', value: rhythm.mulchCheck },
            { key: 'jeevamrutha', iconKey: 'task.fertilise' as VisualIconKey, label: 'Jeevamrutha', value: rhythm.jeevamruthaInterval },
          ],
    [rhythm]
  );

  const suggestions = useMemo(() => {
    const season = getCurrentSeason() as KKSeasonId;
    return getWhatToPlantNow(getPlantingCandidates(), season).slice(0, MAX_SUGGESTIONS);
  }, []);

  const visibleCrops = showAllCrops ? suggestions : suggestions.slice(0, SOWING_PREVIEW_ROWS);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <GardenIcon name={month.iconKey} size={20} color={theme.primary} />
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>{month.label} · {shortenSeasonLabel(seasonLabel)}</Text>
          <Text style={styles.headerSubtitle}>{month.highlight}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.note}>{month.note}</Text>

        {rhythmRows.length > 0 && (
          <>
            <View style={styles.divider} />
            {rhythmRows.map((row) => (
              <View key={row.key} style={styles.rhythmRow}>
                <View style={styles.rhythmLabelRow}>
                  <GardenIcon name={row.iconKey} size={16} color={theme.textSecondary} />
                  <Text style={styles.rhythmLabel}>{row.label}</Text>
                </View>
                <Text style={styles.rhythmValue}>{row.value}</Text>
              </View>
            ))}
          </>
        )}

        {children}

        {suggestions.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sowingTitle}>Sow now</Text>

            {visibleCrops.map((crop) => {
              // Empty when the care profile carries no harvest range.
              const days = formatDaysToHarvest(crop.daysToHarvest);
              return (
                <View key={`${crop.plantType}:${crop.variety}`} style={styles.sowingRow}>
                  <ReferenceThumb
                    source={getPlantImage(crop.variety)}
                    fallbackIcon="general.plant"
                    variant="row"
                    accessibilityLabel={`${crop.variety} reference image`}
                  />
                  <View style={styles.sowingRowBody}>
                    <Text style={styles.sowingName} numberOfLines={1}>
                      {crop.variety}
                    </Text>
                    {days.length > 0 && <Text style={styles.sowingMeta}>{days}</Text>}
                  </View>
                </View>
              );
            })}

            {suggestions.length > SOWING_PREVIEW_ROWS && (
              <TouchableOpacity
                style={styles.link}
                onPress={toggleShowAllCrops}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  showAllCrops
                    ? 'Show fewer sowing suggestions'
                    : `Show all ${suggestions.length} sowing suggestions`
                }
              >
                <Text style={styles.linkText}>
                  {showAllCrops ? 'Show fewer' : `All ${suggestions.length} crops`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
});
