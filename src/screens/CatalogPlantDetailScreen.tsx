import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { getPlantImage } from '@/config/referenceAssets';
import { createStyles } from '@/styles/catalogPlantDetailStyles';
import CollapsibleSection from '@/components/CollapsibleSection';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { ReferenceHero } from '@/components/reference/ReferenceHero';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { OptionPickerSheet } from '@/components/OptionPickerSheet';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { AlertDialog } from '@/components/modals/AlertDialog';
import { CatalogChipList } from '@/components/catalog/CatalogChipList';
import type { CatalogChip } from '@/components/catalog/CatalogChipList';
import { CatalogDangerFooter } from '@/components/catalog/CatalogDangerFooter';
import { CatalogTextEditSheet } from '@/components/catalog/CatalogTextEditSheet';
import { CatalogRangeEditSheet } from '@/components/catalog/CatalogRangeEditSheet';
import { PestDiseasePickerModal } from '@/components/catalog/PestDiseasePickerModal';
import { VarietyDetailModal } from '@/components/catalog/VarietyDetailModal';
import { ReassignPlantsModal } from '@/components/catalog/ReassignPlantsModal';
import { PlantInfoSection } from '@/components/catalog/sections/PlantInfoSection';
import { CoreCareSection } from '@/components/catalog/sections/CoreCareSection';
import { GrowingInfoSection } from '@/components/catalog/sections/GrowingInfoSection';
import { PruningSection } from '@/components/catalog/sections/PruningSection';
import { TolerancesSection } from '@/components/catalog/sections/TolerancesSection';
import { PlantingSection } from '@/components/catalog/sections/PlantingSection';
import type {
  CatalogEditor,
  PickerSheetConfig,
  RangeSheetConfig,
  TextSheetConfig,
} from '@/components/catalog/catalogEditor';
import { useCatalogEntryForm } from '@/hooks/useCatalogEntryForm';
import { useSectionScrollSpy } from '@/hooks/useSectionScrollSpy';
import { getAllPests } from '@/config/pests';
import { getAllDiseases } from '@/config/diseases';
import type { VarietyDetail } from '@/types/database.types';
import { MoreStackParamList } from '@/types/navigation.types';
import { sanitizeName } from '@/utils/catalogDraft';
import {
  FIELD_TO_SECTION,
  SECTION_TO_TAB,
  sectionHasError,
} from '@/utils/catalogValidation';
import type { CatalogSectionKey, CatalogTabKey } from '@/utils/catalogValidation';
import {
  coreCareSummary,
  diseasesSummary,
  growingInfoSummary,
  pestsSummary,
  plantInfoSummary,
  plantingSummary,
  pruningSummary,
  toleranceSummary,
  varietiesSummary,
} from '@/utils/catalogSummaries';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import {
  getCommonDiseases,
  getCommonPests,
} from '@/utils/plantHelpers';
import {
  CATEGORY_LABELS,
  GROWTH_STAGE_LABELS,
  LIFECYCLE_LABELS,
  SUNLIGHT_LABELS,
  TOLERANCE_LABELS,
  WATER_REQUIREMENT_LABELS,
} from '@/utils/plantLabels';

type RouteParam = RouteProp<MoreStackParamList, 'CatalogPlantDetail'>;

const TAB_KEYS: readonly CatalogTabKey[] = ['basics', 'care', 'growing', 'health', 'varieties'];

const TABS: readonly SegmentedTab<CatalogTabKey>[] = [
  { key: 'basics', label: 'Basics', icon: 'information-circle-outline' },
  { key: 'care', label: 'Care', icon: 'water-outline' },
  { key: 'growing', label: 'Growing', icon: 'stats-chart-outline' },
  { key: 'health', label: 'Health', icon: 'shield-checkmark-outline' },
  { key: 'varieties', label: 'Varieties', icon: 'albums-outline' },
];

/** Matches `heroBleed`/`hero` in the shared reference styles. */
const HERO_HEIGHT = 250;
/** Where the sticky bar starts taking over from the hero's own controls. */
const STICKY_THRESHOLD = HERO_HEIGHT - 80;

