import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useBedDetail } from '@/hooks/useBedDetail';
import { RotationStatusCard } from '@/components/RotationStatusCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BedTopDownMap } from '@/components/BedTopDownMap';
import { BedSuccessionTimeline } from '@/components/BedSuccessionTimeline';
import {
  markBedAsResting,
  endBedRest,
  getTransitionInputs,
  getHarvestGapWarnings,
} from '@/services/beds';
import { getSmartNextCrops, getGuildTemplate } from '@/config/beds';
import { getLayerColor } from '@/config/beds/layerMeta';
import { computeRowLayout } from '@/utils/rowLayoutEngine';
import type { RowLayoutResult } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import { plantToEntry } from '@/utils/bedEditReconcile';
import { getPlantEmoji } from '@/utils/plantHelpers';
import { createStyles } from '@/styles/bedDetailStyles';
import { logger } from '@/utils/logger';
import type { BedLayer } from '@/types/database.types';
import type {
  BedDetailScreenNavigationProp,
  BedDetailScreenRouteProp,
} from '@/types/navigation.types';

function formatRelativeDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Never';
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function BedDetailScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<BedDetailScreenNavigationProp>();
  const route = useRoute<BedDetailScreenRouteProp>();
  const { bedId } = route.params;
  const insets = useSafeAreaInsets();
  const { bed, plants, rotationStatus, loading, error, refresh } = useBedDetail(bedId);
  const [actionLoading, setActionLoading] = useState(false);
  const resolveLayerColor = useCallback(
    (layer: BedLayer): string => getLayerColor(theme, layer),
    [theme]
  );

  const handleMarkResting = useCallback(async () => {
    if (!bed) return;
    setActionLoading(true);
    try {
      await markBedAsResting(bed.id, 45);
      refresh();
    } catch (err) {
      logger.warn('markBedAsResting failed', err as Error);
      Alert.alert('Error', 'Failed to mark bed as resting');
    } finally {
      setActionLoading(false);
    }
  }, [bed, refresh]);

  const handleEndRest = useCallback(async () => {
    if (!bed) return;
    setActionLoading(true);
    try {
      await endBedRest(bed.id);
      refresh();
    } catch (err) {
      logger.warn('endBedRest failed', err as Error);
    } finally {
      setActionLoading(false);
    }
  }, [bed, refresh]);

  // Read-only top-down layout, recomputed from the bed's plants (same pipeline
  // as the wizard's Step 6 review).
  const rowLayout = useMemo<RowLayoutResult | null>(() => {
    if (!bed || plants.length === 0) return null;
    const entries = plants.map(plantToEntry);
    const tpl = getGuildTemplate(bed.type);
    const inputs = mapPlantEntriesToRowInputs(entries, tpl);
    if (inputs.length === 0) return null;
    const construction = bed.is_raised_bed ? 'raised' : 'in_ground';
    return computeRowLayout(
      inputs,
      bed.dimensions.width_m,
      bed.dimensions.length_m,
      bed.type,
      construction
    );
  }, [bed, plants]);

  const transitionInputs = useMemo(() => {
    if (!bed?.prev_crop_family) return [];
    const nextFamily = plants.length > 0 ? plants[0]?.crop_family ?? 'other' : 'other';
    return getTransitionInputs(bed.prev_crop_family, nextFamily, bed.pest_history ?? []);
  }, [bed, plants]);

  const harvestGapWarnings = useMemo(() => {
    if (!bed) return [];
    return getHarvestGapWarnings([bed]).filter((w) => w.bed_id === bed.id);
  }, [bed]);

  const nextCropSuggestions = useMemo(() => {
    if (!bed) return [];
    return getSmartNextCrops(bed, plants);
  }, [bed, plants]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !bed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Bed not found'}</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const restingDaysLeft = bed.resting_until
    ? Math.max(
        0,
        Math.ceil((new Date(bed.resting_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={bed.name}
        onBack={() => navigation.goBack()}
        right={
          <>
            <Text style={styles.typeBadge}>{bed.type.replace(/_/g, ' ')}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('BedCreationWizard', { editBedId: bedId })}
              accessibilityLabel="Edit bed"
            >
              <Ionicons name="pencil" size={18} color={theme.primary} />
            </TouchableOpacity>
          </>
        }
      />
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
      >
      {/* Resting banner */}
      {bed.is_resting && (
        <View style={styles.restingBanner}>
          <Ionicons name="moon-outline" size={16} color={theme.warning ?? '#f59e0b'} />
          <Text style={styles.restingText}>
            Resting — {restingDaysLeft} day{restingDaysLeft !== 1 ? 's' : ''} remaining
          </Text>
          <TouchableOpacity onPress={handleEndRest} disabled={actionLoading}>
            <Text style={styles.endRestText}>End rest</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dimensions */}
      <View style={styles.infoRow}>
        <Ionicons name="resize-outline" size={16} color={theme.textSecondary} />
        <Text style={styles.infoText}>
          {bed.dimensions.width_m} m × {bed.dimensions.length_m} m ({bed.dimensions.area_sqm} sqm)
        </Text>
        {bed.is_raised_bed && (
          <View style={styles.raisedBadge}>
            <Text style={styles.raisedBadgeText}>Raised</Text>
          </View>
        )}
      </View>

      {/* Bed Layout — read-only top-down row map */}
      {rowLayout && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bed Layout</Text>
          <BedTopDownMap
            widthM={bed.dimensions.width_m}
            lengthM={bed.dimensions.length_m}
            rows={rowLayout.rows}
            plantEmoji={getPlantEmoji}
            layerColor={resolveLayerColor}
            walkingPathCm={rowLayout.walkingPathCm}
            edgeBufferCm={rowLayout.edgeBufferCm}
            overflowCm={rowLayout.overflowCm}
          />
        </View>
      )}

      {/* Succession & Season Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Season Timeline</Text>
        <BedSuccessionTimeline bed={bed} plants={plants} />
      </View>

      {/* Soil Input Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Soil Input Log</Text>
        <View style={styles.inputLogGrid}>
          <View style={styles.inputLogItem}>
            <Ionicons name="water-outline" size={16} color={theme.primary} />
            <Text style={styles.inputLogLabel}>Last water</Text>
            <Text style={styles.inputLogValue}>{formatRelativeDate(bed.last_water_date)}</Text>
          </View>
          <View style={styles.inputLogItem}>
            <Ionicons name="flask-outline" size={16} color={theme.primary} />
            <Text style={styles.inputLogLabel}>Last Jeevamrutha</Text>
            <Text style={styles.inputLogValue}>
              {formatRelativeDate(bed.last_jeevamrutha_date)}
            </Text>
          </View>
          <View style={styles.inputLogItem}>
            <Ionicons name="cut-outline" size={16} color={theme.primary} />
            <Text style={styles.inputLogLabel}>Last weeding</Text>
            <Text style={styles.inputLogValue}>{formatRelativeDate(bed.last_weeding_date)}</Text>
          </View>
        </View>
        <Text style={styles.inputLogHint}>Logged when you complete the bed task in Care Plan</Text>
      </View>

      {/* Transition Inputs */}
      {transitionInputs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soil Prep (Transition)</Text>
          {transitionInputs.map((step, i) => (
            <View key={i} style={styles.transitionRow}>
              <Text style={styles.transitionBullet}>•</Text>
              <Text style={styles.transitionText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Harvest Gap Alerts */}
      {harvestGapWarnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Harvest Gap Alerts</Text>
          {harvestGapWarnings.map((w, i) => (
            <View key={i} style={styles.warningCard}>
              <Ionicons name="alert-circle" size={16} color={theme.warning ?? '#f59e0b'} />
              <Text style={styles.warningText}>
                {w.category.replace(/_/g, ' ')} beds overlap between {w.gap_start} → {w.gap_end}.
                Stagger harvests for continuous supply.
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Next-crop chips */}
      {nextCropSuggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggested Next Crops</Text>
          <View style={styles.chipRow}>
            {nextCropSuggestions.map((crop) => (
              <View key={crop} style={styles.nextCropChip}>
                <Text style={styles.nextCropChipText}>{crop}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Rotation status */}
      {rotationStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rotation Health</Text>
          {/* Progress bar: ratio of rules passed */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(
                    (rotationStatus.coordinator_checklist.filter((r) => r.passed).length /
                      Math.max(rotationStatus.coordinator_checklist.length, 1)) *
                      100
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {rotationStatus.coordinator_checklist.filter((r) => r.passed).length}/
            {rotationStatus.coordinator_checklist.length} rotation rules met
          </Text>
          <RotationStatusCard status={rotationStatus} bedType={bed.type} />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BedPlantPicker', { bedId })}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={theme.primary} />
          <Text style={styles.actionText}>Rotate Bed</Text>
        </TouchableOpacity>
      </View>
      {!bed.is_resting && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restButton]}
            onPress={handleMarkResting}
            disabled={actionLoading}
          >
            <Ionicons name="moon-outline" size={20} color={theme.warning ?? '#f59e0b'} />
            <Text style={[styles.actionText, { color: theme.warning ?? '#f59e0b' }]}>
              Mark as Resting
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </View>
  );
}
