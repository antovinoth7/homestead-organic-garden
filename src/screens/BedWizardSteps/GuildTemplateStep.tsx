import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { BedType, BedLayer, CropFamily, PlantEntry } from '@/types/database.types';
import { Step2Data, Step3Data, Step4Data } from '@/hooks/useBedCreationWizard';
import { getGuildTemplate, validateCompanionPair, DYNAMIC_ACCUMULATORS } from '@/config/beds';
import type { PlantRow } from '@/config/beds/guildTemplates';
import {
  computeRowLayout,
  maxFitForSpecies,
  getRecommendedFirstAdd,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs } from '@/utils/plantEntryMapper';
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

const COMPANION_DEFAULT_LAYER: BedLayer = 'ground_cover';
const COMPANION_DEFAULT_SPACING = 25;
const ACCUMULATOR_DEFAULT_LAYER: BedLayer = 'understory';
const ACCUMULATOR_DEFAULT_SPACING = 60;
const DEFAULT_BED_WIDTH_M = 1.2;
const DEFAULT_BED_LENGTH_M = 3.0;

const PLANT_TAMIL_NAME: Record<string, string> = {
  Amaranth: 'அரைக்கீரை',
  Spinach: 'பசலைக்கீரை',
  Lettuce: 'லெட்டூஸ்',
  Fenugreek: 'வெந்தயக்கீரை',
  'Pasalai Keerai': 'பசலைக்கீரை',
  Drumstick: 'முருங்கை',
  Tomato: 'தக்காளி',
  Brinjal: 'கத்தரிக்காய்',
  Okra: 'வெண்டைக்காய்',
  Marigold: 'துலுக்காமல்லி',
  Chilli: 'மிளகாய்',
  Ginger: 'இஞ்சி',
  Turmeric: 'மஞ்சள்',
  'Curry Leaf': 'கருவேப்பிலை',
  Cowpea: 'காராமணி',
  'French Beans': 'பீன்ஸ்',
  Carrot: 'கேரட்',
  Radish: 'முள்ளங்கி',
  'Bitter Gourd': 'பாகற்காய்',
  'Snake Gourd': 'புடலங்காய்',
  'Yardlong Beans': 'தட்டைப்பயறு',
  Banana: 'வாழை',
  Cocoa: 'கொக்கோ',
  'Black Pepper': 'மிளகு',
  'Elephant Yam': 'சேனைக்கிழங்கு',
  'Taro / Colocasia': 'சேப்பங்கிழங்கு',
  Maize: 'மக்காச்சோளம்',
  Beans: 'பீன்ஸ்',
  Pumpkin: 'பரங்கிக்காய்',
  Moringa: 'முருங்கை',
  Tulsi: 'துளசி',
  'Aloe Vera': 'கற்றாழை',
  Lemongrass: 'எலுமிச்சைப்புல்',
  Basil: 'திருநீற்றுப்பச்சை',
  Garlic: 'பூண்டு',
  Strawberry: 'ஸ்ட்ராபெர்ரி',
  Beetroot: 'பீட்ரூட்',
  Pepper: 'மிளகு',
  Agathi: 'அகத்தி',
  Comfrey: 'கம்ப்ரி',
};

const MARKET_CROPS = new Set(['Tomato', 'Brinjal', 'Okra', 'Chilli', 'Bitter Gourd', 'Snake Gourd', 'Cowpea', 'French Beans', 'Yardlong Beans', 'Drumstick']);

const PLANT_EMOJI: Record<string, string> = {
  Amaranth: '🌿',
  Spinach: '🥬',
  Lettuce: '🥗',
  Fenugreek: '🌱',
  Tomato: '🍅',
  Brinjal: '🍆',
  Okra: '🫛',
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
  Cocoa: '🍫',
  'Black Pepper': '⚫',
  'Elephant Yam': '🥔',
  Maize: '🌽',
  Beans: '🫘',
  Pumpkin: '🎃',
  Moringa: '🌳',
  Tulsi: '🌿',
  'Aloe Vera': '🌵',
  Lemongrass: '🌾',
  Basil: '🌿',
  Garlic: '🧄',
  Strawberry: '🍓',
  Beetroot: '🟣',
  Pepper: '🌶️',
  Agathi: '🌱',
  Comfrey: '🌿',
};

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

