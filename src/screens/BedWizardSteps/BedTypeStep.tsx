import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/theme';
import { BedType } from '@/types/database.types';
import { Step1Data } from '@/hooks/useBedCreationWizard';
import { createStyles } from '@/styles/bedCreationWizardStyles';

interface Props {
  data: Partial<Step1Data>;
  onChange: (data: Partial<Step1Data>) => void;
}

const BED_TYPE_OPTIONS: {
  type: BedType;
  label: string;
  emoji: string;
  desc: string;
  info: string;
}[] = [
  {
    type: 'leafy',
    label: 'Leafy Greens',
    emoji: '🥬',
    desc: 'Amaranth, spinach, fenugreek',
    info: 'Full sun · 25–35 days',
  },
  {
    type: 'fruiting',
    label: 'Veggie Bed',
    emoji: '🍅',
    desc: 'Tomato, brinjal, okra',
    info: 'Full sun · 60–90 days',
  },
  {
    type: 'spice',
    label: 'Spice & Herb',
    emoji: '🌿',
    desc: 'Chilli, ginger, turmeric, curry leaf',
    info: 'Part shade · 3–10 months',
  },
  {
    type: 'root_legume',
    label: 'Root & Legume',
    emoji: '🥕',
    desc: 'Beans, cowpea, carrot',
    info: 'Full sun · rotational',
  },
  {
    type: 'climber_trellis',
    label: 'Climber Trellis',
    emoji: '🌱',
    desc: 'Bitter gourd, snake gourd ',
    info: 'Full sun · 55–70 days',
  },
  {
    type: 'coconut_intercrop',
    label: 'Coconut Intercrop',
    emoji: '🥥',
    desc: 'Shade crops between coconut palms',
    info: 'Dappled · 2m+ from trunk',
  },
  {
    type: 'three_sisters',
    label: 'Three Sisters',
    emoji: '🌽',
    desc: 'Corn + beans + squash ',
    info: 'Full sun · SW Monsoon',
  },
  {
    type: 'medicinal_guild',
    label: 'Medicinal Guild',
    emoji: '🌾',
    desc: 'Brahmi, nilavembu, aloe vera',
    info: 'Low light · under canopy',
  },
];

export function BedTypeStep({ data, onChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView contentContainerStyle={styles.stepContainer}>
      <Text style={styles.stepTitle}>What kind of bed?</Text>
      <Text style={styles.stepSubtitle}>Choose the primary crop guild for this bed.</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bed name *</Text>
        <TextInput
          style={styles.textInput}
          value={data.name ?? ''}
          onChangeText={(v) => onChange({ name: v })}
          placeholder="e.g. Front Leafy Bed"
          placeholderTextColor={theme.textSecondary}
          maxLength={60}
        />
      </View>

      <View style={styles.typeGrid}>
        {BED_TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.type}
            style={[styles.typeCard, data.bed_type === opt.type && styles.typeCardSelected]}
            onPress={() => onChange({ bed_type: opt.type })}
            activeOpacity={0.7}
          >
            <Text style={styles.typeEmoji}>{opt.emoji}</Text>
            <Text
              style={[styles.typeLabel, data.bed_type === opt.type && styles.typeLabelSelected]}
            >
              {opt.label}
            </Text>
            <Text style={styles.typeDesc}>{opt.desc}</Text>
            <View style={styles.typeInfoTag}>
              <Text style={styles.typeInfoTagText}>{opt.info}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
