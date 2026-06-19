import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Theme } from '@/theme/colors';
import type { Plant } from '@/types/database.types';
import type { CoconutAgeInfo, CoconutNutrientDeficiency } from '@/utils/plantHelpers';
import type { createStyles } from '@/styles/plantDetailStyles';
import { PlantInfoRow } from '@/components/PlantInfoRow';

type DetailStyles = ReturnType<typeof createStyles>;

interface Props {
  styles: DetailStyles;
  theme: Theme;
  plant: Plant;
  coconutAge: CoconutAgeInfo | null;
  coconutDeficiencies: CoconutNutrientDeficiency[];
}

/** §9 — Coconut-specific age guidance, metrics grid, and nutrient deficiency guide. */
export function CoconutSection({
  styles,
  theme,
  plant,
  coconutAge,
  coconutDeficiencies,
}: Props): React.JSX.Element | null {
  if (plant.plant_type !== 'coconut_tree') return null;

  // Inner metrics grid uses != null (0 is a valid metric value).
  const hasMetrics =
    plant.coconut_fronds_count != null ||
    plant.nuts_per_month != null ||
    plant.spathe_count_per_month != null ||
    plant.nut_fall_count != null;

  // Outer visibility mirrors the original truthy condition exactly.
  const hasContent =
    coconutAge ||
    plant.coconut_fronds_count ||
    plant.nuts_per_month ||
    plant.spathe_count_per_month ||
    plant.last_climbing_date ||
    plant.nut_fall_count ||
    coconutDeficiencies.length > 0;

  if (!hasContent) return null;

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>🥥 Coconut</Text>
      {coconutAge && (
        <>
          <PlantInfoRow
            styles={styles}
            icon="time"
            iconColor={theme.primary}
            text={`${coconutAge.ageLabel} — ${coconutAge.stageLabel}`}
          />
          <PlantInfoRow
            styles={styles}
            icon="analytics"
            iconColor={theme.textSecondary}
            text={`Expected Yield: ${coconutAge.expectedNutsPerYear}`}
          />
          {coconutAge.careTips.map((tip, i) => (
            <View key={i} style={styles.careTipItem}>
              <Text style={styles.careTipBullet}>•</Text>
              <Text style={styles.careTipText}>{tip}</Text>
            </View>
          ))}
        </>
      )}
      {hasMetrics && (
        <>
          {coconutAge && <View style={styles.sectionDivider} />}
          <Text style={styles.subsectionTitle}>Metrics</Text>
          <View style={styles.metricsGrid}>
            {plant.coconut_fronds_count != null && (
              <View style={styles.metricCard}>
                <Ionicons name="leaf" size={22} color={theme.success} />
                <Text style={styles.metricValue}>{plant.coconut_fronds_count}</Text>
                <Text style={styles.metricLabel}>Fronds</Text>
                {(plant.coconut_fronds_count < 30 || plant.coconut_fronds_count > 35) && (
                  <Text style={styles.metricWarning}>
                    {plant.coconut_fronds_count < 30
                      ? 'Below healthy (30-35)'
                      : 'Above typical (30-35)'}
                  </Text>
                )}
              </View>
            )}
            {plant.nuts_per_month != null && (
              <View style={styles.metricCard}>
                <Ionicons name="ellipse" size={22} color={theme.textSecondary} />
                <Text style={styles.metricValue}>{plant.nuts_per_month}</Text>
                <Text style={styles.metricLabel}>Nuts / Month</Text>
              </View>
            )}
            {plant.spathe_count_per_month != null && (
              <View style={styles.metricCard}>
                <Ionicons name="flower" size={22} color={theme.accent} />
                <Text style={styles.metricValue}>{plant.spathe_count_per_month}</Text>
                <Text style={styles.metricLabel}>Spathes / Month</Text>
              </View>
            )}
            {plant.nut_fall_count != null && (
              <View style={styles.metricCard}>
                <Ionicons name="arrow-down-circle" size={22} color={theme.error} />
                <Text style={styles.metricValue}>{plant.nut_fall_count}</Text>
                <Text style={styles.metricLabel}>Nut Falls</Text>
                {plant.last_nut_fall_date && (
                  <Text style={styles.metricLabel}>Last: {plant.last_nut_fall_date}</Text>
                )}
              </View>
            )}
          </View>
          {plant.last_climbing_date && (
            <PlantInfoRow
              styles={styles}
              rowStyle={styles.infoRowMarginTop}
              icon="calendar"
              iconColor={theme.textSecondary}
              text={`Last Climbing: ${plant.last_climbing_date}`}
            />
          )}
        </>
      )}
      {coconutDeficiencies.length > 0 && (
        <>
          <View style={styles.sectionDivider} />
          <Text style={styles.subsectionTitle}>Nutrient Deficiency Guide</Text>
          {coconutDeficiencies.map((def) => (
            <View
              key={def.nutrient}
              style={[
                styles.nutrientCard,
                def.urgency === 'high'
                  ? styles.nutrientCardHigh
                  : def.urgency === 'medium'
                  ? styles.nutrientCardMedium
                  : styles.nutrientCardLow,
              ]}
            >
              <Text style={styles.nutrientName}>{def.nutrient}</Text>
              <Text style={styles.nutrientSubTitle}>Symptoms</Text>
              {def.symptoms.slice(0, 3).map((s, i) => (
                <Text key={i} style={styles.nutrientSymptom}>
                  • {s}
                </Text>
              ))}
              <Text style={styles.nutrientSubTitle}>Organic Correction</Text>
              {def.organicCorrection.slice(0, 2).map((c, i) => (
                <Text key={i} style={styles.nutrientCorrection}>
                  ✓ {c}
                </Text>
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}
