import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { Plant, TaskTemplate } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';
import { formatTimestampDisplay } from '@/utils/dateHelpers';
import { isRecurringTaskActive } from '@/utils/recurringTaskStatus';
import { PlantInfoRow } from '@/components/PlantInfoRow';
import { DetailCard } from '@/components/plantDetail/DetailCard';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
  tasks: TaskTemplate[];
}

/**
 * §3 — Combined care summary: last-care grid, care preferences, and the
 * recurring task schedule (Active/Disabled) in one card.
 */
export function CareScheduleSection({ styles, theme, plant, tasks }: Props): React.JSX.Element {
  const hasLastCare =
    plant.last_watered_date || plant.last_fertilised_date || plant.last_pruned_date;

  return (
    <DetailCard title="Care & Schedule" icon="calendar-outline">
      {hasLastCare && (
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

      {tasks.length > 0 && (
        <>
          {(hasLastCare || plant.preferred_fertiliser || plant.mulching_used) && (
            <View style={styles.sectionDivider} />
          )}
          <Text style={styles.careTasksLabel}>Recurring Tasks</Text>
          {tasks.map((task) => {
            const active = isRecurringTaskActive(task, plant);
            return (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskLeft}>
                  <Text style={styles.taskType}>
                    {task.task_type.charAt(0).toUpperCase() +
                      task.task_type.slice(1).replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.taskFrequency}>Every {task.frequency_days} days</Text>
                </View>
                <Text style={[styles.taskStatus, !active && styles.taskDisabled]}>
                  {active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </DetailCard>
  );
}
