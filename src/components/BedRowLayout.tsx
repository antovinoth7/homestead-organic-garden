import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  LongPressGestureHandler,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import type {
  PanGestureHandlerEventPayload,
  GestureEvent,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles, ROW_TILE_STEP } from '@/styles/bedRowLayoutStyles';
import { computeTargetIndex } from '@/utils/dragRowMath';
import { getPlantEmoji } from '@/utils/plantHelpers';
import type { BedLayer, BedType, EntryResolution } from '@/types/database.types';
import { bedExpectsLegumes } from '@/config/beds';
import type { RowLayoutResult, BedRow, RowPlant } from '@/utils/rowLayoutEngine';
import { interleavePlants } from '@/utils/rowLayoutEngine';

// Enable LayoutAnimation on Android old architecture
const isNewArchitectureEnabled =
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager != null;

if (Platform.OS === 'android' && !isNewArchitectureEnabled) {
  try {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  } catch {
    // silently ignore
  }
}

export interface GhostRow {
  layer: BedLayer;
  plantsPerRow: number;
  spacingCm: number;
}

interface Props {
  result: RowLayoutResult;
  locationName?: string;
  solanaceaeBlocked: boolean;
  onAddToRow?: (layer: BedLayer) => void;
  onRemovePlant?: (id: string) => void;
  onReorder?: (layer: BedLayer, orderedIds: string[]) => void;
  ghostRows?: GhostRow[];
  onResolveEntry?: (entryId: string) => void;
  entryResolutions?: Map<string, EntryResolution>;
  resolvedNames?: Map<string, string>;
  onOpenPlant?: (plantId: string) => void;
  bedType?: BedType;
}

const LAYER_ICON: Record<BedLayer, string> = {
  canopy: '🌳',
  climber: '🌿',
  understory: '🌱',
  root: '🥕',
  ground_cover: '🌸',
};

const BENEFIT_LABEL: Record<string, string> = {
  nematode: 'nematode',
  'pest-repel': 'pest-repel',
  'self-seeds': 'self-seeds',
  'chop-drop': 'chop-drop',
  'n-fixer': 'N-fixer',
  'soil-builder': 'soil-builder',
};

function getRowDisplayName(layer: BedLayer, isStaggered: boolean): string {
  switch (layer) {
    case 'canopy':
      return 'Canopy row';
    case 'climber':
      return 'Climber row';
    case 'understory':
      return isStaggered ? 'Mid row B' : 'Mid row A';
    case 'root':
      return isStaggered ? 'Root row B' : 'Root row';
    case 'ground_cover':
      return 'Ground cover';
  }
}

// ─── PlantTile ────────────────────────────────────────────────────────────────

function resolutionLabel(
  res: EntryResolution | undefined,
  resolvedName?: string
): { text: string; resolved: boolean } {
  const kind = res?.kind ?? 'placeholder';
  if (kind === 'placeholder') return { text: 'Tap to link / add to My Plants', resolved: false };
  if (kind === 'link') return { text: `✓ ${resolvedName ?? 'Linked to plant'}`, resolved: true };
  const variety = res?.kind === 'create' ? res.variety : undefined;
  return { text: variety ? `✓ New: ${variety}` : '✓ New plant', resolved: true };
}

interface PlantTileProps {
  plant: RowPlant;
  layerBorderColor: string;
  onRemove?: () => void;
  resolution?: EntryResolution;
  resolvedName?: string;
  onResolveEntry?: () => void;
  onOpenPlant?: (plantId: string) => void;
}

