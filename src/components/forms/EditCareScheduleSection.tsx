import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PlantFormStateReturn,
  sanitizeNumberText,
  adjustFrequency,
  getFrequencyLabel,
} from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { createEditStyles } from '../../styles/plantEditFormStyles';
import { createEnrichedSectionStyles } from '../../styles/enrichedSectionStyles';
import CollapsibleSection from '../CollapsibleSection';
import { CarePlanSummary } from './CarePlanSummary';
import { buildCarePlanRows } from '../../utils/carePlanDisplay';
import { getPruningTechniques } from '../../utils/plantCareDefaults';
import type { PlantType } from '../../types/database.types';

interface Props {
  formState: PlantFormStateReturn;
}

/** Row keys of the profile-seeded, display-only care fields. */
const INFO_ROW_KEYS = ['sunlight', 'waterNeeds', 'soil', 'fertiliser'];

export function EditCareScheduleSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    validationErrors,
    sectionStatuses,
    plantType,
    plantVariety,
    plantCareProfiles,
    sunlight,
    waterRequirement,
    soilType,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    preferredFertiliser,
    mulchingUsed,
    setMulchingUsed,
    pruningFrequency,
    setPruningFrequency,
    wateringEnabled,
    setWateringEnabled,
    fertilisingEnabled,
    setFertilisingEnabled,
    pruningEnabled,
    setPruningEnabled,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  const [adjustExpanded, setAdjustExpanded] = useState(false);
  const hasCareErrors = showValidationErrors && validationErrors.care.length > 0;

  // Validation errors live inside the expander — never leave them hidden.
  useEffect(() => {
    if (hasCareErrors) setAdjustExpanded(true);
  }, [hasCareErrors]);

  const infoRows = useMemo(
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
      }).filter((row) => INFO_ROW_KEYS.includes(row.key)),
    [
      sunlight,
      waterRequirement,
      soilType,
      preferredFertiliser,
      wateringEnabled,
      wateringFrequency,
      fertilisingEnabled,
      fertilisingFrequency,
    ]
  );

  return (
    <CollapsibleSection
      title="Care & Schedule"
      icon="leaf"
      defaultExpanded={false}
      expanded={sectionExpanded.care}
      onExpandedChange={(expanded) => setSectionExpandedState('care', expanded)}
      hasError={hasCareErrors}
      sectionStatus={showValidationErrors ? undefined : sectionStatuses.care}
    >
      <CarePlanSummary compact rows={infoRows} />
      <Text style={editStyles.carePlanCaption}>
        Set from {plantVariety || 'this plant'}&apos;s care profile.
      </Text>

      <TouchableOpacity
        style={editStyles.adjustScheduleHeader}
        onPress={() => setAdjustExpanded(!adjustExpanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: adjustExpanded }}
        accessibilityLabel="Adjust schedule"
      >
        <Ionicons name="options-outline" size={18} color={theme.primary} />
        <View style={editStyles.flexOne}>
          <Text style={editStyles.adjustScheduleHeaderText}>Adjust schedule</Text>
          <Text style={editStyles.adjustScheduleHint}>
            Watering, feeding{['fruit_tree', 'shrub', 'herb'].includes(plantType) ? ', pruning' : ''}{' '}
            &amp; mulching
          </Text>
        </View>
        <Ionicons
          name={adjustExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {adjustExpanded && (
        <>
          <View style={[styles.stepperCard, !wateringEnabled && enrichedStyles.stepperCardDisabled]}>
            <View style={enrichedStyles.toggleHeader}>
              <View style={enrichedStyles.toggleHeaderLeft}>
                <View style={styles.stepperIconWrap}>
                  <Ionicons
                    name="water"
                    size={18}
                    color={wateringEnabled ? theme.primary : theme.textTertiary}
                  />
                </View>
                <Text style={styles.stepperLabel}>Water every</Text>
              </View>
              <TouchableOpacity
                onPress={() => setWateringEnabled(!wateringEnabled)}
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: wateringEnabled }}
              >
                <View
                  style={[
                    styles.settingSwitchTrack,
                    wateringEnabled && styles.settingSwitchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      wateringEnabled && styles.settingSwitchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
            {wateringEnabled ? (
              <>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => adjustFrequency(wateringFrequency, -1, setWateringFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease watering frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={wateringFrequency}
                      onChangeText={(text) => setWateringFrequency(sanitizeNumberText(text))}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => adjustFrequency(wateringFrequency, 1, setWateringFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Increase watering frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                {wateringFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.primary }]}>
                    {getFrequencyLabel(wateringFrequency)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={enrichedStyles.toggleDisabledText}>No task · rain-fed or manual</Text>
            )}
          </View>

          <View
            style={[styles.stepperCard, !fertilisingEnabled && enrichedStyles.stepperCardDisabled]}
          >
            <View style={enrichedStyles.toggleHeader}>
              <View style={enrichedStyles.toggleHeaderLeft}>
                <View style={[styles.stepperIconWrap, { backgroundColor: theme.accentLight }]}>
                  <Ionicons
                    name="nutrition"
                    size={18}
                    color={fertilisingEnabled ? theme.accent : theme.textTertiary}
                  />
                </View>
                <Text style={styles.stepperLabel}>Feed every</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFertilisingEnabled(!fertilisingEnabled)}
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: fertilisingEnabled }}
              >
                <View
                  style={[
                    styles.settingSwitchTrack,
                    fertilisingEnabled && styles.settingSwitchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      fertilisingEnabled && styles.settingSwitchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
            {fertilisingEnabled ? (
              <>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperButton, { borderColor: theme.accent }]}
                    onPress={() =>
                      adjustFrequency(fertilisingFrequency, -1, setFertilisingFrequency)
                    }
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease feeding frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.accent} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={fertilisingFrequency}
                      onChangeText={(text) => setFertilisingFrequency(sanitizeNumberText(text))}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperButton, { borderColor: theme.accent }]}
                    onPress={() => adjustFrequency(fertilisingFrequency, 1, setFertilisingFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Increase feeding frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
                {fertilisingFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.accent }]}>
                    {getFrequencyLabel(fertilisingFrequency)}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={enrichedStyles.toggleDisabledText}>No task · manual feeding only</Text>
            )}
          </View>

          {['fruit_tree', 'shrub', 'herb'].includes(plantType) && (
            <>
              <View style={styles.fieldGroupDivider} />
              <View style={enrichedStyles.toggleHeader}>
                <View style={enrichedStyles.toggleHeaderLeft}>
                  <Text style={styles.fieldGroupLabel}>{'✂️'} Pruning</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPruningEnabled(!pruningEnabled)}
                  activeOpacity={0.85}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: pruningEnabled }}
                >
                  <View
                    style={[
                      styles.settingSwitchTrack,
                      pruningEnabled && styles.settingSwitchTrackActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.settingSwitchThumb,
                        pruningEnabled && styles.settingSwitchThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              {pruningEnabled ? (
                <>
                  <View style={editStyles.pruningFrequencyRow}>
                    <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>Every</Text>
                    <View style={[styles.frequencyInputWrap, editStyles.frequencyInputWrapCompact]}>
                      <TextInput
                        style={[styles.frequencyInput, editStyles.frequencyInputLarge]}
                        value={pruningFrequency}
                        onChangeText={(text) => setPruningFrequency(sanitizeNumberText(text))}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={theme.inputPlaceholder}
                        maxLength={3}
                      />
                    </View>
                    <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>days</Text>
                  </View>
                  {(() => {
                    const userOverride =
                      plantType && plantVariety
                        ? plantCareProfiles[plantType as PlantType]?.[plantVariety]
                        : undefined;
                    const info = getPruningTechniques(plantType, plantVariety, userOverride);
                    const hasTips = info.tips.length > 0 || info.shapePruning || info.flowerPruning;
                    return hasTips ? (
                      <View style={editStyles.pruningTipsCard}>
                        <View style={editStyles.pruningTipsHeader}>
                          <Ionicons name="bulb-outline" size={16} color={theme.accent} />
                          <Text style={editStyles.pruningTipsTitle}>
                            Pruning Tips{plantVariety ? ` — ${plantVariety}` : ''}
                          </Text>
                        </View>
                        {info.tips.map((tip, i) => (
                          <View key={i} style={editStyles.pruningTipRow}>
                            <Text style={editStyles.pruningTipBullet}>{'•'}</Text>
                            <Text style={editStyles.pruningTipText}>{tip}</Text>
                          </View>
                        ))}
                        {info.shapePruning && (
                          <View
                            style={[
                              editStyles.pruningTipRow,
                              info.tips.length > 0 && editStyles.pruningTechniqueTopGap,
                            ]}
                          >
                            <Text style={editStyles.pruningTechniqueIcon}>{'✂️'}</Text>
                            <View style={editStyles.flexOne}>
                              <Text style={editStyles.pruningTechniqueTitle}>
                                Shape pruning
                                <Text style={editStyles.pruningTechniqueDetail}>
                                  {' '}
                                  — {info.shapePruning.tip}
                                </Text>
                              </Text>
                              <Text style={editStyles.pruningTechniqueBestTime}>
                                Best: {info.shapePruning.months}
                              </Text>
                            </View>
                          </View>
                        )}
                        {info.flowerPruning && (
                          <View style={[editStyles.pruningTipRow, editStyles.pruningFlowerTopGap]}>
                            <Text style={editStyles.pruningTechniqueIcon}>{'🌸'}</Text>
                            <View style={editStyles.flexOne}>
                              <Text style={editStyles.pruningTechniqueTitle}>
                                Flower pruning
                                <Text style={editStyles.pruningTechniqueDetail}>
                                  {' '}
                                  — {info.flowerPruning.tip}
                                </Text>
                              </Text>
                              <Text style={editStyles.pruningTechniqueBestTime}>
                                Best: {info.flowerPruning.months}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null;
                  })()}
                </>
              ) : (
                <Text style={enrichedStyles.toggleDisabledText}>No pruning task scheduled</Text>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.settingToggle, mulchingUsed && styles.settingToggleActive]}
            onPress={() => setMulchingUsed(!mulchingUsed)}
            activeOpacity={0.85}
            accessibilityRole="switch"
            accessibilityState={{ checked: mulchingUsed }}
          >
            <View style={styles.settingToggleLeft}>
              <View
                style={[
                  styles.settingToggleIconWrap,
                  mulchingUsed && styles.settingToggleIconWrapActive,
                ]}
              >
                <Ionicons
                  name={mulchingUsed ? 'layers' : 'layers-outline'}
                  size={18}
                  color={mulchingUsed ? theme.primary : theme.textSecondary}
                />
              </View>
              <Text
                style={[styles.settingToggleLabel, mulchingUsed && styles.settingToggleLabelActive]}
              >
                Mulching Used
              </Text>
            </View>
            <View
              style={[styles.settingSwitchTrack, mulchingUsed && styles.settingSwitchTrackActive]}
            >
              <View
                style={[styles.settingSwitchThumb, mulchingUsed && styles.settingSwitchThumbActive]}
              />
            </View>
          </TouchableOpacity>
        </>
      )}
    </CollapsibleSection>
  );
}
