import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getPestByName } from '@/config/pests';
import { getDiseaseByName } from '@/config/diseases';
import { recheckIntervalDays } from '@/utils/journalEntryOptions';
import type {
  HealthStatus,
  IssueSeverity,
  PestDiseaseKind,
  PestStatus,
} from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalFormStyles';

export interface PestFollowUp {
  markHealth: boolean;
  remind: boolean;
  /** Chosen reminder interval; null follows the treatment's suggested one. */
  remindDays: number | null;
}

/** Health suggested for a plant with an open problem of this severity. */
export function suggestedHealth(severity: IssueSeverity): HealthStatus {
  return severity === 'high' || severity === 'severe' ? 'sick' : 'stressed';
}

/**
 * Re-check interval from the reference treatment's own frequency ("Every 5–7
 * days" → 5), or null when the treatment isn't a reference one or names none.
 */
export function referenceRecheckDays(
  kind: PestDiseaseKind,
  issueName: string,
  treatment: string
): number | null {
  if (!issueName.trim() || !treatment.trim()) return null;
  const reference = kind === 'pest' ? getPestByName(issueName) : getDiseaseByName(issueName);
  const item = reference?.organicTreatments.find((t) => t.name === treatment);
  return recheckIntervalDays(item?.frequency);
}

export const DEFAULT_RECHECK_DAYS = 7;
const DAY_OPTIONS: readonly number[] = [3, 5, 7, 10, 14];

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

interface Props {
  value: PestFollowUp;
  onChange: (patch: Partial<PestFollowUp>) => void;
  /** Present only when the linked plant is currently Healthy. */
  healthSuggestion: HealthStatus | null;
  /** From the chosen treatment's reference frequency, if any. */
  suggestedDays: number | null;
  treatment: string;
  status: PestStatus;
}

/**
 * "After saving" options on a new, unresolved pest/disease entry: nudge the
 * plant's health and schedule a spray reminder. Replaces two Alerts that used
 * to fire in sequence after Save, over the screen being navigated away from.
 */
export function JournalPestFollowUp({
  value,
  onChange,
  healthSuggestion,
  suggestedDays,
  treatment,
  status,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const days = value.remindDays ?? suggestedDays ?? DEFAULT_RECHECK_DAYS;
  const dayOptions = useMemo(
    () =>
      suggestedDays && !DAY_OPTIONS.includes(suggestedDays)
        ? [...DAY_OPTIONS, suggestedDays].sort((a, b) => a - b)
        : DAY_OPTIONS,
    [suggestedDays]
  );

  const toggleHealth = useCallback(
    () => onChange({ markHealth: !value.markHealth }),
    [onChange, value.markHealth]
  );
  const toggleRemind = useCallback(
    () => onChange({ remind: !value.remind }),
    [onChange, value.remind]
  );

  // Still active → the first spray is due today; already treated → the next
  // one comes a full interval later.
  const firstReminder = status === 'treated' ? `in ${days} days` : 'today evening';

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.label}>After saving</Text>

      {healthSuggestion && (
        <TouchableOpacity
          style={styles.followUpRow}
          onPress={toggleHealth}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: value.markHealth }}
        >
          <Ionicons
            name={value.markHealth ? 'checkbox' : 'square-outline'}
            size={22}
            color={value.markHealth ? theme.primary : theme.textSecondary}
          />
          <Text style={styles.followUpText}>Mark plant as {titleCase(healthSuggestion)}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.followUpRow}
        onPress={toggleRemind}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value.remind }}
      >
        <Ionicons
          name={value.remind ? 'checkbox' : 'square-outline'}
          size={22}
          color={value.remind ? theme.primary : theme.textSecondary}
        />
        <Text style={styles.followUpText}>Remind me to spray every {days} days</Text>
      </TouchableOpacity>

      {value.remind && (
        <View style={styles.followUpDetail}>
          <View style={styles.optionGrid}>
            {dayOptions.map((option) => {
              const active = option === days;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionTile, active && styles.optionTileActive]}
                  onPress={() => onChange({ remindDays: option })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Every ${option} days`}
                >
                  <Text style={[styles.optionTileText, active && styles.optionTileTextActive]}>
                    {option}d
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.followUpHint}>
            {suggestedDays ? `${treatment}: every ${suggestedDays} days recommended. ` : ''}
            First reminder {firstReminder}.
          </Text>
        </View>
      )}
    </View>
  );
}
