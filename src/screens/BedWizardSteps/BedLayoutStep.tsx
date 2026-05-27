import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { BedRow } from '@/utils/rowLayoutEngine';
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


const PLANT_EMOJI_LAYOUT: Record<string, string> = {
  Amaranth: '🌿',
  Spinach: '🥬',
  Lettuce: '🥗',
  Fenugreek: '🌱',
  Tomato: '🍅',
  Brinjal: '🍆',
  'Ladies Finger': '🫛',
  Marigold: '🌼',
  Chilli: '🌶️',
  Ginger: '🫚',
  Turmeric: '🟡',
  'Curry Leaf': '🍃',
  Cowpea: '🫘',
  'French Beans': '🫘',
  Carrot: '🥕',
  Radish: '🌰',
  'Bitter Gourd': '🥒',
  'Snake Gourd': '🥒',
  'Yardlong Beans': '🫘',
  Banana: '🍌',
  Maize: '🌽',
  Beans: '🫘',
  Pumpkin: '🎃',
  Moringa: '🌳',
  Tulsi: '🌿',
  'Aloe Vera': '🌵',
  Lemongrass: '🌾',
  Basil: '🌿',
  Garlic: '🧄',
  'Black Pepper': '⚫',
  'Elephant Yam': '🥔',
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

  const hasTrellisRow = useMemo(
    () => rowLayout.rows.some((r: BedRow) => r.layer === 'climber'),
    [rowLayout.rows]
  );

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {/* ── Trellis guidance ─────────────────────────────────────────────── */}
      {hasTrellisRow && (
        <View style={styles.blTrellisCard}>
          <Text style={styles.blTrellisText}>
            🔧 Trellis required — Install bamboo poles or wire frame on the North end, min 1.5 m
            height. Anchor firmly before sowing.
          </Text>
        </View>
      )}

      {/* ── Row count summary ────────────────────────────────────────────── */}
      {rowLayout.rows.length > 0 && (
        <Text style={styles.blRowsUsedBadge}>{rowLayout.rows.length} rows used</Text>
      )}

      {/* ── Physical row cards (one card per engine row) ─────────────────── */}
      {rowLayout.rows.map((row: BedRow) => {
        const nameCount = new Map<string, number>();
        const entryIds: string[] = [];
        for (const plant of row.plants) {
          const nth = (nameCount.get(plant.name) ?? 0);
          nameCount.set(plant.name, nth + 1);
          const matches = step4.plant_entries.filter((e) => e.name === plant.name);
          const entry = matches[nth];
          entryIds.push(entry?.id ?? plant.id ?? '');
        }
        return (
          <View key={row.rowIndex} style={styles.blRowCard}>
            <View style={styles.blRowCardHeader}>
              <Text style={styles.blRowCardPos}>↑ {row.northEdgeCm}cm from N</Text>
              <View style={styles.blRowCardLayerBadge}>
                <Text style={styles.blRowCardLayerText}>{FARMER_LAYER_LABEL[row.layer]}</Text>
              </View>
              <TouchableOpacity
                style={styles.blRowCardAddBtn}
                onPress={() => handleAddToLayer(row.layer)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.blRowCardPlants}>
              {row.plants.map((plant, i) => (
                <View key={`${plant.name}-${i}`} style={styles.blRowChip}>
                  <Text style={styles.blRowChipEmoji}>
                    {PLANT_EMOJI_LAYOUT[plant.name] ?? '🌱'}
                  </Text>
                  <Text style={styles.blRowChipName} numberOfLines={1}>
                    {plant.name}
                  </Text>
                  <Text style={styles.blRowChipSpacing}>{plant.spacingCm}cm</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const id = entryIds[i];
                      if (id) handleRemovePlant(id);
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.blRowChipRemove}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        );
      })}

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
