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

const TASK_TYPE_ITEMS: DropdownItem[] = [
  { label: '💧 Water', value: 'water' },
  { label: '🌱 Fertilize', value: 'fertilise' },
  { label: '✂️ Prune', value: 'prune' },
  { label: '🪴 Repot', value: 'repot' },
  { label: '🧴 Spray (Pesticide/Neem)', value: 'spray' },
  { label: '🍂 Mulch', value: 'mulch' },
  { label: '🌾 Weeding', value: 'weeding' },
  { label: '🌱 Transplanting', value: 'transplanting' },
  { label: '⛏️ Cultivating', value: 'cultivating' },
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
  const [startDate, setStartDate] = useState(new Date());
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | null>(
    null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialStartDate) {
      setStartDate(initialStartDate);
    }
  }, [visible, initialStartDate]);

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
    setStartDate(new Date());
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
      const dueDate = new Date(startDate);

      if (preferredTime === 'morning') {
        dueDate.setHours(8, 0, 0, 0);
      } else if (preferredTime === 'afternoon') {
        dueDate.setHours(14, 0, 0, 0);
      } else if (preferredTime === 'evening') {
        dueDate.setHours(18, 0, 0, 0);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDay = new Date(dueDate);
      dueDay.setHours(0, 0, 0, 0);
      if (dueDay < today) {
        dueDate.setDate(dueDate.getDate() + 1);
      }

      await createTaskTemplate({
        task_type: taskType,
        plant_id: selectedPlant || null,
        bed_id: selectedBed || null,
        frequency_days: isOneTimeTask ? 0 : parseInt(frequencyDays),
        next_due_at: dueDate.toISOString(),
        enabled: true,
        preferred_time: preferredTime,
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
              {startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={startDate}
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
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'morning' && styles.timeButtonTextActive,
                ]}
              >
                🌅 Morning
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, preferredTime === 'afternoon' && styles.timeButtonActive]}
              onPress={() => setPreferredTime(preferredTime === 'afternoon' ? null : 'afternoon')}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'afternoon' && styles.timeButtonTextActive,
                ]}
              >
                ☀️ Afternoon
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.timeButton, preferredTime === 'evening' && styles.timeButtonActive]}
              onPress={() => setPreferredTime(preferredTime === 'evening' ? null : 'evening')}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  preferredTime === 'evening' && styles.timeButtonTextActive,
                ]}
              >
                🌙 Evening
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Schedule</Text>
          <View style={styles.taskTypeToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, !isOneTimeTask && styles.toggleButtonActive]}
              onPress={() => setIsOneTimeTask(false)}
            >
              <Text
                style={[styles.toggleButtonText, !isOneTimeTask && styles.toggleButtonTextActive]}
              >
                🔄 Repeating
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isOneTimeTask && styles.toggleButtonActive]}
              onPress={() => setIsOneTimeTask(true)}
            >
              <Text
                style={[styles.toggleButtonText, isOneTimeTask && styles.toggleButtonTextActive]}
              >
                ✓ One-Time
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
                  <Text style={styles.previewTitle}>📅 Schedule Preview</Text>
                  <Text style={styles.previewText}>
                    • First task:{' '}
                    {startDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {preferredTime && ` (${preferredTime})`}
                  </Text>
                  <Text style={styles.previewText}>
                    • Next task:{' '}
                    {new Date(
                      startDate.getTime() + parseInt(frequencyDays) * 24 * 60 * 60 * 1000
                    ).toLocaleDateString('en-US', {
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
              <Text style={styles.previewTitle}>📅 One-Time Task</Text>
              <Text style={styles.previewText}>
                • Due:{' '}
                {startDate.toLocaleDateString('en-US', {
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
