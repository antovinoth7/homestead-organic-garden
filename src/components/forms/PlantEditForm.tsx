import React, { useMemo, useCallback } from 'react';
import type { ImageStyle } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { PlantFormStateReturn, NOTES_MAX_LENGTH } from '../../hooks/usePlantFormState';
import type { FormSectionKey } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { createEditStyles } from '../../styles/plantEditFormStyles';
import VoiceDictation from '@/components/VoiceDictation';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { PlantSectionHeader } from '@/components/plantDetail/PlantSectionHeader';
import { useSectionScrollSpy } from '@/hooks/useSectionScrollSpy';
import { EditBasicInfoSection } from './EditBasicInfoSection';
import { EditLocationSection } from './EditLocationSection';
import { EditCareScheduleSection } from './EditCareScheduleSection';
import { EditPlantHealthSection } from './EditPlantHealthSection';
import { EditCoconutSection } from './EditCoconutSection';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { CATEGORY_FULL_LABELS } from '../../utils/plantLabels';

interface Props {
  formState: PlantFormStateReturn;
}

// Pest observations and harvests are logged in the Journal now, so the edit
// tabs cover configuration only. Notes gets its own tab.
type PlantEditTabKey = 'basics' | 'care' | 'health' | 'notes';

const TAB_KEYS: readonly PlantEditTabKey[] = ['basics', 'care', 'health', 'notes'];

// Save jumps to the tab owning the first errored section, so the inline error
// (and the section's red header) is on screen when validation blocks the save.
const SECTION_TO_TAB: Record<FormSectionKey, PlantEditTabKey> = {
  basic: 'basics',
  location: 'basics',
  care: 'care',
  health: 'health',
  harvest: 'care',
  coconut: 'health',
  pestDisease: 'health',
  notesHistory: 'notes',
};

const ERROR_SECTION_ORDER: readonly FormSectionKey[] = [
  'basic',
  'location',
  'care',
  'health',
  'harvest',
  'coconut',
  'notesHistory',
];

const TABS: readonly SegmentedTab<PlantEditTabKey>[] = [
  { key: 'basics', label: 'Basics', icon: 'leaf-outline' },
  { key: 'care', label: 'Care', icon: 'water-outline' },
  { key: 'health', label: 'Health', icon: 'fitness-outline' },
  { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
];

export function PlantEditForm({ formState }: Props): React.JSX.Element {
  const {
    theme,
    insets,
    loading,
    dataLoading,
    hasUnsavedChanges,
    handleSave,
    handleBackPress,
    validationErrors,
    showValidationErrors,
    photoUri,
    pickImage,
    plantType,
    plantVariety,
    variety,
    name,
    generatedPlantName,
    notes,
    setNotes,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  // Same precedence handleSave uses: the nickname wins, else the generated name.
  const headerTitle = useMemo(() => {
    return name.trim() || generatedPlantName || 'Edit Plant';
  }, [name, generatedPlantName]);

  const {
    activeKey,
    scrollRef,
    registerSection,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
  } = useSectionScrollSpy<PlantEditTabKey>(TAB_KEYS);

  const { scrollViewRef } = formState;
  // The form state hook and the scroll spy each need the ScrollView node.
  const setScrollRef = useCallback(
    (node: ScrollView | null) => {
      scrollViewRef.current = node;
      scrollRef.current = node;
    },
    [scrollViewRef, scrollRef]
  );

  const handleSavePress = useCallback(() => {
    const firstError = ERROR_SECTION_ORDER.find((s) => validationErrors[s].length > 0);
    if (firstError) scrollToKey(SECTION_TO_TAB[firstError]);
    // handleSave sets showValidationErrors and expands the errored card, then
    // navigates away on success.
    handleSave();
  }, [validationErrors, scrollToKey, handleSave]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !formState.isSaving.current) {
      handleBackPress();
    } else {
      formState.handleDiscard();
    }
  }, [hasUnsavedChanges, handleBackPress, formState]);

  return (
    <View style={editStyles.flexOne}>
      {dataLoading && (
        <View style={editStyles.dataLoadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
      {/* KAV padding lifts the notes/text inputs above the keyboard;
          edge-to-edge Android ignores "resize". */}
      <KeyboardAvoidingView style={editStyles.flexOne} behavior="padding">
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={editStyles.editHeaderTitleBlock}>
            <View style={editStyles.editHeaderTitleRow}>
              <Text style={editStyles.editHeaderTitle} numberOfLines={1}>
                {headerTitle}
              </Text>
              {hasUnsavedChanges && <View style={styles.unsavedDot} />}
            </View>
            <Text style={editStyles.editHeaderSubtitle}>Editing plant</Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSavePress}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
              {loading ? 'Saving…' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pinned below the header, outside the ScrollView: a sticky tab bar
            drops taps on Android (translated sticky header), so keeping it here
            makes every tap register while the scroll-spy still tracks sections. */}
        <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={scrollToKey} />

        <ScrollView
          ref={setScrollRef}
          style={[styles.content, editStyles.scrollBody]}
          contentContainerStyle={[
            styles.scrollContent,
            editStyles.scrollContentPadding,
            { paddingBottom: 24 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {/* Photo + identity caption. */}
          <View>
            <TouchableOpacity
              style={styles.photoHeroContainer}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              {photoUri ? (
                <>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.photoHeroImage as ImageStyle}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.photoHeroEditBadge}>
                    <Ionicons name="camera" size={14} color={theme.textInverse} />
                    <Text style={styles.photoHeroEditBadgeText}>Change Photo</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoHeroPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={theme.primary} />
                  <Text style={styles.photoHeroPlaceholderText}>Tap to add a photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.heroCaption}>
              {(plantVariety || variety) && (
                <Text style={styles.heroCaptionName} numberOfLines={1}>
                  {plantVariety || variety}
                </Text>
              )}
              <Text style={styles.heroCaptionCategory}>{CATEGORY_FULL_LABELS[plantType]}</Text>
            </View>
          </View>

          <View onLayout={registerSection('basics')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader title="Basics" icon="leaf-outline" />
            </View>

            {/* Basic Information */}
            <EditBasicInfoSection formState={formState} />

            {/* Location & Placement */}
            <EditLocationSection formState={formState} />
          </View>

          <View onLayout={registerSection('care')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader title="Care" icon="water-outline" />
            </View>

            {/* Care & Schedule */}
            <EditCareScheduleSection formState={formState} />
          </View>

          <View onLayout={registerSection('health')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader title="Health" icon="fitness-outline" />
            </View>

            <EditPlantHealthSection formState={formState} />

            <EditCoconutSection formState={formState} />
          </View>

          {/* Notes tab. Pest/disease observations now live in the Journal. */}
          <View onLayout={registerSection('notes')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader
                title="Notes"
                icon="document-text-outline"
                hasError={showValidationErrors && validationErrors.notesHistory.length > 0}
                status="optional"
              />
            </View>

            <View style={styles.sectionCard}>
              <VoiceDictation
                value={notes}
                onChangeText={(text) => setNotes(sanitizeAlphaNumericSpaces(text))}
              />
              <TextInput
                style={styles.notesCardInput}
                value={notes}
                onChangeText={(text) => setNotes(sanitizeAlphaNumericSpaces(text))}
                multiline
                numberOfLines={4}
                maxLength={NOTES_MAX_LENGTH}
                placeholder="Add any notes about this plant..."
                placeholderTextColor={theme.inputPlaceholder}
              />
              <Text style={styles.noteCounter}>
                {notes.length}/{NOTES_MAX_LENGTH}
              </Text>
            </View>
          </View>

          <View style={editStyles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
