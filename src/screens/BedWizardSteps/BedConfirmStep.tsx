import React, { useMemo } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { Step6Data, WizardStepData } from '@/hooks/useBedCreationWizard';
import { getGuildTemplate } from '@/config/beds';
import { getLayerColor } from '@/config/beds/layerMeta';
import { computeRowLayout } from '@/utils/rowLayoutEngine';
import type { RowLayoutResult } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import { getPlantEmoji, buildHarvestPreview } from '@/utils/plantHelpers';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { BedTopDownMap } from '@/components/BedTopDownMap';

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
  const s4 = stepData[4];
  const template = s1?.bed_type ? getGuildTemplate(s1.bed_type) : null;
  const entries = useMemo(() => s4?.plant_entries ?? [], [s4?.plant_entries]);

  // Compute the planted row layout for the read-only top-down preview.
  const rowLayout = useMemo<RowLayoutResult | null>(() => {
    if (!s1?.bed_type || !s3 || entries.length === 0) return null;
    const tpl = getGuildTemplate(s1.bed_type);
    const inputs = mapPlantEntriesToRowInputs(entries, tpl);
    if (inputs.length === 0) return null;
    return computeRowLayout(inputs, s3.width_m, s3.length_m, s1.bed_type, s2?.construction_type);
  }, [s1?.bed_type, s3, entries, s2?.construction_type]);

  const harvestPreview = useMemo(() => buildHarvestPreview(entries, template), [entries, template]);

  const plantsLabel = useMemo(() => {
    if (entries.length === 0) return null;
    const countByName = new Map<string, number>();
    for (const e of entries) countByName.set(e.name, (countByName.get(e.name) ?? 0) + 1);
    return Array.from(countByName.entries())
      .map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
      .join(', ');
  }, [entries]);

  const summaryItems = useMemo<{ icon: keyof typeof Ionicons.glyphMap; value: string }[]>(() => {
    const items: { icon: keyof typeof Ionicons.glyphMap; value: string }[] = [];
    if (template) items.push({ icon: 'leaf-outline', value: template.label });
    if (s3) {
      const construction = s2?.construction_type === 'in_ground' ? 'In-ground' : 'Raised';
      items.push({
        icon: 'resize-outline',
        value: `${s3.width_m} m × ${s3.length_m} m · ${s3.area_sqm} sqm · ${construction}`,
      });
    }
    if (s2) {
      const humanize = (v: string): string =>
        v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ icon: 'sunny-outline', value: humanize(s2.sunlight) });
      items.push({ icon: 'layers-outline', value: humanize(s2.soil_type) });
      if (s2.parent_location) {
        items.push({
          icon: 'location-outline',
          value: `${s2.parent_location}${s2.child_location ? ` › ${s2.child_location}` : ''}`,
        });
      }
    }
    if (plantsLabel) items.push({ icon: 'flower-outline', value: plantsLabel });
    return items;
  }, [template, s3, s2, plantsLabel]);

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
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

      {/* Row-by-row layout preview */}
      {rowLayout && s3 && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Bed layout</Text>
          <BedTopDownMap
            widthM={s3.width_m}
            lengthM={s3.length_m}
            rows={rowLayout.rows}
            plantEmoji={getPlantEmoji}
            layerColor={getLayerColor}
            walkingPathCm={rowLayout.walkingPathCm}
            edgeBufferCm={rowLayout.edgeBufferCm}
            overflowCm={rowLayout.overflowCm}
          />
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        {summaryItems.map((item) => (
          <View key={item.icon} style={styles.summaryItemRow}>
            <Ionicons
              name={item.icon}
              size={16}
              color={theme.textSecondary}
              style={styles.summaryItemIcon}
            />
            <Text style={styles.summaryItemValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* First-harvest timeline */}
      {harvestPreview.length > 1 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>First harvest from this bed</Text>
          {harvestPreview.map((item) => {
            const maxDays = harvestPreview[harvestPreview.length - 1]!.days;
            const barWidth = Math.max(20, Math.round((item.days / maxDays) * 140));
            return (
              <View key={item.name} style={styles.gtHarvestRow}>
                <View style={styles.gtHarvestLabelCol}>
                  <Text style={styles.gtHarvestName}>
                    {item.emoji} {item.name}
                  </Text>
                </View>
                <View style={styles.gtHarvestBarTrack}>
                  <View style={[styles.gtHarvestBar, { width: barWidth }]} />
                </View>
                <Text style={styles.gtHarvestDays}>{item.days}d</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.autoTasksCard}>
        <Text style={styles.autoTasksTitle}>Auto-tasks that will be created</Text>
        <Text style={styles.autoTaskRow}>• Bed watering (min interval from plants)</Text>
        <Text style={styles.autoTaskRow}>• Jeevamrutha application (every 21 days)</Text>
        <Text style={styles.autoTaskRow}>• Weeding (every 14 days)</Text>
      </View>
    </ScrollView>
  );
}