const ALL_EXPANDED: Record<CatalogSectionKey, boolean> = {
  plantInfo: true,
  coreCare: true,
  pruning: true,
  growingInfo: true,
  planting: true,
  tolerances: true,
  pests: true,
  diseases: true,
  varieties: true,
};

export default function CatalogPlantDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteParam>();
  const navigation = useNavigation();
  const { plantName: initialName, plantType, isCreating = false } = route.params;

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  // ─── Modal visibility ─────────────────────────────────────────────────────

  const [textSheet, setTextSheet] = useState<TextSheetConfig | null>(null);
  const [pickerSheet, setPickerSheet] = useState<PickerSheetConfig | null>(null);
  const [rangeSheet, setRangeSheet] = useState<RangeSheetConfig | null>(null);
  const [showPestPicker, setShowPestPicker] = useState(false);
  const [showDiseasePicker, setShowDiseasePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignReplacement, setReassignReplacement] = useState('');
  const [editingVariety, setEditingVariety] = useState<string | null>(null);
  const [newVariety, setNewVariety] = useState('');
  const [varietyDraft, setVarietyDraft] = useState<VarietyDetail>({});

  const anyModalOpen =
    textSheet !== null ||
    pickerSheet !== null ||
    rangeSheet !== null ||
    showPestPicker ||
    showDiseasePicker ||
    showDeleteConfirm ||
    showReassign ||
    editingVariety !== null;

  const form = useCatalogEntryForm({ initialName, plantType, isCreating, anyModalOpen });
  const {
    loading,
    saving,
    name,
    setName,
    careForm,
    setForm,
    varieties,
    varietyDetails,
    setVarieties,
    setVarietyDetails,
    lookupName,
    categoryPlants,
    usageCount,
    hasOverride,
    isDirty,
    errors,
    showErrors,
    attemptSave,
    resetCare,
    requestDelete,
    confirmDelete,
    showDiscardDialog,
    dismissDiscard,
    discardChanges,
  } = form;

  // ─── Tabs + section expansion ─────────────────────────────────────────────

  const [headerHeight, setHeaderHeight] = useState(0);
  const [tabsStuck, setTabsStuck] = useState(false);
  /** Sticky bar fully faded in — only then may it take taps from the hero. */
  const [headerStuck, setHeaderStuck] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const tabBarYRef = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [sectionExpanded, setSectionExpanded] =
    useState<Record<CatalogSectionKey, boolean>>(ALL_EXPANDED);

  const {
    activeKey,
    scrollRef,
    registerSection,
    onTabBarLayout,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
  } = useSectionScrollSpy<CatalogTabKey>(TAB_KEYS, headerHeight);

  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height),
    []
  );

  const handleTabBarLayout = useCallback(
    (event: LayoutChangeEvent) => {
      tabBarYRef.current = event.nativeEvent.layout.y;
      onTabBarLayout(event);
    },
    [onTabBarLayout]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // The sticky bar overlays the scroll view, so the in-flow bar is covered
      // once it reaches the bar's *bottom* edge — that is where the pinned copy
      // takes over, keeping the handoff seamless.
      const y = event.nativeEvent.contentOffset.y;
      const stuck = y >= tabBarYRef.current - headerHeight;
      setTabsStuck((prev) => (prev === stuck ? prev : stuck));
      const barOpaque = y >= STICKY_THRESHOLD + 40;
      setHeaderStuck((prev) => (prev === barOpaque ? prev : barOpaque));
      onScroll(event);
    },
    [onScroll, headerHeight]
  );

  const stickyBgOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [STICKY_THRESHOLD, STICKY_THRESHOLD + 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyTitleOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [STICKY_THRESHOLD + 10, STICKY_THRESHOLD + 40],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const handleScrollEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: handleScroll,
      }),
    [scrollY, handleScroll]
  );

  const openPreview = useCallback(() => setPreviewVisible(true), []);
  const closePreview = useCallback(() => setPreviewVisible(false), []);

  const setExpanded = useCallback(
    (section: CatalogSectionKey) => (expanded: boolean) =>
      setSectionExpanded((prev) => ({ ...prev, [section]: expanded })),
    []
  );

  // ─── Field editing ────────────────────────────────────────────────────────

  const closeTextSheet = useCallback(() => setTextSheet(null), []);
  const closePickerSheet = useCallback(() => setPickerSheet(null), []);
  const closeRangeSheet = useCallback(() => setRangeSheet(null), []);

  const editor = useMemo<CatalogEditor | null>(
    () =>
      careForm
        ? {
            careForm,
            setForm,
            errors,
            showErrors,
            openText: setTextSheet,
            openPicker: setPickerSheet,
            openRange: setRangeSheet,
          }
        : null,
    [careForm, setForm, errors, showErrors]
  );

  // ─── Pests & diseases ─────────────────────────────────────────────────────

  // Keyed off the live name, so a rename in this session updates what the
  // entry inherits rather than leaving the previous plant's lists behind.
  const inheritedPests = useMemo(
    () => getCommonPests(plantType, lookupName),
    [plantType, lookupName]
  );
  const inheritedDiseases = useMemo(
    () => getCommonDiseases(plantType, lookupName),
    [plantType, lookupName]
  );
  const baseProfile = useMemo(
    () => getPlantCareProfile(lookupName, plantType),
    [lookupName, plantType]
  );

  const pestChips = useMemo<CatalogChip[]>(
    () => [
      ...inheritedPests.map((pest) => ({
        key: `inherited:${pest}`,
        label: pest,
        iconKey: 'general.pest' as const,
        removable: false,
      })),
      ...(careForm?.customPests ?? []).map((pest) => ({
        key: pest,
        label: pest,
        iconKey: 'general.pest' as const,
        removable: true,
      })),
    ],
    [inheritedPests, careForm?.customPests]
  );

  const diseaseChips = useMemo<CatalogChip[]>(
    () => [
      ...inheritedDiseases.map((disease) => ({
        key: `inherited:${disease}`,
        label: disease,
        iconKey: 'general.disease' as const,
        removable: false,
      })),
      ...(careForm?.customDiseases ?? []).map((disease) => ({
        key: disease,
        label: disease,
        iconKey: 'general.disease' as const,
        removable: true,
      })),
    ],
    [inheritedDiseases, careForm?.customDiseases]
  );

  const onAddPest = useCallback(
    (pest: string) => setForm({ customPests: [...(careForm?.customPests ?? []), pest] }),
    [setForm, careForm?.customPests]
  );
  const onRemovePest = useCallback(
    (pest: string) =>
      setForm({ customPests: (careForm?.customPests ?? []).filter((p) => p !== pest) }),
    [setForm, careForm?.customPests]
  );
  const onAddDisease = useCallback(
    (disease: string) =>
      setForm({ customDiseases: [...(careForm?.customDiseases ?? []), disease] }),
    [setForm, careForm?.customDiseases]
  );
  const onRemoveDisease = useCallback(
    (disease: string) =>
      setForm({
        customDiseases: (careForm?.customDiseases ?? []).filter((d) => d !== disease),
      }),
    [setForm, careForm?.customDiseases]
  );

  const openPestPicker = useCallback(() => setShowPestPicker(true), []);
  const closePestPicker = useCallback(() => setShowPestPicker(false), []);
  const openDiseasePicker = useCallback(() => setShowDiseasePicker(true), []);
  const closeDiseasePicker = useCallback(() => setShowDiseasePicker(false), []);

  const takenPestNames = useMemo(
    () => [...inheritedPests, ...(careForm?.customPests ?? [])],
    [inheritedPests, careForm?.customPests]
  );
  const takenDiseaseNames = useMemo(
    () => [...inheritedDiseases, ...(careForm?.customDiseases ?? [])],
    [inheritedDiseases, careForm?.customDiseases]
  );

  // ─── Varieties ────────────────────────────────────────────────────────────

  const hasVarietyDetail = useCallback(
    (variety: string): boolean => {
      const detail = varietyDetails[variety];
      if (!detail) return false;
      return (
        detail.daysToMaturity !== undefined ||
        (detail.seasonSuitability?.length ?? 0) > 0 ||
        Boolean(detail.seedSource?.trim()) ||
        Boolean(detail.notes?.trim())
      );
    },
    [varietyDetails]
  );

  const varietyChips = useMemo<CatalogChip[]>(
    () =>
      varieties.map((variety) => ({
        key: variety,
        label: variety,
        dot: hasVarietyDetail(variety),
        removable: true,
      })),
    [varieties, hasVarietyDetail]
  );

  const onAddVariety = useCallback(() => {
    setNewVariety('');
    setVarietyDraft({});
    setEditingVariety('');
  }, []);

  const onEditVariety = useCallback(
    (variety: string) => {
      setVarietyDraft(varietyDetails[variety] ?? {});
      setEditingVariety(variety);
    },
    [varietyDetails]
  );

  const onRemoveVariety = useCallback(
    (variety: string) => {
      setVarieties((prev) => prev.filter((v) => v.toLowerCase() !== variety.toLowerCase()));
      setVarietyDetails((prev) => {
        const next = { ...prev };
        delete next[variety];
        return next;
      });
    },
    [setVarieties, setVarietyDetails]
  );

  const closeVarietyModal = useCallback(() => setEditingVariety(null), []);

  const onSaveVariety = useCallback(() => {
    if (editingVariety === null) return;

    // Detail is only worth storing when it actually says something.
    const draft: VarietyDetail = {
      ...varietyDraft,
      seedSource: varietyDraft.seedSource?.trim(),
      notes: varietyDraft.notes?.trim(),
    };
    const hasContent =
      draft.daysToMaturity !== undefined ||
      (draft.seasonSuitability?.length ?? 0) > 0 ||
      Boolean(draft.seedSource) ||
      Boolean(draft.notes);

    if (editingVariety === '') {
      const variety = sanitizeName(newVariety);
      if (!variety) {
        setEditingVariety(null);
        return;
      }
      if (varieties.some((v) => v.toLowerCase() === variety.toLowerCase())) {
        setNewVariety('');
        setEditingVariety(null);
        return;
      }
      setVarieties((prev) => [...prev, variety]);
      if (hasContent) {
        setVarietyDetails((prev) => ({ ...prev, [variety]: draft }));
      }
      setNewVariety('');
      setEditingVariety(null);
      return;
    }

    setVarietyDetails((prev) => {
      const next = { ...prev };
      if (hasContent) next[editingVariety] = draft;
      else delete next[editingVariety];
      return next;
    });
    setEditingVariety(null);
  }, [editingVariety, varietyDraft, newVariety, varieties, setVarieties, setVarietyDetails]);

  // ─── Save / delete ────────────────────────────────────────────────────────

  const onSavePress = useCallback(() => {
    const blocked = attemptSave();
    if (!blocked) return;

    const section = FIELD_TO_SECTION[blocked];
    setSectionExpanded((prev) => ({ ...prev, [section]: true }));
    // Offsets are stale until the just-expanded section re-lays-out.
    requestAnimationFrame(() => scrollToKey(SECTION_TO_TAB[section]));
  }, [attemptSave, scrollToKey]);

  const onDeletePress = useCallback(() => {
    const mode = requestDelete();
    if (mode === 'confirm') {
      setShowDeleteConfirm(true);
    } else if (mode === 'reassign') {
      const remaining = categoryPlants.filter((p) => p !== initialName);
      setReassignReplacement(remaining[0] ?? '');
      setShowReassign(true);
    }
  }, [requestDelete, categoryPlants, initialName]);

  const onConfirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    void confirmDelete();
  }, [confirmDelete]);

  const onConfirmReassign = useCallback(() => {
    setShowReassign(false);
    void confirmDelete(reassignReplacement);
  }, [confirmDelete, reassignReplacement]);

  const closeReassign = useCallback(() => setShowReassign(false), []);
  const closeDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);
  const onBackPress = useCallback(() => navigation.goBack(), [navigation]);

  // ─── Derived display ──────────────────────────────────────────────────────

  const heroImage = useMemo(
    () => getPlantImage(lookupName) ?? getPlantImage(initialName),
    [lookupName, initialName]
  );

  const previewSources = useMemo(() => (heroImage ? [heroImage] : []), [heroImage]);

  const displayName =
    name.trim() || (isCreating ? `New ${CATEGORY_LABELS[plantType]}` : initialName);
  const usageSummary = usageCount > 0 ? `${usageCount} in garden` : 'Not in garden yet';

  const summaryLabels = useMemo(
    () => ({
      lifecycleLabel: careForm?.lifecycle ? LIFECYCLE_LABELS[careForm.lifecycle] : undefined,
      waterRequirementLabel: careForm
        ? WATER_REQUIREMENT_LABELS[careForm.waterRequirement]
        : undefined,
      sunlightLabel: careForm ? SUNLIGHT_LABELS[careForm.sunlight] : undefined,
      heatToleranceLabel: careForm?.heatTolerance
        ? TOLERANCE_LABELS[careForm.heatTolerance]
        : undefined,
      droughtToleranceLabel: careForm?.droughtTolerance
        ? TOLERANCE_LABELS[careForm.droughtTolerance]
        : undefined,
      growthStageLabel: careForm ? GROWTH_STAGE_LABELS[careForm.initialGrowthStage] : undefined,
    }),
    [careForm]
  );

  const pruningTipsCount = useMemo(
    () =>
      careForm?.pruningTips
        .split('\n')
        .map((tip) => tip.trim())
        .filter((tip) => tip.length > 0).length ?? 0,
    [careForm?.pruningTips]
  );

  if (loading || !careForm || !editor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const tabBar = <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={scrollToKey} />;

  const saveButton = (
    <TouchableOpacity
      style={[styles.headerSaveButton, saving && styles.headerSaveButtonDisabled]}
      onPress={onSavePress}
      disabled={saving}
      activeOpacity={0.85}
    >
      <Text style={styles.headerSaveText}>Save</Text>
      {isDirty && !saving && <View style={styles.headerSaveDot} />}
    </TouchableOpacity>
  );

  // Tamil name first — it is how the plant is actually spoken about here — then
  // whether it is growing anywhere.
  const heroSubtitle = [careForm.tamilName.trim(), isCreating ? '' : usageSummary]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScrollEvent}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {/* Always rendered — ReferenceHero falls back to an emoji watermark, so
            the catalog plants without bundled art still show something. */}
        <View style={styles.heroBleed}>
          <ReferenceHero
            name={displayName}
            subtitle={heroSubtitle}
            fallbackIcon="general.plant"
            image={heroImage}
            badge={
              isCreating
                ? undefined
                : {
                    label: hasOverride ? 'CUSTOM DEFAULTS' : 'APP DEFAULTS',
                    bg: hasOverride ? theme.primaryLight : theme.backgroundSecondary,
                    color: hasOverride ? theme.primary : theme.textSecondary,
                  }
            }
            topInset={insets.top}
            /* Plain goBack — the hook's beforeRemove listener raises the discard
               prompt when there are unsaved edits. */
            onBack={onBackPress}
            onPressImage={heroImage ? openPreview : undefined}
            headerRight={saveButton}
          />
        </View>

        <View style={styles.inFlowTabBar} onLayout={handleTabBarLayout}>
          {tabBar}
        </View>

        {/* ── Basics ── */}
        <View onLayout={registerSection('basics')}>
          <CollapsibleSection
            title="Plant info"
            icon="information-circle-outline"
            iconTint={theme.primaryLight}
            alwaysShowSummary
            summary={plantInfoSummary(careForm, summaryLabels)}
            expanded={sectionExpanded.plantInfo}
            onExpandedChange={setExpanded('plantInfo')}
            hasError={showErrors && sectionHasError(errors, 'plantInfo')}
          >
            <PlantInfoSection
              editor={editor}
              name={name}
              setName={setName}
              isCreating={isCreating}
              hasOverride={hasOverride}
            />
          </CollapsibleSection>
        </View>

        {/* ── Care ── */}
        <View onLayout={registerSection('care')}>
          <CollapsibleSection
            title="Core care"
            icon="water-outline"
            iconTint={theme.infoLight}
            alwaysShowSummary
            summary={coreCareSummary(careForm, summaryLabels)}
            expanded={sectionExpanded.coreCare}
            onExpandedChange={setExpanded('coreCare')}
            hasError={showErrors && sectionHasError(errors, 'coreCare')}
          >
            <CoreCareSection editor={editor} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Pruning"
            icon="cut-outline"
            iconTint={theme.purpleLight}
            alwaysShowSummary
            summary={pruningSummary(careForm, pruningTipsCount)}
            expanded={sectionExpanded.pruning}
            onExpandedChange={setExpanded('pruning')}
          >
            <PruningSection editor={editor} />
          </CollapsibleSection>
        </View>

        {/* ── Growing ── */}
        <View onLayout={registerSection('growing')}>
          <CollapsibleSection
            title="Growing info"
            icon="stats-chart-outline"
            iconTint={theme.primaryLight}
            alwaysShowSummary
            summary={growingInfoSummary(careForm)}
            expanded={sectionExpanded.growingInfo}
            onExpandedChange={setExpanded('growingInfo')}
            hasError={showErrors && sectionHasError(errors, 'growingInfo')}
          >
            <GrowingInfoSection editor={editor} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Planting"
            icon="leaf-outline"
            iconTint={theme.successLight}
            alwaysShowSummary
            summary={plantingSummary(summaryLabels.growthStageLabel)}
            expanded={sectionExpanded.planting}
            onExpandedChange={setExpanded('planting')}
          >
            <PlantingSection editor={editor} />
          </CollapsibleSection>
        </View>

        {/* ── Health ── */}
        <View onLayout={registerSection('health')}>
          <CollapsibleSection
            title="Tolerances & safety"
            icon="shield-checkmark-outline"
            iconTint={theme.successLight}
            alwaysShowSummary
            summary={toleranceSummary(summaryLabels, baseProfile?.petToxicity)}
            expanded={sectionExpanded.tolerances}
            onExpandedChange={setExpanded('tolerances')}
          >
            <TolerancesSection editor={editor} petToxicity={baseProfile?.petToxicity} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Known pests"
            icon="bug-outline"
            iconTint={theme.accentLight}
            alwaysShowSummary
            summary={pestsSummary(pestChips.length)}
            expanded={sectionExpanded.pests}
            onExpandedChange={setExpanded('pests')}
            headerAction={
              <TouchableOpacity
                style={styles.sectionHeaderAction}
                onPress={openPestPicker}
                accessibilityLabel="Add pest"
              >
                <Ionicons name="add" size={18} color={theme.primary} />
              </TouchableOpacity>
            }
          >
            <CatalogChipList
              chips={pestChips}
              emptyText="No linked pests yet."
              onRemove={onRemovePest}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Known diseases"
            icon="medkit-outline"
            iconTint={theme.errorLight}
            alwaysShowSummary
            summary={diseasesSummary(diseaseChips.length)}
            expanded={sectionExpanded.diseases}
            onExpandedChange={setExpanded('diseases')}
            headerAction={
              <TouchableOpacity
                style={styles.sectionHeaderAction}
                onPress={openDiseasePicker}
                accessibilityLabel="Add disease"
              >
                <Ionicons name="add" size={18} color={theme.primary} />
              </TouchableOpacity>
            }
          >
            <CatalogChipList
              chips={diseaseChips}
              emptyText="No linked diseases yet."
              onRemove={onRemoveDisease}
            />
          </CollapsibleSection>
        </View>

        {/* ── Varieties ── */}
        <View onLayout={registerSection('varieties')}>
          <CollapsibleSection
            title="Varieties"
            icon="albums-outline"
            iconTint={theme.accentLight}
            alwaysShowSummary
            summary={varietiesSummary(varieties.length)}
            expanded={sectionExpanded.varieties}
            onExpandedChange={setExpanded('varieties')}
            headerAction={
              <TouchableOpacity
                style={styles.sectionHeaderAction}
                onPress={onAddVariety}
                accessibilityLabel="Add variety"
              >
                <Ionicons name="add" size={18} color={theme.primary} />
              </TouchableOpacity>
            }
          >
            <CatalogChipList
              chips={varietyChips}
              emptyText="No varieties yet."
              onChipPress={onEditVariety}
              onRemove={onRemoveVariety}
            />
          </CollapsibleSection>

          {!isCreating && (
            <CatalogDangerFooter
              showReset={hasOverride}
              onReset={resetCare}
              onDelete={onDeletePress}
              usageCount={usageCount}
              disabled={saving}
            />
          )}
        </View>
      </Animated.ScrollView>

      {/* Sticky bar — fades in as the hero scrolls away, so back and Save stay
          reachable from every tab. */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.tabBarBackground,
            opacity: stickyBgOpacity,
          },
        ]}
        onLayout={onHeaderLayout}
        pointerEvents={headerStuck ? 'auto' : 'none'}
      >
        <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Animated.Text
          style={[styles.stickyHeaderTitle, { opacity: stickyTitleOpacity }]}
          numberOfLines={1}
        >
          {displayName}
        </Animated.Text>
        {saveButton}
      </Animated.View>

      {/* Pinned tab bar — outside the ScrollView, since Android drops taps on
          translated sticky headers. */}
      {tabsStuck && <View style={[styles.pinnedTabBar, { top: headerHeight }]}>{tabBar}</View>}

      {heroImage && (
        <ImageZoomModal
          visible={previewVisible}
          sources={previewSources}
          onClose={closePreview}
        />
      )}

      {/* ── Sheets & modals ── */}
      {textSheet && (
        <CatalogTextEditSheet
          visible
          onClose={closeTextSheet}
          title={textSheet.title}
          value={textSheet.value}
          onCommit={textSheet.onCommit}
          keyboardType={textSheet.keyboardType}
          sanitize={textSheet.sanitize}
          placeholder={textSheet.placeholder}
          helpText={textSheet.helpText}
          maxLength={textSheet.maxLength}
          autoCapitalize={textSheet.autoCapitalize}
          dictation={textSheet.dictation}
        />
      )}

      {pickerSheet && (
        <OptionPickerSheet
          visible
          onClose={closePickerSheet}
          title={pickerSheet.title}
          options={pickerSheet.options}
          selectedValue={pickerSheet.selectedValue}
          onSelect={pickerSheet.onSelect}
          searchable={pickerSheet.searchable}
          allowClear={pickerSheet.allowClear}
        />
      )}

      {rangeSheet && (
        <CatalogRangeEditSheet
          visible
          onClose={closeRangeSheet}
          title={rangeSheet.title}
          min={rangeSheet.min}
          max={rangeSheet.max}
          minLabel={rangeSheet.minLabel}
          maxLabel={rangeSheet.maxLabel}
          decimal={rangeSheet.decimal}
          helpText={rangeSheet.helpText}
          onCommit={rangeSheet.onCommit}
        />
      )}

      <PestDiseasePickerModal
        visible={showPestPicker}
        onClose={closePestPicker}
          title="Add Pest"
          kind="pest"
        searchPlaceholder="Search pests..."
        allEntries={getAllPests()}
        takenNames={takenPestNames}
        onSelect={onAddPest}
      />

      <PestDiseasePickerModal
        visible={showDiseasePicker}
        onClose={closeDiseasePicker}
          title="Link Disease"
          kind="disease"
        searchPlaceholder="Search diseases..."
        allEntries={getAllDiseases()}
        takenNames={takenDiseaseNames}
        onSelect={onAddDisease}
      />

      <VarietyDetailModal
        editingVariety={editingVariety}
        newVariety={newVariety}
        onNewVarietyChange={setNewVariety}
        draft={varietyDraft}
        onDraftChange={setVarietyDraft}
        onClose={closeVarietyModal}
        onSave={onSaveVariety}
      />

      <ConfirmDeleteModal
        visible={showDeleteConfirm}
        title="Delete plant?"
        message={`Remove "${initialName}" from the catalog? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={closeDeleteConfirm}
        onConfirm={onConfirmDelete}
      />

      <ReassignPlantsModal
        visible={showReassign}
        onClose={closeReassign}
        plantName={initialName}
        usageCount={usageCount}
        options={categoryPlants.filter((p) => p !== initialName)}
        selected={reassignReplacement}
        onSelect={setReassignReplacement}
        onConfirm={onConfirmReassign}
      />

      <AlertDialog
        visible={showDiscardDialog}
        title="Discard changes?"
        message="Your edits to this catalog entry have not been saved."
        icon="warning-outline"
        tone="warning"
        actions={[
          { label: 'Keep editing', variant: 'primary', onPress: dismissDiscard },
          { label: 'Discard', variant: 'ghost', onPress: discardChanges },
        ]}
        onDismiss={dismissDiscard}
      />

      {/* Saving overlay */}
      <Modal
        visible={saving}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      </Modal>
    </View>
  );
}
