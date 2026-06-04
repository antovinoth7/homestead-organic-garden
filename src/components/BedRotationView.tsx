import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { RotationStatus } from '@/types/database.types';
import { useCrossBedStatus } from '@/hooks/useCrossBedStatus';
import { BedWithCoverage } from '@/hooks/useBedData';
import { getGreenManureForMonth } from '@/config/beds/greenManureEngine';
import { RotationStatusCard } from '@/components/RotationStatusCard';
import { LOW_LEGUME_THRESHOLD } from '@/utils/filterAndSortBeds';
import { computeFarmRotationSummary } from '@/utils/farmRotationSummary';
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

  const legumeHealthy = summary.legumePct !== null && summary.legumePct >= LOW_LEGUME_THRESHOLD;
  const legumeColor = legumeHealthy ? theme.success : theme.warning;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Farm rotation status</Text>

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
      </View>

      {loading && rotationStatuses.length === 0 ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        beds.map((bed) => {
          const status = statusByBed.get(bed.id);
          if (!status) return null;
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
            </View>
          );
        })
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}
