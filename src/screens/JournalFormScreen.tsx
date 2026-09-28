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
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import PhotoSourceModal from '../components/modals/PhotoSourceModal';
import FieldErrorText from '../components/FieldErrorText';
import VoiceDictation from '@/components/VoiceDictation';
import { OptionPickerSheet, type PickerOption } from '@/components/OptionPickerSheet';
import { JournalDateSheet } from '@/components/journal/JournalDateSheet';
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
  buildGroupedJournalPlantOptions,
  formatEntryDateLabel,
  formatLastHarvestHint,
  journalEntryTimestamp,
  journalPickablePlants,
  lastHarvest,
  lastHarvestUnit,
  recentLinkIds,
  withRecentGroup,
  type JournalTypeOption,
} from '../utils/journalEntryOptions';
import { journalSaveMessage } from '@/utils/journalListHelpers';
import { toLocalDateString } from '../utils/dateHelpers';
import { createStyles } from '../styles/journalFormStyles';
import { logger } from '../utils/logger';
import {
  getFilenameFromUri,
  getLocalImageUriFromFilename,
  resolveLocalImageUri,
} from '../lib/imageStorage';
import { getErrorMessage } from '../utils/errorLogging';

/** Groups for the bed picker once "Recently used" leads it. */
const ALL_BEDS_GROUP = 'All beds';

