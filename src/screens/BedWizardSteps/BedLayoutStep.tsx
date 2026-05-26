import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { BedLayerStack } from '@/components/BedLayerStack';
import { BedPlantPickerSheet } from '@/components/BedPlantPickerSheet';
import { PlantEntryResolverSheet } from '@/components/PlantEntryResolverSheet';
import { computeRowLayout, getVisibleLayers } from '@/utils/rowLayoutEngine';
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

  // Position-aware row preview using northEdgeCm and eastPositionsCm from the engine.
  const bedRowsPreview = useMemo(() => {
    if (rowLayout.rows.length === 0) return [];
    return rowLayout.rows.map((row: import('@/utils/rowLayoutEngine').BedRow) => {
      // Unique plant names in display order (deduplicate within the row)
      const seen = new Set<string>();
      const uniquePlants: { name: string; emoji: string; isCompanion: boolean }[] = [];
      for (const p of row.plants) {
        if (!seen.has(p.name)) {
          seen.add(p.name);
          uniquePlants.push({
            name: p.name,
            emoji: PLANT_EMOJI_LAYOUT[p.name] ?? '🌱',
            isCompanion: p.isCompanion === true,
          });
        }
      }
      const plantCount = row.plants.length;
      // Show up to 4 position values, then "…"
      const positions = row.eastPositionsCm.slice(0, 4).map((cm: number) => `${cm}`);
      const posStr =
        row.eastPositionsCm.length > 4
          ? positions.join(', ') + '…'
          : positions.join(', ') + ' cm';
      return {
        rowIndex: row.rowIndex,
        layer: row.layer,
        northEdgeCm: row.northEdgeCm,
        plants: uniquePlants,
        plantCount,
        plantsPerRow: row.plantsPerRow,
        posStr,
      };
    });
  }, [rowLayout.rows]);

  // Whether any row uses the climber layer (needs trellis installation guidance).
  const hasTrellisRow = useMemo(
    () => rowLayout.rows.some((r: import('@/utils/rowLayoutEngine').BedRow) => r.layer === 'climber'),
    [rowLayout.rows]
  );

  // Layers to show in BedLayerStack — filtered to bed type + planted layers.
  const visibleLayers = useMemo(() => {
    if (!bedType) return undefined;
    const plantedLayers = new Set(step4.plant_entries.map((e) => e.layer as BedLayer));
    return getVisibleLayers(bedType, plantedLayers);
  }, [bedType, step4.plant_entries]);

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* ── Position-aware bed rows preview ──────────────────────────────── */}
      {bedRowsPreview.length > 0 && (
        <View style={styles.blRowPreviewCard}>
          <View style={styles.blRowPreviewHeader}>
            <Text style={styles.blRowPreviewTitle}>
              📐 {step3.width_m.toFixed(1)}m × {step3.length_m.toFixed(1)}m bed plan
            </Text>
            <Text style={styles.blRowPreviewCompass}>↑ N</Text>
          </View>
          {bedRowsPreview.map((row: { rowIndex: number; layer: string; northEdgeCm: number; plants: { name: string; emoji: string; isCompanion: boolean }[]; plantCount: number; plantsPerRow: number; posStr: string }) => (
            <View key={row.rowIndex} style={styles.blRowPreviewRow}>
              <View
                style={[
                  styles.blRowAccent,
                  { backgroundColor: LAYER_ACCENT_COLOR[row.layer as BedLayer] },
                ]}
              />
              <View style={styles.blRowDots}>
                {row.plants.map((p: { name: string; emoji: string; isCompanion: boolean }, i: number) => (
                  <View
                    key={i}
                    style={[styles.blRowDot, p.isCompanion && styles.blRowDotCompanion]}
                  >
                    <Text style={styles.blRowDotEmoji}>{p.emoji}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.blRowPositionInfo}>
                <Text style={styles.blRowPreviewRowLayer}>
                  {FARMER_LAYER_LABEL[row.layer as BedLayer]}
                </Text>
                <Text style={styles.blRowPositionText}>
                  {row.northEdgeCm}cm from N · {row.plantCount}×  at {row.posStr}
                </Text>
              </View>
            </View>
          ))}
          <Text style={styles.blRowPreviewSouth}>
            ↓ S · 60cm walking path · Tall crops North — won't shade shorter rows
          </Text>
        </View>
      )}

      {/* ── Trellis guidance ─────────────────────────────────────────────── */}
      {hasTrellisRow && (
        <View style={styles.blTrellisCard}>
          <Text style={styles.blTrellisText}>
            🔧 Trellis required — Install bamboo poles or wire frame on the North end,
            min 1.5 m height. Anchor firmly before sowing.
          </Text>
        </View>
      )}

      <BedLayerStack
        result={rowLayout}
        entries={step4.plant_entries}
        visibleLayers={visibleLayers}
        onAddToLayer={handleAddToLayer}
        onRemovePlant={handleRemovePlant}
        onResolveEntry={handleOpenResolver}
        onReorder={handleReorder}
      />

      <TouchableOpacity style={styles.blAddFab} onPress={handleOpenFab} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color={theme.textInverse} />
        <Text style={styles.blAddFabText}>Add Plant</Text>
      </TouchableOpacity>

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
