import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlantFormStateReturn } from '@/hooks/usePlantFormState';
import { createStyles } from '@/styles/plantFormStyles';
import { createAddFormStyles } from '@/styles/plantAddFormStyles';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import { PickerField } from '../PickerField';
import { PlantPickerSheet } from '../PlantPickerSheet';
import { sanitizeAlphaNumericSpaces } from '@/utils/textSanitizer';
import { toLocalDateString, formatDateDisplay } from '@/utils/dateHelpers';
import { getPlantEmoji } from '@/utils/plantHelpers';
import { CATEGORY_FULL_LABELS } from '@/utils/plantLabels';
import type { PlantPickerItem } from '@/utils/plantPickerItems';

interface Props {
  formState: PlantFormStateReturn;
}

const TREE_TYPES = ['fruit_tree', 'timber_tree', 'coconut_tree'];

export function AddPlantBasicsSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    photoUri,
    pickImage,
    plantType,
    setPlantType,
    plantVariety,
    setPlantVariety,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    plantPickerItems,
    varietySuggestions,
    plantingDate,
    setPlantingDate,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
    showValidationErrors,
    validationErrors,
  } = formState;

  const formStyles = useMemo(() => createStyles(theme), [theme]);
  const addFormStyles = useMemo(() => createAddFormStyles(theme), [theme]);
  const [plantSheetVisible, setPlantSheetVisible] = useState(false);

  // Selecting a plant drives category (inverse of the old chip-grid-first
  // flow): plantType comes from the picked item, and the downstream effects
  // (care seeding, variety suggestions, name generation) fire off the setters.
  const handlePlantSelect = useCallback(
    (item: PlantPickerItem): void => {
      setPlantType(item.plantType);
      setPlantVariety(item.name);
      setVariety('');
      setCustomVarietyMode(false);
    },
    [setPlantType, setPlantVariety, setVariety, setCustomVarietyMode]
  );

  const plantingDateOptional = !TREE_TYPES.includes(plantType);

  return (
    <View>
      <TouchableOpacity
        style={formStyles.photoHeroContainer}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {photoUri ? (
          <>
            <Image
              source={{ uri: photoUri }}
              style={formStyles.photoHeroImage as ImageStyle}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={formStyles.photoHeroEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={formStyles.photoHeroEditBadgeText}>Change Photo</Text>
            </View>
          </>
        ) : (
          <View style={formStyles.photoHeroPlaceholder}>
            <Ionicons name="camera-outline" size={40} color={theme.primary} />
            <Text style={formStyles.photoHeroPlaceholderText}>Tap to add a photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={formStyles.sectionCard}>
        <View style={formStyles.sectionCardTitleRow}>
          <View style={formStyles.sectionCardIconWrap}>
            <Ionicons name="leaf-outline" size={15} color={theme.primary} />
          </View>
          <Text style={formStyles.sectionCardTitle}>What are you planting?</Text>
        </View>

        <PickerField
          label="Plant"
          value={plantVariety}
          placeholder="Choose a plant"
          emoji={plantVariety ? getPlantEmoji(plantVariety) : undefined}
          subtitle={plantVariety && plantType ? CATEGORY_FULL_LABELS[plantType] : undefined}
          onPress={() => setPlantSheetVisible(true)}
          errorText={
            showValidationErrors && validationErrors.basic.length > 0
              ? validationErrors.basic[0]
              : undefined
          }
        />

        {plantVariety !== '' &&
          (varietySuggestions.length > 0 ? (
            <>
              <ThemedDropdown
                items={[
                  { label: 'Select variety (optional)', value: '' },
                  ...varietySuggestions.map((s) => ({ label: s, value: s })),
                  { label: 'Other (enter manually)', value: '__custom__' },
                ]}
                selectedValue={customVarietyMode ? '__custom__' : variety}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    setCustomVarietyMode(true);
                    setVariety('');
                    return;
                  }
                  setCustomVarietyMode(false);
                  setVariety(value);
                }}
                label="Variety"
                placeholder="Variety"
                enabled={varietySuggestions.length > 0}
                searchable
              />
              {customVarietyMode && (
                <FloatingLabelInput
                  label="Enter custom variety"
                  value={variety}
                  onChangeText={(text) => setVariety(sanitizeAlphaNumericSpaces(text))}
                />
              )}
            </>
          ) : (
            <FloatingLabelInput
              label="Variety"
              value={variety}
              onChangeText={(text) => setVariety(sanitizeAlphaNumericSpaces(text))}
            />
          ))}

        <View style={formStyles.dateCard}>
          <TouchableOpacity
            style={formStyles.dateCardTouchable}
            onPress={() => setShowPlantingDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={formStyles.dateCardIconWrap}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
            </View>
            <View style={formStyles.dateCardContent}>
              <View style={addFormStyles.dateCardLabelRow}>
                <Text style={formStyles.dateCardLabel}>Planting Date</Text>
                {plantingDateOptional && (
                  <View style={formStyles.optionalBadge}>
                    <Text style={formStyles.optionalBadgeText}>Optional</Text>
                  </View>
                )}
              </View>
              <Text style={plantingDate ? formStyles.dateCardValue : formStyles.dateCardPlaceholder}>
                {plantingDate ? formatDateDisplay(plantingDate) : 'Tap to select date'}
              </Text>
            </View>
            {plantingDate ? (
              <TouchableOpacity
                onPress={() => setPlantingDate('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
        {showPlantingDatePicker && (
          <DateTimePicker
            value={plantingDate ? new Date(plantingDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selectedDate) => {
              setShowPlantingDatePicker(Platform.OS === 'ios');
              if (selectedDate) setPlantingDate(toLocalDateString(selectedDate));
            }}
          />
        )}
      </View>

      <PlantPickerSheet
        visible={plantSheetVisible}
        onClose={() => setPlantSheetVisible(false)}
        items={plantPickerItems}
        selectedName={plantVariety || null}
        selectedPlantType={plantVariety ? plantType : null}
        onSelect={handlePlantSelect}
      />
    </View>
  );
}
