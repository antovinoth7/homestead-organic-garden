import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetModal } from '../BottomSheetModal';
import ThemedDropdown from '../ThemedDropdown';
import FloatingLabelInput from '../FloatingLabelInput';
import type { DropdownItem } from '../ThemedDropdown';
import { createTaskTemplate } from '../../services/tasks';
import { Plant, TaskType, Bed } from '../../types/database.types';
import { getErrorMessage } from '../../utils/errorLogging';
import { sanitizeNumberText } from '../../utils/plantFormConstants';
import { createStyles } from '../../styles/calendarStyles';
import { useTheme } from '../../theme';
import {
  addCalendarDays,
  calendarDateKey,
  farmDateTimeFromKey,
  farmToday,
  formatFarmDate,
} from '@/utils/farmDate';

const TASK_TYPE_ITEMS: DropdownItem[] = [
  { label: 'Water', value: 'water' },
  { label: 'Fertilize', value: 'fertilise' },
  { label: 'Prune', value: 'prune' },
  { label: 'Repot', value: 'repot' },
  { label: 'Spray (Pesticide/Neem)', value: 'spray' },
  { label: 'Mulch', value: 'mulch' },
  { label: 'Weeding', value: 'weeding' },
  { label: 'Transplanting', value: 'transplanting' },
  { label: 'Cultivating', value: 'cultivating' },
];

