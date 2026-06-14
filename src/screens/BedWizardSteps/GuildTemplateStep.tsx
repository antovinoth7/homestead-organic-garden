import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { BedType, BedLayer, CropFamily, PlantEntry } from '@/types/database.types';
import { Step2Data, Step3Data, Step4Data } from '@/hooks/useBedCreationWizard';
import {
  getGuildTemplate,
  validateCompanionPair,
  DYNAMIC_ACCUMULATORS,
  getPlantingSequence,
} from '@/config/beds';
import type { PlantRow } from '@/config/beds/guildTemplates';
import { computeRowLayout, maxFitForSpecies, computePlantsPerRow } from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
import {
  buildQuickStartPlan,
  COMPANION_DEFAULT_LAYER,
  COMPANION_DEFAULT_SPACING,
} from '@/utils/quickStartPlanner';
import { getPlantEmoji } from '@/utils/plantHelpers';
import { createStyles } from '@/styles/bedCreationWizardStyles';

const generateId = (): string =>
  `pe${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

interface Props {
  bedType: BedType | null;
  data: Step4Data;
  onChange: (data: Partial<Step4Data>) => void;
  step2?: Step2Data;
  step3?: Step3Data;
}

const ROTATION_HINT: Partial<Record<CropFamily, string>> = {
  legume: '✓ After legume — soil N is replenished, suits heavy feeders',
  cucurbit: '→ After cucurbit — light feeder mix preferred',
  brassica: '→ After brassica — good rotation for most guilds',
  allium: '✓ After allium — beneficial for most companions',
};

const ACCUMULATOR_DEFAULT_LAYER: BedLayer = 'understory';
const ACCUMULATOR_DEFAULT_SPACING = 60;
const DEFAULT_BED_WIDTH_M = 1.2;
const DEFAULT_BED_LENGTH_M = 3.0;

const LAYER_LABEL: Record<string, string> = {
  canopy: 'Tall / Shade Tree',
  understory: 'Main Crop',
  ground_cover: 'Border / Mulch',
  climber: 'Trellis Crop',
  root: 'Underground Crop',
};

const BENEFIT_TAG_LABEL: Record<string, string> = {
  'n-fixer': 'Feeds Soil N',
  'pest-repel': 'Repels Pests',
  nematode: 'Nematode Control',
  'chop-drop': 'Chop & Drop',
  'soil-builder': 'Soil Builder',
};

interface PlantQtyStepperProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

function PlantQtyStepper({
  count,
  onIncrement,
  onDecrement,
  disabled,
}: PlantQtyStepperProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const canDecrement = count > 0;
  return (
    <View style={styles.gtQtyStepper}>
      <TouchableOpacity
        style={[styles.gtQtyBtn, styles.gtQtyBtnMinus, !canDecrement && styles.gtQtyBtnDisabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
        hitSlop={6}
      >
        <Text style={styles.gtQtyBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.gtQtyValue, count === 0 && styles.gtQtyValueZero]}>{count}</Text>
      <TouchableOpacity
        style={[styles.gtQtyBtn, styles.gtQtyBtnPlus, disabled && styles.gtQtyBtnDisabled]}
        onPress={onIncrement}
        disabled={disabled}
        hitSlop={6}
      >
        <Text style={[styles.gtQtyBtnText, styles.gtQtyBtnTextPlus]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

export function GuildTemplateStep({
  bedType,
  data,
  onChange,
  step2,
  step3,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const template = bedType ? getGuildTemplate(bedType) : null;

  const [autoAddedMsg, setAutoAddedMsg] = useState<string | null>(null);
  const quickStartApplied = data.quick_start_applied ?? false;
  const [companionsExpanded, setCompanionsExpanded] = useState(true);
  const [soilBuildersExpanded, setSoilBuildersExpanded] = useState(false);

  // Auto-dismiss the companion notification after 4 seconds
  useEffect(() => {
    if (autoAddedMsg === null) return;
    const timer = setTimeout(() => setAutoAddedMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [autoAddedMsg]);

  const plantRowNames = useMemo(
    () => new Set(template?.plant_rows.map((r) => r.name) ?? []),
    [template]
  );

  const companionSuggestions = useMemo(() => {
    if (!template) return [];
    const all = new Set<string>();
    for (const row of template.plant_rows) {
      for (const comp of row.companion_plants) {
        if (!plantRowNames.has(comp)) all.add(comp);
      }
    }
    return Array.from(all);
  }, [template, plantRowNames]);

  const plantingSequence = useMemo(
    () => (template ? getPlantingSequence(template) : []),
    [template]
  );

  const getBlockedReason = useCallback(
    (plantName: string): string | null => {
      for (const entry of data.plant_entries) {
        if (entry.name === plantName) continue;
        const result = validateCompanionPair(plantName, entry.name);
        if (!result.valid) return result.reason ?? 'Antagonist pair';
      }
      return null;
    },
    [data.plant_entries]
  );

  // ── Bed-capacity calculations ───────────────────────────────────────────────
  const widthM = step3?.width_m ?? DEFAULT_BED_WIDTH_M;
  const lengthM = step3?.length_m ?? DEFAULT_BED_LENGTH_M;
  const construction = step2?.construction_type;
  const bedTypeForEngine: BedType = bedType ?? 'leafy';

  const currentInputs = useMemo(
    () => mapPlantEntriesToRowInputs(data.plant_entries, template),
    [data.plant_entries, template]
  );

  // candidate for one instance of a species — used in capacity probes.
  const candidateForRow = useCallback(
    (row: PlantRow): RowPlantInput => ({
      name: row.name,
      layer: row.layer,
      spacingCm: row.spacing_cm,
      cropFamily: row.crop_family,
      daysToHarvest: row.days_to_harvest,
      benefitTag: row.benefit_tag,
      careTasks: row.care_tasks,
      isCompanion: row.is_companion,
      successionWeek: row.succession_week,
    }),
    []
  );

  const candidateForCompanion = useCallback(
    (name: string): RowPlantInput => ({
      name,
      layer: COMPANION_DEFAULT_LAYER,
      spacingCm: COMPANION_DEFAULT_SPACING,
      isCompanion: true,
    }),
    []
  );

  const candidateForAccumulator = useCallback(
    (name: string): RowPlantInput => ({
      name,
      layer: ACCUMULATOR_DEFAULT_LAYER,
      spacingCm: ACCUMULATOR_DEFAULT_SPACING,
    }),
    []
  );

  // Map of species name → how many MORE of that species can be added on top of current.
  const maxFitMap = useMemo(() => {
    const m = new Map<string, number>();
    if (!template) return m;
    for (const row of template.plant_rows) {
      m.set(
        row.name,
        maxFitForSpecies(
          candidateForRow(row),
          currentInputs,
          widthM,
          lengthM,
          bedTypeForEngine,
          construction
        )
      );
    }
    for (const comp of companionSuggestions) {
      m.set(
        comp,
        maxFitForSpecies(
          candidateForCompanion(comp),
          currentInputs,
          widthM,
          lengthM,
          bedTypeForEngine,
          construction
        )
      );
    }
    for (const acc of DYNAMIC_ACCUMULATORS) {
      m.set(
        acc.name,
        maxFitForSpecies(
          candidateForAccumulator(acc.name),
          currentInputs,
          widthM,
          lengthM,
          bedTypeForEngine,
          construction
        )
      );
    }
    return m;
  }, [
    template,
    companionSuggestions,
    currentInputs,
    widthM,
    lengthM,
    bedTypeForEngine,
    construction,
    candidateForRow,
    candidateForCompanion,
    candidateForAccumulator,
  ]);

  // ── Companion & accumulator capacity ────────────────────────────────────────

  // Sum of (plantsPerRow − 1) gaps across every main-crop row currently planted.
  const totalInterplantSlots = useMemo(() => {
    if (!template) return 0;
    const widthCm = widthM * 100;
    let slots = 0;
    for (const row of template.plant_rows) {
      const count = data.plant_entries.filter((e) => e.name === row.name).length;
      if (count === 0) continue;
      const ppr = computePlantsPerRow(widthCm, row.spacing_cm);
      const rowCount = Math.ceil(count / ppr);
      slots += rowCount * Math.max(0, ppr - 1);
    }
    return slots;
  }, [data.plant_entries, template, widthM]);

  // Perimeter-based border slots for chop-and-drop accumulators.
  const totalAccumulatorSlots = useMemo(
    () => Math.floor((2 * (widthM + lengthM) * 100) / ACCUMULATOR_DEFAULT_SPACING),
    [widthM, lengthM]
  );

  const totalCompanionsPlaced = useMemo(
    () => data.plant_entries.filter((e) => companionSuggestions.includes(e.name)).length,
    [data.plant_entries, companionSuggestions]
  );

  const totalAccumulatorsPlaced = useMemo(
    () =>
      data.plant_entries.filter((e) => DYNAMIC_ACCUMULATORS.some((a) => a.name === e.name)).length,
    [data.plant_entries]
  );

  const noInterplantSlots = totalInterplantSlots === 0;

  // True per-species capacity comes from maxFitMap (the same row-layout engine Step 5
  // uses), so the slot-status text never contradicts a disabled "+" button.
  const anyCompanionFits = companionSuggestions.some((c: string) => (maxFitMap.get(c) ?? 0) > 0);
  const anyAccumulatorFits = DYNAMIC_ACCUMULATORS.some((a) => (maxFitMap.get(a.name) ?? 0) > 0);

  // ── Increment / decrement handlers ──────────────────────────────────────────

  const incrementPlant = useCallback(
    (candidate: RowPlantInput, isMainCrop: boolean, companionsToAutoAdd?: string[]): void => {
      setAutoAddedMsg(null);
      // Antagonist check vs any *different* species already in the bed
      for (const entry of data.plant_entries) {
        if (entry.name === candidate.name) continue;
        const result = validateCompanionPair(candidate.name, entry.name);
        if (!result.valid) return;
      }

      const bedWidthCm = Math.round(widthM * 100);
      const plantsToAdd = isMainCrop ? computePlantsPerRow(bedWidthCm, candidate.spacingCm) : 1;

      // Capacity check — ground truth from the same row-layout engine Step 5 uses.
      // Mains need room for a full row; companions/accumulators need room for one.
      const remaining = maxFitMap.get(candidate.name) ?? 0;
      if (remaining < plantsToAdd) return;

      const instanceCount = data.plant_entries.filter((e) => e.name === candidate.name).length;
      const makeEntry = (name: string, layer: BedLayer, spacingCm: number): PlantEntry => ({
        id: generateId(),
        name,
        layer,
        spacingCm,
      });

      // Add one full row (plantsToAdd plants) per tap for main crops; 1 for companions
      const newEntries: PlantEntry[] = [
        ...data.plant_entries,
        ...Array.from({ length: plantsToAdd }, () =>
          makeEntry(candidate.name, candidate.layer, candidate.spacingCm)
        ),
      ];

      // On first add of a main crop, auto-add recommended companions that fit
      const addedCompanions: string[] = [];
      if (instanceCount === 0 && companionsToAutoAdd && companionsToAutoAdd.length > 0) {
        // Cap auto-add to available gap slots so companions never spill into their own rows.
        let gapSlots = 0;
        if (template) {
          for (const tRow of template.plant_rows) {
            const cnt = newEntries.filter((e) => e.name === tRow.name).length;
            if (cnt === 0) continue;
            const ppr = computePlantsPerRow(bedWidthCm, tRow.spacing_cm);
            gapSlots += Math.ceil(cnt / ppr) * Math.max(0, ppr - 1);
          }
        }
        const alreadyPlaced = newEntries.filter((e) => companionSuggestions.includes(e.name)).length;
        let slotsRemaining = Math.max(0, gapSlots - alreadyPlaced);

        for (const compName of companionsToAutoAdd) {
          if (slotsRemaining <= 0) break;
          if (newEntries.some((e) => e.name === compName)) continue;
          let antag = false;
          for (const existing of newEntries) {
            if (existing.name === compName) continue;
            const r = validateCompanionPair(compName, existing.name);
            if (!r.valid) {
              antag = true;
              break;
            }
          }
          if (antag) continue;
          const compCandidate = candidateForCompanion(compName);
          const trialInputs = mapPlantEntriesToRowInputs(newEntries, template);
          const fitResult = computeRowLayout(
            [...trialInputs, { ...compCandidate, id: `${compName}_probe` }],
            widthM,
            lengthM,
            bedTypeForEngine,
            construction
          );
          if (!fitResult.fitsInBed) continue;
          newEntries.push(makeEntry(compName, COMPANION_DEFAULT_LAYER, COMPANION_DEFAULT_SPACING));
          addedCompanions.push(compName);
          slotsRemaining--;
        }
      }

      onChange({ plant_entries: newEntries, quick_start_applied: false });
      if (addedCompanions.length > 0) {
        const label = addedCompanions.length === 1 ? 'companion' : 'companions';
        setAutoAddedMsg(`✓ Also added to your bed: ${addedCompanions.join(', ')} (${label})`);
      }
    },
    [
      data.plant_entries,
      template,
      widthM,
      lengthM,
      bedTypeForEngine,
      construction,
      maxFitMap,
      candidateForCompanion,
      companionSuggestions,
      onChange,
      setAutoAddedMsg,
    ]
  );

  const decrementPlant = useCallback(
    (plantName: string, spacingCm: number, isMainCrop: boolean): void => {
      setAutoAddedMsg(null);
      const bedWidthCm = Math.round(widthM * 100);
      const plantsToRemove = isMainCrop ? computePlantsPerRow(bedWidthCm, spacingCm) : 1;
      let toRemove = plantsToRemove;
      const next = [...data.plant_entries];
      for (let i = next.length - 1; i >= 0 && toRemove > 0; i--) {
        if (next[i]!.name === plantName) {
          next.splice(i, 1);
          toRemove--;
        }
      }
      onChange({ plant_entries: next, quick_start_applied: false });
    },
    [data.plant_entries, widthM, onChange]
  );

  // Capacity text: shows "N rows × M = total" for main crops; "fits ~N" for companions.
  const capacityText = useCallback(
    (candidate: RowPlantInput, count: number, isMainCrop: boolean): string => {
      const remaining = maxFitMap.get(candidate.name) ?? 0;

      if (isMainCrop) {
        const bedWidthCm = Math.round(widthM * 100);
        const ppr = computePlantsPerRow(bedWidthCm, candidate.spacingCm);
        const rowsCanAdd = Math.floor(remaining / ppr);

        if (remaining === 0 && count === 0) return 'Too big for bed';
        if (count === 0) {
          if (rowsCanAdd === 0) return 'Too big for bed';
          return rowsCanAdd === 1
            ? `${ppr} plants (1 row)`
            : `${rowsCanAdd} rows × ${ppr} = ${rowsCanAdd * ppr}`;
        }
        const suffix =
          rowsCanAdd === 0
            ? 'Bed full'
            : rowsCanAdd === 1
              ? '1 more row fits'
              : `${rowsCanAdd} more rows fit`;
        return `${count} plants · ${suffix}`;
      }

      if (remaining === 0 && count === 0) return 'Too big for bed';
      if (remaining === 0) return 'Bed full';
      if (count === 0) return `fits ~${remaining}`;
      return `~${remaining} more fit`;
    },
    [maxFitMap, widthM]
  );

  // One-tap: seed a balanced, companion-inclusive guild sized to the bed. The diversity-first
  // planner (see buildQuickStartPlan) guarantees companions are seeded before mains are topped
  // up, so they aren't starved of bed capacity.
  const handleUseFullPlan = useCallback(() => {
    if (!template) return;
    setAutoAddedMsg(null);
    const { entries, dropped } = buildQuickStartPlan(
      template,
      widthM,
      lengthM,
      bedTypeForEngine,
      construction
    );
    onChange({ plant_entries: entries, quick_start_applied: true });
    if (dropped.length > 0) {
      setAutoAddedMsg(`⚠️ Bed full — couldn't fit ${dropped.join(', ')}. Try a larger bed size.`);
    }
  }, [template, widthM, lengthM, bedTypeForEngine, construction, onChange]);

  const handleReset = useCallback(() => {
    onChange({ plant_entries: [], quick_start_applied: false });
    setAutoAddedMsg(null);
  }, [onChange]);

  if (!template) {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Guild Template</Text>
        <Text style={styles.stepSubtitle}>Select a bed type in Step 1 first.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      {autoAddedMsg !== null && (
        <View style={styles.gtAutoAddedBanner}>
          <Text style={styles.gtAutoAddedBannerText}>{autoAddedMsg}</Text>
          <TouchableOpacity
            onPress={() => setAutoAddedMsg(null)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Text style={styles.gtAutoAddedBannerDismiss}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.gtUseFullPlanBtn, quickStartApplied && styles.gtUseFullPlanBtnApplied]}>
        <View style={styles.gtQuickStartTextCol}>
          <Text
            style={[styles.gtQuickStartTitle, quickStartApplied && styles.gtQuickStartTitleApplied]}
          >
            {quickStartApplied ? '✓ Quick Start applied' : '⚡ Quick Start'}
          </Text>
          <Text style={styles.gtQuickStartSubtitle} numberOfLines={1}>
            {quickStartApplied
              ? `Balanced ${template.label} guild`
              : `Auto-fill a balanced ${template.label}`}
          </Text>
        </View>

        {quickStartApplied ? (
          <TouchableOpacity
            style={styles.gtQuickStartIconBtn}
            onPress={handleReset}
            activeOpacity={0.8}
            accessibilityLabel="Clear Quick Start plan"
          >
            <Ionicons name="refresh" size={16} color={theme.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.gtQuickStartPill}
            onPress={handleUseFullPlan}
            activeOpacity={0.8}
          >
            <Text style={styles.gtQuickStartPillText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>

      {data.plant_entries.length === 0 && (
        <Text style={styles.gtEmptyHint}>
          Add at least one crop, or tap Quick Start above to auto-fill.
        </Text>
      )}

      {template.low_light_flag && (
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>
            🌥️ Low-light bed — shade-tolerant plants recommended
          </Text>
        </View>
      )}

      {step2?.prev_crop_family && ROTATION_HINT[step2.prev_crop_family] && (
        <View style={styles.gtRotationHint}>
          <Text style={styles.gtRotationHintText}>{ROTATION_HINT[step2.prev_crop_family]}</Text>
        </View>
      )}

      {plantingSequence.length > 0 && (
        <View style={styles.sequenceCard}>
          <Text style={styles.sequenceTitle}>Planting Sequence</Text>
          <Text style={styles.sequenceSubtitle}>Suggested sowing order for this guild</Text>
          {plantingSequence.map((seq) => (
            <View key={seq.week} style={styles.sequenceRow}>
              <Text style={styles.sequenceWeek}>Week {seq.week}</Text>
              <Text style={styles.sequenceAction}>{seq.action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Template plants ─────────────────────────────────────────────── */}
      <Text style={styles.gtSectionHeader}>MAIN CROPS</Text>

      {template.plant_rows.map((row) => {
        const candidate = candidateForRow(row);
        const instanceCount = data.plant_entries.filter((e) => e.name === row.name).length;
        const isSelected = instanceCount > 0;
        const blockedReason = !isSelected ? getBlockedReason(row.name) : null;
        const isBlocked = !!blockedReason;
        const remaining = maxFitMap.get(row.name) ?? 0;
        const emoji = getPlantEmoji(row.name);
        const layerLabel = LAYER_LABEL[row.layer] ?? row.layer.replace(/_/g, ' ');
        const isMain = row.is_companion !== true;
        const speciesPPR = isMain
          ? computePlantsPerRow(Math.round(widthM * 100), row.spacing_cm)
          : 1;
        const capReached = remaining < speciesPPR;
        const autoCompanions =
          isMain && row.companion_plants.length > 0 ? row.companion_plants : undefined;

        return (
          <View
            key={row.name}
            style={[
              styles.gtPlantCard,
              isSelected && styles.gtPlantCardSelected,
              isBlocked && styles.gtPlantCardBlocked,
            ]}
          >
            <View style={[styles.gtEmojiCircle, isSelected && styles.gtEmojiCircleSelected]}>
              <Text style={styles.gtEmoji}>{emoji}</Text>
            </View>

            <View style={styles.gtPlantMeta}>
              <View style={styles.gtPlantNameRow}>
                <Text
                  style={[styles.gtPlantName, isBlocked && styles.gtPlantNameBlocked]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {row.name}
                </Text>
              </View>
              <View style={styles.gtBadgeRow}>
                <View style={[styles.gtLayerBadge, isSelected && styles.gtLayerBadgeSelected]}>
                  <Text
                    style={[styles.gtLayerBadgeText, isSelected && styles.gtLayerBadgeTextSelected]}
                  >
                    {layerLabel}
                  </Text>
                </View>
                {row.crop_family === 'legume' && (
                  <View style={styles.gtNFixerBadge}>
                    <Text style={styles.gtNFixerBadgeText}>Feeds Soil N</Text>
                  </View>
                )}
                {row.benefit_tag && row.benefit_tag !== 'n-fixer' && (
                  <View style={styles.gtBenefitTagBadge}>
                    <Text style={styles.gtBenefitTagBadgeText}>
                      {BENEFIT_TAG_LABEL[row.benefit_tag] ?? row.benefit_tag}
                    </Text>
                  </View>
                )}
                {row.days_to_harvest !== undefined && (
                  <View style={styles.gtHarvestBadge}>
                    <Text style={styles.gtHarvestBadgeText}>{row.days_to_harvest}d harvest</Text>
                  </View>
                )}
              </View>
              {isBlocked && <Text style={styles.gtAntagonistText}>⛔ {blockedReason}</Text>}
              {step2?.waterlogging_risk && row.needs_good_drainage && (
                <View style={styles.gtDrainageBadge}>
                  <Text style={styles.gtDrainageBadgeText}>⚠ Needs drainage</Text>
                </View>
              )}
            </View>

            <View style={styles.gtPlantRight}>
              <Text style={styles.gtSpacingCompact}>↔{row.spacing_cm}cm</Text>
              <Text style={styles.gtPlantCountTag}>
                {capacityText(candidate, instanceCount, isMain)}
              </Text>
              {(() => {
                const bedWidthCm = Math.round(widthM * 100);
                const speciesPPR = isMain ? computePlantsPerRow(bedWidthCm, row.spacing_cm) : 1;
                const rowsAdded = isMain ? Math.round(instanceCount / speciesPPR) : instanceCount;
                return (
                  <PlantQtyStepper
                    count={rowsAdded}
                    onIncrement={() => incrementPlant(candidate, isMain, autoCompanions)}
                    onDecrement={() => decrementPlant(row.name, row.spacing_cm, isMain)}
                    disabled={isBlocked || capReached}
                  />
                );
              })()}
            </View>
          </View>
        );
      })}

      {/* ── Companion suggestions (collapsible) ─────────────────────────── */}
      {companionSuggestions.length > 0 && (
        <>
          <TouchableOpacity
            style={[styles.gtSectionHeaderMt, styles.gtCollapsibleHeader]}
            onPress={() => setCompanionsExpanded((v: boolean) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.gtSectionHeader}>
              HELPFUL COMPANIONS ({companionSuggestions.length})
            </Text>
            <Ionicons
              name={companionsExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <Text style={styles.gtSlotStatus}>
            {noInterplantSlots
              ? 'Add main crops first to create row gaps'
              : anyCompanionFits
                ? `${Math.max(0, totalInterplantSlots - totalCompanionsPlaced)} of ${totalInterplantSlots} gap slots free`
                : 'Bed full — no room for more companions'}
          </Text>
          {companionsExpanded &&
            companionSuggestions.map((comp: string) => {
              const compCandidate = candidateForCompanion(comp);
              const compCount = data.plant_entries.filter((e) => e.name === comp).length;
              const compBlocked = compCount === 0 && !!getBlockedReason(comp);
              const compFitLabel =
                compCount > 0
                  ? capacityText(compCandidate, compCount, false)
                  : 'Interplants in gaps';
              return (
                <View key={comp} style={styles.gtCompanionRow}>
                  <Text style={styles.gtCompanionEmoji}>{getPlantEmoji(comp)}</Text>
                  <View style={styles.gtCompanionNameBlock}>
                    <Text style={styles.gtCompanionName}>{comp}</Text>
                    <Text style={styles.gtCompanionFitText}>{compFitLabel}</Text>
                  </View>
                  <PlantQtyStepper
                    count={compCount}
                    onIncrement={() => incrementPlant(compCandidate, false)}
                    onDecrement={() => decrementPlant(comp, COMPANION_DEFAULT_SPACING, false)}
                    disabled={compBlocked || (maxFitMap.get(comp) ?? 0) < 1}
                  />
                </View>
              );
            })}
        </>
      )}

      {/* ── Dynamic accumulators (collapsible) ──────────────────────────── */}
      <TouchableOpacity
        style={[styles.gtSectionHeaderMt, styles.gtCollapsibleHeader]}
        onPress={() => setSoilBuildersExpanded((v: boolean) => !v)}
        activeOpacity={0.7}
      >
        <Text style={styles.gtSectionHeader}>SOIL BUILDERS (CHOP & DROP)</Text>
        <Ionicons
          name={soilBuildersExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textSecondary}
        />
      </TouchableOpacity>
      <Text style={styles.gtSlotStatus}>
        {anyAccumulatorFits
          ? `${Math.max(0, totalAccumulatorSlots - totalAccumulatorsPlaced)} of ${totalAccumulatorSlots} border slots free`
          : 'Bed full — no room for more soil builders'}
      </Text>

      {soilBuildersExpanded && (
        <>
          <Text style={styles.gtAccSubtitle}>
            Add one to enrich your soil. Cut stems back to mulch the bed.
          </Text>
          {DYNAMIC_ACCUMULATORS.map((acc) => {
            const accCandidate = candidateForAccumulator(acc.name);
            const accCount = data.plant_entries.filter((e) => e.name === acc.name).length;
            const isAdded = accCount > 0;
            const accBlocked = !isAdded && !!getBlockedReason(acc.name);
            const accFitLabel = isAdded
              ? capacityText(accCandidate, accCount, false)
              : 'Perimeter / border plant';
            return (
              <View key={acc.name} style={[styles.gtAccCard, isAdded && styles.gtAccCardSelected]}>
                <View style={styles.gtAccHeader}>
                  <View style={styles.gtAccNameBlock}>
                    <Text style={[styles.gtAccName, isAdded && styles.gtAccNameSelected]}>
                      {acc.name}
                    </Text>
                    <Text style={styles.gtAccFitText}>{accFitLabel}</Text>
                  </View>
                  <PlantQtyStepper
                    count={accCount}
                    onIncrement={() => incrementPlant(accCandidate, false)}
                    onDecrement={() => decrementPlant(acc.name, ACCUMULATOR_DEFAULT_SPACING, false)}
                    disabled={accBlocked || (maxFitMap.get(acc.name) ?? 0) < 1}
                  />
                </View>
                <Text style={[styles.gtIntervalText, isAdded && styles.gtIntervalTextSelected]}>
                  ✂️ Chop every {acc.chop_drop_interval_days} days
                </Text>
                <View style={styles.gtNutrientRow}>
                  {acc.nutrients_mined.map((n) => (
                    <View
                      key={n}
                      style={[styles.gtNutrientChip, isAdded && styles.gtNutrientChipSelected]}
                    >
                      <Text
                        style={[styles.gtNutrientText, isAdded && styles.gtNutrientTextSelected]}
                      >
                        {n}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
