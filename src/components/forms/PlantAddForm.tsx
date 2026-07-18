import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlantFormStateReturn } from '@/hooks/usePlantFormState';
import { createStyles } from '@/styles/plantFormStyles';
import { createAddFormStyles } from '@/styles/plantAddFormStyles';
import { AddPlantBasicsSection } from './AddPlantBasicsSection';
import { AddPlantPlacementSection } from './AddPlantPlacementSection';
import { AddPlantCarePlanSection } from './AddPlantCarePlanSection';

interface Props {
  formState: PlantFormStateReturn;
}

type AddSectionKey = 'basic' | 'location' | 'care';

/** Single-screen add-plant form: bottom-sheet pickers + inline fields. */
export function PlantAddForm({ formState }: Props): React.JSX.Element {
  const {
    theme,
    insets,
    scrollViewRef,
    handleSave,
    loading,
    hasUnsavedChanges,
    handleBackPress,
    validationErrors,
  } = formState;

  const addFormStyles = useMemo(() => createAddFormStyles(theme), [theme]);
  const formStyles = useMemo(() => createStyles(theme), [theme]);

  const [careExpanded, setCareExpanded] = useState(false);
  const sectionYs = useRef<Record<AddSectionKey, number>>({ basic: 0, location: 0, care: 0 });

  const registerSectionY = useCallback((section: AddSectionKey, y: number): void => {
    sectionYs.current[section] = y;
  }, []);

  const handleSavePress = useCallback(() => {
    // Scroll to the first errored section (and open the collapsed care plan)
    // so its inline field error is visible after handleSave sets showValidationErrors.
    const order: AddSectionKey[] = ['basic', 'location', 'care'];
    const firstError = order.find((s) => validationErrors[s].length > 0);
    if (firstError) {
      if (firstError === 'care') setCareExpanded(true);
      scrollViewRef.current?.scrollTo({ y: sectionYs.current[firstError], animated: true });
    }
    // handleSave navigates on success (returnTo → bed wizard, otherwise the
    // plant list, which shows the "saved" toast). No artificial delay.
    handleSave();
  }, [validationErrors, scrollViewRef, handleSave]);

  return (
    <View style={addFormStyles.root}>
      <View style={[formStyles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={formStyles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={addFormStyles.headerCenter}>
          <View style={addFormStyles.titleRow}>
            <Text style={formStyles.title}>Add Plant</Text>
            {hasUnsavedChanges && <View style={formStyles.unsavedDot} />}
          </View>
        </View>
        <TouchableOpacity
          style={[formStyles.saveButton, loading && formStyles.saveButtonDisabled]}
          onPress={handleSavePress}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[formStyles.saveText, loading && formStyles.saveTextDisabled]}>
            {loading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KAV padding lifts low text inputs (landmark, nickname, pot/bed name)
          above the keyboard; edge-to-edge Android ignores "resize". */}
      <KeyboardAvoidingView style={addFormStyles.content} behavior="padding">
        <ScrollView
          ref={scrollViewRef}
          style={addFormStyles.scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            addFormStyles.scrollContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
        >
          <View onLayout={(e) => registerSectionY('basic', e.nativeEvent.layout.y)}>
            <AddPlantBasicsSection formState={formState} />
          </View>
          <View onLayout={(e) => registerSectionY('location', e.nativeEvent.layout.y)}>
            <AddPlantPlacementSection formState={formState} />
          </View>
          <View onLayout={(e) => registerSectionY('care', e.nativeEvent.layout.y)}>
            <AddPlantCarePlanSection
              formState={formState}
              expanded={careExpanded}
              onToggle={() => setCareExpanded((prev) => !prev)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
