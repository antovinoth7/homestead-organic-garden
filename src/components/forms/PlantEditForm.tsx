import React, { useMemo, useCallback } from 'react';
import type { ImageStyle } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { PlantFormStateReturn, NOTES_MAX_LENGTH } from '../../hooks/usePlantFormState';
import { createStyles } from '../../styles/plantFormStyles';
import { createEditStyles } from '../../styles/plantEditFormStyles';
import CollapsibleSection from '../CollapsibleSection';
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
import { EditSafetySection } from './EditSafetySection';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { CATEGORY_FULL_LABELS } from '../../utils/plantLabels';
import { toLocalDateString, formatDateDisplay } from '../../utils/dateHelpers';
import { JournalEntryType } from '../../types/database.types';
import type { PlantFormScreenNavigationProp } from '../../types/navigation.types';

interface Props {
  formState: PlantFormStateReturn;
}

// Pest observations and harvests are logged in the Journal now, so the edit
// tabs cover configuration only. Notes gets its own tab.
type PlantEditTabKey = 'basics' | 'care' | 'health' | 'notes';

const TAB_KEYS: readonly PlantEditTabKey[] = ['basics', 'care', 'health', 'notes'];

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
    plantId,
    loading,
    dataLoading,
    hasUnsavedChanges,
    handleSave,
    handleBackPress,
    formProgress,
    validationErrors,
    totalErrorCount,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    photoUri,
    pickImage,
    plantType,
    plantVariety,
    variety,
    name,
    generatedPlantName,
    harvestSeason,
    setHarvestSeason,
    harvestSeasonOptions,
    harvestStartDate,
    setHarvestStartDate,
    harvestEndDate,
    setHarvestEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    expectedHarvestDate,
    notes,
    setNotes,
  } = formState;

  const navigation = useNavigation<PlantFormScreenNavigationProp>();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  // Pest observations and harvests are recorded in the Journal (linked to this
  // plant); the edit form links out rather than duplicating that data entry.
  const openJournalForm = useCallback(
    (entryType: JournalEntryType) => {
      if (!plantId) return;
      navigation.navigate('Journal', {
        screen: 'JournalForm',
        params: { initialEntryType: entryType, initialPlantId: plantId },
      });
    },
    [navigation, plantId]
  );

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
        </View>

        <View style={editStyles.progressBarTrack}>
          <View
            style={[
              editStyles.progressBarFill,
              { width: `${formProgress.percent}%` as `${number}%` },
            ]}
          />
        </View>

        <ScrollView
          ref={setScrollRef}
          style={[styles.content, editStyles.scrollBody]}
          contentContainerStyle={[styles.scrollContent, editStyles.scrollContentPadding]}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {/*
            Photo + identity caption. These MUST stay wrapped in one view: the
            ScrollView pins its child at index 1 (the tab bar), so splitting
            them would make the caption sticky and let the tabs scroll away.
          */}
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

          <View onLayout={onTabBarLayout} style={editStyles.stickyTabBarWrap}>
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

            {/* Safety — pet toxicity warning (read-only) */}
            <EditSafetySection formState={formState} />
          </View>

          <View onLayout={registerSection('health')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader title="Health" icon="fitness-outline" />
            </View>

            <EditPlantHealthSection formState={formState} />

            {['vegetable', 'fruit_tree', 'herb'].includes(plantType) && (
              <CollapsibleSection
                title="Harvest"
                icon="calendar"
                defaultExpanded={false}
                expanded={sectionExpanded.harvest}
                onExpandedChange={(expanded) => setSectionExpandedState('harvest', expanded)}
                hasError={showValidationErrors && validationErrors.harvest.length > 0}
                sectionStatus="optional"
              >
                <View style={styles.directionChipsWrapper}>
                  <Text style={styles.directionChipsFloatingLabel}>Harvest Season</Text>
                  <View style={styles.directionChipsContainer}>
                    {harvestSeasonOptions.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.directionChip,
                          harvestSeason === s && styles.directionChipActive,
                        ]}
                        onPress={() => setHarvestSeason(harvestSeason === s ? '' : s)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.directionChipText,
                            harvestSeason === s && styles.directionChipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {plantType === 'fruit_tree' && (
                  <>
                    <View style={styles.fieldGroupDivider} />
                    <Text style={styles.fieldGroupLabel}>Harvest Date Range</Text>
                    <View style={styles.dateCard}>
                      <TouchableOpacity
                        style={styles.dateCardTouchable}
                        onPress={() => setShowStartDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dateCardIconWrap}>
                          <Ionicons name="play" size={18} color={theme.primary} />
                        </View>
                        <View style={styles.dateCardContent}>
                          <Text style={styles.dateCardLabel}>Start Date</Text>
                          <Text
                            style={
                              harvestStartDate ? styles.dateCardValue : styles.dateCardPlaceholder
                            }
                          >
                            {harvestStartDate
                              ? formatDateDisplay(harvestStartDate)
                              : 'Tap to select'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                      </TouchableOpacity>
                    </View>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={harvestStartDate ? new Date(harvestStartDate) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, selectedDate) => {
                          setShowStartDatePicker(Platform.OS === 'ios');
                          if (selectedDate) setHarvestStartDate(toLocalDateString(selectedDate));
                        }}
                      />
                    )}
                    <View style={styles.dateCard}>
                      <TouchableOpacity
                        style={styles.dateCardTouchable}
                        onPress={() => setShowEndDatePicker(true)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[styles.dateCardIconWrap, { backgroundColor: theme.accentLight }]}
                        >
                          <Ionicons name="stop" size={18} color={theme.accent} />
                        </View>
                        <View style={styles.dateCardContent}>
                          <Text style={styles.dateCardLabel}>End Date</Text>
                          <Text
                            style={
                              harvestEndDate ? styles.dateCardValue : styles.dateCardPlaceholder
                            }
                          >
                            {harvestEndDate ? formatDateDisplay(harvestEndDate) : 'Tap to select'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                      </TouchableOpacity>
                    </View>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={harvestEndDate ? new Date(harvestEndDate) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, selectedDate) => {
                          setShowEndDatePicker(Platform.OS === 'ios');
                          if (selectedDate) setHarvestEndDate(toLocalDateString(selectedDate));
                        }}
                      />
                    )}
                  </>
                )}

                {expectedHarvestDate ? (
                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <Ionicons name="calendar" size={20} color="#FF9800" />
                      <Text style={styles.infoCardTitle}>Expected Harvest Date</Text>
                    </View>
                    <Text style={styles.infoCardText}>
                      {new Date(expectedHarvestDate).toLocaleDateString()}
                    </Text>
                    <Text style={styles.infoCardSubtext}>
                      Auto-calculated based on plant variety and planting date
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={editStyles.journalLinkButton}
                  onPress={() => openJournalForm(JournalEntryType.Harvest)}
                  activeOpacity={0.7}
                  disabled={!plantId}
                >
                  <Ionicons name="basket-outline" size={20} color={theme.primary} />
                  <View style={editStyles.journalLinkTextBlock}>
                    <Text style={editStyles.journalLinkTitle}>Log a harvest</Text>
                    <Text style={editStyles.journalLinkSubtitle}>
                      Record actual harvests (weight, quality) in the Journal
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              </CollapsibleSection>
            )}

            <EditCoconutSection formState={formState} />

            <TouchableOpacity
              style={editStyles.journalLinkButton}
              onPress={() => openJournalForm(JournalEntryType.PestDisease)}
              activeOpacity={0.7}
              disabled={!plantId}
            >
              <Ionicons name="bug-outline" size={20} color={theme.primary} />
              <View style={editStyles.journalLinkTextBlock}>
                <Text style={editStyles.journalLinkTitle}>Log a pest or disease</Text>
                <Text style={editStyles.journalLinkSubtitle}>
                  Track pest and disease observations in the Journal
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
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

            <View style={styles.notesCard}>
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
        </ScrollView>

        <View style={[styles.stickySaveContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={[styles.stickySaveButton, loading && styles.stickySaveButtonDisabled]}
            onPress={() => handleSave()}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.stickySaveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
            {showValidationErrors && totalErrorCount > 0 && (
              <View style={styles.stickySaveErrorBadge}>
                <Text style={styles.stickySaveErrorBadgeText}>
                  {totalErrorCount} issue{totalErrorCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