type OpenPicker = 'date' | 'bed' | 'plant' | null;

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
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
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
    // The entry date doubles as the noticed date; an edit keeps a stored one
    // until the entry date itself is changed.
    occurredAt:
      editEntry?.pest_occurred_at ??
      toLocalDateString(editEntry ? new Date(editEntry.created_at) : new Date()),
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

  const openDatePicker = useCallback((): void => setOpenPicker('date'), []);
  const openBedPicker = useCallback((): void => setOpenPicker('bed'), []);
  const openPlantPicker = useCallback((): void => setOpenPicker('plant'), []);
  const closePicker = useCallback((): void => setOpenPicker(null), []);
  // The pest "noticed" date is the entry date — there is no separate field.
  const handleEntryDateSelect = useCallback((selected: Date): void => {
    setPestFields((prev) => ({ ...prev, occurredAt: toLocalDateString(selected) }));
    setEntryDate(selected);
    setDateTouched(true);
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

  // Past entries — for the pickers' "Recently used" group, a new harvest's
  // remembered unit and the "Last: …" hint. The list screen has usually just
  // warmed the journal cache, so this rarely hits Firestore. The entry being
  // edited is left out so it never counts as its own "last harvest".
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  useEffect(() => {
    getJournalEntries()
      .then((all) => setPastEntries(all.filter((e) => e.id !== editEntry?.id)))
      .catch((error: unknown) => logger.warn('Could not load past entries', error as Error));
  }, [editEntry?.id]);

  // Checked against the loaded beds: with no bed row on screen, a stale bed id
  // must not lock the plant row with no way to bring it back.
  const selectedBed = useMemo(
    () => bedList.find((b) => b.id === selectedBedId) ?? null,
    [bedList, selectedBedId]
  );
  const bedLinked = !!selectedBed;

  const selectedPlant = useMemo(
    () => plants.find((p) => p.id === selectedPlantId) ?? null,
    [plants, selectedPlantId]
  );

  const bedOptions = useMemo((): PickerOption[] => {
    const options = [...bedList]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((bed) => ({
        label: bed.name,
        value: bed.id,
        group: ALL_BEDS_GROUP,
        ...(bed.parent_location ? { description: bed.parent_location } : {}),
      }));
    return withRecentGroup(options, recentLinkIds(pastEntries, 'bed'));
  }, [bedList, pastEntries]);

  // The plant picker offers pot and ground plants only; a bed entry links to
  // the bed itself (see journalPickablePlants).
  const plantOptions = useMemo((): PickerOption[] => {
    const bedNameById = new Map(bedList.map((b) => [b.id, b.name]));
    return withRecentGroup(
      buildGroupedJournalPlantOptions(journalPickablePlants(plants, selectedPlantId), bedNameById),
      recentLinkIds(pastEntries, 'plant')
    );
  }, [plants, bedList, selectedPlantId, pastEntries]);

  // A harvest follows how this plant (or bed) was last measured — coconuts in
  // pcs, tomatoes in kg — until the farmer picks a unit.
  const harvestBedId = selectedPlantId ? null : selectedBedId || null;
  const rememberedUnit = useMemo(
    () =>
      selectedPlantId || harvestBedId
        ? lastHarvestUnit(pastEntries, selectedPlantId, harvestBedId)
        : null,
    [pastEntries, selectedPlantId, harvestBedId]
  );
  const lastHarvestHint = useMemo(
    () =>
      formatLastHarvestHint(
        selectedPlantId || harvestBedId
          ? lastHarvest(pastEntries, selectedPlantId, harvestBedId)
          : null,
        !!selectedPlantId || !!harvestBedId
      ),
    [pastEntries, selectedPlantId, harvestBedId]
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
        params: {
          refresh: Date.now(),
          savedMessage: journalSaveMessage(
            entryData,
            selectedPlant?.name ?? selectedBed?.name ?? null,
            isEditing
          ),
        },
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

  const saveLabel = loading
    ? 'Saving…'
    : isEditing
      ? 'Save changes'
      : entryType === JournalEntryType.Harvest
        ? 'Save harvest'
        : entryType === JournalEntryType.PestDisease
          ? `Save ${pestFields.kind}`
          : entryType === JournalEntryType.Milestone
            ? 'Save milestone'
            : entryType === JournalEntryType.Observation
              ? 'Save observation'
              : 'Save entry';
  const goBack = useCallback((): void => navigation.goBack(), [navigation]);
  const closePhotoSource = useCallback((): void => setShowPhotoSourceModal(false), []);
  const plantRowLabel = bedLinked
    ? 'Linked through the bed'
    : (selectedPlant?.name ?? 'No plant linked');
  const plantRowDetail =
    !bedLinked && selectedPlant
      ? plantOptions.find((o) => o.value === selectedPlant.id)?.description
      : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {isEditing ? 'Edit entry' : 'New entry'}
        </Text>
      </View>

      {/* KAV padding lifts both the fields and the Save bar above the keyboard. */}
      <KeyboardAvoidingView style={styles.scrollWrapper} behavior="padding">
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Entry type — a tile per type */}
          <View style={styles.typeGrid}>
            {typeOptions.map((opt) => {
              const active = entryType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeTile, active && styles.typeTileActive]}
                  onPress={typePressHandlers[opt.value]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={active ? theme.textInverse : theme.textSecondary}
                  />
                  <Text
                    style={[styles.typeTileText, active && styles.typeTileTextActive]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date, bed and plant — rows that open pickers, since the lists get long */}
          <View style={styles.linkCard}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={openDatePicker}
              accessibilityRole="button"
              accessibilityLabel={`Entry date, ${formatEntryDateLabel(entryDate)}. Change date`}
            >
              <Ionicons name="calendar-outline" size={21} color={theme.primary} />
              <Text style={styles.linkRowLabel}>Date</Text>
              <View style={styles.linkRowValueWrap}>
                <Text style={styles.linkRowValue} numberOfLines={1}>
                  {formatEntryDateLabel(entryDate)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
            {bedList.length > 0 && (
              <TouchableOpacity
                style={[styles.linkRow, styles.linkRowDivider]}
                onPress={openBedPicker}
                accessibilityRole="button"
                accessibilityLabel={`Link to bed, ${selectedBed?.name ?? 'none'}`}
              >
                <Ionicons name="grid-outline" size={21} color={theme.primary} />
                <Text style={styles.linkRowLabel}>Link to bed</Text>
                <View style={styles.linkRowValueWrap}>
                  <Text
                    style={[styles.linkRowValue, !selectedBed && styles.linkRowValueEmpty]}
                    numberOfLines={1}
                  >
                    {selectedBed?.name ?? 'No bed linked'}
                  </Text>
                  {!!selectedBed?.parent_location && (
                    <Text style={styles.linkRowDetail} numberOfLines={1}>
                      {selectedBed.parent_location}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.linkRow, styles.linkRowDivider]}
              onPress={openPlantPicker}
              disabled={bedLinked}
              accessibilityRole="button"
              accessibilityState={{ disabled: bedLinked }}
              accessibilityLabel={`Link to plant, ${plantRowLabel}`}
            >
              <Ionicons
                name="leaf"
                size={20}
                color={bedLinked ? theme.textTertiary : theme.primary}
              />
              <Text style={styles.linkRowLabel}>Link to plant</Text>
              <View style={styles.linkRowValueWrap}>
                <Text
                  style={[
                    styles.linkRowValue,
                    (bedLinked || !selectedPlant) && styles.linkRowValueEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {plantRowLabel}
                </Text>
                {!!plantRowDetail && (
                  <Text style={styles.linkRowDetail} numberOfLines={1}>
                    {plantRowDetail}
                  </Text>
                )}
              </View>
              {!bedLinked && (
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              )}
            </TouchableOpacity>
          </View>

          {entryType === JournalEntryType.Harvest && (
            <View onLayout={handleHarvestLayout}>
              <JournalHarvestSection
                value={effectiveHarvestFields}
                onChange={handleHarvestChange}
                lastHint={lastHarvestHint}
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

          {/* Notes — label left, compact mic | language pill right; photos below */}
          <View style={styles.notesBlock} onLayout={handleNotesLayout}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>{notesOptional ? 'Notes (optional)' : 'Notes'}</Text>
              <VoiceDictation compact value={content} onChangeText={handleContentChange} />
            </View>
            <TextInput
              style={[styles.notesInput, !!contentError && styles.inputError]}
              value={content}
              onChangeText={handleContentChange}
              placeholder="What's happening in your garden today?"
              placeholderTextColor={theme.inputPlaceholder}
              multiline
              maxLength={CONTENT_MAX_LENGTH}
              accessibilityLabel="Journal notes"
            />
            <View style={styles.notesFooter}>
              <View style={styles.notesFooterError}>
                <FieldErrorText message={contentError} />
              </View>
              <Text style={styles.charCounter}>
                {content.length}/{CONTENT_MAX_LENGTH}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickImage}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <Ionicons name="camera-outline" size={20} color={theme.primary} />
              <Text style={styles.addPhotoText}>Add photo</Text>
            </TouchableOpacity>
            {photoItems.some((item) => !!item.uri) && (
              <View style={styles.photoGrid}>
                {photoItems.map((item, index) =>
                  item.uri ? (
                    <View key={`${item.filename ?? item.uri}-${index}`} style={styles.photoTile}>
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
                        <Ionicons name="close" size={13} color={theme.textInverse} />
                      </TouchableOpacity>
                    </View>
                  ) : null
                )}
              </View>
            )}
          </View>

          {/* Tags — only for types that expose free tags */}
          {availableTags.length > 0 && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsWrap}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedTags.includes(tag) }}
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
        </ScrollView>

        {/* Save at thumb height, above the keyboard when it is open */}
        <View style={[styles.saveBar, { paddingBottom: footerPaddingBottom + 12 }]}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.saveText} numberOfLines={1}>
              {saveLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <JournalDateSheet
        visible={openPicker === 'date'}
        value={entryDate}
        onSelect={handleEntryDateSelect}
        onClose={closePicker}
      />
      <OptionPickerSheet
        visible={openPicker === 'bed'}
        onClose={closePicker}
        title="Link to bed"
        subtitle="Entries about plants in a bed go on the bed."
        options={bedOptions}
        selectedValue={selectedBedId}
        onSelect={handleBedChange}
        searchable
        searchPlaceholder="Search beds"
        allowClear
        clearLabel="No bed linked"
      />
      <OptionPickerSheet
        visible={openPicker === 'plant'}
        onClose={closePicker}
        title="Link to plant"
        subtitle="Plants in pots or the ground. Plants in a bed are linked through their bed."
        options={plantOptions}
        selectedValue={selectedPlantId ?? ''}
        onSelect={handlePlantChange}
        searchable
        searchPlaceholder="Search name, variety or place"
        allowClear
        clearLabel="No plant linked"
      />
      <PhotoSourceModal
        visible={showPhotoSourceModal}
        onClose={closePhotoSource}
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
