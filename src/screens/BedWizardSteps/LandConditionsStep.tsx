import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';
import { Step2Data } from '@/hooks/useBedCreationWizard';
import { SunlightLevel, BedSlope, CropFamily, SoilType, BedType, PestHistoryItem } from '@/types/database.types';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import FieldLabelWithHelp from '@/components/FieldLabelWithHelp';
import ThemedDropdown from '@/components/ThemedDropdown';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import { buildGeneratedBedNameBase } from '@/utils/bedNameGenerator';

const PEST_OPTIONS: { value: string; label: string; hint: string }[] = [
  { value: 'Root Knot Nematode', label: 'Root Knot', hint: 'Yellowing · stunted roots' },
  { value: 'Fusarium Wilt', label: 'Fusarium Wilt', hint: 'Wilting · stem rot' },
  { value: 'Bacterial Wilt', label: 'Bacterial Wilt', hint: 'Sudden collapse' },
  { value: 'White Grubs', label: 'White Grubs', hint: 'Root-eating larvae' },
];

const SUNLIGHT_RANK: Record<SunlightLevel, number> = { full_sun: 2, partial_sun: 1, shade: 0 };

const SUNLIGHT_LABELS: Record<SunlightLevel, string> = {
  full_sun: '☀️ Full Sun',
  partial_sun: '⛅ Partial Sun',
  shade: '🌥️ Shade',
};

const SUNLIGHT_OPTIONS: { value: SunlightLevel; label: string; hint: string }[] = [
  { value: 'full_sun', label: '☀️ Full sun', hint: '6+ hrs direct' },
  { value: 'partial_sun', label: '⛅ Partial', hint: '3–6 hrs' },
  { value: 'shade', label: '🌥️ Shade', hint: '<3 hrs' },
];

const SOIL_TYPE_OPTIONS: { value: SoilType; label: string; hint: string }[] = [
  { value: 'garden_soil', label: 'Garden Soil', hint: 'General purpose' },
  { value: 'red_laterite', label: 'Red Laterite', hint: 'Slightly acidic' },
  { value: 'coastal_sandy', label: 'Coastal Sandy', hint: 'Fast draining' },
  { value: 'black_cotton', label: 'Black Cotton', hint: 'Retains moisture' },
  { value: 'alluvial', label: 'Alluvial', hint: 'Fertile, drained' },
  { value: 'coco_peat', label: 'Coco Peat', hint: 'Lightweight' },
];

interface Props {
  data: Step2Data;
  onChange: (data: Partial<Step2Data>) => void;
  solanaceaeBlocked: boolean;
  parentOptions: string[];
  childOptions: string[];
  locationsLoading: boolean;
  bedType: BedType | null;
}

