import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  ImageStyle,
  LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import PhotoSourceModal from '../components/modals/PhotoSourceModal';
import FloatingLabelInput from '../components/FloatingLabelInput';
import ThemedDropdown from '../components/ThemedDropdown';
import VoiceDictation from '@/components/VoiceDictation';
import {
  JournalHarvestSection,
  type HarvestFields,
} from '@/components/forms/JournalHarvestSection';
import {
  JournalPestDiseaseSection,
  type PestDiseaseFields,
} from '@/components/forms/JournalPestDiseaseSection';
import { JournalMilestoneSection } from '@/components/forms/JournalMilestoneSection';
import { createJournalEntry, updateJournalEntry, saveJournalImage } from '../services/journal';
import { getAllPlants, updatePlant } from '../services/plants';
import { createTaskTemplate } from '../services/tasks';
import {
  HealthStatus,
  MilestoneKind,
  Plant,
  JournalEntryType,
} from '../types/database.types';
import { useBedOptions } from '@/hooks/useBedOptions';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import {
  firstJournalErrorField,
  journalFormErrors,
  type JournalFieldKey,
} from '@/hooks/journalFormValidation';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  JournalFormScreenNavigationProp,
  JournalFormScreenRouteProp,
} from '../types/navigation.types';
import { useTheme } from '../theme';
import { sanitizeAlphaNumericSpaces } from '../utils/textSanitizer';
import { tagsForEntry, normalizeHarvestUnit } from '../utils/journalEntryOptions';
import { toLocalDateString } from '../utils/dateHelpers';
import { createStyles } from '../styles/journalFormStyles';
import { logger } from '../utils/logger';
import {
  getFilenameFromUri,
  getLocalImageUriFromFilename,
  resolveLocalImageUri,
} from '../lib/imageStorage';
import { getErrorMessage } from '../utils/errorLogging';

type PhotoItem = {
  uri: string | null;
  filename: string | null;
};

const BASE_TYPE_OPTIONS: {
  value: JournalEntryType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: JournalEntryType.Observation, label: 'Observation', icon: 'eye' },
  { value: JournalEntryType.Harvest, label: 'Harvest', icon: 'basket' },
  { value: JournalEntryType.PestDisease, label: 'Pest/Disease', icon: 'bug' },
  { value: JournalEntryType.Milestone, label: 'Milestone', icon: 'flag' },
];

