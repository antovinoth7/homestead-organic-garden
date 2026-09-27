import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ImageStyle,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import PhotoSourceModal from '../components/modals/PhotoSourceModal';
import FieldErrorText from '../components/FieldErrorText';
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
import {
  DEFAULT_RECHECK_DAYS,
  JournalPestFollowUp,
  referenceRecheckDays,
  suggestedHealth,
  type PestFollowUp,
} from '@/components/forms/JournalPestFollowUp';
import { AlertDialog } from '@/components/modals/AlertDialog';
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  saveJournalImage,
} from '../services/journal';
import { getAllPlants, updatePlant } from '../services/plants';
import { createTaskTemplate } from '../services/tasks';
import { JournalEntry, MilestoneKind, Plant, JournalEntryType } from '../types/database.types';
import { useBedOptions } from '@/hooks/useBedOptions';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import {
  CONTENT_MAX_LENGTH,
  firstJournalErrorField,
  journalFormErrors,
  type JournalFieldKey,
} from '@/hooks/journalFormValidation';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type NavigationAction } from '@react-navigation/native';
import {
  JournalFormScreenNavigationProp,
  JournalFormScreenRouteProp,
} from '../types/navigation.types';
import { useTheme } from '../theme';
import { sanitizeFreeText } from '../utils/textSanitizer';
import {
  JOURNAL_TYPE_OPTIONS,
  tagsForEntry,
  normalizeHarvestUnit,
  buildJournalPlantOptions,
  formatEntryDateLabel,
  journalEntryTimestamp,
  journalPickablePlants,
  lastHarvestUnit,
  type JournalTypeOption,
} from '../utils/journalEntryOptions';
import { toLocalDateString } from '../utils/dateHelpers';
import { createStyles } from '../styles/journalFormStyles';
import { logger } from '../utils/logger';
import {
  getFilenameFromUri,
  getLocalImageUriFromFilename,
  resolveLocalImageUri,
} from '../lib/imageStorage';
import { getErrorMessage } from '../utils/errorLogging';

/** The notes counter only appears once the limit is worth watching. */
const CONTENT_COUNTER_FROM = 4000;

