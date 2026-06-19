import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { Plant, PlantCareProfile } from '@/types/database.types';
import type { EffectiveGrowthStage } from '@/utils/plantHelpers';
import type { createStyles } from '@/styles/plantDetailStyles';
import GrowthStageTimeline from '@/components/GrowthStageTimeline';
import { PlantInfoRow } from '@/components/PlantInfoRow';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
  effectiveStage: EffectiveGrowthStage | null;
  careProfile: PlantCareProfile | null;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
}

function badgeLabel(source: EffectiveGrowthStage['source']): string {
  switch (source) {
    case 'pinned':
      return 'Pinned';
    case 'coconut':
      return 'Age-based';
    case 'annual_cycle':
      return 'Annual cycle';
    case 'computed':
      return 'Auto';
    default:
      return 'Manual';
  }
}

/** §2 — Growth stage badge, pin/unpin action, and the stage timeline. */
export function GrowthStageSection({
  styles,
  theme,
  plant,
  effectiveStage,
  careProfile,
  isPinned,
  onPin,
  onUnpin,
}: Props): React.JSX.Element | null {
  if (!effectiveStage && !plant.growth_stage) return null;

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>🌱 Growth Stage</Text>
      {effectiveStage && (
        <>
          <PlantInfoRow
            styles={styles}
            icon="trending-up"
            iconColor={theme.primary}
            text={`Stage: ${
              effectiveStage.stage.charAt(0).toUpperCase() + effectiveStage.stage.slice(1)
            }`}
          >
            <View style={styles.growthStageBadge}>
              <Text style={styles.growthStageBadgeText}>{badgeLabel(effectiveStage.source)}</Text>
            </View>
          </PlantInfoRow>
          {!isPinned && effectiveStage.source !== 'coconut' && (
            <TouchableOpacity style={styles.growthStageAction} onPress={onPin}>
              <Ionicons name="pin-outline" size={16} color={theme.primary} />
              <Text style={styles.growthStageActionText}>Pin stage</Text>
            </TouchableOpacity>
          )}
          {isPinned && (
            <TouchableOpacity style={styles.growthStageAction} onPress={onUnpin}>
              <Ionicons name="pin" size={16} color={theme.accent} />
              <Text style={styles.growthStageActionText}>Unpin stage</Text>
            </TouchableOpacity>
          )}
          <GrowthStageTimeline
            effectiveStage={effectiveStage}
            plantingDate={plant.planting_date}
            durations={careProfile?.growthStageDurations}
            annualCycleDurations={careProfile?.annualCycleDurations}
            isPinned={isPinned}
          />
        </>
      )}
      {!effectiveStage && plant.growth_stage && (
        <PlantInfoRow
          styles={styles}
          icon="trending-up"
          iconColor={theme.primary}
          text={`Stage: ${
            plant.growth_stage.charAt(0).toUpperCase() + plant.growth_stage.slice(1)
          }`}
        />
      )}
    </View>
  );
}