export default function JournalFormScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalFormScreenNavigationProp>();
  const route = useRoute<JournalFormScreenRouteProp>();
  const editEntry = route.params?.entry;
  const initialEntryType = route.params?.initialEntryType;
  const initialPlantId = route.params?.initialPlantId;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  // Keyboard covers the nav-bar area, so its inset would become a dead gap.
  const footerPaddingBottom = keyboardVisible ? 8 : Math.max(insets.bottom, 8);
  const isEditing = !!editEntry;

  const [entryType, setEntryType] = useState<JournalEntryType>(
    editEntry?.entry_type || initialEntryType || JournalEntryType.Observation
  );
  const [content, setContent] = useState(editEntry?.content || '');
  const buildInitialPhotoItems = (): PhotoItem[] => {
    if (!editEntry) return [];
    if (editEntry.photo_filenames && editEntry.photo_filenames.length > 0) {
      return editEntry.photo_filenames.map((filename, index) => ({
        filename,
        uri: editEntry.photo_urls?.[index] ?? getLocalImageUriFromFilename(filename),
      }));
    }
    const legacyUris = editEntry.photo_urls || (editEntry.photo_url ? [editEntry.photo_url] : []);
    return legacyUris.map((uri) => ({
      uri,
      filename: getFilenameFromUri(uri),
    }));
  };
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(buildInitialPhotoItems);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    editEntry?.plant_id || initialPlantId || null
  );
  const [selectedBedId, setSelectedBedId] = useState<string>(editEntry?.bed_id || '');
  const [plants, setPlants] = useState<Plant[]>([]);
  const { beds: bedList } = useBedOptions();
  const [loading, setLoading] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const bedSyncedRef = useRef(false);

  // Tags — relevant to the current entry type, unioned with any legacy tags.
  const availableTags = useMemo(
    () => tagsForEntry(entryType, editEntry?.tags),
    [entryType, editEntry?.tags]
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(editEntry?.tags ?? []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Harvest fields
  const [harvestFields, setHarvestFields] = useState<HarvestFields>({
    quantity: editEntry?.harvest_quantity?.toString() ?? '',
    unit: normalizeHarvestUnit(editEntry?.harvest_unit),
    quality: editEntry?.harvest_quality ?? 'good',
    notes: editEntry?.harvest_notes ?? '',
    treeNumber: editEntry?.harvest_tree_number?.toString() ?? '',
  });
  const handleHarvestChange = useCallback((patch: Partial<HarvestFields>) => {
    setHarvestFields((prev) => ({ ...prev, ...patch }));
  }, []);

  // Pest/disease fields
  const [pestFields, setPestFields] = useState<PestDiseaseFields>({
    kind: editEntry?.pest_kind ?? 'pest',
    name: editEntry?.pest_name ?? '',
    severity: editEntry?.pest_severity ?? 'medium',
    status: editEntry?.pest_status ?? 'active',
    occurredAt: editEntry?.pest_occurred_at ?? toLocalDateString(new Date()),
    affectedParts: editEntry?.pest_affected_parts ?? [],
    treatment: editEntry?.pest_treatment ?? '',
    treatmentEffectiveness: editEntry?.pest_treatment_effectiveness ?? null,
  });
  const handlePestChange = useCallback((patch: Partial<PestDiseaseFields>) => {
    setPestFields((prev) => ({ ...prev, ...patch }));
  }, []);

  // Milestone field
  const [milestoneKind, setMilestoneKind] = useState<MilestoneKind | null>(
    editEntry?.milestone_kind ?? null
  );

  // Inline validation — errors stay hidden until the first Save attempt, then
  // the screen scrolls to the offending field (mirrors the plant forms).
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldYs = useRef<Partial<Record<JournalFieldKey, number>>>({});
  const validationErrors = useMemo(
    () =>
      journalFormErrors({
        entryType,
        content,
        harvestQuantity: harvestFields.quantity,
        pestName: pestFields.name,
        milestoneKind,
      }),
    [entryType, content, harvestFields.quantity, pestFields.name, milestoneKind]
  );
  const errorFor = useCallback(
    (key: JournalFieldKey): string | undefined =>
      showValidationErrors ? validationErrors[key][0] : undefined,
    [showValidationErrors, validationErrors]
  );
  const handleHarvestLayout = useCallback((e: LayoutChangeEvent): void => {
    fieldYs.current.quantity = e.nativeEvent.layout.y;
  }, []);
  const handlePestLayout = useCallback((e: LayoutChangeEvent): void => {
    fieldYs.current.pestName = e.nativeEvent.layout.y;
  }, []);
  const handleMilestoneLayout = useCallback((e: LayoutChangeEvent): void => {
    fieldYs.current.milestone = e.nativeEvent.layout.y;
  }, []);
  const handleNotesLayout = useCallback((e: LayoutChangeEvent): void => {
    fieldYs.current.content = e.nativeEvent.layout.y;
  }, []);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (isEditing) return;
    if (initialEntryType) {
      setEntryType(initialEntryType);
    }
    if (initialPlantId) {
      setSelectedPlantId(initialPlantId);
    }
  }, [isEditing, initialEntryType, initialPlantId]);

  // When a linked plant lives in a bed, surface that bed so the plant stays
  // visible in the (bed-filtered) plant dropdown. Runs once after plants load.
  useEffect(() => {
    if (bedSyncedRef.current || plants.length === 0) return;
    if (selectedPlantId && !selectedBedId) {
      const plant = plants.find((p) => p.id === selectedPlantId);
      if (plant?.bed_id) setSelectedBedId(plant.bed_id);
    }
    bedSyncedRef.current = true;
  }, [plants, selectedPlantId, selectedBedId]);

  const loadPlants = async (): Promise<void> => {
    try {
      const data = await getAllPlants();
      setPlants(data);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

  // Plants offered depend on the bed: a bed narrows to its members; no bed
  // shows only standalone (pot / unassigned) plants.
  const filteredPlants = useMemo(() => {
    if (selectedBedId) return plants.filter((p) => p.bed_id === selectedBedId);
    return plants.filter((p) => !p.bed_id);
  }, [plants, selectedBedId]);

  const selectedPlant = useMemo(
    () => plants.find((p) => p.id === selectedPlantId) ?? null,
    [plants, selectedPlantId]
  );

  const handleBedChange = useCallback(
    (value: string): void => {
      setSelectedBedId(value);
      setSelectedPlantId((prevPlantId) => {
        if (!prevPlantId) return prevPlantId;
        const plant = plants.find((p) => p.id === prevPlantId);
        const stillValid = value ? plant?.bed_id === value : !plant?.bed_id;
        return stillValid ? prevPlantId : null;
      });
    },
    [plants]
  );

  const handleTypeChange = useCallback(
    (type: JournalEntryType): void => {
      setEntryType(type);
      // Errors are armed per Save attempt. Switching type swaps in a different
      // set of fields the user hasn't submitted yet, so re-hide them instead of
      // greeting the new tab with a red error.
      setShowValidationErrors(false);
      const allowed = tagsForEntry(type, editEntry?.tags);
      setSelectedTags((prev) => prev.filter((t) => allowed.includes(t)));
    },
    [editEntry?.tags]
  );

  const openImageLibrary = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newItems = result.assets.map((asset) => ({
        uri: asset.uri,
        filename: null,
      }));
      setPhotoItems((prev) => [...prev, ...newItems]);
    }
  };

  const openCamera = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your camera');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled) {
        const cameraUri = result.assets[0]?.uri;
        if (cameraUri) {
          setPhotoItems((prev) => [...prev, { uri: cameraUri, filename: null }]);
        }
      }
    } catch (error) {
      logger.warn('Camera launch failed', error as Error);
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    }
  };

  const pickImage = (): void => {
    setShowPhotoSourceModal(true);
  };

  const removeImage = (index: number): void => {
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Prompts carried over from the old pest/disease modal: nudge health status
  // and offer a recurring spray task when a new, active issue is logged.
  const runPestSideEffects = useCallback(
    (plantId: string): void => {
      const plant = plants.find((p) => p.id === plantId);
      if (plant && plant.health_status === 'healthy') {
        const suggested: HealthStatus =
          pestFields.severity === 'high' || pestFields.severity === 'severe'
            ? 'sick'
            : 'stressed';
        Alert.alert(
          'Update Health Status?',
          `You logged an active ${pestFields.kind}. Change this plant's health to "${suggested}"?`,
          [
            { text: 'Keep Healthy', style: 'cancel' },
            {
              text: `Set ${suggested.charAt(0).toUpperCase() + suggested.slice(1)}`,
              onPress: () => {
                void updatePlant(plantId, { health_status: suggested }).catch((error) =>
                  logger.warn('Failed to update plant health', error as Error)
                );
              },
            },
          ]
        );
      }

      setTimeout(() => {
        Alert.alert(
          'Create Spray Task?',
          `Would you like a recurring spray task for "${pestFields.name.trim()}"?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Create Task',
              onPress: async () => {
                try {
                  const dueDate = new Date();
                  dueDate.setHours(18, 0, 0, 0);
                  await createTaskTemplate({
                    plant_id: plantId,
                    task_type: 'spray',
                    frequency_days: 7,
                    next_due_at: dueDate.toISOString(),
                    enabled: true,
                    preferred_time: null,
                    source: 'manual',
                  });
                  Alert.alert('Done', 'Spray task created!');
                } catch {
                  Alert.alert('Error', 'Could not create spray task.');
                }
              },
            },
          ]
        );
      }, 800);
    },
    [plants, pestFields.severity, pestFields.kind, pestFields.name]
  );

  const handleSave = async (): Promise<void> => {
    const isHarvest = entryType === JournalEntryType.Harvest;
    const isPest = entryType === JournalEntryType.PestDisease;
    const isMilestone = entryType === JournalEntryType.Milestone;

    const firstError = firstJournalErrorField(validationErrors);
    if (firstError) {
      setShowValidationErrors(true);
      scrollViewRef.current?.scrollTo({ y: fieldYs.current[firstError] ?? 0, animated: true });
      return;
    }

    if (loading) {
      return; // Prevent multiple submissions
    }

    setLoading(true);
    try {
      const photoUrls: string[] = [];
      const photoFilenames: string[] = [];

      for (const item of photoItems) {
        if (item.filename) {
          photoFilenames.push(item.filename);
          if (item.uri) {
            photoUrls.push(item.uri);
          } else {
            const localUri = await resolveLocalImageUri(item.filename);
            if (localUri) {
              photoUrls.push(localUri);
            }
          }
          continue;
        }
        if (item.uri) {
          const saved = await saveJournalImage(item.uri);
          const filename = saved.filename || getFilenameFromUri(saved.uri);
          if (filename) {
            photoFilenames.push(filename);
          }
          photoUrls.push(saved.uri);
        }
      }

      const entryData = {
        entry_type: entryType,
        content: content.trim(),
        photo_filenames: photoFilenames,
        photo_urls: photoUrls,
        plant_id: selectedPlantId,
        bed_id: selectedBedId || null,
        // Always an array: Firestore rejects `undefined`, and on edit an empty
        // array is what actually clears previously-saved tags.
        tags: selectedTags,
        harvest_quantity: isHarvest ? parseFloat(harvestFields.quantity) : null,
        harvest_unit: isHarvest ? harvestFields.unit : null,
        harvest_quality: isHarvest ? harvestFields.quality : null,
        harvest_notes: isHarvest ? harvestFields.notes : null,
        harvest_tree_number:
          isHarvest && harvestFields.treeNumber.trim() !== ''
            ? parseInt(harvestFields.treeNumber, 10)
            : null,
        pest_kind: isPest ? pestFields.kind : null,
        pest_name: isPest ? pestFields.name.trim() || null : null,
        pest_severity: isPest ? pestFields.severity : null,
        pest_status: isPest ? pestFields.status : null,
        pest_occurred_at: isPest ? pestFields.occurredAt : null,
        pest_affected_parts:
          isPest && pestFields.affectedParts.length > 0 ? pestFields.affectedParts : null,
        pest_treatment: isPest ? pestFields.treatment.trim() || null : null,
        pest_treatment_effectiveness: isPest ? pestFields.treatmentEffectiveness : null,
        pest_resolved_at: isPest
          ? pestFields.status === 'resolved'
            ? editEntry?.pest_resolved_at ?? toLocalDateString(new Date())
            : null
          : null,
        milestone_kind: isMilestone ? milestoneKind : null,
      };

      if (isEditing && editEntry) {
        await updateJournalEntry(editEntry.id, entryData);
      } else {
        await createJournalEntry(entryData);
        if (isPest && pestFields.status !== 'resolved' && selectedPlantId) {
          runPestSideEffects(selectedPlantId);
        }
      }

      // Trigger refresh in parent screen
      navigation.navigate({
        name: 'JournalList',
        params: { refresh: Date.now() },
        merge: true,
      });
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const typeOptions = useMemo(() => {
    // 'Issue' is retired for new entries but must remain selectable when editing
    // a pre-existing issue so its type isn't silently changed.
    if (editEntry?.entry_type === JournalEntryType.Issue) {
      return [
        ...BASE_TYPE_OPTIONS,
        {
          value: JournalEntryType.Issue,
          label: 'Issue',
          icon: 'alert-circle' as React.ComponentProps<typeof Ionicons>['name'],
        },
      ];
    }
    return BASE_TYPE_OPTIONS;
  }, [editEntry?.entry_type]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{isEditing ? 'Edit Entry' : 'New Entry'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KAV padding keeps low inputs above the keyboard; the header stays fixed
          outside it so Save is always reachable. */}
      <KeyboardAvoidingView style={styles.scrollWrapper} behavior="padding">
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: footerPaddingBottom + 24 }}
        >
          {/* Entry Type Selector */}
          <View style={styles.typeSelector}>
            {typeOptions.map((opt) => {
              const active = entryType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeButton, active && styles.typeButtonActive]}
                  onPress={() => handleTypeChange(opt.value)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? theme.textInverse : theme.primary}
                  />
                  <Text style={[styles.typeButtonText, active && styles.typeButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {photoItems.length > 0 && (
            <View style={styles.photosGrid}>
              {photoItems.map((item, index) =>
                item.uri ? (
                  <View key={index} style={styles.photoContainer}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.photoThumbnail as ImageStyle}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                      recyclingKey={`journal-photo-${index}`}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : null
              )}
            </View>
          )}

          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="camera" size={20} color={theme.primary} />
            <Text style={styles.addPhotoText}>
              {photoItems.length > 0 ? `Add More Photos (${photoItems.length})` : 'Add Photos'}
            </Text>
          </TouchableOpacity>

          {/* Location — bed narrows the plant list below it */}
          <View style={styles.locationSection}>
            {bedList.length > 0 && (
              <ThemedDropdown
                items={[
                  { label: 'No bed linked', value: '' },
                  ...bedList.map((b) => ({ label: b.name, value: b.id })),
                ]}
                selectedValue={selectedBedId}
                onValueChange={handleBedChange}
                label="Link to bed"
                placeholder="Link to bed (optional)"
              />
            )}
            <ThemedDropdown
              items={[
                { label: 'No plant linked', value: '' },
                ...filteredPlants.map((p) => ({ label: p.name, value: p.id })),
              ]}
              selectedValue={selectedPlantId || ''}
              onValueChange={(value) => setSelectedPlantId(value || null)}
              label="Link to plant"
              placeholder="Link to plant (optional)"
              searchable
            />
            {selectedBedId !== '' && (
              <Text style={styles.locationHint}>Showing plants in the selected bed</Text>
            )}
          </View>

          {/* Tags — only for types that expose free tags */}
          {availableTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsWrap}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        selectedTags.includes(tag) && styles.tagChipTextActive,
                      ]}
                    >
                      {tag.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {entryType === JournalEntryType.Harvest && (
            <View onLayout={handleHarvestLayout}>
              <JournalHarvestSection
                value={harvestFields}
                onChange={handleHarvestChange}
                plantType={selectedPlant?.plant_type ?? null}
                errorText={errorFor('quantity')}
              />
            </View>
          )}

          {entryType === JournalEntryType.PestDisease && (
            <View onLayout={handlePestLayout}>
              <JournalPestDiseaseSection
                value={pestFields}
                onChange={handlePestChange}
                plantType={selectedPlant?.plant_type ?? null}
                plantVariety={selectedPlant?.plant_variety ?? null}
                errorText={errorFor('pestName')}
              />
            </View>
          )}

          {entryType === JournalEntryType.Milestone && (
            <View onLayout={handleMilestoneLayout}>
              <JournalMilestoneSection
                value={milestoneKind}
                onChange={setMilestoneKind}
                errorText={errorFor('milestone')}
              />
            </View>
          )}

          <View style={styles.notesWrapper} onLayout={handleNotesLayout}>
            <VoiceDictation
              value={content}
              onChangeText={(text) => setContent(sanitizeAlphaNumericSpaces(text))}
            />
            <FloatingLabelInput
              label="What's happening in your garden today?"
              value={content}
              onChangeText={(text) => setContent(sanitizeAlphaNumericSpaces(text))}
              multiline
              numberOfLines={6}
              maxLength={5000}
              errorText={errorFor('content')}
            />
            <Text style={styles.charCounter}>{content.length}/5000</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoSourceModal
        visible={showPhotoSourceModal}
        onClose={() => setShowPhotoSourceModal(false)}
        onCamera={openCamera}
        onLibrary={openImageLibrary}
      />
    </View>
  );
}
