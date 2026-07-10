import React from 'react';
import { View } from 'react-native';
import type { Plant, JournalEntry } from '@/types/database.types';

interface Props {
  plant: Plant;
  journalEntries: JournalEntry[];
  enabled: boolean;
}

/** Merged, filterable plant history — implemented in a following commit. */
export function PlantHistoryTab(_props: Props): React.JSX.Element {
  return <View />;
}
