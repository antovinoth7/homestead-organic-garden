import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/pestDiseaseListStyles';
import { getCurrentRisk, getRiskColor } from '@/utils/riskHelpers';
import type { ReferenceEntry } from './types';

interface Props {
  entry: ReferenceEntry;
  image?: ImageSource;
  onPress: (id: string) => void;
}

/**
 * Browse-list row: risk-tinted thumbnail tile, name + Tamil name, a clamped
 * identification snippet, and a current-season risk badge.
 */
export function ReferenceListCard({ entry, image, onPress }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const risk = getCurrentRisk(entry.seasonalRisk);
  const riskColors = risk ? getRiskColor(risk, theme) : undefined;
  const tileBackground = riskColors?.bg ?? theme.backgroundTertiary;

  const handlePress = useCallback(() => onPress(entry.id), [onPress, entry.id]);

  const plantsLabel =
    entry.plantsAffected.length === 1 ? '1 plant' : `${entry.plantsAffected.length} plants`;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
      <View style={[styles.cardTile, { backgroundColor: tileBackground }]}>
        {image ? (
          <Image
            source={image}
            style={styles.cardTileImage as ImageStyle}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={entry.id}
          />
        ) : (
          <Text style={styles.cardTileEmoji}>{entry.emoji}</Text>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {entry.name}
          </Text>
          {entry.tamilName ? (
            <Text style={styles.cardTamil} numberOfLines={1}>
              {entry.tamilName}
            </Text>
          ) : null}
        </View>

        <Text style={styles.cardSymptom} numberOfLines={2}>
          {entry.identification}
        </Text>

        <View style={styles.cardMetaRow}>
          {risk && riskColors ? (
            <View style={[styles.riskBadge, { backgroundColor: riskColors.bg }]}>
              <Text style={[styles.riskBadgeText, { color: riskColors.text }]}>
                {risk.toUpperCase()} NOW
              </Text>
            </View>
          ) : null}
          {entry.plantsAffected.length > 0 ? (
            <Text style={styles.cardPlantsLabel}>{plantsLabel}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.cardChevron}>
        <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}
