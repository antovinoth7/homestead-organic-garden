import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/onboardingStyles';
import { getFarmConfig, saveFarmConfig } from '@/services/farmCapacity';
import {
  TAMIL_NADU_DISTRICTS,
  DEFAULT_DISTRICT,
  getZoneByDistrict,
  resolveActiveZone,
} from '@/config/zones';
import { getSeasonLabel } from '@/utils/seasonHelpers';
import type { FarmConfig, FarmGoal } from '@/types/database.types';
import { logger } from '@/utils/logger';

interface OnboardingScreenProps {
  onComplete: () => Promise<void>;
}

const STEP_COUNT = 4;

const ALL_GOALS: { id: FarmGoal; label: string }[] = [
  { id: 'self_sufficiency', label: 'Self Sufficiency' },
  { id: 'surplus_sale', label: 'Surplus Sale' },
  { id: 'seed_saving', label: 'Seed Saving' },
  { id: 'medicinal', label: 'Medicinal' },
  { id: 'fodder', label: 'Fodder' },
];

const WELCOME_BULLETS: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: 'leaf-outline',
    title: 'Plan organic beds',
    text: 'Companion-aware layouts tuned for Tamil Nadu seasons and rainfall.',
  },
  {
    icon: 'water-outline',
    title: 'Right care, right time',
    text: 'Watering and tasks adjust to the monsoon and dry seasons automatically.',
  },
  {
    icon: 'book-outline',
    title: 'Track every harvest',
    text: 'A journal, pest library and almanac built for your district.',
  },
];

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [district, setDistrict] = useState(DEFAULT_DISTRICT);
  const [families, setFamilies] = useState(1);
  const [goals, setGoals] = useState<FarmGoal[]>(['self_sufficiency']);
  const [baseConfig, setBaseConfig] = useState<FarmConfig | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const config = await getFarmConfig();
        if (!active) return;
        setBaseConfig(config);
        setFamilies(config.families_count || 1);
        if (config.goals?.length) setGoals(config.goals);
        if (config.district) setDistrict(config.district);
      } catch (error) {
        logger.warn('Onboarding: failed to load farm config', error as Error);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const seasonLabel = useMemo(
    () => getSeasonLabel(undefined, resolveActiveZone({ district })),
    [district]
  );

  const persistConfig = useCallback(async (): Promise<void> => {
    try {
      await saveFarmConfig({
        ...(baseConfig ?? { families_count: 1, goals: [] }),
        families_count: families,
        goals,
        district,
        zone_id: getZoneByDistrict(district).id,
      });
    } catch (error) {
      logger.warn('Onboarding: failed to save farm config', error as Error);
    }
  }, [baseConfig, families, goals, district]);

  const goToTabs = useCallback(
    (target?: { screen: string; params: object }) => {
      if (target) {
        navigation.navigate('AppTabs', { screen: 'Beds', params: target });
      } else {
        navigation.navigate('AppTabs');
      }
    },
    [navigation]
  );

  const finish = useCallback(
    async (withBed: boolean) => {
      if (busy) return;
      setBusy(true);
      await persistConfig();
      await onComplete();
      if (withBed) {
        goToTabs({ screen: 'BedCreationWizard', params: { prefillType: 'leafy' } });
      } else {
        goToTabs();
      }
    },
    [busy, persistConfig, onComplete, goToTabs]
  );

  const handleNext = useCallback(() => {
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1));
  }, []);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const toggleGoal = useCallback((goal: FarmGoal) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  }, []);

  const renderDistrict = useCallback(
    ({ item }: ListRenderItemInfo<string>) => {
      const active = item === district;
      return (
        <TouchableOpacity
          style={[styles.districtRow, active && styles.districtRowActive]}
          onPress={() => setDistrict(item)}
        >
          <Text style={active ? styles.districtTextActive : styles.districtText}>{item}</Text>
          {active ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : null}
        </TouchableOpacity>
      );
    },
    [district, styles, theme.primary]
  );

  const renderStepBody = (): React.JSX.Element => {
    switch (step) {
      case 0:
        return (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Ionicons name="leaf" size={56} color={theme.primary} style={styles.heroIcon} />
            <Text style={styles.stepTitle}>Welcome to your garden</Text>
            <Text style={styles.stepDescription}>
              Let&apos;s set up a thriving organic garden for your home. A few quick questions and
              we&apos;ll plan your first bed.
            </Text>
            {WELCOME_BULLETS.map((b) => (
              <View key={b.title} style={styles.bulletRow}>
                <View style={styles.bulletIcon}>
                  <Ionicons name={b.icon} size={20} color={theme.primary} />
                </View>
                <View style={styles.bulletTextWrap}>
                  <Text style={styles.bulletTitle}>{b.title}</Text>
                  <Text style={styles.bulletText}>{b.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case 1:
        return (
          <View style={styles.content}>
            <View style={styles.scrollContent}>
              <Text style={styles.stepTitle}>Where do you garden?</Text>
              <Text style={styles.stepDescription}>
                Pick your district so seasons, watering and pest alerts match your local climate.
                Tuning is best for the Kanyakumari / south Tamil Nadu high-rainfall belt today.
              </Text>
            </View>
            <FlatList
              data={TAMIL_NADU_DISTRICTS}
              keyExtractor={(d) => d}
              renderItem={renderDistrict}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        );
      case 2:
        return (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Who are you growing for?</Text>
            <Text style={styles.stepDescription}>
              This sizes your beds and harvest targets. You can change it anytime in your profile.
            </Text>

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
            <Text style={styles.helperText}>~4 people per family · {families * 4} people total</Text>

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
          </ScrollView>
        );
      default:
        return (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Plant your first bed</Text>
            <Text style={styles.stepDescription}>
              We&apos;ll guide you through a companion-planted bed sized to your space.
            </Text>
            <View style={styles.recommendCard}>
              <View style={styles.recommendBadge}>
                <Text style={styles.recommendBadgeText}>Recommended for {seasonLabel}</Text>
              </View>
              <Text style={styles.recommendTitle}>Leafy Greens Bed</Text>
              <Text style={styles.recommendText}>
                Fast, forgiving and quick to harvest in 30–45 days — the ideal first bed for a new
                garden. The wizard suggests companions, spacing and a care schedule for you.
              </Text>
            </View>
          </ScrollView>
        );
    }
  };

  const isLastStep = step === STEP_COUNT - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
      </View>

      {renderStepBody()}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {step > 0 ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack} disabled={busy}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        ) : null}
        {isLastStep ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => finish(true)}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>Create my first bed</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext} disabled={busy}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={() => finish(false)} disabled={busy}>
        <Text style={styles.skipText}>{isLastStep ? 'Maybe later' : 'Skip for now'}</Text>
      </TouchableOpacity>
    </View>
  );
}
