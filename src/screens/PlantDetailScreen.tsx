import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { pinGrowthStage, unpinGrowthStage, archivePlant } from '@/services/plants';
import { JournalEntryType } from '@/types/database.types';
import type { GrowthStage } from '@/types/database.types';
import { useTheme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { createStyles } from '@/styles/plantDetailStyles';
import { PlantDetailHero } from '@/components/plantDetail/PlantDetailHero';
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  calculateExpectedHarvestDate,
  getCoconutAgeInfo,
  getCoconutNutrientDeficiencies,
  getEffectiveGrowthStage,
} from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { PinGrowthStageModal } from '@/components/PinGrowthStageModal';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { PlantDetailCareSection } from '@/components/plantDetail/PlantDetailCareSection';
import { PlantDetailInfoSection } from '@/components/plantDetail/PlantDetailInfoSection';
import { PlantPicturesSection } from '@/components/plantDetail/PlantPicturesSection';
import { PlantHistorySection } from '@/components/plantDetail/PlantHistorySection';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { useSectionScrollSpy } from '@/hooks/useSectionScrollSpy';
import {
  PlantDetailScreenNavigationProp,
  PlantDetailScreenRouteProp,
} from '@/types/navigation.types';

type PlantDetailTabKey = 'care' | 'info' | 'pictures' | 'history';

const TAB_KEYS: readonly PlantDetailTabKey[] = ['care', 'info', 'pictures', 'history'];

const TABS: readonly SegmentedTab<PlantDetailTabKey>[] = [
  { key: 'care', label: 'Care', icon: 'water-outline' },
  { key: 'info', label: 'Info', icon: 'book-outline' },
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

  const {
    activeKey,
    scrollRef,
    registerSection,
    onTabBarLayout,
    onScrollViewLayout,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
    lastSectionMinHeight,
  } = useSectionScrollSpy<PlantDetailTabKey>(TAB_KEYS);

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

  const openBeejamruthaRecipe = useCallback(() => {
    navigation.navigate('More', {
      screen: 'InputRecipes',
      params: { initialTab: 'beejamrutha' },
    });
  }, [navigation]);

  const openJournal = useCallback(() => {
    navigation.navigate('Journal');
  }, [navigation]);

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
      <ScreenHeader
        title={plant.name}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('PlantForm', { plantId })}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Edit plant"
          >
            <Ionicons name="pencil" size={22} color={theme.primary} />
          </TouchableOpacity>
        }
      />

      {plant.photo_url && (
        <ImageZoomModal
          visible={zoomVisible}
          uri={plant.photo_url}
          onClose={() => setZoomVisible(false)}
        />
      )}

      <ScrollView
        ref={scrollRef}
        onLayout={onScrollViewLayout}
        stickyHeaderIndices={[1]}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
      >
        <PlantDetailHero plant={plant} onPhotoPress={() => setZoomVisible(true)} />

        <View onLayout={onTabBarLayout}>
          <SegmentedTabs tabs={TABS} activeKey={activeKey} onChange={handleTabPress} />
        </View>

        <View onLayout={registerSection('care')}>
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
            onOpenBeejamrutha={openBeejamruthaRecipe}
          />
        </View>

        <View onLayout={registerSection('info')}>
          <PlantDetailInfoSection
            plantType={plant.plant_type}
            plantVariety={plant.plant_variety || ''}
            companions={companions}
            incompatible={incompatible}
          />
        </View>

        <View onLayout={registerSection('pictures')}>
          <PlantPicturesSection plant={plant} journalEntries={journalEntries} />
        </View>

        <View
          onLayout={registerSection('history')}
          style={{ minHeight: lastSectionMinHeight }}
        >
          <PlantHistorySection
            plant={plant}
            journalEntries={journalEntries}
            enabled={historyEnabled}
          />
        </View>
      </ScrollView>

      <PinGrowthStageModal
        visible={pinStageVisible}
        styles={styles}
        theme={theme}
        onClose={() => setPinStageVisible(false)}
        onSelect={handlePinSelect}
      />
    </View>
  );
}
