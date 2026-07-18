import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn, sanitizeNumberText } from '@/hooks/usePlantFormState';
import { useBedOptions } from '@/hooks/useBedOptions';
import { createStyles } from '@/styles/plantFormStyles';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import { PickerField } from '../PickerField';
import { LocationPickerSheet } from '../LocationPickerSheet';
import { sanitizeAlphaNumericSpaces, sanitizeLandmarkText } from '@/utils/textSanitizer';
import type { SpaceType } from '@/types/database.types';

interface Props {
  formState: PlantFormStateReturn;
}

export function AddPlantPlacementSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    parentLocationOptions,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    childLocationOptions,
    location,
    locationShortNames,
    landmarks,
    setLandmarks,
    spaceType,
    setSpaceType,
    potSize,
    setPotSize,
    bedId,
    setBedId,
    bedName,
    setBedName,
    locationDefaultsFired,
    autoSuggestFired,
    generatedPlantName,
    showCustomNameInput,
    setShowCustomNameInput,
    name,
    setName,
    showValidationErrors,
    validationErrors,
  } = formState;

  const { beds } = useBedOptions();

  const formStyles = useMemo(() => createStyles(theme), [theme]);
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
      <View style={formStyles.sectionCard}>
        <View style={formStyles.sectionCardTitleRow}>
          <View style={formStyles.sectionCardIconWrap}>
            <Ionicons name="location-outline" size={15} color={theme.primary} />
          </View>
          <Text style={formStyles.sectionCardTitle}>Where is it?</Text>
        </View>

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

        {locationDefaultsFired && !autoSuggestFired && (
          <Text style={formStyles.locationDefaultsHint}>
            Soil defaults applied from location profile
          </Text>
        )}

        <FloatingLabelInput
          label="Nearby landmark or reference point"
          value={landmarks}
          onChangeText={(text) => setLandmarks(sanitizeLandmarkText(text))}
        />
      </View>

      <View style={formStyles.sectionCard}>
        <View style={formStyles.sectionCardTitleRow}>
          <View style={formStyles.sectionCardIconWrap}>
            <Ionicons name="pricetag-outline" size={15} color={theme.primary} />
          </View>
          <Text style={formStyles.sectionCardTitle}>Nickname</Text>
        </View>

        {!showCustomNameInput ? (
          <View style={formStyles.namePreviewRow}>
            <Text style={formStyles.namePreviewFloatingLabel}>Plant nickname</Text>
            {generatedPlantName ? (
              <Text style={formStyles.namePreviewValue} numberOfLines={1}>
                {generatedPlantName}
              </Text>
            ) : (
              <Text style={formStyles.namePreviewValuePending}>
                Auto after choosing plant &amp; location above
              </Text>
            )}
            <TouchableOpacity
              style={formStyles.namePreviewActionCustom}
              onPress={() => setShowCustomNameInput(true)}
              activeOpacity={0.7}
            >
              <Text style={formStyles.namePreviewActionTextMuted}>Customise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={formStyles.nameCustomRow}>
            <Text style={formStyles.namePreviewFloatingLabel}>Plant nickname</Text>
            <TextInput
              style={formStyles.nameCustomInput}
              placeholder={generatedPlantName || 'Enter a custom name'}
              value={name}
              onChangeText={(text) => setName(sanitizeAlphaNumericSpaces(text))}
              placeholderTextColor={theme.inputPlaceholder}
            />
            <View style={formStyles.nameCustomActions}>
              {name.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  accessibilityLabel="Reset to auto-generated name"
                  style={formStyles.nameCustomClear}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={formStyles.namePreviewActionUse}
                onPress={() => {
                  setName('');
                  setShowCustomNameInput(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={formStyles.namePreviewActionText}>Use Auto ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={formStyles.sectionCard}>
        <View style={formStyles.sectionCardTitleRow}>
          <View style={formStyles.sectionCardIconWrap}>
            <Ionicons name="earth-outline" size={15} color={theme.primary} />
          </View>
          <Text style={formStyles.sectionCardTitle}>Growing Space</Text>
        </View>

        <View style={formStyles.spaceSegmentRow}>
          {(
            [
              { value: 'ground' as SpaceType, icon: 'earth' as const, label: 'Ground' },
              { value: 'bed' as SpaceType, icon: 'apps' as const, label: 'Raised Bed' },
              { value: 'pot' as SpaceType, icon: 'cube-outline' as const, label: 'Pot' },
            ]
          ).map((opt, i) => (
            <React.Fragment key={opt.value}>
              {i > 0 && <View style={formStyles.spaceSegmentDivider} />}
              <TouchableOpacity
                style={[
                  formStyles.spaceSegmentItem,
                  spaceType === opt.value && formStyles.spaceSegmentItemActive,
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
                    formStyles.spaceSegmentLabel,
                    spaceType === opt.value && formStyles.spaceSegmentLabelActive,
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
          <>
            {beds.length > 0 && (
              <ThemedDropdown
                items={[
                  { label: 'No bed selected', value: '' },
                  ...beds.map((b) => ({ label: b.name, value: b.id })),
                ]}
                selectedValue={bedId}
                onValueChange={setBedId}
                label="Assign to Bed"
                placeholder="Select a bed (optional)"
              />
            )}
            <FloatingLabelInput
              label="Bed Name (e.g., Veggie Bed 1)"
              value={bedName}
              onChangeText={(text) => setBedName(sanitizeAlphaNumericSpaces(text))}
            />
          </>
        )}
      </View>

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
