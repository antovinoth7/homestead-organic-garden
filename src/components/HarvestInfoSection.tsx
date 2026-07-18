import React from 'react';
import type { Theme } from '@/theme/colors';
import type { Plant } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';
import { formatDateDisplay } from '@/utils/dateHelpers';
import { DetailCard } from '@/components/plantDetail/DetailCard';
import { PlantInfoRow } from '@/components/PlantInfoRow';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
  computedHarvestDate: string | null;
}

/** §8 — Harvest season and expected harvest date. */
export function HarvestInfoSection({
  styles,
  theme,
  plant,
  computedHarvestDate,
}: Props): React.JSX.Element | null {
  if (!plant.harvest_season && !plant.expected_harvest_date && !computedHarvestDate) {
    return null;
  }

  return (
    <DetailCard title="Harvest" icon="nutrition-outline">
      {plant.harvest_season && (
        <PlantInfoRow
          styles={styles}
          icon="sunny"
          iconColor={theme.textSecondary}
          text={`Season: ${plant.harvest_season}`}
        />
      )}
      {(plant.expected_harvest_date || computedHarvestDate) && (
        <PlantInfoRow
          styles={styles}
          icon="hourglass"
          iconColor={theme.textSecondary}
          text={`Expected: ${formatDateDisplay(
            plant.expected_harvest_date || computedHarvestDate!
          )}`}
        />
      )}
    </DetailCard>
  );
}
