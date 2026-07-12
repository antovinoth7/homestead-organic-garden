import React from 'react';
import { View, Text } from 'react-native';
import type { createStyles } from '@/styles/plantDetailStyles';
import { DetailCard } from '@/components/plantDetail/DetailCard';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  companions: string[];
  incompatible: string[];
}

/** §7 — Good companions and plants to avoid, as chip rows. */
export function CompanionPlantingSection({
  styles,
  companions,
  incompatible,
}: Props): React.JSX.Element | null {
  if (companions.length === 0 && incompatible.length === 0) return null;

  return (
    <DetailCard title="Companions" icon="people-outline">
      {companions.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Good Companions</Text>
          <View style={styles.companionRow}>
            {companions.map((c) => (
              <View key={c} style={styles.companionChip}>
                <Text style={styles.companionChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      {incompatible.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Avoid Planting With</Text>
          <View style={styles.companionRow}>
            {incompatible.map((c) => (
              <View key={c} style={styles.incompatibleChip}>
                <Text style={styles.incompatibleChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </DetailCard>
  );
}
