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
import ThemedDropdown from '../ThemedDropdown';
import { CarePlanSummary } from './CarePlanSummary';
import { buildCarePlanRows } from '../../utils/carePlanDisplay';

interface Props {
  formState: PlantFormStateReturn;
}

/** Row keys of the profile-seeded, display-only care fields. */
const INFO_ROW_KEYS = ['sunlight', 'waterNeeds'];

const SOIL_TYPE_ITEMS = [
  { label: 'Garden Soil', value: 'garden_soil' },
  { label: 'Potting Mix', value: 'potting_mix' },
  { label: 'Coco Peat Mix', value: 'coco_peat' },
  { label: 'Red Laterite (Seivaal)', value: 'red_laterite' },
  { label: 'Coastal Sandy Soil', value: 'coastal_sandy' },
  { label: 'Black Cotton Soil', value: 'black_cotton' },
  { label: 'Alluvial Soil', value: 'alluvial' },
  { label: 'Custom Mix', value: 'custom' },
];

const FERTILISER_ITEMS = [
  { label: 'Compost', value: 'compost' },
  { label: 'Vermicompost', value: 'vermicompost' },
  { label: 'Cow Dung Slurry', value: 'cow_dung_slurry' },
  { label: 'Neem Cake', value: 'neem_cake' },
  { label: 'Panchagavya', value: 'panchagavya' },
  { label: 'Jeevamrutham', value: 'jeevamrutham' },
  { label: 'Groundnut Cake', value: 'groundnut_cake' },
  { label: 'Fish Emulsion', value: 'fish_emulsion' },
  { label: 'Seaweed Extract', value: 'seaweed' },
  { label: 'Other', value: 'other' },
];

export function EditCareScheduleSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    validationErrors,
    sectionStatuses,
    plantType,
    sunlight,
    waterRequirement,
    soilType,
    setSoilType,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    preferredFertiliser,
    setPreferredFertiliser,
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

      <ThemedDropdown
        items={SOIL_TYPE_ITEMS}
        selectedValue={soilType}
        onValueChange={setSoilType}
        placeholder="Select soil type"
        label="Soil Type"
      />
      <View style={editStyles.spacerMedium} />

      <ThemedDropdown
        items={FERTILISER_ITEMS}
        selectedValue={preferredFertiliser}
        onValueChange={setPreferredFertiliser}
        label="Preferred Fertiliser"
        placeholder="Preferred Fertiliser"
      />
      <View style={editStyles.spacerMedium} />

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
        <View style={[styles.settingSwitchTrack, mulchingUsed && styles.settingSwitchTrackActive]}>
          <View
            style={[styles.settingSwitchThumb, mulchingUsed && styles.settingSwitchThumbActive]}
          />
        </View>
      </TouchableOpacity>

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
            {['fruit_tree', 'shrub', 'herb'].includes(plantType)
              ? 'Watering, feeding & pruning'
              : 'Watering & feeding'}
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
          <View
            style={[styles.stepperCard, !wateringEnabled && enrichedStyles.stepperCardDisabled]}
          >
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
                    onPress={() =>
                      adjustFrequency(fertilisingFrequency, 1, setFertilisingFrequency)
                    }
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
            <View
              style={[styles.stepperCard, !pruningEnabled && enrichedStyles.stepperCardDisabled]}
            >
              <View style={enrichedStyles.toggleHeader}>
                <View style={enrichedStyles.toggleHeaderLeft}>
                  <View style={[styles.stepperIconWrap, { backgroundColor: theme.warningLight }]}>
                    <Ionicons
                      name="cut"
                      size={18}
                      color={pruningEnabled ? theme.warning : theme.textTertiary}
                    />
                  </View>
                  <Text style={styles.stepperLabel}>Prune every</Text>
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
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={[styles.stepperButton, { borderColor: theme.warning }]}
                      onPress={() => adjustFrequency(pruningFrequency, -1, setPruningFrequency)}
                      activeOpacity={0.6}
                      accessibilityLabel="Decrease pruning frequency"
                    >
                      <Ionicons name="remove" size={20} color={theme.warning} />
                    </TouchableOpacity>
                    <View style={styles.stepperValueWrap}>
                      <TextInput
                        style={styles.stepperValueInput}
                        value={pruningFrequency}
                        onChangeText={(text) => setPruningFrequency(sanitizeNumberText(text))}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={theme.inputPlaceholder}
                        maxLength={3}
                        textAlign="center"
                      />
                      <Text style={styles.stepperUnit}>days</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.stepperButton, { borderColor: theme.warning }]}
                      onPress={() => adjustFrequency(pruningFrequency, 1, setPruningFrequency)}
                      activeOpacity={0.6}
                      accessibilityLabel="Increase pruning frequency"
                    >
                      <Ionicons name="add" size={20} color={theme.warning} />
                    </TouchableOpacity>
                  </View>
                  {pruningFrequency ? (
                    <Text style={[styles.stepperHint, { color: theme.warning }]}>
                      {getFrequencyLabel(pruningFrequency)}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={enrichedStyles.toggleDisabledText}>No pruning task scheduled</Text>
              )}
            </View>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
