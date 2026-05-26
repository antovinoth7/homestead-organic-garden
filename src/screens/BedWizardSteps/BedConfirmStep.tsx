import React, { useMemo } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { Step6Data, WizardStepData } from '@/hooks/useBedCreationWizard';
import { getGuildTemplate } from '@/config/beds';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { BedZoneIllustration } from '@/components/BedZoneIllustration';

interface Props {
  stepData: Partial<WizardStepData>;
  data: Step6Data;
  onChange: (data: Partial<Step6Data>) => void;
}

export function BedConfirmStep({ stepData, data, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const s1 = stepData[1];
  const s2 = stepData[2];
  const s3 = stepData[3];
  const template = s1?.bed_type ? getGuildTemplate(s1.bed_type) : null;

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Save</Text>

      {s2?.name ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Bed name</Text>
          <Text style={styles.summaryRow}>{s2.name}</Text>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={data.notes}
          onChangeText={(v) => onChange({ notes: v })}
          placeholder="Any additional notes about this bed"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={3}
          maxLength={300}
        />
      </View>

      {s3 && <BedZoneIllustration widthM={s3.width_m} lengthM={s3.length_m} isRaised />}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        {template && <Text style={styles.summaryRow}>Type: {template.label}</Text>}
        {s3 && (
          <Text style={styles.summaryRow}>
            Size: {s3.width_m} m × {s3.length_m} m ({s3.area_sqm} sqm) — Raised
          </Text>
        )}
        {s2 && (
          <>
            <Text style={styles.summaryRow}>Sunlight: {s2.sunlight.replace(/_/g, ' ')}</Text>
            <Text style={styles.summaryRow}>Soil: {s2.soil_type.replace(/_/g, ' ')}</Text>
            {s2.parent_location && (
              <Text style={styles.summaryRow}>
                Location: {s2.parent_location}
                {s2.child_location ? ` › ${s2.child_location}` : ''}
              </Text>
            )}
          </>
        )}
        {(() => {
          const entries = stepData[4]?.plant_entries ?? [];
          if (entries.length === 0) return null;
          const countByName = new Map<string, number>();
          for (const e of entries) countByName.set(e.name, (countByName.get(e.name) ?? 0) + 1);
          const label = Array.from(countByName.entries())
            .map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
            .join(', ');
          return <Text style={styles.summaryRow}>Plants: {label}</Text>;
        })()}
      </View>

      <View style={styles.autoTasksCard}>
        <Text style={styles.autoTasksTitle}>Auto-tasks that will be created</Text>
        <Text style={styles.autoTaskRow}>• Bed watering (min interval from plants)</Text>
        <Text style={styles.autoTaskRow}>• Jeevamrutha application (every 21 days)</Text>
        <Text style={styles.autoTaskRow}>• Weeding (every 14 days)</Text>
      </View>
    </ScrollView>
  );
}
