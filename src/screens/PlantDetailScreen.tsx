import React, { useCallback, useMemo, useState } from 'react';
import type { ImageStyle } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { pinGrowthStage, unpinGrowthStage, archivePlant } from '@/services/plants';
import { JournalEntryType } from '@/types/database.types';
import type { GrowthStage } from '@/types/database.types';
import { useTheme } from '@/theme';
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
import PestDiseaseHistorySection from '@/components/PestDiseaseHistorySection';
import HarvestHistorySection from '@/components/HarvestHistorySection';
import { DetailQuickInfoSection } from '@/components/DetailQuickInfoSection';
import { BedContextSection } from '@/components/BedContextSection';
import { DetailCareGuidanceSection } from '@/components/DetailCareGuidanceSection';
import { PlantKeyInfoSection } from '@/components/PlantKeyInfoSection';
import { GrowthStageSection } from '@/components/GrowthStageSection';
import { ClearBedCta } from '@/components/ClearBedCta';
import { CareScheduleSection } from '@/components/CareScheduleSection';
import { CompanionPlantingSection } from '@/components/CompanionPlantingSection';
import { HarvestInfoSection } from '@/components/HarvestInfoSection';
import { CoconutSection } from '@/components/CoconutSection';
import { PlantNotesSection } from '@/components/PlantNotesSection';
import { PlantTasksSection } from '@/components/PlantTasksSection';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { PinGrowthStageModal } from '@/components/PinGrowthStageModal';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import {
  PlantDetailScreenNavigationProp,
  PlantDetailScreenRouteProp,
} from '@/types/navigation.types';

export default function PlantDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<PlantDetailScreenNavigationProp>();
  const route = useRoute<PlantDetailScreenRouteProp>();
  const { plantId } = route.params ?? {};
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const { plant, tasks, harvestEntries, loading, reload } = usePlantDetail(plantId);
  const [isArchiving, setIsArchiving] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [pinStageVisible, setPinStageVisible] = useState(false);

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
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
      >
        <View style={[styles.header, { top: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PlantForm', { plantId })}
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

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
            insets={insets}
            styles={styles}
            onClose={() => setZoomVisible(false)}
          />
        )}

        <View style={styles.content}>
          <PlantKeyInfoSection styles={styles} theme={theme} plant={plant} />

          <GrowthStageSection
            styles={styles}
            theme={theme}
            plant={plant}
            effectiveStage={effectiveStage}
            careProfile={careProfile}
            isPinned={isPinned}
            onPin={() => setPinStageVisible(true)}
            onUnpin={handleUnpin}
          />

          <ClearBedCta
            styles={styles}
            theme={theme}
            plant={plant}
            effectiveStage={effectiveStage}
            isArchiving={isArchiving}
            onClearBed={handleClearBed}
          />

          <CareScheduleSection styles={styles} theme={theme} plant={plant} />

          {plant.plant_type !== 'coconut_tree' && (
            <TouchableOpacity
              style={styles.beejamruthaCta}
              onPress={openBeejamruthaRecipe}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf-outline" size={20} color={theme.primary} />
              <Text style={styles.beejamruthaCtaText}>
                Treat seeds with Beejamrutha before sowing
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          <BedContextSection plant={plant} />

          <DetailQuickInfoSection
            theme={theme}
            plantType={plant.plant_type}
            plantVariety={plant.plant_variety || ''}
            plantCareProfiles={{}}
          />

          <DetailCareGuidanceSection
            theme={theme}
            plantType={plant.plant_type}
            plantVariety={plant.plant_variety || ''}
            plantCareProfiles={{}}
          />

          <PestDiseaseHistorySection
            records={plant.pest_disease_history || []}
            seasonalAlerts={[]}
            styles={styles}
          />

          <CompanionPlantingSection
            styles={styles}
            companions={companions}
            incompatible={incompatible}
          />

          <HarvestInfoSection
            styles={styles}
            theme={theme}
            plant={plant}
            computedHarvestDate={computedHarvestDate}
          />

          <HarvestHistorySection
            plantType={plant.plant_type}
            harvestEntries={harvestEntries}
            styles={styles}
            onRecordHarvest={openHarvestForm}
            onViewAll={() => navigation.navigate('Journal')}
          />

          <CoconutSection
            styles={styles}
            theme={theme}
            plant={plant}
            coconutAge={coconutAge}
            coconutDeficiencies={coconutDeficiencies}
          />

          <PlantNotesSection styles={styles} plant={plant} />

          <PlantTasksSection styles={styles} tasks={tasks} />
        </View>
      </ScrollView>

      <PinGrowthStageModal
        visible={pinStageVisible}
        styles={styles}
        theme={theme}
        onClose={() => setPinStageVisible(false)}
        onSelect={handlePinSelect}
      />
    </>
  );
}
