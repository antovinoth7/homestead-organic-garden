import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { BedLayerStack } from '@/components/BedLayerStack';
import { BedPlantPickerSheet } from '@/components/BedPlantPickerSheet';
import { PlantEntryResolverSheet } from '@/components/PlantEntryResolverSheet';
import { computeRowLayout } from '@/utils/rowLayoutEngine';
import type { RowLayoutResult } from '@/utils/rowLayoutEngine';
import { getGuildTemplate } from '@/config/beds/guildTemplates';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import type { BedLayer, BedType, EntryResolution, PlantEntry } from '@/types/database.types';
import type { Step2Data, Step3Data, Step4Data } from '@/hooks/useBedCreationWizard';

const FARMER_LAYER_LABEL: Record<BedLayer, string> = {
  canopy: 'Shade Tree',
  climber: 'Trellis',
  understory: 'Main Crop',
  root: 'Underground',
  ground_cover: 'Border',
};

const LAYER_ACCENT_COLOR: Record<BedLayer, string> = {
  canopy: '#2e7d32',
  climber: '#7b1fa2',
  understory: '#558b2f',
  root: '#e65100',
  ground_cover: '#c8842a',
};

const PLANT_EMOJI_LAYOUT: Record<string, string> = {
  Amaranth: '🌿', Spinach: '🥬', Lettuce: '🥗', Fenugreek: '🌱', Tomato: '🍅',
  Brinjal: '🍆', Okra: '🫛', Marigold: '🌼', Chilli: '🌶️', Ginger: '🫚',
  Turmeric: '🟡', 'Curry Leaf': '🍃', Cowpea: '🫘', 'French Beans': '🫘',
  Carrot: '🥕', Radish: '🌰', 'Bitter Gourd': '🥒', 'Snake Gourd': '🥒',
  'Yardlong Beans': '🫘', Banana: '🍌', Maize: '🌽', Beans: '🫘', Pumpkin: '🎃',
  Moringa: '🌳', Tulsi: '🌿', 'Aloe Vera': '🌵', Lemongrass: '🌾', Basil: '🌿',
  Garlic: '🧄', 'Black Pepper': '⚫', 'Elephant Yam': '🥔',
};

