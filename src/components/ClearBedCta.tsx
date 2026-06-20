import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { Plant } from '@/types/database.types';
import type { EffectiveGrowthStage } from '@/utils/plantHelpers';
import { isPlantArchived } from '@/utils/plantHelpers';
import type { createStyles } from '@/styles/plantDetailStyles';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
  effectiveStage: EffectiveGrowthStage | null;
  isArchiving: boolean;
  onClearBed: () => void;
}

/** End-of-season call to action for annual/biennial plants at harvest stage. */
export function ClearBedCta({
  styles,
  theme,
  plant,
  effectiveStage,
  isArchiving,
  onClearBed,
}: Props): React.JSX.Element | null {
  const atHarvestStage =
    effectiveStage?.stage === 'fruiting' ||
    effectiveStage?.stage === 'mature' ||
    plant.growth_stage === 'fruiting' ||
    plant.growth_stage === 'mature';

  if (
    (plant.lifecycle_type !== 'annual' && plant.lifecycle_type !== 'biennial') ||
    isPlantArchived(plant) ||
    !atHarvestStage
  ) {
    return null;
  }

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>🌾 End of Season</Text>
      <Text style={styles.clearBedHint}>
        This annual is at harvest stage. Once you have finished harvesting, clear the bed so the
        next crop can be planned.
      </Text>
      <TouchableOpacity style={styles.clearBedButton} disabled={isArchiving} onPress={onClearBed}>
        <Ionicons name="trash-bin-outline" size={18} color={theme.warning} />
        <Text style={styles.growthStageActionText}>
          {isArchiving ? 'Clearing...' : 'Clear Bed & Archive Plant'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