type PhotoItem = {
  uri: string | null;
  filename: string | null;
};

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
  // Entry date. Defaults to now; farmers often log the evening or day after
  // ("harvested yesterday"). Only a date the user actually picks is saved, so
  // an untouched edit never rewrites the stored timestamp.
  const [entryDate, setEntryDate] = useState<Date>(() =>
    editEntry ? new Date(editEntry.created_at) : new Date()
  );
  const [dateTouched, setDateTouched] = useState(false);
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
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
  // Once the farmer picks a unit it's theirs; until then a new harvest follows
  // the plant's last harvest unit (see rememberedUnit below).
  const [unitTouched, setUnitTouched] = useState(false);
  const handleHarvestChange = useCallback((patch: Partial<HarvestFields>) => {
    if (patch.unit !== undefined) setUnitTouched(true);
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

  // "After saving" options for a new, unresolved pest/disease entry.
  const [followUp, setFollowUp] = useState<PestFollowUp>({
    markHealth: true,
    remind: false,
    remindDays: null,
  });
  const handleFollowUpChange = useCallback((patch: Partial<PestFollowUp>) => {
    setFollowUp((prev) => ({ ...prev, ...patch }));
  }, []);

  const openEntryDatePicker = useCallback((): void => setShowEntryDatePicker(true), []);
  const handleEntryDateChange = useCallback(
    (_event: DateTimePickerEvent, selected?: Date): void => {
      setShowEntryDatePicker(Platform.OS === 'ios');
      if (!selected) return;
      // On a new entry the pest "occurred" date follows the entry date until
      // the farmer sets it separately (a problem can start before it's logged).
      if (!isEditing) {
        const previousDay = toLocalDateString(entryDate);
        const nextDay = toLocalDateString(selected);
        setPestFields((prev) =>
          prev.occurredAt === previousDay ? { ...prev, occurredAt: nextDay } : prev
        );
      }
      setEntryDate(selected);
      setDateTouched(true);
    },
    [entryDate, isEditing]
  );

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

  const loadPlants = async (): Promise<void> => {
    try {
      const data = await getAllPlants();
      setPlants(data);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

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

  // An older entry linked to a bed plant surfaces that bed; the plant field then
  // hides but the plant_id is kept on save. Runs once after plants load.
  useEffect(() => {
    if (bedSyncedRef.current || plants.length === 0) return;
    if (selectedPlantId && !selectedBedId) {
      const plant = plants.find((p) => p.id === selectedPlantId);
      if (plant?.bed_id) setSelectedBedId(plant.bed_id);
    }
    bedSyncedRef.current = true;
  }, [plants, selectedPlantId, selectedBedId]);

  // The plant picker offers pot and ground plants only; a bed entry links to
  // the bed itself (see journalPickablePlants).
  const bedItems = useMemo(
    () => [
      { label: 'No bed linked', value: '' },
      ...bedList.map((b) => ({ label: b.name, value: b.id })),
    ],
    [bedList]
  );

  const plantItems = useMemo(() => {
    const bedNameById = new Map(bedList.map((b) => [b.id, b.name]));
    return [
      { label: 'No plant linked', value: '' },
      ...buildJournalPlantOptions(journalPickablePlants(plants, selectedPlantId), bedNameById),
    ];
  }, [plants, bedList, selectedPlantId]);

  // Checked against the loaded beds: with no bed dropdown on screen, a stale
  // bed id must not hide the plant field with no way to bring it back.
  const bedLinked = !!selectedBedId && bedList.some((b) => b.id === selectedBedId);

  const selectedPlant = useMemo(
    () => plants.find((p) => p.id === selectedPlantId) ?? null,
    [plants, selectedPlantId]
  );

  // Past entries, loaded only for a new harvest — to default its unit to how
  // this plant was last measured (coconuts in pcs, tomatoes in kg). The list
  // screen has usually just warmed the journal cache, so this rarely hits Firestore.
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const pastEntriesRequested = useRef(false);
  useEffect(() => {
    if (isEditing || entryType !== JournalEntryType.Harvest || pastEntriesRequested.current) return;
    pastEntriesRequested.current = true;
    getJournalEntries()
      .then(setPastEntries)
      .catch((error: unknown) => logger.warn('Could not load past harvests', error as Error));
  }, [isEditing, entryType]);
  const rememberedUnit = useMemo(
    () => (selectedPlantId ? lastHarvestUnit(pastEntries, selectedPlantId) : null),
    [pastEntries, selectedPlantId]
  );
  const effectiveHarvestFields = useMemo(
    () =>
      !isEditing && !unitTouched && rememberedUnit
        ? { ...harvestFields, unit: rememberedUnit }
        : harvestFields,
    [isEditing, unitTouched, rememberedUnit, harvestFields]
  );

  // Follow-up applies to a new, unresolved problem on a linked plant. The
  // health nudge only offers itself while the plant still reads Healthy.
  const showFollowUp =
    !isEditing &&
    entryType === JournalEntryType.PestDisease &&
    pestFields.status !== 'resolved' &&
    !!selectedPlant;
  const healthSuggestion =
    selectedPlant?.health_status === 'healthy' ? suggestedHealth(pestFields.severity) : null;
  const suggestedRecheckDays = useMemo(
    () => referenceRecheckDays(pestFields.kind, pestFields.name, pestFields.treatment),
    [pestFields.kind, pestFields.name, pestFields.treatment]
  );

  const handleBedChange = useCallback(
    (value: string): void => {
      setSelectedBedId(value);
      // Clearing the bed brings the plant field back; the linked plant stays.
      if (!value) return;
      // A bed entry links to the bed, so a pot/ground plant is dropped. A plant
      // that really lives in this bed (older entries) keeps its link.
      setSelectedPlantId((prevPlantId) => {
        if (!prevPlantId) return prevPlantId;
        const plant = plants.find((p) => p.id === prevPlantId);
        return plant?.bed_id === value ? prevPlantId : null;
      });
    },
    [plants]
  );

  const handlePlantChange = useCallback((value: string): void => {
    setSelectedPlantId(value || null);
  }, []);

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

  // The "After saving" choices for a new, unresolved pest/disease entry: set
  // the plant's health and/or schedule a recurring spray reminder. Runs after
  // the entry itself is saved; a failed reminder is reported, since the farmer
  // would otherwise count on a reminder that never comes.
  const runPestFollowUp = async (plantId: string): Promise<void> => {
    const jobs: Promise<unknown>[] = [];
    if (healthSuggestion && followUp.markHealth) {
      jobs.push(
        updatePlant(plantId, { health_status: healthSuggestion }).catch((error: unknown) =>
          logger.warn('Failed to update plant health', error as Error)
        )
      );
    }
    if (followUp.remind) {
      const days = followUp.remindDays ?? suggestedRecheckDays ?? DEFAULT_RECHECK_DAYS;
      // Still active → spray this evening; already treated → a full interval on.
      const dueDate = new Date();
      if (pestFields.status === 'treated') dueDate.setDate(dueDate.getDate() + days);
      dueDate.setHours(18, 0, 0, 0);
      jobs.push(
        createTaskTemplate({
          plant_id: plantId,
          task_type: 'spray',
          frequency_days: days,
          next_due_at: dueDate.toISOString(),
          enabled: true,
          preferred_time: null,
          source: 'manual',
        }).catch((error: unknown) => {
          logger.warn('Failed to create spray reminder', error as Error);
          Alert.alert(
            'Reminder not created',
            'The entry was saved, but the spray reminder failed.'
          );
        })
      );
    }
    await Promise.all(jobs);
  };

  // ─── Unsaved-work guard ──────────────────────────────────────────────────
  // Farmers get interrupted mid-entry; a stray back swipe shouldn't lose it.
  // A new entry counts as dirty once it holds something typed or photographed
  // (picking a type or plant alone isn't worth a prompt). An edit is dirty when
  // any saved field differs from how it opened.
  const formSnapshot = useMemo(
    () =>
      JSON.stringify({
        entryType,
        content,
        photos: photoItems.map((p) => p.filename ?? p.uri),
        plant: selectedPlantId,
        tags: selectedTags,
        harvestFields,
        pestFields,
        milestoneKind,
        dateTouched,
      }),
    [
      entryType,
      content,
      photoItems,
      selectedPlantId,
      selectedTags,
      harvestFields,
      pestFields,
      milestoneKind,
      dateTouched,
    ]
  );
  const [initialSnapshot] = useState(formSnapshot);
  const hasUserInput =
    content.trim() !== '' ||
    photoItems.length > 0 ||
    harvestFields.quantity.trim() !== '' ||
    harvestFields.notes.trim() !== '' ||
    pestFields.name.trim() !== '' ||
    pestFields.treatment.trim() !== '' ||
    milestoneKind !== null;
  const isDirty = isEditing ? formSnapshot !== initialSnapshot : hasUserInput;

  const allowLeaveRef = useRef(false);
  const [pendingLeave, setPendingLeave] = useState<NavigationAction | null>(null);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (allowLeaveRef.current || !isDirty) return;
        e.preventDefault();
        setPendingLeave(e.data.action);
      }),
    [navigation, isDirty]
  );
  const keepEditing = useCallback((): void => setPendingLeave(null), []);
  const discardEntry = useCallback((): void => {
    const action = pendingLeave;
    setPendingLeave(null);
    if (!action) return;
    allowLeaveRef.current = true;
    navigation.dispatch(action);
  }, [pendingLeave, navigation]);

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
        harvest_unit: isHarvest ? effectiveHarvestFields.unit : null,
        harvest_quality: isHarvest ? harvestFields.quality : null,
        harvest_notes: isHarvest ? harvestFields.notes.trim() || null : null,
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
            ? (editEntry?.pest_resolved_at ?? toLocalDateString(new Date()))
            : null
          : null,
        milestone_kind: isMilestone ? milestoneKind : null,
      };

      if (isEditing && editEntry) {
        await updateJournalEntry(
          editEntry.id,
          dateTouched
            ? {
                ...entryData,
                created_at: journalEntryTimestamp(
                  entryDate,
                  new Date(editEntry.created_at)
                ).toISOString(),
              }
            : entryData
        );
      } else {
        await createJournalEntry(
          entryData,
          dateTouched ? { createdAt: journalEntryTimestamp(entryDate, new Date()) } : undefined
        );
        if (showFollowUp && selectedPlantId) {
          await runPestFollowUp(selectedPlantId);
        }
      }

      // Trigger refresh in parent screen. Saved, so leaving isn't a discard.
      allowLeaveRef.current = true;
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

  const typeOptions = useMemo((): readonly JournalTypeOption[] => {
    // 'Issue' is retired for new entries but must remain selectable when editing
    // a pre-existing issue so its type isn't silently changed.
    if (editEntry?.entry_type === JournalEntryType.Issue) {
      return [
        ...JOURNAL_TYPE_OPTIONS,
        { value: JournalEntryType.Issue, label: 'Issue', icon: 'alert-circle' },
      ];
    }
    return JOURNAL_TYPE_OPTIONS;
  }, [editEntry?.entry_type]);

  // One stable press handler per type pill (no anonymous functions in JSX).
  const typePressHandlers = useMemo(
    () =>
      Object.fromEntries(
        typeOptions.map((opt) => [opt.value, () => handleTypeChange(opt.value)])
      ) as Record<JournalEntryType, () => void>,
    [typeOptions, handleTypeChange]
  );

  const handleContentChange = useCallback((text: string): void => {
    setContent(sanitizeFreeText(text));
  }, []);

  // Harvest / pest / milestone capture their own fields, so notes are optional
  // there (mirrors journalFormErrors).
  const notesOptional =
    entryType === JournalEntryType.Harvest ||
    entryType === JournalEntryType.PestDisease ||
    entryType === JournalEntryType.Milestone;
  const contentError = errorFor('content');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
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
          {/* Entry type — one row of pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeBar}
            contentContainerStyle={styles.typeBarContent}
          >
            {typeOptions.map((opt) => {
              const active = entryType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typePill, active && styles.typePillActive]}
                  onPress={typePressHandlers[opt.value]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={15}
                    color={active ? theme.textInverse : theme.primary}
                  />
                  <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Entry date — defaults to today; backdate for late logging */}
          <TouchableOpacity
            style={styles.entryDateButton}
            onPress={openEntryDatePicker}
            accessibilityRole="button"
            accessibilityLabel={`Entry date, ${formatEntryDateLabel(entryDate)}. Change date`}
          >
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={styles.entryDateText}>{formatEntryDateLabel(entryDate)}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
          {showEntryDatePicker && (
            <DateTimePicker
              value={entryDate}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEntryDateChange}
            />
          )}

          {/* Location — a bed entry links to the bed; otherwise a pot/ground plant */}
          <View style={styles.locationSection}>
            {bedList.length > 0 && (
              <ThemedDropdown
                items={bedItems}
                selectedValue={selectedBedId}
                onValueChange={handleBedChange}
                label="Link to bed"
                placeholder="Link to bed (optional)"
                compact
              />
            )}
            {bedLinked ? (
              <Text style={styles.locationHint}>This entry is linked to the whole bed</Text>
            ) : (
              <ThemedDropdown
                items={plantItems}
                selectedValue={selectedPlantId || ''}
                onValueChange={handlePlantChange}
                label="Link to plant"
                placeholder="Link to plant (optional)"
                searchable
                compact
              />
            )}
          </View>

          {/* Photos — in the field the photo comes first, the words after, so
              the strip sits above the details rather than under the keyboard. */}
          <Text style={styles.fieldLabel}>
            {photoItems.length > 0 ? `Photos (${photoItems.length})` : 'Photos'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoStrip}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={styles.addPhotoTile}
              onPress={pickImage}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <Ionicons name="camera-outline" size={22} color={theme.primary} />
              <Text style={styles.addPhotoTileText}>Add</Text>
            </TouchableOpacity>
            {photoItems.map((item, index) =>
              item.uri ? (
                <View key={index} style={styles.photoTile}>
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
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons name="close" size={14} color={theme.textInverse} />
                  </TouchableOpacity>
                </View>
              ) : null
            )}
          </ScrollView>

          {entryType === JournalEntryType.Harvest && (
            <View onLayout={handleHarvestLayout}>
              <JournalHarvestSection
                value={effectiveHarvestFields}
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

          {showFollowUp && (
            <JournalPestFollowUp
              value={followUp}
              onChange={handleFollowUpChange}
              healthSuggestion={healthSuggestion}
              suggestedDays={suggestedRecheckDays}
              treatment={pestFields.treatment}
              status={pestFields.status}
            />
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

          {/* Notes — label left, compact mic | language pill right */}
          <View style={styles.notesBlock} onLayout={handleNotesLayout}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>{notesOptional ? 'Notes (optional)' : 'Notes'}</Text>
              <VoiceDictation compact value={content} onChangeText={handleContentChange} />
            </View>
            <TextInput
              style={[styles.notesInput, !!contentError && styles.notesInputError]}
              value={content}
              onChangeText={handleContentChange}
              placeholder="What's happening in your garden today?"
              placeholderTextColor={theme.inputPlaceholder}
              multiline
              maxLength={CONTENT_MAX_LENGTH}
              accessibilityLabel="Journal notes"
            />
            <FieldErrorText message={contentError} />
            {content.length >= CONTENT_COUNTER_FROM && (
              <Text style={styles.charCounter}>
                {content.length}/{CONTENT_MAX_LENGTH}
              </Text>
            )}
          </View>

          {/* Tags — only for types that expose free tags */}
          {availableTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.fieldLabel}>Tags</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>

      <PhotoSourceModal
        visible={showPhotoSourceModal}
        onClose={() => setShowPhotoSourceModal(false)}
        onCamera={openCamera}
        onLibrary={openImageLibrary}
      />

      <AlertDialog
        visible={pendingLeave !== null}
        title={isEditing ? 'Discard changes?' : 'Discard this entry?'}
        message={
          isEditing
            ? 'Your edits to this entry have not been saved.'
            : 'What you have entered has not been saved.'
        }
        icon="warning-outline"
        tone="warning"
        actions={[
          { label: 'Keep editing', variant: 'primary', onPress: keepEditing },
          { label: 'Discard', variant: 'ghost', onPress: discardEntry },
        ]}
        onDismiss={keepEditing}
      />
    </View>
  );
}
