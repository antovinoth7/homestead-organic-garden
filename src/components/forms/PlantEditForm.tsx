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
import PestDiseaseModal from '../modals/PestDiseaseModal';
import { EditBasicInfoSection } from './EditBasicInfoSection';
import { EditLocationSection } from './EditLocationSection';
import { EditCareScheduleSection } from './EditCareScheduleSection';
import { EditPlantHealthSection } from './EditPlantHealthSection';
import { EditCoconutSection } from './EditCoconutSection';
import { EditSafetySection } from './EditSafetySection';
import { EditRelationshipsSection } from './EditRelationshipsSection';
import { sanitizeAlphaNumericSpaces } from '../../utils/textSanitizer';
import { CATEGORY_FULL_LABELS } from '../../utils/plantLabels';
import { toLocalDateString, formatDateDisplay } from '../../utils/dateHelpers';
import { PestDiseaseRecord } from '../../types/database.types';

interface Props {
  formState: PlantFormStateReturn;
}

// Notes has no tab — it is a single free-text field, so it lives at the bottom
// of the page rather than taking a pill in the bar.
type PlantEditTabKey = 'basics' | 'care' | 'health' | 'pests';

const TAB_KEYS: readonly PlantEditTabKey[] = ['basics', 'care', 'health', 'pests'];

const TABS: readonly SegmentedTab<PlantEditTabKey>[] = [
  { key: 'basics', label: 'Basics', icon: 'leaf-outline' },
  { key: 'care', label: 'Care', icon: 'water-outline' },
  { key: 'health', label: 'Health', icon: 'fitness-outline' },
  { key: 'pests', label: 'Pests', icon: 'bug-outline' },
];

/** One-line summary of a record: date · severity · affected part · resolved. */
function pestMetaLine(record: PestDiseaseRecord): string {
  return [
    formatDateDisplay(record.occurredAt),
    record.severity ? record.severity.charAt(0).toUpperCase() + record.severity.slice(1) : '',
    record.affectedPart,
    record.resolved ? 'Resolved' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

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
    healthStatus,
    setHealthStatus,
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
    pestDiseaseHistory,
    setPestDiseaseHistory,
    showPestDiseaseModal,
    setShowPestDiseaseModal,
    currentPestDisease,
    setCurrentPestDisease,
    editingPestIndex,
    setEditingPestIndex,
    pestPhotoUri,
    setPestPhotoUri,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  // Same precedence handleSave uses: the nickname wins, else the generated name.
  const headerTitle = useMemo(() => {
    const displayName = name.trim() || generatedPlantName;
    return displayName ? `Edit — ${displayName}` : 'Edit Plant';
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

  const openNewPestRecord = useCallback(() => {
    setEditingPestIndex(null);
    setPestPhotoUri(null);
    setCurrentPestDisease({
      type: 'pest',
      name: '',
      occurredAt: toLocalDateString(new Date()),
      severity: 'medium',
      resolved: false,
    });
    setShowPestDiseaseModal(true);
  }, [setEditingPestIndex, setPestPhotoUri, setCurrentPestDisease, setShowPestDiseaseModal]);

  return (
    <View style={editStyles.flexOne}>
      {dataLoading && (
        <View style={editStyles.dataLoadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
      <KeyboardAvoidingView
        style={editStyles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title} numberOfLines={1}>
              {headerTitle}
            </Text>
            {hasUnsavedChanges && <View style={styles.unsavedDot} />}
          </View>
          <View style={editStyles.editHeaderSpacer} />
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

            {/* Companion Plants (read-only) */}
            <EditRelationshipsSection formState={formState} />
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
              </CollapsibleSection>
            )}

            <EditCoconutSection formState={formState} />
          </View>

          <View onLayout={registerSection('pests')}>
            <View style={editStyles.sectionHeaderBleed}>
              <PlantSectionHeader
                title="Pest & Disease"
                icon="bug-outline"
                hasError={showValidationErrors && validationErrors.pestDisease.length > 0}
                action={
                  <TouchableOpacity
                    style={editStyles.sectionHeaderAction}
                    onPress={openNewPestRecord}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Add pest or disease record"
                  >
                    <Ionicons name="add" size={16} color={theme.primary} />
                  </TouchableOpacity>
                }
              />
            </View>

            {pestDiseaseHistory.length > 0 ? (
              <View style={editStyles.pestListCard}>
                {pestDiseaseHistory
                  .map((record, index) => ({ record, index }))
                  .sort((a, b) =>
                    a.record.resolved === b.record.resolved ? 0 : a.record.resolved ? 1 : -1
                  )
                  .map(({ record, index }, position, rows) => (
                    <TouchableOpacity
                      key={record.id || index}
                      style={[
                        editStyles.pestRow,
                        position === rows.length - 1 && editStyles.pestRowLast,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setEditingPestIndex(index);
                        setCurrentPestDisease({ ...record });
                        setPestPhotoUri(record.photo_filename || null);
                        setShowPestDiseaseModal(true);
                      }}
                    >
                      <View
                        style={[
                          editStyles.pestRowIconWrap,
                          record.resolved
                            ? editStyles.pestRowIconWrapResolved
                            : editStyles.pestRowIconWrapActive,
                        ]}
                      >
                        <Ionicons
                          name={record.type === 'pest' ? 'bug' : 'medical'}
                          size={16}
                          color={record.resolved ? theme.success : theme.error}
                        />
                      </View>
                      <View style={editStyles.pestRowTextBlock}>
                        <Text
                          style={[
                            editStyles.pestRowName,
                            record.resolved && editStyles.pestRowNameResolved,
                          ]}
                          numberOfLines={1}
                        >
                          {record.name}
                        </Text>
                        <Text style={editStyles.pestRowMeta} numberOfLines={1}>
                          {pestMetaLine(record)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={editStyles.pestRowDelete}
                        onPress={() =>
                          setPestDiseaseHistory(pestDiseaseHistory.filter((_, i) => i !== index))
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={`Delete ${record.name}`}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.error} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <Text style={editStyles.pestEmpty}>No pest or disease records yet</Text>
            )}
          </View>

          {/* Notes trails the tabbed sections — no tab, so no registerSection. */}
          <View>
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
      </KeyboardAvoidingView>

      <PestDiseaseModal
        visible={showPestDiseaseModal}
        editingIndex={editingPestIndex}
        editingRecord={editingPestIndex !== null ? currentPestDisease : null}
        initialPhotoUri={pestPhotoUri}
        pestDiseaseHistory={pestDiseaseHistory}
        plantType={plantType}
        plantVariety={plantVariety}
        plantId={plantId}
        healthStatus={healthStatus}
        styles={styles}
        theme={theme}
        bottomInset={insets.bottom}
        onClose={() => {
          setEditingPestIndex(null);
          setShowPestDiseaseModal(false);
        }}
        onSave={(updatedHistory) => {
          setPestDiseaseHistory(updatedHistory);
          setEditingPestIndex(null);
          setShowPestDiseaseModal(false);
        }}
        onHealthStatusChange={(status) => setHealthStatus(status)}
      />

      <View style={[styles.stickySaveContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          style={[styles.stickySaveButton, loading && styles.stickySaveButtonDisabled]}
          onPress={() => handleSave()}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.stickySaveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          {showValidationErrors && totalErrorCount > 0 && (
            <View style={styles.stickySaveErrorBadge}>
              <Text style={styles.stickySaveErrorBadgeText}>
                {totalErrorCount} issue{totalErrorCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
