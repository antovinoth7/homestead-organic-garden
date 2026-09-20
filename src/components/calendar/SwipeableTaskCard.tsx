import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { TASK_ICON_KEYS } from '@/config/iconRegistry';
import { TaskTemplate, Plant } from '../../types/database.types';
import { TASK_COLORS, TASK_LABELS } from '../../utils/taskConstants';
import {
  calendarDaysOverdue,
  isEarlyCompletionBlocked,
  isFutureTask,
  isSkipBlocked,
} from '../../services/taskSchedulingLogic';
import { calculateTaskPriority } from '../../services/tasks';
import { useTheme } from '../../theme';
import { createStyles } from '../../styles/calendarStyles';
import { formatFarmDate } from '@/utils/farmDate';
import type { TaskWeatherAdvisory } from '@/utils/taskWeatherAdvisory';

interface PlantDetails {
  name: string;
  location: string;
  type: string;
}

interface Props {
  task: TaskTemplate;
  isSelected: boolean;
  plantMap: Map<string, Plant>;
  swipeableRefs: React.MutableRefObject<Map<string, Swipeable>>;
  getPlantDetails: (plantId: string | null) => PlantDetails;
  onComplete: (task: TaskTemplate) => void;
  /** Invoked instead of `onComplete` when the task can't be done early. */
  onBlockedComplete: (task: TaskTemplate) => void;
  onSkipOpen: (task: TaskTemplate) => void;
  /** Invoked instead of `onSkipOpen` when the task isn't due yet. */
  onBlockedSkip: (task: TaskTemplate) => void;
  onSelectToggle: (taskId: string) => void;
  onDetail: (task: TaskTemplate) => void;
  /** Shared StyleSheet from the screen — avoids rebuilding the large factory per card. */
  styles: ReturnType<typeof createStyles>;
  bedMap?: Map<string, string>;
  /** Watering tasks: rain predicted on the due date — prompt a soil check. */
  weatherAdvisory?: TaskWeatherAdvisory | null;
  /** Harvest tasks: formatted estimated harvest date hint (e.g. "Aug 12"). */
  harvestHint?: string | null;
}