const generateId = (): string =>
  `pe${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

function nextSortOrderForLayer(entries: PlantEntry[], layer: BedLayer): number {
  let max = -1;
  for (const e of entries) {
    if (e.layer === layer) {
      const so = e.sortOrder ?? 0;
      if (so > max) max = so;
    }
  }
  return max + 1;
}

interface Props {
  bedType: BedType | null;
  step2?: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
  solanaceaeBlocked?: boolean;
  onChangePlants: (patch: Partial<Step4Data>) => void;
  onCreateInFormForEntry: (entryId: string, variety: string | null) => void | Promise<void>;
}

export function BedLayoutStep({
  bedType,
  step2,
  step3,
  step4,
  onChangePlants,
  onCreateInFormForEntry,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [targetLayer, setTargetLayer] = useState<BedLayer | null>(null);
  const [resolveEntryId, setResolveEntryId] = useState<string | null>(null);

  const rowLayout = useMemo<RowLayoutResult>(() => {
    const baseResult: RowLayoutResult = {
      rows: [],
      rowsNeeded: 0,
      totalRowsFit: 0,
      usedLengthCm: 0,
      fitsInBed: true,
      overflowCm: 0,
      bedWidthCm: Math.round(step3.width_m * 100),
      bedLengthCm: Math.round(step3.length_m * 100),
      edgeBufferCm: 0,
      walkingPathCm: 60,
      companionWarnings: [],
      successionWeeks: [],
    };
    if (!bedType || step4.plant_entries.length === 0) return baseResult;
    const template = getGuildTemplate(bedType);
    const inputs = mapPlantEntriesToRowInputs(step4.plant_entries, template);
    if (inputs.length === 0) return baseResult;
    return computeRowLayout(
      inputs,
      step3.width_m,
      step3.length_m,
      bedType,
      step2?.construction_type
    );
  }, [bedType, step4.plant_entries, step3.width_m, step3.length_m, step2?.construction_type]);

  const handleAddToLayer = useCallback((layer: BedLayer): void => {
    setTargetLayer(layer);
    setPickerVisible(true);
  }, []);

  const handleOpenFab = useCallback((): void => {
    setTargetLayer(null);
    setPickerVisible(true);
  }, []);

  const handleRemovePlant = useCallback(
    (id: string): void => {
      onChangePlants({ plant_entries: step4.plant_entries.filter((e) => e.id !== id) });
    },
    [step4.plant_entries, onChangePlants]
  );

  const handleAddPlant = useCallback(
    (name: string, layer: BedLayer, spacingCm: number): void => {
      const newEntry: PlantEntry = {
        id: generateId(),
        name,
        layer,
        spacingCm,
        sortOrder: nextSortOrderForLayer(step4.plant_entries, layer),
      };
      onChangePlants({ plant_entries: [...step4.plant_entries, newEntry] });
      setPickerVisible(false);
    },
    [step4.plant_entries, onChangePlants]
  );

  const handleReorder = useCallback(
    (layer: BedLayer, orderedIds: string[]): void => {
      const orderIndex = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderIndex.set(id, idx));
      onChangePlants({
        plant_entries: step4.plant_entries.map((e) => {
          if (e.layer !== layer) return e;
          const idx = orderIndex.get(e.id);
          return idx === undefined ? e : { ...e, sortOrder: idx };
        }),
      });
    },
    [step4.plant_entries, onChangePlants]
  );

  const handleOpenResolver = useCallback((entryId: string): void => {
    setResolveEntryId(entryId);
  }, []);

  const handleResolve = useCallback(
    (resolution: EntryResolution): void => {
      if (!resolveEntryId) return;
      onChangePlants({
        plant_entries: step4.plant_entries.map((e) =>
          e.id === resolveEntryId ? { ...e, resolution } : e
        ),
      });
      setResolveEntryId(null);
    },
    [resolveEntryId, step4.plant_entries, onChangePlants]
  );

  const resolverEntry = useMemo(
    () => step4.plant_entries.find((e) => e.id === resolveEntryId) ?? null,
    [step4.plant_entries, resolveEntryId]
  );

  // Bed rows preview — visual dot data for each row.
  const bedRowsPreview = useMemo(() => {
    if (rowLayout.rows.length === 0) return [];
    return rowLayout.rows.map((row) => {
      const capped = row.plants.slice(0, 8);
      const overflow = Math.max(0, row.plants.length - 8);
      return {
        rowIndex: row.rowIndex,
        layer: row.layer,
        dots: capped.map((p) => ({
          name: p.name,
          emoji: PLANT_EMOJI_LAYOUT[p.name] ?? '🌱',
          isCompanion: p.isCompanion === true,
        })),
        overflow,
      };
    });
  }, [rowLayout.rows]);

  // Planting schedule grouped by succession_week from guild template.
  const plantingSchedule = useMemo(() => {
    if (!bedType || step4.plant_entries.length === 0) return [];
    const template = getGuildTemplate(bedType);
    const weekMap = new Map<number, string[]>();
    const seen = new Set<string>();
    for (const entry of step4.plant_entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      const row = template.plant_rows.find((r) => r.name === entry.name);
      const week = row?.succession_week ?? 1;
      const existing = weekMap.get(week) ?? [];
      weekMap.set(week, [...existing, entry.name]);
    }
    return Array.from(weekMap.entries()).sort(([a], [b]) => a - b);
  }, [bedType, step4.plant_entries]);

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* ── Bed rows preview ─────────────────────────────────────────────── */}
      {bedRowsPreview.length > 0 && (
        <View style={styles.blRowPreviewCard}>
          <View style={styles.blRowPreviewHeader}>
            <Text style={styles.blRowPreviewTitle}>
              📐 {step3.width_m.toFixed(1)}m × {step3.length_m.toFixed(1)}m bed plan
            </Text>
            <Text style={styles.blRowPreviewCompass}>↑ N</Text>
          </View>
          {bedRowsPreview.map((row) => (
            <View key={row.rowIndex} style={styles.blRowPreviewRow}>
              <View
                style={[
                  styles.blRowAccent,
                  { backgroundColor: LAYER_ACCENT_COLOR[row.layer as BedLayer] },
                ]}
              />
              <View style={styles.blRowDots}>
                {row.dots.map((dot, i) => (
                  <View
                    key={i}
                    style={[styles.blRowDot, dot.isCompanion && styles.blRowDotCompanion]}
                  >
                    <Text style={styles.blRowDotEmoji}>{dot.emoji}</Text>
                  </View>
                ))}
                {row.overflow > 0 && (
                  <Text style={styles.blRowOverflow}>+{row.overflow}</Text>
                )}
              </View>
              <Text style={styles.blRowPreviewRowLayer}>
                {FARMER_LAYER_LABEL[row.layer as BedLayer]}
              </Text>
            </View>
          ))}
          <Text style={styles.blRowPreviewSouth}>↓ S · 60cm walking path</Text>
        </View>
      )}

      <BedLayerStack
        result={rowLayout}
        entries={step4.plant_entries}
        onAddToLayer={handleAddToLayer}
        onRemovePlant={handleRemovePlant}
        onResolveEntry={handleOpenResolver}
        onReorder={handleReorder}
      />

      <TouchableOpacity style={styles.blAddFab} onPress={handleOpenFab} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={theme.textInverse} />
        <Text style={styles.blAddFabText}>Add Plant</Text>
      </TouchableOpacity>

      {/* ── Planting schedule ────────────────────────────────────────────── */}
      {plantingSchedule.length > 0 && (
        <View style={styles.blScheduleCard}>
          <Text style={styles.blScheduleTitle}>PLANTING SCHEDULE</Text>
          {plantingSchedule.map(([week, names]: [number, string[]]) => (
            <View key={week} style={styles.blScheduleWeekRow}>
              <Text style={styles.blScheduleWeekLabel}>
                {week === 1 ? 'Week 1\n(Plant now)' : `Week ${week}`}
              </Text>
              <Text style={styles.blSchedulePlantNames}>
                {names.map((n) => `${PLANT_EMOJI_LAYOUT[n] ?? '🌱'} ${n}`).join('  ·  ')}
              </Text>
            </View>
          ))}
        </View>
      )}

      <BedPlantPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        bedType={bedType}
        step2={step2}
        step3={step3}
        currentEntries={step4.plant_entries}
        preselectedLayer={targetLayer}
        onAdd={handleAddPlant}
      />

      <PlantEntryResolverSheet
        visible={resolveEntryId !== null}
        entry={resolverEntry}
        onClose={() => setResolveEntryId(null)}
        onResolve={handleResolve}
        onCreateInForm={(variety) => {
          const entryId = resolveEntryId;
          setResolveEntryId(null);
          if (entryId) return onCreateInFormForEntry(entryId, variety);
        }}
      />
    </ScrollView>
  );
}
