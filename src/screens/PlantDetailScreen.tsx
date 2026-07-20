import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { pinGrowthStage, unpinGrowthStage, archivePlant } from '@/services/plants';
import { JournalEntryType } from '@/types/database.types';
import type { GrowthStage } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { PlantDetailHero } from '@/components/plantDetail/PlantDetailHero';
import { PlantSectionHeader } from '@/components/plantDetail/PlantSectionHeader';
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  calculateExpectedHarvestDate,
  getCoconutAgeInfo,
  getCoconutNutrientDeficiencies,
  getEffectiveGrowthStage,
  getValidStagesForPlant,
} from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { PinGrowthStageModal } from '@/components/PinGrowthStageModal';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { PlantDetailCareSection } from '@/components/plantDetail/PlantDetailCareSection';
import { PlantDetailGuideSection } from '@/components/plantDetail/PlantDetailGuideSection';
import { PlantDetailInfoSection } from '@/components/plantDetail/PlantDetailInfoSection';
import { PlantPicturesSection } from '@/components/plantDetail/PlantPicturesSection';
import { PlantHistorySection } from '@/components/plantDetail/PlantHistorySection';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { useSectionScrollSpy } from '@/hooks/useSectionScrollSpy';
import {
  PlantDetailScreenNavigationProp,
  PlantDetailScreenRouteProp,
} from '@/types/navigation.types';

type PlantDetailTabKey = 'care' | 'guide' | 'info' | 'pictures' | 'history';

const TAB_KEYS: readonly PlantDetailTabKey[] = ['care', 'guide', 'info', 'pictures', 'history'];

/** Height of the header overlay below the top inset: 4 top gap + 40 button + 6 bottom pad. */
const HEADER_OVERLAY_CLEARANCE = 50;

