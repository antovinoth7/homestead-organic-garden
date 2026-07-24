import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/plantDetailStyles';
import { GrowthStageSection } from '@/components/GrowthStageSection';
import { ClearBedCta } from '@/components/ClearBedCta';
import { CareScheduleSection } from '@/components/CareScheduleSection';
import { BedContextSection } from '@/components/BedContextSection';
import { HarvestInfoSection } from '@/components/HarvestInfoSection';
import { PlantNotesSection } from '@/components/PlantNotesSection';
import { PlantQuickActions } from '@/components/plantDetail/PlantQuickActions';
import type { Plant, TaskTemplate, PlantCareProfile } from '@/types/database.types';
import type { EffectiveGrowthStage } from '@/utils/plantHelpers';

interface Props {
  plant: Plant;
  tasks: TaskTemplate[];
  effectiveStage: EffectiveGrowthStage | null;
  careProfile: PlantCareProfile | null;
  isPinned: boolean;
  isArchiving: boolean;
  computedHarvestDate: string | null;
  onPin: () => void;
  onUnpin: () => void;
  onClearBed: () => void;
  onRecordHarvest: () => void;
  onLogPest: () => void;
  onAddNote: () => void;
  onAddCareTask: () => void;
}

/** Instance-specific care content for a planted specimen. */
export function PlantDetailCareSection({
  plant,
  tasks,
  effectiveStage,
  careProfile,
  isPinned,
  isArchiving,
  computedHarvestDate,
  onPin,
  onUnpin,
  onClearBed,
  onRecordHarvest,
  onLogPest,
  onAddNote,
  onAddCareTask,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.content}>
      <PlantQuickActions
        onLogHarvest={onRecordHarvest}
        onLogPest={onLogPest}
        onAddNote={onAddNote}
        onAddCareTask={onAddCareTask}
      />

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

      <CareScheduleSection styles={styles} theme={theme} plant={plant} tasks={tasks} />

      <BedContextSection plant={plant} />

      <HarvestInfoSection
        styles={styles}
        theme={theme}
        plant={plant}
        computedHarvestDate={computedHarvestDate}
      />

      <PlantNotesSection styles={styles} plant={plant} />
    </View>
  );
}
