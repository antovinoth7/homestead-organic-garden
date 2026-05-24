import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { TaskTemplate } from '@/types/database.types';
import { syncBedTasks } from '@/services/BedTaskResolver';
import { getBed } from '@/services/beds';
import { getPlantsByBed } from '@/services/plants';
import { getTaskTemplates } from '@/services/tasks';
import { invalidate, CACHE_KEYS } from '@/lib/dataCache';
import { createStyles } from '@/styles/bedTasksStyles';
import { logger } from '@/utils/logger';
import { HarvestWeightInput } from '@/components/HarvestWeightInput';
import type {
  BedTasksScreenNavigationProp,
  BedTasksScreenRouteProp,
} from '@/types/navigation.types';

type TabKey = 'bed' | 'plant';

export default function BedTasksScreen(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<BedTasksScreenNavigationProp>();
  const route = useRoute<BedTasksScreenRouteProp>();
  const { bedId } = route.params;

  const [activeTab, setActiveTab] = useState<TabKey>('bed');
  const [bedTasks, setBedTasks] = useState<TaskTemplate[]>([]);
  const [plantTasks, setPlantTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHarvestInput, setShowHarvestInput] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [bed, plants, _allTemplates] = await Promise.all([
          getBed(bedId),
          getPlantsByBed(bedId),
          getTaskTemplates(),
        ]);

        if (bed && plants.length > 0) {
          await syncBedTasks(bed, plants);
        }

        const updatedTemplates = await getTaskTemplates();
        if (!cancelled) {
          setBedTasks(updatedTemplates.filter((t) => t.bed_id === bedId && t.task_subtype != null));
          const bedPlantIds = new Set(plants.map((p) => p.id));
          setPlantTasks(
            updatedTemplates.filter(
              (t) => t.plant_id && bedPlantIds.has(t.plant_id) && !t.task_subtype
            )
          );
        }
      } catch {
        // non-critical — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [bedId]);

  const renderTask = ({ item }: { item: TaskTemplate }): React.JSX.Element => (
    <View style={styles.taskRow}>
      <Ionicons name="ellipse-outline" size={20} color={theme.textSecondary} />
      <View style={styles.taskInfo}>
        <Text style={styles.taskType}>
          {item.task_subtype?.replace(/_/g, ' ') ?? item.task_type}
        </Text>
        <Text style={styles.taskFreq}>Every {item.frequency_days} days</Text>
      </View>
      {item.task_type === 'harvest' && (
        <TouchableOpacity onPress={() => setShowHarvestInput(true)}>
          <Text style={styles.logWeight}>Log weight</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const activeData = activeTab === 'bed' ? bedTasks : plantTasks;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Bed Tasks</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bed' && styles.tabActive]}
          onPress={() => setActiveTab('bed')}
        >
          <Text style={[styles.tabText, activeTab === 'bed' && styles.tabTextActive]}>
            Bed Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plant' && styles.tabActive]}
          onPress={() => setActiveTab('plant')}
        >
          <Text style={[styles.tabText, activeTab === 'plant' && styles.tabTextActive]}>
            Plant Lifecycle
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : activeData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {activeTab === 'bed'
              ? 'No bed-level tasks yet. Add plants to generate tasks.'
              : 'No plant lifecycle tasks. Tasks appear once plants are assigned.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
        />
      )}

      {showHarvestInput && (
        <HarvestWeightInput
          onConfirm={(kg) => {
            logger.info(`Harvest logged: ${kg} kg for bed ${bedId}`);
            invalidate(CACHE_KEYS.BEDS);
            invalidate(CACHE_KEYS.ALL_PLANTS);
            setShowHarvestInput(false);
          }}
          onDismiss={() => setShowHarvestInput(false)}
        />
      )}
    </View>
  );
}
