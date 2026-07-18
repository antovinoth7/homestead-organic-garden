import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn, sanitizeNumberText } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { FormSectionCard } from './FormSectionCard';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import { PickerField } from '../PickerField';
import { LocationPickerSheet } from '../LocationPickerSheet';
import { sanitizeAlphaNumericSpaces, sanitizeLandmarkText } from '../../utils/textSanitizer';
import type { SpaceType } from '../../types/database.types';
import { useBedOptions } from '@/hooks/useBedOptions';

interface Props {
  formState: PlantFormStateReturn;
}

export function EditLocationSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    showValidationErrors,
    validationErrors,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    childLocationOptions,
    parentLocationOptions,
    location,
    locationShortNames,
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
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);

  const handleLocationSelect = useCallback(
    (parent: string, child: string): void => {
      setParentLocation(parent);
      setChildLocation(child);
    },
    [setParentLocation, setChildLocation]
  );

  return (
    <View>
      <FormSectionCard
        title="Where is it?"
        icon="location-outline"
        hasError={showValidationErrors && validationErrors.location.length > 0}
      >
        <PickerField
          label="Location"
          value={location || parentLocation}
          placeholder="Choose a location"
          icon="location-outline"
          onPress={() => setLocationSheetVisible(true)}
          errorText={
            showValidationErrors && validationErrors.location.length > 0
              ? validationErrors.location[0]
              : undefined
          }
        />

        <FloatingLabelInput
          label="Nearby landmark or reference point"
          value={landmarks}
          onChangeText={(text) => setLandmarks(sanitizeLandmarkText(text))}
        />
      </FormSectionCard>

      <FormSectionCard title="Growing Space" icon="earth-outline">
        <View style={styles.spaceSegmentRow}>
          {[
            { value: 'ground' as SpaceType, icon: 'earth' as const, label: 'Ground' },
            { value: 'bed' as SpaceType, icon: 'apps' as const, label: 'Raised Bed' },
            { value: 'pot' as SpaceType, icon: 'cube-outline' as const, label: 'Pot' },
          ].map((opt, i) => (
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
      </FormSectionCard>

      <LocationPickerSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        parentLocations={parentLocationOptions}
        childLocations={childLocationOptions}
        parentShortNames={locationShortNames}
        selectedParent={parentLocation}
        selectedChild={childLocation}
        onSelect={handleLocationSelect}
      />
    </View>
  );
}
