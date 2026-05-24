import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useFarmCapacity } from '@/hooks/useFarmCapacity';
import { calcWeeklyVegNeed } from '@/services/farmCapacity';
import { createStyles } from '@/styles/profileStyles';
import type { FarmGoal } from '@/types/database.types';

const ALL_GOALS: { id: FarmGoal; label: string }[] = [
  { id: 'self_sufficiency', label: 'Self Sufficiency' },
  { id: 'surplus_sale', label: 'Surplus Sale' },
  { id: 'seed_saving', label: 'Seed Saving' },
  { id: 'medicinal', label: 'Medicinal' },
  { id: 'fodder', label: 'Fodder' },
];

export default function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { config, save } = useFarmCapacity();

  const [families, setFamilies] = useState(config?.families_count ?? 1);
  const [goals, setGoals] = useState<FarmGoal[]>(config?.goals ?? ['self_sufficiency']);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (config) {
      setFamilies(config.families_count);
      setGoals(config.goals as FarmGoal[]);
    }
  }, [config]);

  const toggleGoal = useCallback((goal: FarmGoal) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await save({
      ...(config ?? { families_count: 1, goals: [] }),
      families_count: families,
      goals,
    });
    setSaving(false);
  }, [config, families, goals, save]);

  const weeklyVeg = calcWeeklyVegNeed(families);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
      >
        <Text style={styles.sectionLabel}>Household</Text>

        <View style={styles.stepperRow}>
          <Text style={styles.stepperLabel}>Families to feed</Text>
          <View style={styles.stepperControls}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setFamilies((v) => Math.max(1, v - 1))}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{families}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setFamilies((v) => v + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.helperText}>
          ~4 people per family · {families * 4} people total · ~{weeklyVeg} kg vegetables/week
        </Text>

        <Text style={styles.sectionLabel}>Farm Goals</Text>
        <View style={styles.chipRow}>
          {ALL_GOALS.map((g) => {
            const active = goals.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleGoal(g.id)}
              >
                <Text style={active ? styles.chipTextActive : styles.chipText}>{g.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
