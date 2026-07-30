import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import type { ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { TAB_BAR_HEIGHT } from '@/components/FloatingTabBar';
import { createStyles } from '@/styles/pestDiseaseDetailStyles';
import { getCurrentRisk } from '@/utils/riskHelpers';
import { ImageZoomModal } from '@/components/ImageZoomModal';
import { ReferenceHero } from './ReferenceHero';
import { RiskInGardenCard } from './RiskInGardenCard';
import { ActionPlanCard } from './ActionPlanCard';
import type { ReferenceEntry } from './types';

const HERO_HEIGHT = 250;
const STICKY_THRESHOLD = HERO_HEIGHT - 80;

interface Props {
  entry: ReferenceEntry;
  categoryLabel: string;
  image?: ImageSource;
  onBack: () => void;
  /** Opens the create-task flow for the tapped control step. */
  onAddToTasks: () => void;
}

/**
 * Detail layout shared by the pest and disease screens: hero, seasonal risk
 * card, spot/damage pair, numbered action plan, prevention.
 */
export function ReferenceDetailView({
  entry,
  categoryLabel,
  image,
  onBack,
  onAddToTasks,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  const previewSources = useMemo(() => (image ? [image] : []), [image]);
  const handleOpenPreview = useCallback(() => setPreviewVisible(true), []);
  const handleClosePreview = useCallback(() => setPreviewVisible(false), []);

  const risk = getCurrentRisk(entry.seasonalRisk);

  const handleToggleStep = useCallback((index: number) => {
    setExpandedStep((current) => (current === index ? null : index));
  }, []);

  const stickyBgOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD, STICKY_THRESHOLD + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD + 10, STICKY_THRESHOLD + 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const subtitle = entry.tamilName ? `${entry.tamilName} · ${categoryLabel}` : categoryLabel;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.tabBarBackground,
            opacity: stickyBgOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.stickyBackButton}
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <Animated.Text style={[styles.stickyHeaderEmoji, { opacity: stickyTitleOpacity }]}>
          {entry.emoji}
        </Animated.Text>
        <Animated.Text
          style={[styles.stickyHeaderTitle, { opacity: stickyTitleOpacity }]}
          numberOfLines={1}
        >
          {entry.name}
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
      >
        <ReferenceHero
          name={entry.name}
          subtitle={subtitle}
          emoji={entry.emoji}
          image={image}
          risk={risk}
          topInset={insets.top}
          onBack={onBack}
          onPressImage={image ? handleOpenPreview : undefined}
        />

        <RiskInGardenCard
          seasonalRisk={entry.seasonalRisk}
          plantsAffected={entry.plantsAffected}
        />

        <View style={styles.panel}>
          <View style={styles.pairRow}>
            <View style={styles.pairCard}>
              <Text style={styles.microLabel}>SPOT IT</Text>
              <Text style={styles.pairText}>{entry.identification}</Text>
            </View>
            <View style={styles.pairCard}>
              <Text style={styles.microLabel}>DAMAGE</Text>
              <Text style={styles.pairText}>{entry.damageDescription}</Text>
            </View>
          </View>

          {entry.organicTreatments.length > 0 ? (
            <>
              <Text style={styles.planTitle}>Your action plan</Text>
              <Text style={styles.planSubtitle}>
                {entry.organicTreatments.length === 1 ? 'One step.' : 'Organic controls, in order.'}{' '}
                Open one to add it to this week&apos;s tasks.
              </Text>
              {entry.organicTreatments.map((step, index) => (
                <ActionPlanCard
                  key={`${step.name}-${index}`}
                  step={step}
                  index={index}
                  expanded={expandedStep === index}
                  onToggle={handleToggleStep}
                  onAddToTasks={onAddToTasks}
                />
              ))}
            </>
          ) : null}

          {entry.organicPrevention.length > 0 ? (
            <View style={styles.preventionCard}>
              <Text style={styles.preventionTitle}>Prevention, ongoing</Text>
              {entry.organicPrevention.map((item) => (
                <Text key={item} style={styles.preventionItem}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      </Animated.ScrollView>

      {image ? (
        <ImageZoomModal
          visible={previewVisible}
          sources={previewSources}
          onClose={handleClosePreview}
        />
      ) : null}
    </View>
  );
}