interface CreateTaskModalProps {
  visible: boolean;
  plants: Plant[];
  beds: Bed[];
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  initialStartDate?: Date;
  /** Preselect this plant (or its bed) when the modal opens. */
  initialPlantId?: string;
  /** Preselect the task type when the modal opens. Defaults to `water`. */
  initialTaskType?: TaskType;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTaskModal({
  visible,
  plants,
  beds,
  styles,
  bottomInset,
  initialStartDate,
  initialPlantId,
  initialTaskType,
  onClose,
  onCreated,
}: CreateTaskModalProps): React.JSX.Element {
  const theme = useTheme();
  // Plants assigned to a bed are tasked via the Bed dropdown, so keep the plant
  // dropdown to standalone (pot / unassigned) plants only.
  const standalonePlants = useMemo(() => plants.filter((p) => !p.bed_id), [plants]);
  const [taskType, setTaskType] = useState<TaskType>('water');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [isOneTimeTask, setIsOneTimeTask] = useState(false);
  const [startDate, setStartDate] = useState(farmToday());
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const today = farmToday();
    const initialKey = initialStartDate ? calendarDateKey(initialStartDate) : null;
    const todayKey = calendarDateKey(today);
    setStartDate(
      initialKey && todayKey && initialKey >= todayKey ? initialStartDate ?? today : today
    );
  }, [visible, initialStartDate]);

  useEffect(() => {
    if (visible && initialTaskType) {
      setTaskType(initialTaskType);
    }
  }, [visible, initialTaskType]);

  // Preselect the deep-linked plant when the modal opens. Bed-assigned plants
  // are tasked via the Bed dropdown, so prefill the bed for those instead.
  useEffect(() => {
    if (!visible || !initialPlantId) return;
    const plant = plants.find((p) => p.id === initialPlantId);
    if (!plant) return;
    if (plant.bed_id) {
      setSelectedBed(plant.bed_id);
    } else {
      setSelectedPlant(plant.id);
    }
  }, [visible, initialPlantId, plants]);

  const resetForm = (): void => {
    setTaskType('water');
    setSelectedPlant('');
    setSelectedBed('');
    setFrequencyDays('7');
    setIsOneTimeTask(false);
    setStartDate(farmToday());
    setPreferredTime(null);
  };

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  const applyFrequencyPreset = (days: number): void => {
    setFrequencyDays(days.toString());
  };

  const handleCreateTask = async (): Promise<void> => {
    if (!isOneTimeTask) {
      const frequency = parseInt(frequencyDays);
      if (isNaN(frequency) || frequency < 1) {
        Alert.alert('Error', 'Please enter a valid frequency (1 or more days)');
        return;
      }
    }

    setLoading(true);
    try {
      const selectedKey = calendarDateKey(startDate);
      const todayKey = calendarDateKey(farmToday());
      if (!selectedKey || !todayKey) throw new Error('Invalid task date');
      const dueKey = selectedKey < todayKey ? todayKey : selectedKey;
      const dueHour = preferredTime === 'morning' ? 8 : preferredTime === 'afternoon' ? 14 : 18;
      const dueDate = farmDateTimeFromKey(dueKey, dueHour);
      if (!dueDate) throw new Error('Invalid task date');

      await createTaskTemplate({
        task_type: taskType,
        plant_id: selectedPlant || null,
        bed_id: selectedBed || null,
        frequency_days: isOneTimeTask ? 0 : parseInt(frequencyDays),
        next_due_at: dueDate.toISOString(),
        enabled: true,
        preferred_time: preferredTime,
        source: 'manual',
      });
      Alert.alert('Success', 'Task created successfully!');
      resetForm();
      onCreated();
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={handleClose}
      sheetStyle={styles.modalContent}
      keyboardAvoiding
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={styles.modalTitleWrap}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            Create Task
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
          onPress={handleCreateTask}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.modalSaveText, loading && styles.modalSaveTextDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <View style={styles.modalBody}>
          <ThemedDropdown
            items={TASK_TYPE_ITEMS}
            selectedValue={taskType}
            onValueChange={(v) => setTaskType(v as TaskType)}
            label="Task Type *"
            placeholder="Task Type"
          />

          <ThemedDropdown
            items={[
              { label: 'General Task', value: '' },
              ...standalonePlants.map((p) => ({ label: p.name, value: p.id })),
            ]}
            selectedValue={selectedPlant}
            onValueChange={setSelectedPlant}
            label="Plant (Optional)"
            placeholder="Plant"
            searchable
          />

          <ThemedDropdown
            items={[
              { label: 'No Bed', value: '' },
              ...beds.map((b) => ({ label: b.name, value: b.id })),
            ]}
            selectedValue={selectedBed}
            onValueChange={setSelectedBed}
            label="Bed (Optional)"
            placeholder="Bed"
            searchable
          />

          <Text style={styles.label}>Start Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
            <Text style={styles.dateButtonText}>
              {formatFarmDate(startDate, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              minimumDate={farmToday()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <Text style={styles.label}>Preferred Time (Optional)</Text>
          <View style={styles.timeButtons}>
            <TouchableOpacity
              style={[styles.timeButton, preferredTime === 'morning' && styles.timeButtonActive]}
              onPress={() => setPreferredTime(preferredTime === 'morning' ? null : 'morning')}
            >
              <Ionicons
                name="sunny-outline"
                size={16}
                color={preferredTime === 'morning' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'morning' && styles.timeButtonTextActive,
                ]}
              >
                Morning
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, preferredTime === 'afternoon' && styles.timeButtonActive]}
              onPress={() => setPreferredTime(preferredTime === 'afternoon' ? null : 'afternoon')}
            >
              <Ionicons
                name="sunny"
                size={16}
                color={preferredTime === 'afternoon' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'afternoon' && styles.timeButtonTextActive,
                ]}
              >
                Afternoon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, preferredTime === 'evening' && styles.timeButtonActive]}
              onPress={() => setPreferredTime(preferredTime === 'evening' ? null : 'evening')}
            >
              <Ionicons
                name="moon-outline"
                size={16}
                color={preferredTime === 'evening' ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'evening' && styles.timeButtonTextActive,
                ]}
              >
                Evening
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Schedule</Text>
          <View style={styles.taskTypeToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, !isOneTimeTask && styles.toggleButtonActive]}
              onPress={() => setIsOneTimeTask(false)}
            >
              <Ionicons
                name="repeat-outline"
                size={16}
                color={!isOneTimeTask ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[styles.toggleButtonText, !isOneTimeTask && styles.toggleButtonTextActive]}
              >
                Repeating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isOneTimeTask && styles.toggleButtonActive]}
              onPress={() => setIsOneTimeTask(true)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={16}
                color={isOneTimeTask ? theme.primary : theme.textSecondary}
              />
              <Text
                style={[styles.toggleButtonText, isOneTimeTask && styles.toggleButtonTextActive]}
              >
                One-Time
              </Text>
            </TouchableOpacity>
          </View>

          {!isOneTimeTask && (
            <>
              <Text style={styles.label}>Repeat Every (days) *</Text>

              <View style={styles.presets}>
                <TouchableOpacity
                  style={[styles.presetButton, frequencyDays === '1' && styles.presetButtonActive]}
                  onPress={() => applyFrequencyPreset(1)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.presetText, frequencyDays === '1' && styles.presetTextActive]}
                  >
                    Daily
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, frequencyDays === '7' && styles.presetButtonActive]}
                  onPress={() => applyFrequencyPreset(7)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.presetText, frequencyDays === '7' && styles.presetTextActive]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, frequencyDays === '14' && styles.presetButtonActive]}
                  onPress={() => applyFrequencyPreset(14)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.presetText, frequencyDays === '14' && styles.presetTextActive]}
                  >
                    Bi-weekly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, frequencyDays === '30' && styles.presetButtonActive]}
                  onPress={() => applyFrequencyPreset(30)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.presetText, frequencyDays === '30' && styles.presetTextActive]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              <FloatingLabelInput
                label="Frequency (days)"
                value={frequencyDays}
                onChangeText={(t) => setFrequencyDays(sanitizeNumberText(t))}
                keyboardType="numeric"
              />

              {frequencyDays && parseInt(frequencyDays) > 0 && (
                <View style={styles.preview}>
                  <View style={styles.previewTitleRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                    <Text style={styles.previewTitle}>Schedule Preview</Text>
                  </View>
                  <Text style={styles.previewText}>
                    • First task:{' '}
                    {formatFarmDate(startDate, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {preferredTime && ` (${preferredTime})`}
                  </Text>
                  <Text style={styles.previewText}>
                    • Next task:{' '}
                    {formatFarmDate(addCalendarDays(startDate, parseInt(frequencyDays)), {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.previewText}>
                    • Repeats every {frequencyDays} {parseInt(frequencyDays) === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              )}
            </>
          )}

          {isOneTimeTask && (
            <View style={styles.preview}>
              <View style={styles.previewTitleRow}>
                <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                <Text style={styles.previewTitle}>One-Time Task</Text>
              </View>
              <Text style={styles.previewText}>
                • Due:{' '}
                {formatFarmDate(startDate, {
                  month: 'short',
                  day: 'numeric',
                })}
                {preferredTime && ` (${preferredTime})`}
              </Text>
              <Text style={styles.previewText}>• Will not repeat after completion</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}
