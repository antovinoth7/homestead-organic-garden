import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn } from '../../hooks/usePlantFormState';
import { createWizardStyles } from '../../styles/plantAddWizardStyles';
import { CarePlanSummary } from './CarePlanSummary';
import { buildCarePlanRows, buildPlantSummaryRows } from '../../utils/carePlanDisplay';
import { getPlantCareProfile } from '../../utils/plantCareDefaults';
import { CATEGORY_FULL_LABELS } from '../../utils/plantLabels';

interface Props {
  formState: PlantFormStateReturn;
}

const PRUNABLE_TYPES = ['fruit_tree', 'shrub', 'herb'];

/** Step 3 — read-only review: "Your plant" selections + auto-seeded "Your care plan". */
export function WizardStep3({ formState }: Props): React.JSX.Element {
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
    variety,
    plantingDate,
    harvestSeason,
    location,
    parentLocation,
    childLocation,
    landmarks,
    spaceType,
    potSize,
    bedName,
    name,
    generatedPlantName,
  } = formState;

  const wizardStyles = useMemo(() => createWizardStyles(theme), [theme]);

  const categoryLabel = CATEGORY_FULL_LABELS[plantType] ?? 'plant';
  const profile = getPlantCareProfile(plantVariety, plantType, plantCareProfiles);
  const showPruning = PRUNABLE_TYPES.includes(plantType);

  const plantRows = useMemo(
    () =>
      buildPlantSummaryRows({
        plantVariety,
        plantType,
        variety,
        plantingDate,
        harvestSeason,
        location,
        parentLocation,
        childLocation,
        landmarks,
        spaceType,
        potSize,
        bedName,
        name: name || generatedPlantName,
      }),
    [
      plantVariety,
      plantType,
      variety,
      plantingDate,
      harvestSeason,
      location,
      parentLocation,
      childLocation,
      landmarks,
      spaceType,
      potSize,
      bedName,
      name,
      generatedPlantName,
    ]
  );

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
    <View>
      <View style={wizardStyles.reviewHeader}>
        <Text style={wizardStyles.reviewSubtitle}>
          Here&apos;s {plantVariety || categoryLabel}. We&apos;ll set up its care tasks for you.
        </Text>
      </View>

      <CarePlanSummary title="Your plant" icon="leaf-outline" rows={plantRows} />

      {!autoSuggestFired && (
        <View style={wizardStyles.reviewFallbackBanner}>
          <Ionicons name="information-circle-outline" size={18} color={theme.info} />
          <Text style={wizardStyles.reviewFallbackText}>
            No preset for {plantVariety || 'this plant'} — starting with sensible {categoryLabel}{' '}
            defaults. Fine-tune anytime from Edit Plant.
          </Text>
        </View>
      )}

      <CarePlanSummary title="Your care plan" rows={rows} />

      <View style={wizardStyles.reviewFooterHint}>
        <Ionicons name="create-outline" size={14} color={theme.textTertiary} />
        <Text style={wizardStyles.reviewFooterHintText}>
          You can adjust watering and feeding schedules later from Edit Plant.
        </Text>
      </View>
    </View>
  );
}