const TABS: readonly SegmentedTab<PlantDetailTabKey>[] = [
  { key: 'care', label: 'Care', icon: 'water-outline' },
  { key: 'guide', label: 'Guide', icon: 'book-outline' },
  { key: 'info', label: 'Info', icon: 'people-outline' },
  { key: 'pictures', label: 'Pictures', icon: 'images-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
];

export default function PlantDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<PlantDetailScreenNavigationProp>();
  const route = useRoute<PlantDetailScreenRouteProp>();
  const { plantId } = route.params ?? {};
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const { plant, tasks, journalEntries, harvestEntries, loading, reload } = usePlantDetail(plantId);
  const [isArchiving, setIsArchiving] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [pinStageVisible, setPinStageVisible] = useState(false);
  // Task logs are an uncached read — defer loading until the History section is reached.
  const [historyEnabled, setHistoryEnabled] = useState(false);
  // The hero is full-bleed with floating buttons; once the tab bar pins we swap
  // to a solid compact header so back/edit stay reachable over content.
  const [tabsStuck, setTabsStuck] = useState(false);
  const tabBarYRef = useRef(0);

  const {
    activeKey,
    scrollRef,
    registerSection,
    onTabBarLayout,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
  } = useSectionScrollSpy<PlantDetailTabKey>(TAB_KEYS);

  const handleTabBarLayout = useCallback(
    (event: LayoutChangeEvent) => {
      tabBarYRef.current = event.nativeEvent.layout.y;
      onTabBarLayout(event);
    },
    [onTabBarLayout]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Swap to the pinned overlay tab bar as the in-flow one reaches the bottom
      // of the floating header, so the two line up and the handoff is seamless.
      const stuckAt = tabBarYRef.current - (insets.top + HEADER_OVERLAY_CLEARANCE);
      const stuck = event.nativeEvent.contentOffset.y >= stuckAt;
      setTabsStuck((prev) => (prev === stuck ? prev : stuck));
      onScroll(event);
    },
    [onScroll, insets.top]
  );

  useEffect(() => {
    if (activeKey === 'history') setHistoryEnabled(true);
  }, [activeKey]);

  const handleTabPress = useCallback(
    (key: PlantDetailTabKey) => {
      // Enable the lazy task-log read as soon as History is requested, even if
      // the section is too short to scroll fully under the sticky bar.
      if (key === 'history') setHistoryEnabled(true);
      scrollToKey(key);
    },
    [scrollToKey]
  );

  const openHarvestForm = useCallback(() => {
    navigation.navigate('Journal', {
      screen: 'JournalForm',
      params: {
        initialEntryType: JournalEntryType.Harvest,
        initialPlantId: plantId,
      },
    });
  }, [navigation, plantId]);

  const openJournal = useCallback(() => {
    navigation.navigate('Journal');
  }, [navigation]);

  const openPestForm = useCallback(() => {
    navigation.navigate('Journal', {
      screen: 'JournalForm',
      params: {
        initialEntryType: JournalEntryType.PestDisease,
        initialPlantId: plantId,
      },
    });
  }, [navigation, plantId]);

  const openNoteForm = useCallback(() => {
    navigation.navigate('Journal', {
      screen: 'JournalForm',
      params: {
        initialEntryType: JournalEntryType.Observation,
        initialPlantId: plantId,
      },
    });
  }, [navigation, plantId]);

  const openCreateTask = useCallback(() => {
    navigation.navigate('Care Plan', { openCreateTask: true, prefillPlantId: plantId });
  }, [navigation, plantId]);

  if (!plantId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Plant not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Plant not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const companions = getCompanionSuggestions(plant.plant_variety || plant.name);
  const incompatible = getIncompatiblePlants(plant.plant_variety || plant.name);
  const computedHarvestDate = calculateExpectedHarvestDate(
    plant.plant_variety || plant.name,
    plant.planting_date,
    plant.plant_type
  );
  const coconutAge =
    plant.plant_type === 'coconut_tree' ? getCoconutAgeInfo(plant.planting_date) : null;
  const coconutDeficiencies =
    plant.plant_type === 'coconut_tree' ? getCoconutNutrientDeficiencies() : [];
  const careProfile = getPlantCareProfile(plant.plant_variety || '', plant.plant_type);
  const effectiveStage = careProfile ? getEffectiveGrowthStage(plant, careProfile) : null;
  const isPinned = Boolean(plant.growth_stage_pinned);
  const pinnableStages = getValidStagesForPlant(plant, careProfile);

  const handleUnpin = async (): Promise<void> => {
    await unpinGrowthStage(plant.id);
    void reload();
  };

  const handlePinSelect = async (stage: GrowthStage): Promise<void> => {
    setPinStageVisible(false);
    await pinGrowthStage(plant.id, stage);
    void reload();
  };

  const handleClearBed = (): void => {
    Alert.alert(
      'Clear Bed',
      'Mark this plant as harvested and clear the bed slot? The plant record will be preserved for crop rotation history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Bed',
          style: 'destructive',
          onPress: async () => {
            setIsArchiving(true);
            try {
              await archivePlant(plant.id);
              await reload({ silent: true });
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to clear bed');
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {plant.photo_url && (
        <ImageZoomModal
          visible={zoomVisible}
          uris={[plant.photo_url]}
          onClose={() => setZoomVisible(false)}
        />
      )}

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
      >
        <PlantDetailHero plant={plant} onPhotoPress={() => setZoomVisible(true)} />

        {/* In-flow tab bar for the un-stuck state (sits below the hero). Once it
            scrolls under the header, the pinned copy in the overlay takes over —
            both are outside any translated sticky header, so taps never drop. */}
        <View onLayout={handleTabBarLayout}>
          <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={handleTabPress} />
        </View>

        <View onLayout={registerSection('care')}>
          <PlantSectionHeader title="Care" icon="water-outline" />
          <PlantDetailCareSection
            plant={plant}
            tasks={tasks}
            harvestEntries={harvestEntries}
            effectiveStage={effectiveStage}
            careProfile={careProfile}
            isPinned={isPinned}
            isArchiving={isArchiving}
            computedHarvestDate={computedHarvestDate}
            coconutAge={coconutAge}
            coconutDeficiencies={coconutDeficiencies}
            onPin={() => setPinStageVisible(true)}
            onUnpin={handleUnpin}
            onClearBed={handleClearBed}
            onRecordHarvest={openHarvestForm}
            onViewAllHarvests={openJournal}
            onLogPest={openPestForm}
            onAddNote={openNoteForm}
            onAddCareTask={openCreateTask}
          />
        </View>

        <View onLayout={registerSection('guide')}>
          <PlantSectionHeader title="Guide" icon="book-outline" />
          <PlantDetailGuideSection
            plantType={plant.plant_type}
            plantVariety={plant.plant_variety || ''}
          />
        </View>

        <View onLayout={registerSection('info')}>
          <PlantSectionHeader title="Info" icon="people-outline" />
          <PlantDetailInfoSection
            plantVariety={plant.plant_variety || ''}
            companions={companions}
            incompatible={incompatible}
            petToxic={careProfile?.petToxicity ?? false}
          />
        </View>

        <View onLayout={registerSection('pictures')}>
          <PlantSectionHeader title="Pictures" icon="images-outline" />
          <PlantPicturesSection plant={plant} journalEntries={journalEntries} />
        </View>

        <View onLayout={registerSection('history')}>
          <PlantSectionHeader title="History" icon="time-outline" />
          <PlantHistorySection
            plant={plant}
            journalEntries={journalEntries}
            enabled={historyEnabled}
          />
        </View>

        {/* Lets the last section scroll under the pinned bar so every tab tap
            produces visible movement. */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Always-mounted header overlay: transparent floating buttons over the
          full-bleed hero, gaining a solid background, title and the pinned tab
          bar once the in-flow tabs scroll away. Living outside the ScrollView
          keeps the buttons and tabs tappable in both states (Android drops
          touches on interactive children of a translated sticky header). */}
      <View
        style={[
          styles.headerOverlay,
          { paddingTop: insets.top + 4 },
          tabsStuck && styles.headerOverlayStuck,
        ]}
        pointerEvents={tabsStuck ? 'auto' : 'box-none'}
      >
        <View style={styles.headerOverlayRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.floatingCircleButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
          {tabsStuck ? (
            <Text style={styles.stuckHeaderTitle} numberOfLines={1}>
              {plant.name}
            </Text>
          ) : (
            <View style={styles.headerOverlaySpacer} pointerEvents="none" />
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('PlantForm', { plantId })}
            style={styles.floatingCircleButton}
            accessibilityRole="button"
            accessibilityLabel="Edit plant"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={20} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
        {tabsStuck && (
          <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={handleTabPress} />
        )}
      </View>

      <PinGrowthStageModal
        visible={pinStageVisible}
        styles={styles}
        theme={theme}
        stages={pinnableStages}
        onClose={() => setPinStageVisible(false)}
        onSelect={handlePinSelect}
      />
    </View>
  );
}
