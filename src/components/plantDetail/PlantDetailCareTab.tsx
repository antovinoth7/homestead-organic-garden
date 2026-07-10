import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { GrowthStageSection } from '@/components/GrowthStageSection';
import { ClearBedCta } from '@/components/ClearBedCta';
import { CareScheduleSection } from '@/components/CareScheduleSection';
import { BedContextSection } from '@/components/BedContextSection';
import { HarvestInfoSection } from '@/components/HarvestInfoSection';
import HarvestHistorySection from '@/components/HarvestHistorySection';
import { CoconutSection } from '@/components/CoconutSection';
import { PlantNotesSection } from '@/components/PlantNotesSection';
import { PlantTasksSection } from '@/components/PlantTasksSection';
import type { Plant, TaskTemplate, JournalEntry, PlantCareProfile } from '@/types/database.types';
import type {
  EffectiveGrowthStage,
  CoconutAgeInfo,
  CoconutNutrientDeficiency,
} from '@/utils/plantHelpers';

interface Props {
  header: React.ReactNode;
  plant: Plant;
  tasks: TaskTemplate[];
  harvestEntries: JournalEntry[];
  effectiveStage: EffectiveGrowthStage | null;
  careProfile: PlantCareProfile | null;
  isPinned: boolean;
  isArchiving: boolean;
  computedHarvestDate: string | null;
  coconutAge: CoconutAgeInfo | null;
  coconutDeficiencies: CoconutNutrientDeficiency[];
  onPin: () => void;
  onUnpin: () => void;
  onClearBed: () => void;
  onRecordHarvest: () => void;
  onViewAllHarvests: () => void;
  onOpenBeejamrutha: () => void;
}

/** Instance-specific care content for a planted specimen. */
export function PlantDetailCareTab({
  header,
  plant,
  tasks,
  harvestEntries,
  effectiveStage,
  careProfile,
  isPinned,
  isArchiving,
  computedHarvestDate,
  coconutAge,
  coconutDeficiencies,
  onPin,
  onUnpin,
  onClearBed,
  onRecordHarvest,
  onViewAllHarvests,
  onOpenBeejamrutha,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
    >
      {header}
      <View style={styles.content}>
        <GrowthStageSection
          styles={styles}
          theme={theme}
          plant={plant}
          effectiveStage={effectiveStage}
          careProfile={careProfile}
          isPinned={isPinned}
          onPin={onPin}
          onUnpin={onUnpin}
        />

        <ClearBedCta
          styles={styles}
          theme={theme}
          plant={plant}
          effectiveStage={effectiveStage}
          isArchiving={isArchiving}
          onClearBed={onClearBed}
        />

        <CareScheduleSection styles={styles} theme={theme} plant={plant} />

        {plant.plant_type !== 'coconut_tree' && (
          <TouchableOpacity
            style={styles.beejamruthaCta}
            onPress={onOpenBeejamrutha}
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
          onRecordHarvest={onRecordHarvest}
          onViewAll={onViewAllHarvests}
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
  );
}
