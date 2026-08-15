import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { PlantFormStateReturn } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { FormSectionCard } from './FormSectionCard';
import { PickerField } from '../PickerField';
import { StagePickerSheet } from '../StagePickerSheet';
import { getEffectiveGrowthStage, getValidStagesForPlant } from '../../utils/plantHelpers';
import type { StageResolvable } from '../../utils/plantHelpers';
import { getPlantCareProfile } from '../../utils/plantCareDefaults';
import {
  GROWTH_STAGE_DESCRIPTIONS,
  GROWTH_STAGE_LABELS,
  GROWTH_STAGE_SOURCE_HINTS,
  GROWTH_STAGE_SOURCE_LABELS,
  HEALTH_STATUS_DESCRIPTIONS,
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_TONE,
} from '../../utils/plantLabels';
import { GROWTH_STAGE_ICON_KEYS } from '@/config/iconRegistry';
import type { StatusTone } from '../../utils/plantLabels';
import type { GrowthStage, HealthStatus } from '../../types/database.types';

interface Props {
  formState: PlantFormStateReturn;
}

const HEALTH_STATUSES: HealthStatus[] = ['healthy', 'stressed', 'recovering', 'sick'];

type Styles = ReturnType<typeof createStyles>;

interface ToneStyles {
  chip: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  dot: StyleProp<ViewStyle>;
  calloutBg: StyleProp<ViewStyle>;
  calloutText: StyleProp<TextStyle>;
}

/** Tone -> the chip/dot/callout style set, so the lookup stays in one place. */
function toneStyles(styles: Styles, tone: StatusTone): ToneStyles {
  switch (tone) {
    case 'success':
      return {
        chip: styles.healthGridItemActiveSuccess,
        text: styles.healthGridItemTextSuccess,
        dot: styles.statusDotSuccess,
        calloutBg: styles.healthCalloutSuccess,
        calloutText: styles.healthCalloutTextSuccess,
      };
    case 'warning':
      return {
        chip: styles.healthGridItemActiveWarning,
        text: styles.healthGridItemTextWarning,
        dot: styles.statusDotWarning,
        calloutBg: styles.healthCalloutWarning,
        calloutText: styles.healthCalloutTextWarning,
      };
    case 'info':
      return {
        chip: styles.healthGridItemActiveInfo,
        text: styles.healthGridItemTextInfo,
        dot: styles.statusDotInfo,
        calloutBg: styles.healthCalloutInfo,
        calloutText: styles.healthCalloutTextInfo,
      };
    case 'error':
      return {
        chip: styles.healthGridItemActiveError,
        text: styles.healthGridItemTextError,
        dot: styles.statusDotError,
        calloutBg: styles.healthCalloutError,
        calloutText: styles.healthCalloutTextError,
      };
  }
}

/**
 * Health Status plus the growth-stage override.
 *
 * The stage shown here is the *effective* one — the same value the detail
 * screen derives. Choosing a stage pins it (`growth_stage_pinned`), which is the
 * only way to actually override the derived stage; writing `growth_stage` alone
 * would be ignored whenever a stage can be computed.
 */
export function EditPlantHealthSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    plantType,
    plantVariety,
    plantingDate,
    healthStatus,
    setHealthStatus,
    growthStage,
    setGrowthStage,
    pinnedStage,
    setPinnedStage,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [stageSheetVisible, setStageSheetVisible] = useState(false);

  const careProfile = useMemo(
    () => getPlantCareProfile(plantVariety, plantType),
    [plantVariety, plantType]
  );

  const stageInput: StageResolvable = useMemo(
    () => ({
      plant_type: plantType,
      planting_date: plantingDate || null,
      growth_stage: growthStage,
      growth_stage_pinned: pinnedStage,
    }),
    [plantType, plantingDate, growthStage, pinnedStage]
  );

  const effectiveStage = useMemo(
    () => getEffectiveGrowthStage(stageInput, careProfile),
    [stageInput, careProfile]
  );

  const validStages = useMemo(
    () => getValidStagesForPlant(stageInput, careProfile),
    [stageInput, careProfile]
  );

  // Keep growth_stage in step with the pin so the two columns never disagree.
  const handleOverride = useCallback(
    (stage: GrowthStage) => {
      setPinnedStage(stage);
      setGrowthStage(stage);
    },
    [setPinnedStage, setGrowthStage]
  );

  const handleUseAutomatic = useCallback(() => {
    setPinnedStage(null);
  }, [setPinnedStage]);

  const sourceHint =
    effectiveStage.source === 'manual'
      ? plantingDate
        ? 'No growth profile for this plant — set the stage yourself.'
        : 'Add a planting date to track stages automatically.'
      : GROWTH_STAGE_SOURCE_HINTS[effectiveStage.source];

  // Coconut stages come from tree age and can't be sensibly overridden — the
  // detail screen hides its Pin action for the same reason.
  const canOverride = effectiveStage.source !== 'coconut';

  const activeTone = toneStyles(styles, HEALTH_STATUS_TONE[healthStatus]);

  return (
    <FormSectionCard title="Plant Health" icon="fitness-outline">
      <View style={styles.healthGrid}>
        {HEALTH_STATUSES.map((status) => {
          const isActive = healthStatus === status;
          const tone = toneStyles(styles, HEALTH_STATUS_TONE[status]);
          return (
            <TouchableOpacity
              key={status}
              style={[styles.healthGridItem, isActive && tone.chip]}
              onPress={() => setHealthStatus(status)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.statusDot, tone.dot]} />
              <Text style={[styles.healthGridItemText, isActive && tone.text]}>
                {HEALTH_STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.healthCallout, activeTone.calloutBg]}>
        <Text style={[styles.healthCalloutText, activeTone.calloutText]}>
          {HEALTH_STATUS_DESCRIPTIONS[healthStatus]}
        </Text>
      </View>

      <PickerField
        label="Growth Stage"
        value={GROWTH_STAGE_LABELS[effectiveStage.stage]}
        fallbackIcon={GROWTH_STAGE_ICON_KEYS[effectiveStage.stage]}
        badge={GROWTH_STAGE_SOURCE_LABELS[effectiveStage.source]}
        subtitle={GROWTH_STAGE_DESCRIPTIONS[effectiveStage.stage]}
        placeholder="Choose a stage"
        disabled={!canOverride}
        onPress={() => setStageSheetVisible(true)}
      />

      <StagePickerSheet
        visible={stageSheetVisible}
        onClose={() => setStageSheetVisible(false)}
        stages={validStages}
        effectiveStage={effectiveStage.stage}
        pinnedStage={pinnedStage}
        automaticHint={sourceHint}
        onSelectStage={handleOverride}
        onSelectAutomatic={handleUseAutomatic}
      />
    </FormSectionCard>
  );
}