function PlantTile({
  plant,
  layerBorderColor,
  onRemove,
  resolution,
  resolvedName,
  onResolveEntry,
  onOpenPlant,
}: PlantTileProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isCompanion = plant.isCompanion === true;
  const resLabel = onResolveEntry !== undefined ? resolutionLabel(resolution, resolvedName) : null;
  // A resolved "link" entry points at a saved plant — tapping opens its detail
  // screen; an unresolved placeholder opens the resolver sheet instead.
  const linkedPlantId = resolution?.kind === 'link' ? resolution.plantId : undefined;
  const handleResLabelPress =
    linkedPlantId !== undefined && onOpenPlant !== undefined
      ? () => onOpenPlant(linkedPlantId)
      : onResolveEntry;

  return (
    <View
      style={[
        isCompanion ? styles.plantTileCompanion : styles.plantTileMain,
        isCompanion ? null : { borderColor: layerBorderColor },
      ]}
    >
      <Text style={styles.plantTileEmoji}>{getPlantEmoji(plant.name)}</Text>
      <Text style={styles.plantTileName} numberOfLines={2}>
        {plant.name}
      </Text>
      <Text style={styles.plantTileSpacing}>
        {isCompanion
          ? `★ ${plant.spacingCm}cm`
          : plant.daysToHarvest !== undefined
            ? `${plant.spacingCm}cm · Day ${plant.daysToHarvest}`
            : `${plant.spacingCm}cm`}
      </Text>
      {resLabel !== null && (
        <TouchableOpacity
          onPress={handleResLabelPress}
          style={[styles.resolutionChip, resLabel.resolved && styles.resolutionChipResolved]}
        >
          <Text
            style={[styles.resolutionChipText, resLabel.resolved && styles.resolutionChipResolvedText]}
          >
            {resLabel.text}
          </Text>
        </TouchableOpacity>
      )}
      {onRemove !== undefined && (
        <TouchableOpacity style={styles.tileRemove} onPress={onRemove} hitSlop={6}>
          <Text style={styles.tileRemoveText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptySlot ────────────────────────────────────────────────────────────────

interface EmptySlotProps {
  spacingCm: number;
  borderColor: string;
  onPress?: () => void;
}

function EmptySlot({ spacingCm, borderColor, onPress }: EmptySlotProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const inner = (
    <View
      style={[
        styles.plantTileEmpty,
        onPress ? styles.plantTileEmptyTappable : null,
        { borderColor: onPress ? theme.primary : borderColor },
      ]}
    >
      <Text style={[styles.plantTileEmptyIcon, onPress ? { color: theme.primary } : null]}>+</Text>
      <Text style={styles.emptySlotSpacingText}>{spacingCm}cm</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

// ─── RowCard (accordion) ──────────────────────────────────────────────────────

interface RowCardProps {
  row: BedRow;
  onAddToRow?: (layer: BedLayer) => void;
  onRemovePlant?: (id: string) => void;
  onReorder?: (layer: BedLayer, orderedIds: string[]) => void;
  onResolveEntry?: (entryId: string) => void;
  entryResolutions?: Map<string, EntryResolution>;
  resolvedNames?: Map<string, string>;
  onOpenPlant?: (plantId: string) => void;
}

function RowCard({
  row,
  onAddToRow,
  onRemovePlant,
  onReorder,
  onResolveEntry,
  entryResolutions,
  resolvedNames,
  onOpenPlant,
}: RowCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // ── Drag-to-reorder state ────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const displayPlants = useMemo(() => interleavePlants(row.plants), [row.plants]);
  const [localPlants, setLocalPlants] = useState<RowPlant[]>(displayPlants);
  const startIdxRef = useRef(0);
  const currentIdxRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef(null);

  useEffect(() => {
    if (draggingId === null) setLocalPlants(displayPlants);
  }, [displayPlants, draggingId]);

  const beginDrag = useCallback(
    (id: string): void => {
      const idx = localPlants.findIndex((p) => p.id === id);
      if (idx === -1) return;
      startIdxRef.current = idx;
      currentIdxRef.current = idx;
      translateX.setValue(0);
      setDraggingId(id);
    },
    [localPlants, translateX]
  );

  const handlePan = useCallback(
    (event: GestureEvent<PanGestureHandlerEventPayload>): void => {
      if (draggingId === null) return;
      const tx = event.nativeEvent.translationX;
      const target = computeTargetIndex(startIdxRef.current, tx, localPlants.length, ROW_TILE_STEP);
      if (target !== currentIdxRef.current) {
        const next = [...localPlants];
        const [item] = next.splice(currentIdxRef.current, 1);
        if (item) {
          next.splice(target, 0, item);
          currentIdxRef.current = target;
          setLocalPlants(next);
        }
      }
      translateX.setValue(tx - (currentIdxRef.current - startIdxRef.current) * ROW_TILE_STEP);
    },
    [draggingId, localPlants, translateX]
  );

  const handlePanState = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>): void => {
      const s = event.nativeEvent.state;
      if (s !== State.END && s !== State.CANCELLED && s !== State.FAILED) return;
      if (draggingId === null) return;
      const orderedIds = localPlants
        .map((p) => p.id)
        .filter((id): id is string => id !== undefined);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setDraggingId(null);
        onReorder?.(row.layer, orderedIds);
      });
    },
    [draggingId, localPlants, onReorder, row.layer, translateX]
  );

  const borderColor = theme.layerColors[row.layer].color;
  const bgColor = theme.layerColors[row.layer].bg;
  const icon = LAYER_ICON[row.layer];
  const displayName = getRowDisplayName(row.layer, row.isStaggered);
  const hasNFixer = row.plants.some((p) => p.isNFixer);
  const isGndCover = row.layer === 'ground_cover';
  const mainPlantCount = row.plants.length - row.interplantedCount;
  const plantCount =
    row.interplantedCount > 0
      ? `${mainPlantCount} main + ${row.interplantedCount} companion`
      : `${row.plants.length} / ${row.plantsPerRow} plant${row.plantsPerRow !== 1 ? 's' : ''}`;
  const careTasks = Array.from(new Set(row.plants.flatMap((p) => p.careTasks ?? [])));
  const tileSpacingCm =
    row.plants.length > 0 ? Math.min(...row.plants.map((p) => p.spacingCm)) : 30;
  const emptySlotCount = Math.max(0, row.plantsPerRow - row.plants.length);

  return (
    <View style={[styles.rowCard, { borderColor, backgroundColor: bgColor }]}>
      <View style={[styles.rowAccentStripe, { backgroundColor: borderColor }]} />

      {/* Header */}
      <View style={[styles.rowHeader, { borderBottomColor: borderColor }]}>
        <View style={styles.rowHeaderTop}>
          <View style={[styles.rowNumCircle, { backgroundColor: borderColor }]}>
            <Text style={styles.rowNumText}>{row.rowIndex}</Text>
          </View>
          <Text style={styles.rowIcon}>{icon}</Text>
          <Text style={styles.rowNameText} numberOfLines={1}>
            {displayName}
          </Text>
          {onAddToRow !== undefined && (
            <TouchableOpacity
              style={styles.rowCardAddBtn}
              onPress={() => onAddToRow(row.layer)}
              hitSlop={4}
            >
              <Text style={styles.rowCardAddBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.badgeRow}>
          {hasNFixer && (
            <View style={styles.nFixerBadge}>
              <Text style={styles.nFixerBadgeText}>N-fixer</Text>
            </View>
          )}
          {isGndCover && (
            <View style={styles.fillsGapsBadge}>
              <Text style={styles.fillsGapsBadgeText}>Fills gaps</Text>
            </View>
          )}
          {row.isStaggered && (
            <View style={styles.staggeredBadge}>
              <Text style={styles.staggeredBadgeText}>Staggered</Text>
            </View>
          )}
          {!hasNFixer && !isGndCover && !row.isStaggered && (
            <View style={styles.mainCropBadge}>
              <Text style={styles.mainCropBadgeText}>Main crops</Text>
            </View>
          )}
          <Text style={styles.plantCountText}>{plantCount}</Text>
        </View>
      </View>

      {/* Plant tiles + care chips */}
      <>
        {onReorder !== undefined ? (
            <PanGestureHandler
              ref={panRef}
              enabled={draggingId !== null}
              onGestureEvent={handlePan}
              onHandlerStateChange={handlePanState}
            >
              <Animated.View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={draggingId === null}
                >
                  <View style={styles.plantTilesContainer}>
                    {localPlants.map((plant, idx) => {
                      const isDragging = draggingId === plant.id;
                      const canDrag = !plant.isCompanion && plant.id !== undefined;
                      const tileEl = (
                        <Animated.View
                          style={
                            isDragging
                              ? [
                                  styles.tileWrapperDragging,
                                  { transform: [{ translateX }, { scale: 1.05 }] },
                                ]
                              : undefined
                          }
                        >
                          <PlantTile
                            plant={plant}
                            layerBorderColor={borderColor}
                            resolution={entryResolutions?.get(plant.id ?? '')}
                            resolvedName={resolvedNames?.get(plant.id ?? '')}
                            onOpenPlant={onOpenPlant}
                            onResolveEntry={
                              onResolveEntry && plant.id !== undefined
                                ? () => onResolveEntry(plant.id!)
                                : undefined
                            }
                            onRemove={
                              onRemovePlant && plant.id !== undefined
                                ? () => onRemovePlant(plant.id!)
                                : undefined
                            }
                          />
                        </Animated.View>
                      );
                      return (
                        <React.Fragment key={plant.id ?? `${plant.name}_${idx}`}>
                          {canDrag ? (
                            <LongPressGestureHandler
                              minDurationMs={350}
                              simultaneousHandlers={panRef}
                              onActivated={() =>
                                plant.id !== undefined && beginDrag(plant.id)
                              }
                            >
                              {tileEl}
                            </LongPressGestureHandler>
                          ) : (
                            tileEl
                          )}
                        </React.Fragment>
                      );
                    })}
                    {Array.from({ length: emptySlotCount }, (_, i) => (
                      <EmptySlot
                        key={`empty-${i}`}
                        spacingCm={tileSpacingCm}
                        borderColor={borderColor}
                        onPress={onAddToRow ? () => onAddToRow(row.layer) : undefined}
                      />
                    ))}
                  </View>
                </ScrollView>
              </Animated.View>
            </PanGestureHandler>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.plantTilesContainer}>
                {displayPlants.map((plant, idx) => (
                  <React.Fragment key={plant.id ?? `${plant.name}_${idx}`}>
                    {idx > 0 && <View style={styles.tileGapDot} />}
                    <PlantTile
                      plant={plant}
                      layerBorderColor={borderColor}
                      resolution={entryResolutions?.get(plant.id ?? '')}
                      resolvedName={resolvedNames?.get(plant.id ?? '')}
                      onOpenPlant={onOpenPlant}
                      onResolveEntry={
                        onResolveEntry && plant.id !== undefined
                          ? () => onResolveEntry(plant.id!)
                          : undefined
                      }
                      onRemove={
                        onRemovePlant && plant.id !== undefined
                          ? () => onRemovePlant(plant.id!)
                          : undefined
                      }
                    />
                  </React.Fragment>
                ))}
                {Array.from({ length: emptySlotCount }, (_, i) => (
                  <EmptySlot
                    key={`empty-${i}`}
                    spacingCm={tileSpacingCm}
                    borderColor={borderColor}
                    onPress={onAddToRow ? () => onAddToRow(row.layer) : undefined}
                  />
                ))}
              </View>
            </ScrollView>
          )}

          {careTasks.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.careTaskChips}>
                {careTasks.map((task) => (
                  <View key={task} style={styles.careTaskChip}>
                    <Text style={styles.careTaskChipText}>{task}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </>
    </View>
  );
}

// ─── AvailableLayersSection ───────────────────────────────────────────────────

interface AvailableLayersSectionProps {
  ghostRows: GhostRow[];
  onAddToRow: (layer: BedLayer) => void;
}

function AvailableLayersSection({
  ghostRows,
  onAddToRow,
}: AvailableLayersSectionProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isExpanded, setIsExpanded] = useState(false);

  if (ghostRows.length === 0) return null;

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.availableLayersCard}>
      <TouchableOpacity style={styles.availableLayersHeader} onPress={toggle} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
        <Text style={styles.availableLayersTitle}>Available layers</Text>
        <View style={styles.availableLayersBadge}>
          <Text style={styles.availableLayersBadgeText}>{ghostRows.length}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.availableLayersList}>
          {ghostRows.map((ghost) => (
            <TouchableOpacity
              key={ghost.layer}
              style={styles.availableLayerItem}
              onPress={() => onAddToRow(ghost.layer)}
              activeOpacity={0.7}
            >
              <Text style={styles.availableLayerItemIcon}>{LAYER_ICON[ghost.layer]}</Text>
              <View style={styles.availableLayerItemTextBlock}>
                <Text style={styles.availableLayerItemName}>
                  {getRowDisplayName(ghost.layer, false)}
                </Text>
                <Text style={styles.availableLayerItemMeta}>
                  {ghost.plantsPerRow} slot{ghost.plantsPerRow !== 1 ? 's' : ''} · {ghost.spacingCm}
                  cm spacing
                </Text>
              </View>
              <View
                style={[
                  styles.availableLayerItemDot,
                  { backgroundColor: theme.layerColors[ghost.layer].color },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Rule helpers ────────────────────────────────────────────────────────────

interface Rule {
  text: string;
  ok: boolean;
}

function buildRules(
  result: RowLayoutResult,
  solanaceaeBlocked: boolean,
  bedType?: BedType
): Rule[] {
  const rules: Rule[] = [];
  const allPlants = result.rows.flatMap((r) => r.plants);

  const canopyRow = result.rows.find((r) => r.layer === 'canopy');
  if (canopyRow) {
    const name = canopyRow.plants[0]?.name ?? 'Canopy plant';
    rules.push({ text: `${name} at north end — won't shade mid crops`, ok: true });
  }

  const companion = allPlants.find((p) => p.isCompanion);
  if (companion) {
    rules.push({ text: `${companion.name} interplanted — companion coverage active`, ok: true });
  }

  const benefitPlant = allPlants.find((p) => p.benefitTag !== undefined);
  if (benefitPlant?.benefitTag) {
    const label = BENEFIT_LABEL[benefitPlant.benefitTag] ?? benefitPlant.benefitTag;
    rules.push({ text: `${benefitPlant.name} provides ${label} benefit`, ok: true });
  }

  rules.push(
    solanaceaeBlocked
      ? { text: 'Solanaceae grown recently — rotation break needed', ok: false }
      : { text: 'No Solanaceae conflict — rotation is safe', ok: true }
  );

  // Legume coverage only matters for bed types designed around nitrogen-fixers.
  if (bedType && bedExpectsLegumes(bedType)) {
    const total = allPlants.length;
    const nFix = allPlants.filter((p) => p.isNFixer).length;
    const pct = total > 0 ? Math.round((nFix / total) * 100) : 0;
    rules.push(
      pct >= 30
        ? { text: `Legume coverage ${pct}% — good nitrogen fixation`, ok: true }
        : { text: `Legume coverage ${pct}% — consider adding a legume`, ok: pct > 0 }
    );
  }

  const spareCm = result.bedLengthCm - result.usedLengthCm;
  rules.push(
    result.fitsInBed
      ? { text: `All ${result.rowsNeeded} rows fit · ${spareCm}cm spare`, ok: true }
      : { text: `${result.overflowCm}cm overflow — reduce plants or extend bed`, ok: false }
  );

  return rules;
}

// ─── BedInsightsAccordion ─────────────────────────────────────────────────────

function PlantingSchedule({ result }: { result: RowLayoutResult }): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (result.successionWeeks.length <= 1) return null;

  const byWeek = new Map<number, string[]>();
  for (const row of result.rows) {
    for (const plant of row.plants) {
      const week = plant.successionWeek ?? 1;
      const arr = byWeek.get(week) ?? [];
      arr.push(plant.name);
      byWeek.set(week, arr);
    }
  }

  const entries = Array.from(byWeek.entries()).sort(([a], [b]) => a - b);

  return (
    <View style={styles.scheduleSection}>
      <Text style={styles.scheduleSectionTitle}>PLANTING SCHEDULE</Text>
      {entries.map(([week, names]) => (
        <View key={week} style={styles.scheduleWeekRow}>
          <Text style={styles.scheduleWeekLabel}>
            {week === 1 ? 'Week 1 — Plant now' : `Week ${week}–${week + 1} — Plant later`}
          </Text>
          <View style={styles.scheduleTagsRow}>
            {names.map((name, i) => (
              <View
                key={`${name}_${i}`}
                style={[
                  styles.scheduleTag,
                  week === 1 ? styles.scheduleTagNow : styles.scheduleTagLater,
                ]}
              >
                <Text
                  style={[
                    styles.scheduleTagText,
                    week === 1 ? styles.scheduleTagTextNow : styles.scheduleTagTextLater,
                  ]}
                >
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function RulesPanel({
  result,
  solanaceaeBlocked,
  bedType,
}: {
  result: RowLayoutResult;
  solanaceaeBlocked: boolean;
  bedType?: BedType;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rules = useMemo(
    () => buildRules(result, solanaceaeBlocked, bedType),
    [result, solanaceaeBlocked, bedType]
  );

  return (
    <View style={styles.rulesPanel}>
      <Text style={styles.rulesPanelTitle}>RULES APPLIED AUTOMATICALLY</Text>
      {rules.map((rule, i) => (
        <View key={i} style={styles.ruleItem}>
          <Ionicons
            name={rule.ok ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color={rule.ok ? theme.success : theme.error}
          />
          <Text style={[styles.ruleText, rule.ok ? styles.ruleTextOk : styles.ruleTextWarn]}>
            {rule.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Legend(): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={styles.legendSwatchMain} />
        <Text style={styles.legendText}>Main crop</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.legendSwatchCompanion} />
        <Text style={styles.legendText}>★ Companion</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.legendSwatchGround} />
        <Text style={styles.legendText}>Ground cover</Text>
      </View>
    </View>
  );
}

interface BedInsightsAccordionProps {
  result: RowLayoutResult;
  solanaceaeBlocked: boolean;
  bedType?: BedType;
}

function BedInsightsAccordion({
  result,
  solanaceaeBlocked,
  bedType,
}: BedInsightsAccordionProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const rules = useMemo(
    () => buildRules(result, solanaceaeBlocked, bedType),
    [result, solanaceaeBlocked, bedType]
  );
  const warnings = rules.filter((r) => !r.ok).length;

  const [isExpanded, setIsExpanded] = useState(warnings > 0);

  const toggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  const summaryText =
    warnings === 0
      ? `${rules.length} checks · all good`
      : `${warnings} warning${warnings !== 1 ? 's' : ''} · tap to review`;

  return (
    <View style={styles.insightsCard}>
      <TouchableOpacity style={styles.insightsHeader} onPress={toggle} activeOpacity={0.7}>
        <Ionicons
          name={warnings === 0 ? 'checkmark-circle' : 'alert-circle'}
          size={16}
          color={warnings === 0 ? theme.success : theme.error}
        />
        <Text style={styles.insightsTitle}>Bed insights</Text>
        <Text style={[styles.insightsSummary, warnings > 0 && styles.insightsSummaryWarn]}>
          {summaryText}
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <>
          <PlantingSchedule result={result} />
          <RulesPanel result={result} solanaceaeBlocked={solanaceaeBlocked} bedType={bedType} />
          <Legend />
        </>
      )}
    </View>
  );
}

// ─── GhostRowCard (kept for backward compat with BedDetail screens) ───────────

export function GhostRowCard({
  ghost,
  onAddToRow,
}: {
  ghost: GhostRow;
  onAddToRow: (layer: BedLayer) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const borderColor = theme.layerColors[ghost.layer].color;
  const bgColor = theme.layerColors[ghost.layer].bg;
  const icon = LAYER_ICON[ghost.layer];
  const displayName = getRowDisplayName(ghost.layer, false);

  return (
    <View style={[styles.rowCard, { borderColor, backgroundColor: bgColor }]}>
      <View style={[styles.rowAccentStripe, { backgroundColor: borderColor }]} />
      <View style={[styles.rowHeader, { borderBottomColor: borderColor }]}>
        <View style={styles.rowHeaderTop}>
          <Text style={styles.rowIcon}>{icon}</Text>
          <Text style={styles.rowNameText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.mainCropBadge}>
            <Text style={styles.mainCropBadgeText}>EMPTY</Text>
          </View>
          <Text style={styles.plantCountText}>0 / {ghost.plantsPerRow} plants</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.plantTilesContainer}>
          {Array.from({ length: ghost.plantsPerRow }, (_, i) => (
            <EmptySlot
              key={i}
              spacingCm={ghost.spacingCm}
              borderColor={borderColor}
              onPress={() => onAddToRow(ghost.layer)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BedRowLayout({
  result,
  locationName,
  solanaceaeBlocked,
  onAddToRow,
  onRemovePlant,
  onReorder,
  ghostRows,
  onResolveEntry,
  entryResolutions,
  resolvedNames,
  onOpenPlant,
  bedType,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (result.rows.length === 0 && !ghostRows?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={28} color={theme.textTertiary} />
        <Text style={styles.emptyText}>
          Select plants in the previous step{'\n'}to see your row layout.
        </Text>
      </View>
    );
  }

  const topRow = result.rows[0];
  const topName = topRow
    ? getRowDisplayName(topRow.layer, topRow.isStaggered)
    : getRowDisplayName(ghostRows![0]!.layer, false);
  const widthM = (result.bedWidthCm / 100).toFixed(1);
  const lengthM = (result.bedLengthCm / 100).toFixed(1);
  const dimLabel = locationName
    ? `${locationName} · ${widthM}×${lengthM}m`
    : `${widthM} × ${lengthM}m`;
  const spareCm = result.bedLengthCm - result.usedLengthCm;
  const extraRowsFit = result.totalRowsFit;

  return (
    <View style={styles.container}>
      {/* Compass Header */}
      <View style={styles.compassHeader}>
        <Text style={styles.compassHeaderLeft}>↑ North — {topName}</Text>
        <Text style={styles.compassHeaderRight}>{dimLabel}</Text>
      </View>

      {/* Capacity strip — only when occupied rows exist */}
      {result.rows.length > 0 && (
        <View
          style={[
            styles.capacityStrip,
            result.fitsInBed ? styles.capacityStripOk : styles.capacityStripOver,
          ]}
        >
          <Ionicons
            name={result.fitsInBed ? 'checkmark-circle' : 'alert-circle'}
            size={13}
            color={result.fitsInBed ? theme.success : theme.error}
          />
          <Text
            style={[
              styles.capacityStripText,
              result.fitsInBed ? styles.capacityStripTextOk : styles.capacityStripTextOver,
            ]}
          >
            {result.fitsInBed
              ? `${result.rowsNeeded} rows · ${
                  result.edgeBufferCm
                }cm edge · ${spareCm}cm spare · ${extraRowsFit} more row${
                  extraRowsFit !== 1 ? 's' : ''
                } possible`
              : `${result.rowsNeeded} rows needed · ${result.overflowCm}cm over`}
          </Text>
        </View>
      )}

      {/* Accordion row cards — north to south */}
      {result.rows.map((row) => (
        <RowCard
          key={row.rowIndex}
          row={row}
          onAddToRow={onAddToRow}
          onRemovePlant={onRemovePlant}
          onReorder={onReorder}
          onResolveEntry={onResolveEntry}
          entryResolutions={entryResolutions}
          resolvedNames={resolvedNames}
          onOpenPlant={onOpenPlant}
        />
      ))}

      {/* Available layers (ghost rows) — collapsed accordion */}
      {ghostRows && ghostRows.length > 0 && (
        <AvailableLayersSection ghostRows={ghostRows} onAddToRow={onAddToRow ?? ((): void => {})} />
      )}

      {/* Bed insights — planting schedule + rules + legend, collapsed accordion */}
      {result.rows.length > 0 && (
        <BedInsightsAccordion
          result={result}
          solanaceaeBlocked={solanaceaeBlocked}
          bedType={bedType}
        />
      )}

      {/* Compass Footer */}
      <View style={styles.compassFooter}>
        <Text style={styles.compassFooterLeft}>↓ South — open sun end</Text>
        <Text style={styles.compassFooterRight}>{result.walkingPathCm}CM PATH EACH SIDE</Text>
      </View>
    </View>
  );
}
