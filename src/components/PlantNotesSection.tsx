import React from 'react';
import { View, Text } from 'react-native';
import type { Plant } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';

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
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{plant.notes}</Text>
        </View>
      )}
      {plant.pruning_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Pruning Notes</Text>
          <Text style={styles.notesText}>{plant.pruning_notes}</Text>
        </View>
      )}
    </>
  );
}
