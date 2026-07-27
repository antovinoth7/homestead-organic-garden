import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import type { OrganicControlItem } from '@/types/database.types';

interface Props {
  step: OrganicControlItem;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  onAddToTasks: () => void;
}

/**
 * One numbered step of the action plan. Collapsed it shows the method /
 * effort / frequency chips; expanded it shows the full instructions and a
 * shortcut into the create-task flow.
 */
export function ActionPlanCard({
  step,
  index,
  expanded,
  onToggle,
  onAddToTasks,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleToggle = useCallback(() => onToggle(index), [onToggle, index]);

  const hasDetail = Boolean(step.howToApply ?? step.frequency ?? step.timing ?? step.safetyNotes);

  return (
    <View style={styles.planCard}>
      <TouchableOpacity style={styles.planCardHeader} onPress={handleToggle} activeOpacity={0.75}>
        <View style={styles.planNumber}>
          <Text style={styles.planNumberText}>{index + 1}</Text>
        </View>

        <View style={styles.planCardBody}>
          <Text style={styles.planName}>{step.name}</Text>
          <View style={styles.planChipRow}>
            <View style={[styles.planChip, styles.planChipMethod]}>
              <Text style={[styles.planChipText, styles.planChipMethodText]}>{step.method}</Text>
            </View>
            <View style={[styles.planChip, styles.planChipEffort]}>
              <Text style={[styles.planChipText, styles.planChipEffortText]}>{step.effort}</Text>
            </View>
            {step.frequency ? (
              <View style={[styles.planChip, styles.planChipDose]}>
                <Text style={[styles.planChipText, styles.planChipDoseText]}>{step.frequency}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.planCardChevron}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.textTertiary}
          />
        </View>
      </TouchableOpacity>

      {expanded && hasDetail ? (
        <View style={styles.planDetail}>
          <View style={styles.planDetailDivider} />

          {step.howToApply ? (
            <>
              <Text style={styles.microLabel}>HOW TO APPLY</Text>
              <Text style={styles.planDetailText}>{step.howToApply}</Text>
            </>
          ) : null}

          {step.frequency || step.timing ? (
            <View style={styles.planDetailColumns}>
              {step.frequency ? (
                <View style={styles.planDetailColumn}>
                  <Text style={styles.microLabel}>FREQUENCY</Text>
                  <Text style={styles.planDetailValue}>{step.frequency}</Text>
                </View>
              ) : null}
              {step.timing ? (
                <View style={styles.planDetailColumn}>
                  <Text style={styles.microLabel}>TIMING</Text>
                  <Text style={styles.planDetailValue}>{step.timing}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {step.safetyNotes ? (
            <View style={styles.planNote}>
              <Text style={styles.planNoteText}>{step.safetyNotes}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.planAddButton}
            onPress={onAddToTasks}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={15} color={theme.textInverse} />
            <Text style={styles.planAddButtonText}>Add to tasks</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