function SwipeableTaskCardComponent({
  task,
  isSelected,
  plantMap,
  swipeableRefs,
  getPlantDetails,
  onComplete,
  onBlockedComplete,
  onSkipOpen,
  onBlockedSkip,
  onSelectToggle,
  onDetail,
  styles,
  bedMap,
  weatherAdvisory,
  harvestHint,
}: Props): React.JSX.Element | null {
  const theme = useTheme();

  if (!task || !task.next_due_at) return null;

  const plantDetails = getPlantDetails(task.plant_id);
  const dueDate = new Date(task.next_due_at);
  const isOverdue = calendarDaysOverdue(task) !== null;
  // Not due yet. For most types completing early is allowed but reschedules from
  // today, so the swipe action says so and the screen confirms. For water /
  // fertilise / spray it is refused outright — the Done affordance is replaced
  // rather than left to promise something it won't do.
  const isFuture = isFutureTask(task);
  const isBlocked = isEarlyCompletionBlocked(task);
  // Skipping is refused for *any* not-yet-due task — there is nothing to defer
  // until it comes due — so the left action is replaced the same way.
  const skipBlocked = isSkipBlocked(task);

  const plantObj = task.plant_id ? plantMap.get(task.plant_id) : undefined;
  const effectivePriority = task.priority_level || calculateTaskPriority(task, plantObj || null);
  const taskLabel = TASK_LABELS[task.task_type];

  // Bed-level tasks have no plant — surface the bed name as the label so the
  // farmer can tell *where* to act instead of a generic "General".
  const bedLabel = task.bed_id != null ? bedMap?.get(task.bed_id) ?? null : null;
  const displayName = task.plant_id ? plantDetails.name : bedLabel ?? plantDetails.name;

  const priorityColor =
    effectivePriority === 'critical'
      ? theme.error
      : effectivePriority === 'high'
      ? theme.warning
      : null;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ): React.JSX.Element => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    if (isBlocked) {
      return (
        <TouchableOpacity
          style={styles.swipeBlockedAction}
          onPress={() => onBlockedComplete(task)}
          accessibilityRole="button"
          accessibilityLabel="Not due yet — why?"
        >
          <Animated.View style={[styles.swipeActionContent, { opacity, transform: [{ scale }] }]}>
            <Ionicons name="ban-outline" size={28} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>Not due</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.swipeAction} onPress={() => onComplete(task)}>
        <Animated.View style={[styles.swipeActionContent, { opacity, transform: [{ scale }] }]}>
          <Ionicons name="checkmark-circle" size={28} color={theme.textInverse} />
          <Text style={styles.swipeActionText}>{isFuture ? 'Done early' : 'Done'}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ): React.JSX.Element => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });
    const opacity = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    // Rendered bare rather than inside `swipeLeftActions`: the blocked box
    // carries its own bottom margin, same as the right-hand one.
    if (skipBlocked) {
      return (
        <TouchableOpacity
          style={styles.swipeBlockedAction}
          onPress={() => onBlockedSkip(task)}
          accessibilityRole="button"
          accessibilityLabel="Not due yet — why?"
        >
          <Animated.View style={[styles.swipeActionContent, { opacity, transform: [{ scale }] }]}>
            <Ionicons name="ban-outline" size={24} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>Not due</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.swipeLeftActions}>
        <TouchableOpacity style={styles.swipeSkipAction} onPress={() => onSkipOpen(task)}>
          <Animated.View style={[styles.swipeActionContent, { opacity, transform: [{ scale }] }]}>
            <Ionicons name="play-skip-forward" size={24} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>Skip</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      key={task.id}
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(task.id, ref);
        } else {
          swipeableRefs.current.delete(task.id);
        }
      }}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      overshootRight={false}
      overshootLeft={false}
      onSwipeableOpen={(direction) => {
        if (direction !== 'right') return;
        // A blocked task still resolves the swipe — with the explanation rather
        // than the completion — instead of leaving the drawer hanging open.
        if (isBlocked) onBlockedComplete(task);
        else onComplete(task);
      }}
    >
      <View
        style={[
          styles.taskCard,
          isOverdue && styles.taskCardOverdue,
          isSelected && styles.taskCardSelected,
        ]}
      >
        <View style={[styles.taskColorBar, { backgroundColor: TASK_COLORS[task.task_type] }]} />
        <TouchableOpacity style={styles.flexOne} onPress={() => onDetail(task)} activeOpacity={0.7}>
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <View
                style={[
                  styles.taskIconContainer,
                  { backgroundColor: TASK_COLORS[task.task_type] + '18' },
                ]}
              >
                <GardenIcon
                  name={TASK_ICON_KEYS[task.task_type]}
                  size={20}
                  color={TASK_COLORS[task.task_type]}
                />
              </View>
              <View style={styles.taskInfo}>
                <View style={styles.rowCenter}>
                  <Text style={styles.taskTitle}>{taskLabel}</Text>
                  {priorityColor && (
                    <View
                      style={[styles.taskPriorityBadge, { backgroundColor: priorityColor + '22' }]}
                    >
                      <Text style={[styles.taskPriorityBadgeText, { color: priorityColor }]}>
                        {effectivePriority === 'critical' ? 'Critical' : 'High'}
                      </Text>
                    </View>
                  )}
                  {weatherAdvisory && (
                    <View style={styles.taskRainBadge}>
                      <GardenIcon name={weatherAdvisory.iconKey} size={12} color={theme.info} />
                      <Text style={styles.taskRainBadgeText}>{weatherAdvisory.text}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.taskPlant}>{displayName}</Text>
                {plantDetails.location && (
                  <View style={styles.taskMetaLine}>
                    <GardenIcon name="general.location" size={12} color={theme.textTertiary} />
                    <Text style={styles.taskLocation}>{plantDetails.location}</Text>
                  </View>
                )}
                {task.plant_id != null && bedLabel != null && (
                  <View style={styles.taskMetaLine}>
                    <Ionicons name="grid-outline" size={12} color={theme.primary} />
                    <Text style={styles.taskBed}>{bedLabel}</Text>
                  </View>
                )}
                {task.preferred_time && (
                  <View style={styles.taskMetaLine}>
                    <Ionicons
                      name={task.preferred_time === 'evening' ? 'moon-outline' : 'sunny-outline'}
                      size={12}
                      color={theme.textTertiary}
                    />
                    <Text style={styles.taskPreferredTime}>
                      {task.preferred_time === 'morning'
                        ? 'Morning'
                        : task.preferred_time === 'afternoon'
                        ? 'Afternoon'
                        : 'Evening'}
                    </Text>
                  </View>
                )}
                {task.source === 'manual' && (
                  // A manual task can sit beside the plant's own schedule, so
                  // one plant may list the same care type twice. Mark which one
                  // the farmer added by hand.
                  <View style={styles.taskMetaLine}>
                    <Text style={styles.taskCustomBadge}>Custom</Text>
                  </View>
                )}
                {harvestHint && (
                  <View style={styles.taskMetaLine}>
                    <GardenIcon name="task.harvest" size={12} color={theme.success} />
                    <Text style={styles.taskHarvestHint}>{harvestHint}</Text>
                  </View>
                )}
              </View>
              <View style={styles.taskRight}>
                <Text style={[styles.taskTime, isOverdue && styles.taskTimeOverdue]}>
                  {isOverdue
                    ? 'Overdue'
                    : formatFarmDate(
                        dueDate,
                        {
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.taskCheckbox,
                    isSelected && styles.taskCheckboxSelected,
                    isBlocked && styles.taskCheckboxBlocked,
                  ]}
                  onPress={() => (isBlocked ? onBlockedComplete(task) : onSelectToggle(task.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={
                    isBlocked
                      ? `Explain early completion for ${taskLabel}`
                      : `${isSelected ? 'Deselect' : 'Select'} ${taskLabel}`
                  }
                >
                  <Ionicons
                    name={
                      isBlocked
                        ? 'ban-outline'
                        : isSelected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={isSelected ? theme.primary : theme.border}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}

// Memoized so toggling one task's selection (or batch progress) only re-renders
// the affected card, not every mounted card. All props are primitives or stable
// refs from the screen, so the default shallow comparison is correct.
export const SwipeableTaskCard = React.memo(SwipeableTaskCardComponent);
