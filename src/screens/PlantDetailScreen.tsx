import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { pinGrowthStage, unpinGrowthStage, archivePlant } from '@/services/plants';
import { JournalEntryType } from '@/types/database.types';
import type { GrowthStage } from '@/types/database.types';
import { useTheme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { createStyles } from '@/styles/plantDetailStyles';
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  calculateExpectedHarvestDate,
  getCoconutAgeInfo,
  getCoconutNutrientDeficiencies,
  getEffectiveGrowthStage,
} from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { PlantKeyInfoSection } from '@/components/PlantKeyInfoSection';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { PinGrowthStageModal } from '@/components/PinGrowthStageModal';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import type { SegmentedTab } from '@/components/SegmentedTabs';
import { PlantDetailCareTab } from '@/components/plantDetail/PlantDetailCareTab';
import { PlantDetailInfoTab } from '@/components/plantDetail/PlantDetailInfoTab';
import { PlantPicturesTab } from '@/components/plantDetail/PlantPicturesTab';
import { PlantHistoryTab } from '@/components/plantDetail/PlantHistoryTab';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import {
  PlantDetailScreenNavigationProp,
  PlantDetailScreenRouteProp,
} from '@/types/navigation.types';

type PlantDetailTabKey = 'care' | 'info' | 'pictures' | 'history';

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

  const { plant, tasks, journalEntries, harvestEntries, loading, reload } = usePlantDetail(plantId);
  const [isArchiving, setIsArchiving] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [pinStageVisible, setPinStageVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<PlantDetailTabKey>('care');
  // Task logs are an uncached read — defer loading until History is first opened.
  const [historyEnabled, setHistoryEnabled] = useState(false);

  const handleTabChange = useCallback((key: PlantDetailTabKey) => {
    setActiveTab(key);
    if (key === 'history') setHistoryEnabled(true);
  }, []);

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

      {plant.photo_url ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomVisible(true)}>
          <Image
            source={{ uri: plant.photo_url }}
            style={styles.photo as ImageStyle}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf" size={64} color={theme.primary} />
        </View>
      )}

      {plant.photo_url && (
        <ImageZoomModal
          visible={zoomVisible}
          uri={plant.photo_url}
          onClose={() => setZoomVisible(false)}
        />
      )}

      <View style={styles.keyInfoWrapper}>
        <PlantKeyInfoSection styles={styles} theme={theme} plant={plant} />
      </View>

      <SegmentedTabs tabs={TABS} activeKey={activeTab} onChange={handleTabChange} />

      <View style={styles.tabContent}>
        {activeTab === 'care' && (
          <PlantDetailCareTab
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
        )}
        {activeTab === 'info' && (
          <PlantDetailInfoTab
            plantType={plant.plant_type}
            plantVariety={plant.plant_variety || ''}
            companions={companions}
            incompatible={incompatible}
          />
        )}
        {activeTab === 'pictures' && (
          <PlantPicturesTab plant={plant} journalEntries={journalEntries} />
        )}
        {activeTab === 'history' && (
          <PlantHistoryTab
            plant={plant}
            journalEntries={journalEntries}
            enabled={historyEnabled}
          />
        )}
      </View>

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
