import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedLayerStackStyles';
import { DraggablePlantRow } from '@/components/DraggablePlantRow';
import { LAYER_ORDER, LAYER_META } from '@/config/beds/layerMeta';
import { getPlantEmoji } from '@/utils/plantHelpers';
import type { RowLayoutResult } from '@/utils/rowLayoutEngine';
import type { BedLayer, EntryResolution, PlantEntry } from '@/types/database.types';

interface Props {
  result: RowLayoutResult;
  entries: PlantEntry[];
  visibleLayers?: BedLayer[]; // when provided, only these layers render (empty or not)
  onAddToLayer: (layer: BedLayer) => void;
  onRemovePlant: (entryId: string) => void;
  onResolveEntry: (entryId: string) => void;
  onReorder: (layer: BedLayer, orderedIds: string[]) => void;
}

function resolutionLabel(res: EntryResolution | undefined): { text: string; resolved: boolean } {
  const kind = res?.kind ?? 'placeholder';
  if (kind === 'placeholder') return { text: 'Tap to link / add to My Plants', resolved: false };
  if (kind === 'link') return { text: '✓ Linked to plant', resolved: true };
  const variety = res?.kind === 'create' ? res.variety : undefined;
  return { text: variety ? `✓ New: ${variety}` : '✓ New plant', resolved: true };
}

export function BedLayerStack({
  result,
  entries,
  visibleLayers,
  onAddToLayer,
  onRemovePlant,
  onResolveEntry,
  onReorder,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // isCompanion map derived from the engine's classification (template-aware).
  const isCompanionById = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of result.rows) {
      for (const p of row.plants) {
        if (p.id) map.set(p.id, p.isCompanion === true);
      }
    }
    return map;
  }, [result.rows]);

  // Entries grouped by layer, ordered by sortOrder (user-controlled).
  const entriesByLayer = useMemo(() => {
    const map = new Map<BedLayer, PlantEntry[]>();
    for (const layer of LAYER_ORDER) map.set(layer, []);
    const sorted = [...entries].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    for (const e of sorted) map.get(e.layer)?.push(e);
    return map;
  }, [entries]);

  const overflowing = result.overflowCm > 0;

  const renderPlantTile = (
    entry: PlantEntry,
    isDragging: boolean,
    accentColor: string
  ): React.ReactNode => {
    const { text: chipText, resolved } = resolutionLabel(entry.resolution);
    const isCompanion = isCompanionById.get(entry.id) === true;
    return (
      <View
        style={[
          styles.tile,
          { borderColor: accentColor },
          isCompanion ? styles.tileCompanion : null,
          isDragging ? styles.tileDragging : null,
        ]}
      >
        <Text style={styles.tileEmoji}>{getPlantEmoji(entry.name)}</Text>
        <Text style={styles.tileName} numberOfLines={2}>
          {entry.name}
        </Text>
        <Text style={styles.tileSpacing}>{entry.spacingCm}cm</Text>
        <TouchableOpacity
          onPress={() => onResolveEntry(entry.id)}
          style={[styles.resolutionChip, resolved && styles.resolutionChipResolved]}
        >
          <Text style={[styles.resolutionChipText, resolved && styles.resolutionChipResolvedText]}>
            {chipText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tileRemove}
          onPress={() => onRemovePlant(entry.id)}
          hitSlop={6}
        >
          <Text style={styles.tileRemoveText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.compass}>
        <Text style={styles.compassText}>↑ NORTH</Text>
        <Text style={styles.compassSub}>
          {(result.bedWidthCm / 100).toFixed(1)}m × {(result.bedLengthCm / 100).toFixed(1)}m
        </Text>
      </View>

      <View style={styles.capacityStrip}>
        <Text style={styles.capacityChip}>{result.rowsNeeded} rows used</Text>
        {result.totalRowsFit > 0 && (
          <Text style={styles.capacityChip}>+{result.totalRowsFit} more rows fit</Text>
        )}
        {overflowing && (
          <Text style={[styles.capacityChip, styles.capacityOverflow]}>
            ⚠ Too short by {Math.round(result.overflowCm)}cm
          </Text>
        )}
      </View>
      {overflowing && (
        <View style={styles.overflowActionRow}>
          <Text style={styles.overflowActionText}>
            Remove one crop row, or go back to Step 3 to increase bed length.
          </Text>
        </View>
      )}

      {(visibleLayers ?? LAYER_ORDER).map((layer) => {
        const meta = LAYER_META[layer];
        const layerColor = theme.layerColors[layer];
        const layerEntries = entriesByLayer.get(layer) ?? [];
        if (layerEntries.length === 0) {
          return (
            <View key={layer} style={styles.ghostCard}>
              <Text style={styles.ghostIcon}>{meta.icon}</Text>
              <View style={styles.ghostInfo}>
                <Text style={styles.ghostTitle}>{meta.title} — empty</Text>
                <Text style={styles.ghostSubtitle}>{meta.subtitle}</Text>
              </View>
              <TouchableOpacity style={styles.ghostAddBtn} onPress={() => onAddToLayer(layer)}>
                <Text style={styles.ghostAddBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          );
        }
        const companionCount = layerEntries.filter(
          (e) => isCompanionById.get(e.id) === true
        ).length;
        const mainCount = layerEntries.length - companionCount;
        return (
          <View
            key={layer}
            style={[
              styles.layerCard,
              { borderColor: layerColor.color, backgroundColor: layerColor.bg },
            ]}
          >
            <View style={[styles.layerAccent, { backgroundColor: layerColor.color }]} />
            <View style={styles.layerHeader}>
              <Text style={styles.layerIcon}>{meta.icon}</Text>
              <View style={styles.layerTitleCol}>
                <Text style={styles.layerTitle}>{meta.title}</Text>
                <Text style={styles.layerSubtitle}>{meta.subtitle}</Text>
              </View>
              <Text style={styles.layerCount}>
                {companionCount > 0 ? `${mainCount} + ${companionCount}★` : `${mainCount}`}
              </Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => onAddToLayer(layer)}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <DraggablePlantRow
              layer={layer}
              entries={layerEntries}
              onReorder={onReorder}
              renderTile={(entry, isDragging) => renderPlantTile(entry, isDragging, layerColor.color)}
            />
          </View>
        );
      })}

      <View style={styles.compass}>
        <Text style={styles.compassText}>↓ SOUTH</Text>
        <Text style={styles.compassSub}>walking path 60cm</Text>
      </View>
    </View>
  );
}