const BENEFIT_EXPLANATION: Record<string, string> = {
  'n-fixer': 'Fixes nitrogen — feeds neighboring crops',
  'pest-repel': 'Repels insects that attack crop neighbors',
  nematode: 'Reduces root nematodes in soil',
  'chop-drop': 'Chop stems as mulch to feed the soil',
  'soil-builder': 'Builds organic matter when cut back',
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

  // ── Increment / decrement handlers ──────────────────────────────────────────

  const incrementPlant = useCallback(
    (candidate: RowPlantInput, companionsToAutoAdd?: string[]): void => {
      // Antagonist check vs any *different* species already in the bed
      for (const entry of data.plant_entries) {
        if (entry.name === candidate.name) continue;
        const result = validateCompanionPair(candidate.name, entry.name);
        if (!result.valid) return;
      }

      // Capacity check — applies to every tap equally (no special first-add bulk fill)
      const remaining = maxFitMap.get(candidate.name) ?? 0;
      if (remaining <= 0) return;

      const instanceCount = data.plant_entries.filter((e) => e.name === candidate.name).length;
      const makeEntry = (name: string, layer: BedLayer, spacingCm: number): PlantEntry => ({
        id: generateId(),
        name,
        layer,
        spacingCm,
      });

      // Always add exactly 1 plant per tap for predictable stepper behaviour
      const newEntries: PlantEntry[] = [
        ...data.plant_entries,
        makeEntry(candidate.name, candidate.layer, candidate.spacingCm),
      ];

      // On first add of a main crop, silently add recommended companion plants that fit
      if (instanceCount === 0 && companionsToAutoAdd && companionsToAutoAdd.length > 0) {
        for (const compName of companionsToAutoAdd) {
          if (newEntries.some((e) => e.name === compName)) continue;
          let antag = false;
          for (const existing of newEntries) {
            if (existing.name === compName) continue;
            const r = validateCompanionPair(compName, existing.name);
            if (!r.valid) { antag = true; break; }
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
        }
      }

      onChange({ plant_entries: newEntries });
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
      onChange,
    ]
  );

  const decrementPlant = useCallback(
    (plantName: string): void => {
      const lastIdx = (() => {
        for (let i = data.plant_entries.length - 1; i >= 0; i--) {
          if (data.plant_entries[i]!.name === plantName) return i;
        }
        return -1;
      })();
      if (lastIdx === -1) return;
      const next = [...data.plant_entries];
      next.splice(lastIdx, 1);
      onChange({ plant_entries: next });
    },
    [data.plant_entries, onChange]
  );

  // Capacity text shown on each card, e.g. "fits ~3" or "~2 more fit" or "Bed full".
  const capacityText = useCallback(
    (name: string, count: number): string => {
      const remaining = maxFitMap.get(name) ?? 0;
      if (remaining === 0 && count === 0) return "Too big for bed";
      if (remaining === 0) return "Bed full";
      if (count === 0) return `fits ~${remaining}`;
      return `~${remaining} more fit`;
    },
    [maxFitMap]
  );

  // One-tap: add all template plants at their recommended counts.
  const handleUseFullPlan = useCallback(() => {
    if (!template) return;
    let accEntries: PlantEntry[] = [];
    for (const row of template.plant_rows) {
      let blocked = false;
      for (const existing of accEntries) {
        if (existing.name === row.name) continue;
        const check = validateCompanionPair(row.name, existing.name);
        if (!check.valid) { blocked = true; break; }
      }
      if (blocked) continue;
      const candidate = candidateForRow(row);
      const trialInputs = mapPlantEntriesToRowInputs(accEntries, template);
      const count = getRecommendedFirstAdd(candidate, trialInputs, widthM, lengthM, bedTypeForEngine, construction);
      if (count === 0) continue;
      for (let i = 0; i < count; i++) {
        accEntries = [...accEntries, { id: generateId(), name: row.name, layer: row.layer, spacingCm: row.spacing_cm }];
      }
    }
    onChange({ plant_entries: accEntries });
  }, [template, widthM, lengthM, bedTypeForEngine, construction, candidateForRow, onChange]);

  // Harvest mini-timeline — selected plants sorted by days to harvest.
  const harvestPreview = useMemo(() => {
    if (!template) return [];
    const seen = new Set<string>();
    const items: { name: string; days: number; emoji: string }[] = [];
    for (const entry of data.plant_entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);
      const row = template.plant_rows.find((r) => r.name === entry.name);
      const days = row?.days_to_harvest;
      if (days !== undefined) {
        items.push({ name: entry.name, days, emoji: PLANT_EMOJI[entry.name] ?? '🌱' });
      }
    }
    return items.sort((a, b) => a.days - b.days);
  }, [data.plant_entries, template]);

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
      <Text style={styles.stepTitle}>{template.label}</Text>
      <Text style={styles.stepSubtitle}>{template.description}</Text>

      <View style={styles.gtTemplateBanner}>
        <Ionicons name="information-circle-outline" size={18} color={theme.infoDark} />
        <Text style={styles.gtTemplateBannerText}>
          Tap + to add each crop. All selected crops are planted when you save this bed. Set
          variety in the Arrange step.
        </Text>
      </View>

      <TouchableOpacity style={styles.gtUseFullPlanBtn} onPress={handleUseFullPlan} activeOpacity={0.8}>
        <Text style={styles.gtUseFullPlanBtnText}>
          📋 Add all recommended crops at once
        </Text>
        <View style={styles.gtUseFullPlanQuickBadge}>
          <Text style={styles.gtUseFullPlanQuickBadgeText}>Quick Start</Text>
        </View>
      </TouchableOpacity>

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

      {template.three_sisters_sequence && (
        <View style={styles.sequenceCard}>
          <Text style={styles.sequenceTitle}>Planting Sequence</Text>
          {template.three_sisters_sequence.map((seq) => (
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
        const instanceCount = data.plant_entries.filter((e) => e.name === row.name).length;
        const isSelected = instanceCount > 0;
        const blockedReason = !isSelected ? getBlockedReason(row.name) : null;
        const isBlocked = !!blockedReason;
        const remaining = maxFitMap.get(row.name) ?? 0;
        const capReached = remaining === 0;
        const emoji = PLANT_EMOJI[row.name] ?? '🌱';
        const layerLabel = LAYER_LABEL[row.layer] ?? row.layer.replace(/_/g, ' ');
        const isMain = row.is_companion !== true;
        const autoCompanions =
          isMain && row.companion_plants.length > 0 ? row.companion_plants : undefined;

        const tamilName = PLANT_TAMIL_NAME[row.name];
        const isMarketCrop = MARKET_CROPS.has(row.name);
        const harvestDays = row.days_to_harvest;

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
                <Text style={[styles.gtPlantName, isBlocked && styles.gtPlantNameBlocked]}>
                  {row.name}
                </Text>
                {isMarketCrop && (
                  <View style={styles.gtMarketBadge}>
                    <Text style={styles.gtMarketBadgeText}>Market</Text>
                  </View>
                )}
              </View>
              {tamilName ? (
                <Text style={styles.gtTamilName}>{tamilName}</Text>
              ) : null}
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
                {harvestDays !== undefined && (
                  <View style={styles.gtHarvestBadge}>
                    <Text style={styles.gtHarvestBadgeText}>{harvestDays}d harvest</Text>
                  </View>
                )}
              </View>
              {row.benefit_tag && BENEFIT_EXPLANATION[row.benefit_tag] && (
                <Text style={styles.gtBenefitLine}>
                  {BENEFIT_EXPLANATION[row.benefit_tag]}
                </Text>
              )}
              {!row.benefit_tag && row.companion_plants.length > 0 && !isBlocked && (
                <Text style={styles.gtBenefitLine}>
                  Good with: {row.companion_plants.slice(0, 2).join(', ')}
                </Text>
              )}
              {isBlocked && <Text style={styles.gtAntagonistText}>⛔ {blockedReason}</Text>}
              {step2?.waterlogging_risk && row.needs_good_drainage && (
                <View style={styles.gtDrainageBadge}>
                  <Text style={styles.gtDrainageBadgeText}>⚠ Needs drainage</Text>
                </View>
              )}
            </View>

            <View style={styles.gtPlantRight}>
              <Text style={styles.gtSpacingTag}>{row.spacing_cm} cm</Text>
              <Text style={styles.gtPlantCountTag}>{capacityText(row.name, instanceCount)}</Text>
              <PlantQtyStepper
                count={instanceCount}
                onIncrement={() => incrementPlant(candidateForRow(row), autoCompanions)}
                onDecrement={() => decrementPlant(row.name)}
                disabled={isBlocked || capReached}
              />
            </View>
          </View>
        );
      })}

      {/* ── Companion suggestions ────────────────────────────────────────── */}
      {companionSuggestions.length > 0 && (
        <>
          <Text style={[styles.gtSectionHeader, styles.gtSectionHeaderMt]}>
            HELPFUL NEIGHBOR PLANTS
          </Text>
          {companionSuggestions.map((comp) => {
            const compCount = data.plant_entries.filter((e) => e.name === comp).length;
            const compBlocked = compCount === 0 && !!getBlockedReason(comp);
            const compRemaining = maxFitMap.get(comp) ?? 0;
            const compCapReached = compRemaining === 0;
            return (
              <View key={comp} style={styles.gtCompanionRow}>
                <Text style={styles.gtCompanionEmoji}>{PLANT_EMOJI[comp] ?? '🌿'}</Text>
                <View style={styles.gtCompanionNameBlock}>
                  <Text style={styles.gtCompanionName}>{comp}</Text>
                  <Text style={styles.gtCompanionFitText}>{capacityText(comp, compCount)}</Text>
                </View>
                <PlantQtyStepper
                  count={compCount}
                  onIncrement={() => incrementPlant(candidateForCompanion(comp))}
                  onDecrement={() => decrementPlant(comp)}
                  disabled={compBlocked || compCapReached}
                />
              </View>
            );
          })}
        </>
      )}

      {/* ── Dynamic accumulators ─────────────────────────────────────────── */}
      <Text style={[styles.gtSectionHeader, styles.gtSectionHeaderMt]}>{'SOIL BUILDERS (CHOP & DROP)'}</Text>
      <Text style={styles.gtAccSubtitle}>Add one to enrich your soil. Cut stems back to mulch the bed.</Text>

      {DYNAMIC_ACCUMULATORS.map((acc) => {
        const accCount = data.plant_entries.filter((e) => e.name === acc.name).length;
        const isAdded = accCount > 0;
        const accBlocked = !isAdded && !!getBlockedReason(acc.name);
        const accRemaining = maxFitMap.get(acc.name) ?? 0;
        const accCapReached = accRemaining === 0;
        return (
          <View key={acc.name} style={[styles.gtAccCard, isAdded && styles.gtAccCardSelected]}>
            <View style={styles.gtAccHeader}>
              <View style={styles.gtAccNameBlock}>
                <Text style={[styles.gtAccName, isAdded && styles.gtAccNameSelected]}>
                  {acc.name}
                </Text>
                <Text style={styles.gtAccTamil}>{acc.tamilName}</Text>
                <Text style={styles.gtAccFitText}>{capacityText(acc.name, accCount)}</Text>
              </View>
              <PlantQtyStepper
                count={accCount}
                onIncrement={() => incrementPlant(candidateForAccumulator(acc.name))}
                onDecrement={() => decrementPlant(acc.name)}
                disabled={accBlocked || accCapReached}
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
                  <Text style={[styles.gtNutrientText, isAdded && styles.gtNutrientTextSelected]}>
                    {n}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      {/* ── Harvest mini-timeline ────────────────────────────────────────── */}
      {harvestPreview.length > 1 && (
        <>
          <Text style={[styles.gtSectionHeader, styles.gtSectionHeaderMt]}>
            FIRST HARVEST FROM THIS BED
          </Text>
          <View style={styles.gtHarvestTimeline}>
            {harvestPreview.map((item) => {
              const maxDays = harvestPreview[harvestPreview.length - 1]!.days;
              const barWidth = Math.max(20, Math.round((item.days / maxDays) * 140));
              return (
                <View key={item.name} style={styles.gtHarvestRow}>
                  <View style={styles.gtHarvestLabelCol}>
                    <Text style={styles.gtHarvestName}>{item.emoji} {item.name}</Text>
                  </View>
                  <View style={styles.gtHarvestBarTrack}>
                    <View style={[styles.gtHarvestBar, { width: barWidth }]} />
                  </View>
                  <Text style={styles.gtHarvestDays}>{item.days}d</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
