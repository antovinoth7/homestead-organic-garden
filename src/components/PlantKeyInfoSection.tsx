import React from 'react';
import { View, Text } from 'react-native';
import type { Theme } from '@/theme/colors';
import type { Plant } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';
import { getYearsOld, formatDateDisplay } from '@/utils/dateHelpers';
import { PlantInfoRow } from '@/components/PlantInfoRow';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
}

/** §1 — Name, variety, row badge, and the key-info rows. */
export function PlantKeyInfoSection({ styles, theme, plant }: Props): React.JSX.Element {
  return (
    <>
      <Text style={styles.name}>{plant.name}</Text>
      {plant.variety && <Text style={styles.variety}>{plant.variety}</Text>}
      {plant.record_kind === 'row' && plant.plant_count !== undefined && (
        <View style={styles.rowRecordBadge}>
          <Text style={styles.rowRecordBadgeText}>
            Row of {plant.plant_count} {plant.plant_count === 1 ? 'plant' : 'plants'}
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        {plant.plant_variety && (
          <PlantInfoRow
            styles={styles}
            icon="leaf"
            iconColor={theme.textSecondary}
            text={`Type: ${plant.plant_variety}`}
          />
        )}
        <PlantInfoRow
          styles={styles}
          icon="location"
          iconColor={theme.textSecondary}
          text={plant.location}
        />
        {plant.landmarks && (
          <PlantInfoRow
            styles={styles}
            icon="flag"
            iconColor={theme.textSecondary}
            text={`Landmark: ${plant.landmarks}`}
          />
        )}
        <PlantInfoRow
          styles={styles}
          icon={
            plant.space_type === 'pot' ? 'cube-outline' : plant.space_type === 'bed' ? 'apps' : 'earth'
          }
          iconColor={theme.textSecondary}
          text={
            plant.space_type === 'pot'
              ? plant.pot_size || 'Pot'
              : plant.space_type === 'bed'
              ? plant.bed_name || 'Bed'
              : 'Ground'
          }
        />
        {plant.planting_date && (
          <PlantInfoRow
            styles={styles}
            icon="calendar"
            iconColor={theme.textSecondary}
            text={`Planted: ${formatDateDisplay(plant.planting_date)} (${
              getYearsOld(plant.planting_date) ?? 0
            } years old)`}
          />
        )}
        {plant.health_status && (
          <PlantInfoRow
            styles={styles}
            icon={
              plant.health_status === 'healthy'
                ? 'checkmark-circle'
                : plant.health_status === 'sick'
                ? 'close-circle'
                : 'alert-circle'
            }
            iconColor={
              plant.health_status === 'healthy'
                ? theme.success
                : plant.health_status === 'sick'
                ? theme.error
                : theme.warning
            }
            textStyle={
              plant.health_status === 'healthy'
                ? styles.healthStatusHealthy
                : plant.health_status === 'sick'
                ? styles.healthStatusSick
                : styles.healthStatusWarning
            }
            text={plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
          />
        )}
        {plant.lifecycle_type && (
          <PlantInfoRow
            styles={styles}
            icon="time-outline"
            iconColor={theme.textSecondary}
            text={`Lifecycle: ${
              plant.lifecycle_type === 'annual'
                ? 'Annual (dies after yield)'
                : plant.lifecycle_type === 'biennial'
                ? 'Biennial (cleared after 2nd year)'
                : plant.lifecycle_type === 'perennial'
                ? 'Perennial (multi-year)'
                : 'Permanent (never cleared)'
            }`}
          />
        )}
        {plant.cleared_date && (
          <PlantInfoRow
            styles={styles}
            icon="checkmark-done-circle"
            iconColor={theme.success}
            textStyle={{ color: theme.success }}
            text={`Bed cleared: ${plant.cleared_date}`}
          />
        )}
      </View>
    </>
  );
}
