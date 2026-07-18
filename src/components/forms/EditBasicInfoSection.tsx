import React, { useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlantFormStateReturn } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { FormSectionCard } from './FormSectionCard';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { toLocalDateString, formatDateDisplay } from '../../utils/dateHelpers';

interface Props {
  formState: PlantFormStateReturn;
}

export function EditBasicInfoSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    showValidationErrors,
    validationErrors,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    varietySuggestions,
    generatedPlantName,
    name,
    setName,
    showCustomNameInput,
    setShowCustomNameInput,
    plantingDate,
    setPlantingDate,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleVarietyDropdownChange = useCallback(
    (value: string) => {
      if (value === '__custom__') {
        setCustomVarietyMode(true);
        setVariety('');
        return;
      }
      setCustomVarietyMode(false);
      setVariety(value);
    },
    [setCustomVarietyMode, setVariety]
  );

  const handleUseAutoName = useCallback(() => {
    setName('');
    setShowCustomNameInput(false);
  }, [setName, setShowCustomNameInput]);

  return (
    <View>
      <FormSectionCard
        title="Variety & Name"
        icon="leaf-outline"
        hasError={showValidationErrors && validationErrors.basic.length > 0}
      >
        {varietySuggestions.length > 0 ? (
          <>
            <ThemedDropdown
              items={[
                { label: 'Select variety (optional)', value: '' },
                ...varietySuggestions.map((s) => ({ label: s, value: s })),
                { label: 'Other (enter manually)', value: '__custom__' },
              ]}
              selectedValue={customVarietyMode ? '__custom__' : variety}
              onValueChange={handleVarietyDropdownChange}
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
        )}

        {!showCustomNameInput ? (
          <View style={styles.namePreviewRow}>
            <Text style={styles.namePreviewFloatingLabel}>Name</Text>
            {generatedPlantName ? (
              <Text style={styles.namePreviewValue} numberOfLines={1}>
                {generatedPlantName}
              </Text>
            ) : (
              <Text style={styles.namePreviewValuePending}>
                Auto after selecting plant & location
              </Text>
            )}
            <TouchableOpacity
              style={styles.namePreviewActionCustom}
              onPress={() => setShowCustomNameInput(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.namePreviewActionTextMuted}>Customise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.nameCustomRow}>
            <Text style={styles.namePreviewFloatingLabel}>Name</Text>
            <TextInput
              style={styles.nameCustomInput}
              placeholder={generatedPlantName || 'Enter a custom name'}
              value={name}
              onChangeText={(text) => setName(sanitizeAlphaNumericSpaces(text))}
              placeholderTextColor={theme.inputPlaceholder}
            />
            <View style={styles.nameCustomActions}>
              {name.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  accessibilityLabel="Reset to auto-generated name"
                  style={styles.nameCustomClear}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.namePreviewActionUse}
                onPress={handleUseAutoName}
                activeOpacity={0.7}
              >
                <Text style={styles.namePreviewActionText}>Use Auto ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.dateCard}>
          <TouchableOpacity
            style={styles.dateCardTouchable}
            onPress={() => setShowPlantingDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateCardIconWrap}>
              <Ionicons name="calendar" size={20} color={theme.primary} />
            </View>
            <View style={styles.dateCardContent}>
              <Text style={styles.dateCardLabel}>Planting Date</Text>
              <Text style={plantingDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                {plantingDate ? formatDateDisplay(plantingDate) : 'Tap to select date'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
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
      </FormSectionCard>
    </View>
  );
}
