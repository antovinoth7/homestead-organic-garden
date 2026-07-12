import React from 'react';
import { Text } from 'react-native';
import type { Plant } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';
import { DetailCard } from '@/components/plantDetail/DetailCard';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  plant: Plant;
}

/** §10 — Free-text notes and pruning notes. */
export function PlantNotesSection({ styles, plant }: Props): React.JSX.Element | null {
  if (!plant.notes && !plant.pruning_notes) return null;

  return (
    <>
      {plant.notes && (
        <DetailCard title="Notes" icon="document-text-outline">
          <Text style={styles.notesText}>{plant.notes}</Text>
        </DetailCard>
      )}
      {plant.pruning_notes && (
        <DetailCard title="Pruning Notes" icon="cut-outline">
          <Text style={styles.notesText}>{plant.pruning_notes}</Text>
        </DetailCard>
      )}
    </>
  );
}
