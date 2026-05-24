import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Plant, Bed } from '@/types/database.types';
import { getBed } from '@/services/beds';
import { getPlantsByBed } from '@/services/plants';
import { createEnrichedSectionStyles as createStyles } from '@/styles/enrichedSectionStyles';

interface Props {
  plant: Plant;
}

export function BedContextSection({ plant }: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation =
    useNavigation<import('@/types/navigation.types').BedListScreenNavigationProp>();
  const [bed, setBed] = useState<Bed | null>(null);
  const [bedMates, setBedMates] = useState<Plant[]>([]);

  useEffect(() => {
    if (!plant.bed_id) return;
    let cancelled = false;
    Promise.all([getBed(plant.bed_id), getPlantsByBed(plant.bed_id)]).then(([b, mates]) => {
      if (!cancelled) {
        setBed(b);
        setBedMates(mates.filter((m) => m.id !== plant.id).slice(0, 3));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [plant.bed_id, plant.id]);

  if (!plant.bed_id || !bed) return null;

  return (
    <View style={styles.bedSection}>
      <Text style={styles.bedSectionTitle}>Bed Context</Text>
      <TouchableOpacity
        style={styles.bedLink}
        onPress={() =>
          navigation.navigate('Beds', { screen: 'BedDetail', params: { bedId: bed.id } })
        }
      >
        <Ionicons name="grid-outline" size={16} color={theme.primary} />
        <Text style={styles.bedLinkText}>{bed.name}</Text>
        <Text style={styles.bedDims}>
          {bed.dimensions.width_m}m × {bed.dimensions.length_m}m
        </Text>
      </TouchableOpacity>

      {plant.bed_layer && (
        <View style={styles.bedInfoRow}>
          <Text style={styles.bedInfoLabel}>Layer</Text>
          <Text style={styles.bedInfoValue}>{plant.bed_layer.replace(/_/g, ' ')}</Text>
        </View>
      )}

      {bedMates.length > 0 && (
        <View style={styles.bedInfoRow}>
          <Text style={styles.bedInfoLabel}>Bed-mates</Text>
          <Text style={styles.bedInfoValue}>{bedMates.map((m) => m.name).join(', ')}</Text>
        </View>
      )}
    </View>
  );
}
