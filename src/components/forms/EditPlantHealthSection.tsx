import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { createEditStyles } from '../../styles/plantEditFormStyles';
import CollapsibleSection from '../CollapsibleSection';
import { getEffectiveGrowthStage, getValidStagesForPlant } from '../../utils/plantHelpers';
import type { StageResolvable } from '../../utils/plantHelpers';
import { getPlantCareProfile } from '../../utils/plantCareDefaults';
import {
  GROWTH_STAGE_DESCRIPTIONS,
  GROWTH_STAGE_EMOJIS,
  GROWTH_STAGE_LABELS,
  GROWTH_STAGE_SOURCE_HINTS,
  GROWTH_STAGE_SOURCE_LABELS,
  HEALTH_STATUS_DESCRIPTIONS,
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_TONE,
} from '../../utils/plantLabels';
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
}

/** Tone -> the chip/dot/text style trio, so the lookup stays in one place. */
function toneStyles(styles: Styles, tone: StatusTone): ToneStyles {
  switch (tone) {
    case 'success':
      return {
        chip: styles.chipGridItemActiveSuccess,
        text: styles.chipGridItemTextSuccess,
        dot: styles.statusDotSuccess,
      };
    case 'warning':
      return {
        chip: styles.chipGridItemActiveWarning,
        text: styles.chipGridItemTextWarning,
        dot: styles.statusDotWarning,
      };
    case 'info':
      return {
        chip: styles.chipGridItemActiveInfo,
        text: styles.chipGridItemTextInfo,
        dot: styles.statusDotInfo,
      };
    case 'error':
      return {
        chip: styles.chipGridItemActiveError,
        text: styles.chipGridItemTextError,
        dot: styles.statusDotError,
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
    sectionExpanded,
    setSectionExpandedState,
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
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  const [overrideOpen, setOverrideOpen] = useState(false);

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

  return (
    <CollapsibleSection
      title="Plant Health"
      icon="fitness"
      defaultExpanded={false}
      expanded={sectionExpanded.health}
      onExpandedChange={(expanded) => setSectionExpandedState('health', expanded)}
      hasError={false}
      sectionStatus="optional"
    >
      <Text style={styles.fieldGroupLabel}>Health Status</Text>
      <View style={styles.chipGrid}>
        {HEALTH_STATUSES.map((status) => {
          const isActive = healthStatus === status;
          const tone = toneStyles(styles, HEALTH_STATUS_TONE[status]);
          return (
            <TouchableOpacity
              key={status}
              style={[styles.chipGridItem, isActive && tone.chip]}
              onPress={() => setHealthStatus(status)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <View style={[styles.statusDot, tone.dot]} />
              <Text style={[styles.chipGridItemText, isActive && tone.text]}>
                {HEALTH_STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helperText}>{HEALTH_STATUS_DESCRIPTIONS[healthStatus]}</Text>

      <Text style={styles.fieldGroupLabel}>Growth Stage</Text>

      <View style={styles.stageCard}>
        <View style={styles.stageCardRow}>
          <Text style={styles.stageCardStage}>
            {GROWTH_STAGE_EMOJIS[effectiveStage.stage]} {GROWTH_STAGE_LABELS[effectiveStage.stage]}
          </Text>
          <View style={styles.stageCardBadge}>
            <Text style={styles.stageCardBadgeText}>
              {GROWTH_STAGE_SOURCE_LABELS[effectiveStage.source]}
            </Text>
          </View>
        </View>
        <Text style={styles.stageCardHint}>{sourceHint}</Text>
      </View>

      <Text style={styles.helperText}>{GROWTH_STAGE_DESCRIPTIONS[effectiveStage.stage]}</Text>

      {canOverride && (
        <>
          <TouchableOpacity
            style={editStyles.adjustScheduleHeader}
            onPress={() => setOverrideOpen(!overrideOpen)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: overrideOpen }}
            accessibilityLabel="Override growth stage"
          >
            <Ionicons name="options-outline" size={18} color={theme.primary} />
            <View style={editStyles.flexOne}>
              <Text style={editStyles.adjustScheduleHeaderText}>Override stage</Text>
              <Text style={editStyles.adjustScheduleHint}>
                Set the stage yourself instead of letting the app work it out
              </Text>
            </View>
            <Ionicons
              name={overrideOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {overrideOpen && (
            <>
              <View style={styles.chipGrid}>
                {validStages.map((stage) => {
                  const isActive = pinnedStage === stage;
                  return (
                    <TouchableOpacity
                      key={stage}
                      style={[styles.chipGridItem, isActive && styles.chipGridItemActive]}
                      onPress={() => handleOverride(stage)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                    >
                      <Text
                        style={[
                          styles.chipGridItemText,
                          isActive && styles.chipGridItemTextActive,
                        ]}
                      >
                        {GROWTH_STAGE_EMOJIS[stage]} {GROWTH_STAGE_LABELS[stage]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {pinnedStage && (
                <TouchableOpacity
                  style={styles.stageResetButton}
                  onPress={handleUseAutomatic}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh" size={16} color={theme.primary} />
                  <Text style={styles.stageResetText}>Use automatic instead</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
