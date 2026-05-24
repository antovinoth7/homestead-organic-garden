import React, { useMemo, useCallback, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useBedDetail } from '@/hooks/useBedDetail';
import { RotationStatusCard } from '@/components/RotationStatusCard';
import { BedDiagram } from '@/components/BedDiagram';
import {
  markBedAsResting,
  endBedRest,
  logBedInput,
  getTransitionInputs,
  getHarvestGapWarnings,
} from '@/services/beds';
import { updatePlant } from '@/services/plants';
import { getRecommendedPlantsForBed } from '@/config/beds';
import { createStyles } from '@/styles/bedDetailStyles';
import { logger } from '@/utils/logger';
import type { BedPosition } from '@/types/database.types';
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
  const { bed, plants, rotationStatus, loading, error, refresh } = useBedDetail(bedId);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleLogInput = useCallback(
    async (inputType: 'water' | 'jeevamrutha' | 'weeding') => {
      if (!bed) return;
      try {
        await logBedInput(bed.id, inputType);
        refresh();
      } catch (err) {
        logger.warn('logBedInput failed', err as Error);
      }
    },
    [bed, refresh]
  );

  // Drag-and-drop position persistence (debounced)
  const positionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePositionChange = useCallback((plantId: string, pos: BedPosition) => {
    if (positionTimerRef.current) {
      clearTimeout(positionTimerRef.current);
    }
    positionTimerRef.current = setTimeout(async () => {
      try {
        await updatePlant(plantId, { position_in_bed: pos });
      } catch (err) {
        logger.warn('Failed to save plant position', err as Error);
      }
    }, 300);
  }, []);

  const handleResetLayout = useCallback(async () => {
    if (plants.length === 0) return;
    try {
      await Promise.all(plants.map((p) => updatePlant(p.id, { position_in_bed: null })));
      refresh();
    } catch (err) {
      logger.warn('Reset layout failed', err as Error);
    }
  }, [plants, refresh]);

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
    return getRecommendedPlantsForBed(bed.type).slice(0, 5);
  }, [bed]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{bed.name}</Text>
        <Text style={styles.typeBadge}>{bed.type.replace(/_/g, ' ')}</Text>
      </View>

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

      {/* Bed Layout Diagram */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bed Layout</Text>
        <BedDiagram
          bed={bed}
          plants={plants}
          onPositionChange={handlePositionChange}
          onResetLayout={handleResetLayout}
        />
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
        <View style={styles.logInputButtons}>
          <TouchableOpacity style={styles.logInputChip} onPress={() => handleLogInput('water')}>
            <Text style={styles.logInputChipText}>💧 Log Water</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logInputChip}
            onPress={() => handleLogInput('jeevamrutha')}
          >
            <Text style={styles.logInputChipText}>🧪 Log Jeevamrutha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logInputChip} onPress={() => handleLogInput('weeding')}>
            <Text style={styles.logInputChipText}>✂️ Log Weeding</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plants summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plants ({plants.length})</Text>
        {plants.length === 0 ? (
          <Text style={styles.emptyText}>No plants assigned to this bed yet.</Text>
        ) : (
          plants.map((p) => (
            <View key={p.id} style={styles.plantRow}>
              <Text style={styles.plantName}>{p.name}</Text>
              {p.bed_layer && (
                <Text style={styles.layerBadge}>{p.bed_layer.replace(/_/g, ' ')}</Text>
              )}
            </View>
          ))
        )}
        <TouchableOpacity
          style={styles.addPlantButton}
          onPress={() => navigation.navigate('BedPlantPicker', { bedId })}
        >
          <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
          <Text style={styles.addPlantText}>Add plants to bed</Text>
        </TouchableOpacity>
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
          <RotationStatusCard status={rotationStatus} />
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BedPlantPicker', { bedId })}
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={styles.actionText}>Add Plant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BedTasks', { bedId })}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
          <Text style={styles.actionText}>View Tasks</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.actions}>
        {!bed.is_resting && (
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
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('BedPlantPicker', { bedId })}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={theme.primary} />
          <Text style={styles.actionText}>Rotate Bed</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
