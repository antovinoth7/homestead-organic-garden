import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { BedType } from '@/types/database.types';
import { Step1Data } from '@/hooks/useBedCreationWizard';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { getCurrentSeason } from '@/utils/seasonHelpers';

interface Props {
  data: Partial<Step1Data>;
  onChange: (data: Partial<Step1Data>) => void;
}

type SeasonFit = 'ideal' | 'ok' | 'avoid';

const BED_TYPE_OPTIONS: {
  type: BedType;
  label: string;
  tamilLabel: string;
  emoji: string;
  desc: string;
  info: string;
  seasonFit: Record<string, SeasonFit>;
}[] = [
  {
    type: 'leafy',
    label: 'Leafy Greens',
    tamilLabel: 'கீரை பாத்தி',
    emoji: '🥬',
    desc: 'Amaranth, spinach, fenugreek',
    info: 'Full sun · 25–35 days',
    seasonFit: { summer: 'avoid', sw_monsoon: 'ok', ne_monsoon: 'ideal', cool_dry: 'ideal' },
  },
  {
    type: 'fruiting',
    label: 'Veggie Bed',
    tamilLabel: 'காய்கறி பாத்தி',
    emoji: '🍅',
    desc: 'Tomato, brinjal, ladies finger',
    info: 'Full sun · 60–90 days',
    seasonFit: { summer: 'ideal', sw_monsoon: 'avoid', ne_monsoon: 'avoid', cool_dry: 'ok' },
  },
  {
    type: 'spice',
    label: 'Spice & Herb',
    tamilLabel: 'மசாலா பாத்தி',
    emoji: '🌿',
    desc: 'Chilli, ginger, turmeric, curry leaf',
    info: 'Part shade · 3–10 months',
    seasonFit: { summer: 'ok', sw_monsoon: 'ideal', ne_monsoon: 'ideal', cool_dry: 'ok' },
  },
  {
    type: 'root_legume',
    label: 'Root & Legume',
    tamilLabel: 'கிழங்கு / பயிறு',
    emoji: '🥕',
    desc: 'Beans, cowpea, carrot',
    info: 'Full sun · rotational',
    seasonFit: { summer: 'ok', sw_monsoon: 'avoid', ne_monsoon: 'ok', cool_dry: 'ideal' },
  },
  {
    type: 'climber_trellis',
    label: 'Climber Trellis',
    tamilLabel: 'கொடி பந்தல்',
    emoji: '🌱',
    desc: 'Bitter gourd, snake gourd',
    info: 'Full sun · 55–70 days',
    seasonFit: { summer: 'ideal', sw_monsoon: 'ok', ne_monsoon: 'ok', cool_dry: 'avoid' },
  },
  {
    type: 'three_sisters',
    label: 'Three Sisters',
    tamilLabel: 'மூன்று சகோதரிகள்',
    emoji: '🌽',
    desc: 'Corn + beans + squash',
    info: 'Full sun · SW Monsoon',
    seasonFit: { summer: 'ok', sw_monsoon: 'ideal', ne_monsoon: 'avoid', cool_dry: 'avoid' },
  },
  {
    type: 'medicinal_guild',
    label: 'Medicinal Guild',
    tamilLabel: 'மூலிகை தோட்டம்',
    emoji: '🌾',
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

export function BedTypeStep({ data, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const seasonLabel = SEASON_LABEL[currentSeason] ?? currentSeason;

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      <View style={styles.btSeasonBanner}>
        <Text style={styles.btSeasonBannerText}>
          🌦 Now: {seasonLabel} — ideal beds highlighted below
        </Text>
      </View>

      <View style={styles.typeGrid}>
        {BED_TYPE_OPTIONS.map((opt) => {
          const fit = opt.seasonFit[currentSeason] ?? 'ok';
          const isSelected = data.bed_type === opt.type;
          return (
            <TouchableOpacity
              key={opt.type}
              style={[
                styles.typeCard,
                isSelected && styles.typeCardSelected,
                fit === 'avoid' && !isSelected && styles.typeCardDimmed,
              ]}
              onPress={() => onChange({ bed_type: opt.type })}
              activeOpacity={0.7}
            >
              {fit === 'ideal' && !isSelected && (
                <View style={styles.btIdealBadge}>
                  <Text style={styles.btIdealBadgeText}>✓ Now</Text>
                </View>
              )}
              <Text style={styles.typeEmoji}>{opt.emoji}</Text>
              <Text
                style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}
                numberOfLines={1}
              >
                {opt.label}
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
