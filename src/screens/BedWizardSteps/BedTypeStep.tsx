import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { BedType } from '@/types/database.types';
import { Step1Data } from '@/hooks/useBedCreationWizard';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { getCurrentSeason } from '@/utils/seasonHelpers';
import { BED_TYPE_NAME, BED_TYPE_EMOJI } from '@/config/beds';

interface Props {
  data: Partial<Step1Data>;
  onChange: (data: Partial<Step1Data>) => void;
  /** Edit mode: bed type can't be changed once a bed exists, so render read-only. */
  locked?: boolean;
}

type SeasonFit = 'ideal' | 'ok' | 'avoid';

const BED_TYPE_OPTIONS: {
  type: BedType;
  tamilLabel: string;
  desc: string;
  info: string;
  seasonFit: Record<string, SeasonFit>;
}[] = [
  {
    type: 'leafy',
    tamilLabel: 'கீரை பாத்தி',
    desc: 'Amaranth, spinach, fenugreek',
    info: 'Full sun · 25–35 days',
    seasonFit: { summer: 'avoid', sw_monsoon: 'ok', ne_monsoon: 'ideal', cool_dry: 'ideal' },
  },
  {
    type: 'fruiting',
    tamilLabel: 'காய்கறி பாத்தி',
    desc: 'Tomato, brinjal, ladies finger',
    info: 'Full sun · 60–90 days',
    seasonFit: { summer: 'ideal', sw_monsoon: 'avoid', ne_monsoon: 'avoid', cool_dry: 'ok' },
  },
  {
    type: 'spice',
    tamilLabel: 'மசாலா பாத்தி',
    desc: 'Chilli, ginger, turmeric, curry leaf',
    info: 'Part shade · 3–10 months',
    seasonFit: { summer: 'ok', sw_monsoon: 'ideal', ne_monsoon: 'ideal', cool_dry: 'ok' },
  },
  {
    type: 'root_legume',
    tamilLabel: 'கிழங்கு / பயிறு',
    desc: 'Beans, cowpea, carrot',
    info: 'Full sun · rotational',
    seasonFit: { summer: 'ok', sw_monsoon: 'avoid', ne_monsoon: 'ok', cool_dry: 'ideal' },
  },
  {
    type: 'climber_trellis',
    tamilLabel: 'கொடி பந்தல்',
    desc: 'Bitter gourd, snake gourd',
    info: 'Full sun · 55–70 days',
    seasonFit: { summer: 'ideal', sw_monsoon: 'ok', ne_monsoon: 'ok', cool_dry: 'avoid' },
  },
  {
    type: 'three_sisters',
    tamilLabel: 'மூன்று சகோதரிகள்',
    desc: 'Corn + beans + squash',
    info: 'Full sun · SW Monsoon',
    seasonFit: { summer: 'ok', sw_monsoon: 'ideal', ne_monsoon: 'avoid', cool_dry: 'avoid' },
  },
  {
    type: 'medicinal_guild',
    tamilLabel: 'மூலிகை தோட்டம்',
    desc: 'Tulsi, brahmi, aloe vera',
    info: 'Low light · under canopy',
    seasonFit: { summer: 'ok', sw_monsoon: 'ideal', ne_monsoon: 'ok', cool_dry: 'ok' },
  },
];

const SEASON_LABEL: Record<string, string> = {
  summer: 'Summer',
  sw_monsoon: 'SW Monsoon',
  ne_monsoon: 'NE Monsoon',
  cool_dry: 'Cool & Dry',
};

export function BedTypeStep({ data, onChange, locked = false }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const seasonLabel = SEASON_LABEL[currentSeason] ?? currentSeason;

  // In edit mode the type is fixed, so show only the chosen type as a single
  // read-only card instead of the full (dimmed) grid of seven options.
  const lockedOption = locked
    ? (BED_TYPE_OPTIONS.find((opt) => opt.type === data.bed_type) ?? null)
    : null;
  const visibleOptions = lockedOption ? [lockedOption] : BED_TYPE_OPTIONS;

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      <View style={styles.btSeasonBanner}>
        <Text style={styles.btSeasonBannerText}>
          {locked
            ? "🔒 Bed type can't be changed after creation"
            : `🌦 Now: ${seasonLabel} — ideal beds highlighted below`}
        </Text>
      </View>

      <View style={styles.typeGrid}>
        {visibleOptions.map((opt) => {
          const fit = opt.seasonFit[currentSeason] ?? 'ok';
          const isSelected = data.bed_type === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.typeCard,
                isSelected && styles.typeCardSelected,
                !locked && fit === 'avoid' && !isSelected && styles.typeCardDimmed,
              ]}
              onPress={() => onChange({ bed_type: opt.type })}
              disabled={locked}
              activeOpacity={0.7}
            >
              {fit === 'ideal' && !isSelected && (
                <View style={styles.btIdealBadge}>
                  <Text style={styles.btIdealBadgeText}>✓ Now</Text>
                </View>
              )}
              <Text style={styles.typeEmoji}>{BED_TYPE_EMOJI[opt.type]}</Text>
              <Text
                style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}
                numberOfLines={1}
              >
                {BED_TYPE_NAME[opt.type]}
              </Text>
              <Text style={styles.btTamilLabel}>{opt.tamilLabel}</Text>
              <Text style={styles.typeDesc} numberOfLines={1}>
                {opt.desc}
              </Text>
              <View style={styles.typeInfoTag}>
                <Text style={styles.typeInfoTagText}>{opt.info}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
