import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { RotationStatus } from '@/types/database.types';
import { createStyles } from '@/styles/bedDetailStyles';

interface Props {
  status: RotationStatus;
}

export function RotationStatusCard({ status }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.rotationCard}>
      {status.has_solanaceae_violation && (
        <View style={styles.violationBanner}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.violationText}>
            Solanaceae planted in previous season — rest recommended
          </Text>
        </View>
      )}

      <View style={styles.legumeRow}>
        <Text style={styles.legumeLabel}>Legume coverage</Text>
        <Text
          style={[
            styles.legumeValue,
            {
              color:
                status.legume_coverage_pct < 20
                  ? theme.warning ?? '#f59e0b'
                  : theme.success ?? '#22c55e',
            },
          ]}
        >
          {status.legume_coverage_pct}%
        </Text>
      </View>

      {status.green_manure_recommendation && (
        <View style={styles.greenManureBanner}>
          <Ionicons name="leaf-outline" size={14} color={theme.primary} />
          <Text style={styles.greenManureText}>
            Recommended now: {status.green_manure_recommendation.name}
            {status.green_manure_recommendation.tamilName
              ? ` (${status.green_manure_recommendation.tamilName})`
              : ''}{' '}
            — {status.green_manure_recommendation.rationale}
          </Text>
        </View>
      )}

      <Text style={styles.checklistTitle}>6-Rule Rotation Coordinator</Text>
      {status.coordinator_checklist.map((rule) => (
        <View key={rule.id} style={styles.checklistRow}>
          <Ionicons
            name={rule.passed ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={rule.passed ? theme.success ?? '#22c55e' : theme.error ?? '#ef4444'}
          />
          <View style={styles.checklistInfo}>
            <Text style={styles.checklistRule}>{rule.rule}</Text>
            <Text style={styles.checklistDesc}>{rule.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
