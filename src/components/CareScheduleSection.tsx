import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { Plant } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';
import { formatTimestampDisplay } from '@/utils/dateHelpers';
import { PlantInfoRow } from '@/components/PlantInfoRow';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
}

/** §3 — Last care summary grid and care frequencies. */
export function CareScheduleSection({ styles, theme, plant }: Props): React.JSX.Element {
  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>📋 Care & Schedule</Text>
      {(plant.last_watered_date || plant.last_fertilised_date || plant.last_pruned_date) && (
        <View style={styles.lastCareGrid}>
          {plant.last_watered_date && (
            <View style={styles.lastCareItem}>
              <Ionicons name="water" size={22} color={theme.primary} />
              <Text style={styles.lastCareLabel}>Watered</Text>
              <Text style={styles.lastCareDate}>
                {formatTimestampDisplay(plant.last_watered_date)}
              </Text>
            </View>
          )}
          {plant.last_fertilised_date && (
            <View style={styles.lastCareItem}>
              <Ionicons name="nutrition" size={22} color={theme.accent} />
              <Text style={styles.lastCareLabel}>Fertilised</Text>
              <Text style={styles.lastCareDate}>
                {formatTimestampDisplay(plant.last_fertilised_date)}
              </Text>
            </View>
          )}
          {plant.last_pruned_date && (
            <View style={styles.lastCareItem}>
              <Ionicons name="cut" size={22} color={theme.textSecondary} />
              <Text style={styles.lastCareLabel}>Pruned</Text>
              <Text style={styles.lastCareDate}>
                {formatTimestampDisplay(plant.last_pruned_date)}
              </Text>
            </View>
          )}
        </View>
      )}
      {plant.watering_frequency_days && (
        <PlantInfoRow
          styles={styles}
          icon="water"
          iconColor={theme.primary}
          text={`Water every ${plant.watering_frequency_days} days`}
        />
      )}
      {plant.fertilising_frequency_days && (
        <PlantInfoRow
          styles={styles}
          icon="nutrition"
          iconColor={theme.accent}
          text={`Fertilise every ${plant.fertilising_frequency_days} days`}
        />
      )}
      {plant.preferred_fertiliser && (
        <PlantInfoRow
          styles={styles}
          icon="leaf"
          iconColor={theme.success}
          text={`Fertiliser: ${plant.preferred_fertiliser
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}`}
        />
      )}
      {plant.mulching_used && (
        <PlantInfoRow
          styles={styles}
          icon="checkmark-circle"
          iconColor={theme.success}
          text="Mulching applied"
        />
      )}
      {plant.pruning_frequency_days && (
        <PlantInfoRow
          styles={styles}
          icon="cut"
          iconColor={theme.textSecondary}
          text={`Prune every ${plant.pruning_frequency_days} days`}
        />
      )}
    </View>
  );
}
