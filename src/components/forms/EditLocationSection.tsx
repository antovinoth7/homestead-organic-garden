import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn, sanitizeNumberText } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import CollapsibleSection from '../CollapsibleSection';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import { sanitizeAlphaNumericSpaces, sanitizeLandmarkText } from '../../utils/textSanitizer';
import type { SpaceType } from '../../types/database.types';
import { useBedOptions } from '@/hooks/useBedOptions';

interface Props {
  formState: PlantFormStateReturn;
}

export function EditLocationSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    validationErrors,
    sectionStatuses,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    childLocationOptions,
    parentLocationOptions,
    location,
    landmarks,
    setLandmarks,
    spaceType,
    setSpaceType,
    potSize,
    setPotSize,
    bedName,
    setBedName,
    bedId,
    setBedId,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const { beds } = useBedOptions();

  return (
    <CollapsibleSection
      title="Location & Placement"
      icon="location"
      defaultExpanded={true}
      expanded={sectionExpanded.location}
      onExpandedChange={(expanded) => setSectionExpandedState('location', expanded)}
      hasError={showValidationErrors && validationErrors.location.length > 0}
      sectionStatus={showValidationErrors ? undefined : sectionStatuses.location}
    >
      <ThemedDropdown
        items={[
          { label: 'Select Main Location', value: '' },
          ...parentLocationOptions.map((loc) => ({ label: loc, value: loc })),
        ]}
        selectedValue={parentLocation}
        onValueChange={(value) => {
          setParentLocation(value);
          if (!value) setChildLocation('');
        }}
        label="Location"
        placeholder="Location"
      />

      {parentLocation !== '' && childLocationOptions.length > 0 && (
        <ThemedDropdown
          items={[
            { label: 'Select Direction / Section', value: '' },
            ...childLocationOptions.map((loc) => ({ label: loc, value: loc })),
          ]}
          selectedValue={childLocation}
          onValueChange={(value) => setChildLocation(value)}
          label="Direction / Section"
          placeholder="Direction / Section"
        />
      )}

      {location ? (
        <View style={styles.locationPreview}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={styles.locationPreviewText}>{location}</Text>
        </View>
      ) : null}

      <FloatingLabelInput
        label="Nearby landmark or reference point"
        value={landmarks}
        onChangeText={(text) => setLandmarks(sanitizeLandmarkText(text))}
      />

      <View style={styles.fieldGroupDivider} />
      <Text style={styles.fieldGroupLabel}>{'\uD83E\uDEB4'} Growing Space</Text>

      <View style={styles.spaceSegmentRow}>
        {(
          [
            { value: 'ground' as SpaceType, icon: 'earth' as const, label: 'Ground' },
            { value: 'bed' as SpaceType, icon: 'apps' as const, label: 'Raised Bed' },
            { value: 'pot' as SpaceType, icon: 'cube-outline' as const, label: 'Pot' },
          ]
        ).map((opt, i) => (
          <React.Fragment key={opt.value}>
            {i > 0 && <View style={styles.spaceSegmentDivider} />}
            <TouchableOpacity
              style={[
                styles.spaceSegmentItem,
                spaceType === opt.value && styles.spaceSegmentItemActive,
              ]}
              onPress={() => setSpaceType(opt.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: spaceType === opt.value }}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={spaceType === opt.value ? theme.textInverse : theme.textTertiary}
              />
              <Text
                style={[
                  styles.spaceSegmentLabel,
                  spaceType === opt.value && styles.spaceSegmentLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {spaceType === 'pot' && (
        <FloatingLabelInput
          label="Pot Size in inches (e.g., 12)"
          value={potSize}
          onChangeText={(text) => setPotSize(sanitizeNumberText(text))}
          keyboardType="numeric"
        />
      )}
      {spaceType === 'bed' && (
        <FloatingLabelInput
          label="Bed Name (e.g., Veggie Bed 1)"
          value={bedName}
          onChangeText={(text) => setBedName(sanitizeAlphaNumericSpaces(text))}
        />
      )}
      {spaceType === 'bed' && beds.length > 0 && (
        <ThemedDropdown
          items={[
            { label: 'No bed linked', value: '' },
            ...beds.map((b) => ({ label: b.name, value: b.id })),
          ]}
          selectedValue={bedId ?? ''}
          onValueChange={(v) => setBedId(v)}
          label="Link to Bed"
          placeholder="Link to Bed"
        />
      )}
    </CollapsibleSection>
  );
}
