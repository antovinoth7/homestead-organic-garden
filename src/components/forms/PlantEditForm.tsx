import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { ImageStyle, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
    onTabBarLayout,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
    tabBarHeight,
  } = useSectionScrollSpy<PlantEditTabKey>(TAB_KEYS);

  // Mirror the detail screen: full-bleed hero → in-flow tabs → pinned overlay
  // tabs once the in-flow bar scrolls under the header.
  const [tabsStuck, setTabsStuck] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [lastSectionHeight, setLastSectionHeight] = useState(0);
  const tabBarYRef = useRef(0);

  const handleTabBarLayout = useCallback(
    (event: LayoutChangeEvent) => {
      tabBarYRef.current = event.nativeEvent.layout.y;
      onTabBarLayout(event);
    },
    [onTabBarLayout]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // The in-flow tab bar sits at tabBarYRef within the scroll content; once
      // it reaches the top of the viewport (just under the header) the pinned
      // overlay copy takes over so the handoff is seamless.
      const stuck = event.nativeEvent.contentOffset.y >= tabBarYRef.current;
      setTabsStuck((prev) => (prev === stuck ? prev : stuck));
      onScroll(event);
    },
    [onScroll]
  );

  const registerNotesSection = useCallback(
    (event: LayoutChangeEvent) => {
      registerSection('notes')(event);
      setLastSectionHeight(event.nativeEvent.layout.height);
    },
    [registerSection]
  );

  const contentBottomPadding = 24 + insets.bottom;
  const bottomSpacerHeight = Math.max(
    0,
    viewportHeight - tabBarHeight - lastSectionHeight - contentBottomPadding
  );

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
        <View
          style={[styles.header, { paddingTop: insets.top + 12 }]}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
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

        <ScrollView
          ref={setScrollRef}
          style={[styles.content, editStyles.scrollBody]}
          contentContainerStyle={[
            styles.scrollContent,
            editStyles.scrollContentPadding,
            { paddingBottom: contentBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
          scrollEventThrottle={16}
        >
          {/* Full-bleed editable hero photo — tap to change; mirrors the detail
              screen's hero but stays interactive. */}
          <TouchableOpacity style={editStyles.editHero} onPress={pickImage} activeOpacity={0.85}>
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

          <View style={editStyles.editHeroCaption}>
            {(plantVariety || variety) && (
              <Text style={styles.heroCaptionName} numberOfLines={1}>
                {plantVariety || variety}
              </Text>
            )}
            <Text style={styles.heroCaptionCategory}>{CATEGORY_FULL_LABELS[plantType]}</Text>
          </View>

          {/* In-flow tab bar sits under the image; a pinned copy (below) takes
              over once this scrolls under the header. */}
          <View style={editStyles.inFlowTabBar} onLayout={handleTabBarLayout}>
            <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={scrollToKey} />
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
          <View onLayout={registerNotesSection}>
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

          <View style={[editStyles.bottomSpacer, { height: bottomSpacerHeight }]} />
        </ScrollView>

        {/* Pinned overlay tab bar: appears just below the header once the
            in-flow bar scrolls away, so the tabs stay reachable. Outside the
            ScrollView (Android drops taps on translated sticky headers). */}
        {tabsStuck && (
          <View style={[editStyles.pinnedTabBar, { top: headerHeight }]}>
            <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={scrollToKey} />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
