import React from 'react';
import { View } from 'react-native';
import type { Plant, JournalEntry } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
}

/** Photo timeline for a plant — implemented in a following commit. */
export function PlantPicturesTab(_props: Props): React.JSX.Element {
  return <View />;
}
