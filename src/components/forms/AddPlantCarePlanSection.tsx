import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn } from '@/hooks/usePlantFormState';
import { createAddFormStyles } from '@/styles/plantAddFormStyles';
import { CarePlanSummary } from './CarePlanSummary';
import { buildCarePlanRows } from '@/utils/carePlanDisplay';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { CATEGORY_FULL_LABELS } from '@/utils/plantLabels';

interface Props {
  formState: PlantFormStateReturn;
  expanded: boolean;
  onToggle: () => void;
}

const PRUNABLE_TYPES = ['fruit_tree', 'shrub', 'herb'];

/** Auto-seeded care plan, shown as a collapsible card on the single add screen. */
export function AddPlantCarePlanSection({
  formState,
  expanded,
  onToggle,
}: Props): React.JSX.Element {
  const {
    theme,
    plantType,
    plantVariety,
    plantCareProfiles,
    autoSuggestFired,
    sunlight,
    waterRequirement,
    soilType,
    preferredFertiliser,
    wateringEnabled,
    wateringFrequency,
    fertilisingEnabled,
    fertilisingFrequency,
    pruningEnabled,
    pruningFrequency,
    growthStage,
  } = formState;

  const addFormStyles = useMemo(() => createAddFormStyles(theme), [theme]);

  const categoryLabel = CATEGORY_FULL_LABELS[plantType] ?? 'plant';
  const profile = getPlantCareProfile(plantVariety, plantType, plantCareProfiles);
  const showPruning = PRUNABLE_TYPES.includes(plantType);

  const collapsedSummary = useMemo(() => {
    const parts: string[] = [];
    if (wateringEnabled && wateringFrequency) parts.push(`Water every ${wateringFrequency}d`);
    if (fertilisingEnabled && fertilisingFrequency)
      parts.push(`Feed every ${fertilisingFrequency}d`);
    return parts.length > 0 ? parts.join(' · ') : 'Care tasks will be set up automatically';
  }, [wateringEnabled, wateringFrequency, fertilisingEnabled, fertilisingFrequency]);

  const rows = useMemo(
    () =>
      buildCarePlanRows({
        sunlight,
        waterRequirement,
        soilType,
        preferredFertiliser,
        wateringEnabled,
        wateringFrequency,
        fertilisingEnabled,
        fertilisingFrequency,
        ...(showPruning ? { pruningEnabled, pruningFrequency } : {}),
        ...(growthStage ? { growthStage } : {}),
        ...(profile?.lifecycle ? { lifecycle: profile.lifecycle } : {}),
      }),
    [
      sunlight,
      waterRequirement,
      soilType,
      preferredFertiliser,
      wateringEnabled,
      wateringFrequency,
      fertilisingEnabled,
      fertilisingFrequency,
      showPruning,
      pruningEnabled,
      pruningFrequency,
      growthStage,
      profile?.lifecycle,
    ]
  );

  return (
    <View style={addFormStyles.careSectionCard}>
      <TouchableOpacity
        style={addFormStyles.careSectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={addFormStyles.careSectionIconWrap}>
          <Ionicons name="sparkles-outline" size={15} color={theme.primary} />
        </View>
        <View style={addFormStyles.careSectionHeaderMeta}>
          <Text style={addFormStyles.careSectionTitle}>Your care plan</Text>
          {!expanded && (
            <Text style={addFormStyles.careSectionSummary} numberOfLines={1}>
              {collapsedSummary}
            </Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textTertiary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={addFormStyles.careSectionBody}>
          {!autoSuggestFired && (
            <View style={addFormStyles.reviewFallbackBanner}>
              <Ionicons name="information-circle-outline" size={18} color={theme.info} />
              <Text style={addFormStyles.reviewFallbackText}>
                No preset for {plantVariety || 'this plant'} — starting with sensible{' '}
                {categoryLabel} defaults. Fine-tune anytime from Edit Plant.
              </Text>
            </View>
          )}

          <CarePlanSummary rows={rows} compact />

          <View style={addFormStyles.reviewFooterHint}>
            <Ionicons name="create-outline" size={14} color={theme.textTertiary} />
            <Text style={addFormStyles.reviewFooterHintText}>
              You can adjust watering and feeding schedules later from Edit Plant.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
