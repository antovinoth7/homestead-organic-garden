import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { RotationStatus } from '@/types/database.types';
import { useCrossBedStatus } from '@/hooks/useCrossBedStatus';
import { BedWithCoverage } from '@/hooks/useBedData';
import { getGreenManureForMonth } from '@/config/beds/greenManureEngine';
import { getTransitionInputs } from '@/config/beds';
import { RotationStatusCard } from '@/components/RotationStatusCard';
import { LOW_LEGUME_THRESHOLD } from '@/utils/filterAndSortBeds';
import { computeFarmRotationSummary } from '@/utils/farmRotationSummary';
import { getHarvestGapWarnings } from '@/services/beds';
import { getDaysToSWMonsoon } from '@/utils/preMonsoonTasks';
import { getSeasonLabel } from '@/utils/seasonHelpers';
import { createStyles } from '@/styles/bedRotationStyles';

interface Props {
  beds: BedWithCoverage[];
  onOpenBed: (bed: BedWithCoverage) => void;
}

export function BedRotationView({ beds, onOpenBed }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { rotationStatuses, loading } = useCrossBedStatus(beds);

  const statusByBed = useMemo(() => {
    const map = new Map<string, RotationStatus>();
    for (const status of rotationStatuses) map.set(status.bed_id, status);
    return map;
  }, [rotationStatuses]);

  const summary = useMemo(
    () => computeFarmRotationSummary(beds, rotationStatuses),
    [beds, rotationStatuses]
  );

  const greenManure = useMemo(() => getGreenManureForMonth(new Date().getMonth() + 1), []);

  // C.9 additions: season countdown + farm-wide harvest-gap warnings.
  const seasonLabel = useMemo(() => getSeasonLabel(), []);
  const daysToMonsoon = useMemo(() => getDaysToSWMonsoon(), []);
  const harvestGaps = useMemo(() => getHarvestGapWarnings(beds), [beds]);
  const bedNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of beds) map[b.id] = b.name;
    return map;
  }, [beds]);

  const legumeHealthy = summary.legumePct !== null && summary.legumePct >= LOW_LEGUME_THRESHOLD;
  const legumeColor = legumeHealthy ? theme.success : theme.warning;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Farm rotation status</Text>

        <View style={styles.seasonBanner}>
          <Ionicons name="calendar-outline" size={14} color={theme.info} />
          <Text style={styles.seasonBannerText}>
            {seasonLabel} · SW monsoon in {daysToMonsoon} day{daysToMonsoon === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Ionicons name="checkmark-done-outline" size={16} color={theme.primary} />
          <Text style={styles.summaryRowText}>
            {summary.rulesTotal > 0
              ? `${summary.rulesPassed} of ${summary.rulesTotal} rules met across ${
                  summary.bedCount
                } bed${summary.bedCount === 1 ? '' : 's'}`
              : 'No rotation rules to check yet'}
          </Text>
        </View>

        {summary.legumePct !== null && (
          <View style={styles.legumeBlock}>
            <View style={styles.legumeHeader}>
              <Text style={styles.legumeLabel}>Farm legume coverage</Text>
              <Text style={[styles.legumeValue, { color: legumeColor }]}>{summary.legumePct}%</Text>
            </View>
            <View style={styles.legumeTrack}>
              <View
                style={[
                  styles.legumeFill,
                  { width: `${Math.min(summary.legumePct, 100)}%`, backgroundColor: legumeColor },
                ]}
              />
            </View>
            <Text style={styles.legumeHint}>
              {legumeHealthy
                ? '✓ Healthy across legume beds'
                : `Target ${LOW_LEGUME_THRESHOLD}% — add a legume to lift coverage`}
            </Text>
          </View>
        )}

        <View style={styles.greenManureBanner}>
          <Ionicons name="leaf-outline" size={14} color={theme.primary} />
          <Text style={styles.greenManureText}>
            Rest beds now: {greenManure.name}
            {greenManure.tamilName ? ` (${greenManure.tamilName})` : ''} — {greenManure.rationale}
          </Text>
        </View>

        {harvestGaps.length > 0 && (
          <View style={styles.gapBlock}>
            <Text style={styles.gapTitle}>Harvest gap warnings</Text>
            {harvestGaps.map((gap) => (
              <View key={`${gap.bed_id}-${gap.gap_start}`} style={styles.gapRow}>
                <Ionicons name="time-outline" size={14} color={theme.warning} />
                <Text style={styles.gapText}>
                  {bedNameById[gap.bed_id] ?? 'Bed'} ({gap.category.replace(/_/g, ' ')}) clears within
                  21 days of another same-guild bed — stagger clearing to avoid a supply gap.
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {loading && rotationStatuses.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        beds.map((bed) => {
          const status = statusByBed.get(bed.id);
          if (!status) return null;
          // Transition-input prescription: soil prep for the previous family.
          const transitionSteps = bed.prev_crop_family
            ? getTransitionInputs(bed.prev_crop_family, 'other', bed.pest_history)
            : [];
          return (
            <View key={bed.id} style={styles.bedBlock}>
              <TouchableOpacity
                style={styles.bedHeader}
                onPress={() => onOpenBed(bed)}
                accessibilityRole="button"
                accessibilityLabel={`View ${bed.name}`}
              >
                <View style={styles.bedHeaderInfo}>
                  <Text style={styles.bedName}>{bed.name}</Text>
                  <Text style={styles.bedType}>{bed.type.replace(/_/g, ' ')}</Text>
                </View>
                <View style={styles.viewBedLink}>
                  <Text style={styles.viewBedText}>View bed</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.primary} />
                </View>
              </TouchableOpacity>
              <RotationStatusCard status={status} bedType={bed.type} hideGreenManure />
              {transitionSteps.length > 0 && (
                <View style={styles.transitionBanner}>
                  <Ionicons name="construct-outline" size={14} color={theme.text} />
                  <Text style={styles.transitionText}>
                    Soil prep after {bed.prev_crop_family?.replace(/_/g, ' ')}:{' '}
                    {transitionSteps.join('; ')}
                  </Text>
                </View>
              )}
            </View>
          );
        })
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