function ChipGroup<T extends string>({
  label,
  helpText,
  options,
  value,
  onSelect,
  styles,
}: {
  label: string;
  helpText: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onSelect: (v: T) => void;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <FieldLabelWithHelp
        label={label}
        helpText={helpText}
        labelStyle={styles.fieldLabel}
        style={styles.fieldLabelRow}
      />
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.7}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {opt.label}
              </Text>
              {opt.hint ? (
                <Text style={[styles.chipHint, selected && styles.chipHintSelected]}>
                  {opt.hint}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function LandConditionsStep({
  data,
  onChange,
  solanaceaeBlocked,
  parentOptions,
  childOptions,
  locationsLoading,
  bedType,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [showCustomName, setShowCustomName] = useState(false);

  const generatedBedName = useMemo(
    () => buildGeneratedBedNameBase(data.child_location ?? data.parent_location, bedType),
    [data.child_location, data.parent_location, bedType]
  );

  // Sync generated name into data.name whenever location/bedType changes, unless user is editing
  useEffect(() => {
    if (!showCustomName && generatedBedName) {
      onChange({ name: generatedBedName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedBedName, showCustomName]);

  const sunlightRequired = bedType ? GUILD_TEMPLATES[bedType].sunlight_requirement : null;
  const sunlightMismatch =
    sunlightRequired !== null && SUNLIGHT_RANK[data.sunlight] < SUNLIGHT_RANK[sunlightRequired];
  const bedLabel = bedType ? GUILD_TEMPLATES[bedType].label : null;

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      {/* Location */}
      <View style={styles.fieldGroup}>
        <FieldLabelWithHelp
          label="Location"
          helpText="Select the main area of your farm or garden where this bed is located."
          labelStyle={styles.fieldLabel}
          style={styles.fieldLabelRow}
        />
        {locationsLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <ThemedDropdown
            items={[
              { label: 'Select location', value: '' },
              ...parentOptions.map((loc) => ({ label: loc, value: loc })),
            ]}
            selectedValue={data.parent_location ?? ''}
            onValueChange={(value: string) => {
              onChange({ parent_location: value || null, child_location: null });
            }}
            label="Main Location"
            placeholder="Select location"
          />
        )}
      </View>

      {/* Sub-location chips */}
      {data.parent_location && childOptions.length > 0 && (
        <View style={styles.fieldGroup}>
          <FieldLabelWithHelp
            label="Section / Direction"
            helpText="Choose the specific section or direction within the main location."
            labelStyle={styles.fieldLabel}
            style={styles.fieldLabelRow}
          />
          <View style={styles.chipRow}>
            {childOptions.map((loc) => {
              const selected = data.child_location === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  activeOpacity={0.7}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => onChange({ child_location: selected ? null : loc })}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                    {loc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Bed name — auto-generated from location + bed type, or custom */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bed name *</Text>
        {!showCustomName && generatedBedName ? (
          <View style={[styles.infoBadge, styles.namePreviewRow]}>
            <Text style={styles.namePreviewText}>{generatedBedName}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setShowCustomName(true);
                onChange({ name: data.name || generatedBedName });
              }}
            >
              <Text style={styles.infoBadgeText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.textInput}
              value={data.name ?? ''}
              onChangeText={(v) => onChange({ name: v })}
              placeholder={generatedBedName || 'e.g. Front Leafy Bed'}
              placeholderTextColor={theme.textSecondary}
              maxLength={60}
              autoFocus={showCustomName}
            />
            {generatedBedName ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowCustomName(false);
                  onChange({ name: generatedBedName });
                }}
              >
                <Text style={styles.nameAutoRevertText}>Use auto name ✓</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>

      {/* Sunlight — custom layout for recommendation badge */}
      <View style={styles.fieldGroup}>
        <FieldLabelWithHelp
          label="Sunlight"
          helpText="Full sun (6+ hrs) suits fruiting crops like tomatoes, chillies, and brinjal. Partial sun (3–6 hrs) is ideal for leafy greens and herbs. Shade (<3 hrs) limits options to shade-tolerant plants."
          labelStyle={styles.fieldLabel}
          style={styles.fieldLabelRow}
        />
        {sunlightRequired && bedLabel && (
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>
              Required for {bedLabel}: {SUNLIGHT_LABELS[sunlightRequired]}
            </Text>
          </View>
        )}
        <View style={styles.chipRow}>
          {SUNLIGHT_OPTIONS.map((opt) => {
            const selected = data.sunlight === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onChange({ sunlight: opt.value })}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={[styles.chipHint, selected && styles.chipHintSelected]}>
                  {opt.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {sunlightMismatch && sunlightRequired && bedLabel && (
          <View style={styles.sunlightWarning}>
            <Text style={styles.sunlightWarningText}>
              ⚠️ {bedLabel} grows best in {SUNLIGHT_LABELS[sunlightRequired]}.{' '}
              {SUNLIGHT_LABELS[data.sunlight]} may reduce yield.
            </Text>
          </View>
        )}
      </View>

      <ChipGroup
        label="Slope"
        helpText="Slope affects water runoff and erosion risk. Flat ground retains water evenly. Gentle slopes drain well. Moderate to steep slopes need terracing or swales to prevent soil loss and hold moisture."
        options={[
          { value: 'flat' as BedSlope, label: 'Flat', hint: 'Level ground' },
          { value: 'gentle' as BedSlope, label: 'Gentle', hint: '<5° tilt' },
          { value: 'moderate' as BedSlope, label: 'Moderate', hint: '5–15°' },
          { value: 'steep' as BedSlope, label: 'Steep', hint: '>15°' },
        ]}
        value={data.slope}
        onSelect={(v) => onChange({ slope: v })}
        styles={styles}
      />

      <ChipGroup
        label="Soil Type"
        helpText="Soil type affects bed height and drainage recommendations. Laterite and black cotton soil benefit most from raised beds."
        options={SOIL_TYPE_OPTIONS}
        value={data.soil_type}
        onSelect={(v) => onChange({ soil_type: v })}
        styles={styles}
      />

      {bedType === 'coconut_intercrop' ? (
        <View style={styles.fieldGroup}>
          <FieldLabelWithHelp
            label="Bed construction"
            helpText="Coconut intercropping spaces plants around mature trees, so it always uses food-forest row gaps regardless of construction style."
            labelStyle={styles.fieldLabel}
            style={styles.fieldLabelRow}
          />
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>Coconut intercrop uses food-forest spacing</Text>
          </View>
        </View>
      ) : (
        <ChipGroup
          label="Bed construction"
          helpText="Raised beds drain better and allow narrower rows. In-ground beds suit flat terrain and need wider gaps (~40cm) between rows for walking access."
          options={[
            { value: 'raised' as const, label: 'Raised', hint: 'Above ground · narrow rows' },
            { value: 'in_ground' as const, label: 'In-ground', hint: 'Direct soil · wider paths' },
          ]}
          value={data.construction_type}
          onSelect={(v) => onChange({ construction_type: v })}
          styles={styles}
        />
      )}

      <ChipGroup
        label="Previous crop family"
        helpText="Crop rotation prevents disease buildup and nutrient depletion. Avoid planting the same family back-to-back. Legumes fix nitrogen and benefit the next crop. Solanaceae (tomato, chilli) need at least one season's rest before repeating."
        options={[
          {
            value: 'solanaceae' as CropFamily,
            label: 'Solanaceae',
            hint: 'Tomato · Chilli · Brinjal',
          },
          { value: 'legume' as CropFamily, label: 'Legume', hint: 'Cowpea · Groundnut · Beans' },
          {
            value: 'cucurbit' as CropFamily,
            label: 'Cucurbit',
            hint: 'Pumpkin · Bitter gourd · Snake gourd',
          },
          {
            value: 'brassica' as CropFamily,
            label: 'Brassica',
            hint: 'Cabbage · Cauliflower · Radish',
          },
          { value: 'allium' as CropFamily, label: 'Allium', hint: 'Onion · Garlic · Shallot' },
          {
            value: 'other' as CropFamily,
            label: 'Other / Unknown',
            hint: 'Cereal · Tuber · Mixed',
          },
        ]}
        value={(data.prev_crop_family ?? 'other') as CropFamily}
        onSelect={(v) => onChange({ prev_crop_family: v === 'other' ? null : v })}
        styles={styles}
      />

      {solanaceaeBlocked && (
        <View style={styles.blockAlert}>
          <Text style={styles.blockAlertText}>
            ⛔ Solanaceae was the previous crop. This bed needs at least one season&apos;s rest
            before planting Solanaceae again. Choose a different previous crop family to continue.
          </Text>
        </View>
      )}

      {/* Pest history */}
      <View style={styles.fieldGroup}>
        <FieldLabelWithHelp
          label="Pest issues last season?"
          helpText="Select any problems from the previous crop. This personalises the soil-prep checklist in the next step."
          labelStyle={styles.fieldLabel}
          style={styles.fieldLabelRow}
        />
        <View style={styles.chipRow}>
          {PEST_OPTIONS.map((opt) => {
            const selected = data.pest_history.some((p) => p.pest_name === opt.value);
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => {
                  const next: PestHistoryItem[] = selected
                    ? data.pest_history.filter((p) => p.pest_name !== opt.value)
                    : [
                        ...data.pest_history,
                        {
                          pest_name: opt.value,
                          severity: 'medium' as const,
                          season: 'last',
                          year: new Date().getFullYear(),
                        },
                      ];
                  onChange({ pest_history: next });
                }}
              >
                <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={[styles.chipHint, selected && styles.chipHintSelected]}>
                  {opt.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.switchRow}
        onPress={() => onChange({ waterlogging_risk: !data.waterlogging_risk })}
      >
        <View style={styles.switchLabelBlock}>
          <FieldLabelWithHelp
            label="Waterlogging risk?"
            helpText="Enable this if the spot is low-lying or water tends to pool after rain. Waterlogged soil causes root rot — raised beds or drainage channels help in flood-prone areas."
            labelStyle={styles.fieldLabel}
            style={styles.fieldLabelRow}
          />
          <Text style={styles.switchHint}>Low-lying area or water pools after rain</Text>
        </View>
        <View style={[styles.switchTrack, data.waterlogging_risk && styles.switchTrackActive]}>
          <View style={[styles.switchThumb, data.waterlogging_risk && styles.switchThumbActive]} />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}
