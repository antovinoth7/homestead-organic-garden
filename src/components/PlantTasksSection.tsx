import React from 'react';
import { View, Text } from 'react-native';
import type { TaskTemplate } from '@/types/database.types';
import type { createStyles } from '@/styles/plantDetailStyles';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  tasks: TaskTemplate[];
}

/** §11 — Recurring task templates for this plant. */
export function PlantTasksSection({ styles, tasks }: Props): React.JSX.Element {
  return (
    <View style={styles.tasksSection}>
      <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItem}>
          <View style={styles.taskLeft}>
            <Text style={styles.taskType}>
              {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
            </Text>
            <Text style={styles.taskFrequency}>Every {task.frequency_days} days</Text>
          </View>
          <Text style={[styles.taskStatus, !task.enabled && styles.taskDisabled]}>
            {task.enabled ? 'Active' : 'Disabled'}
          </Text>
        </View>
      ))}
    </View>
  );
}
