/**
 * SeasonBlock - the Today screen's compact seasonal guide.
 *
 * The crop groups deliberately consume a small, source-reviewed district
 * calendar. They never enumerate the user's whole plant catalogue.
 *
 * Every crop is a tap target into its catalog entry: a name alone is not a
 * decision, and the spacing and days-to-harvest that make it one already live
 * there. The tile is the crop's photo — the fastest way to recognise one — with
 * the name set beneath it and no border of its own, plus whatever the catalog
 * states about how long the crop occupies the ground and how much room it
 * needs.
 *
 * What the season is doing to the crops already planted is stated after the
 * suggestions rather than buried in them, because it qualifies them.
 *
 * Free bed space is deliberately not stated here: each plot card already counts
 * its ready beds and links to the Beds tab, and saying it twice made the card
 * answer a question it does not own.
 */

import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GardenIcon } from '@/components/GardenIcon';
import { ReferenceThumb } from '@/components/ReferenceThumb';
import { getPlantImage } from '@/config/referenceAssets';
import {
  PerennialCareBrief,
  PlantNowRecommendation,
  PlantType,
  SeasonProgress,
} from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonBlockStyles';

interface Props {
  season: SeasonProgress;
  note: string;
  tip: string;
  tipTitle: string;
  district: string | null;
  recommendations: PlantNowRecommendation[];
  /** Crop names whose window opens next month — context, not tiles. */
  openingNext: string[];
  perennialCare: PerennialCareBrief | null;
  onPressCrop: (plantName: string, plantType: PlantType) => void;
  onPressDistrict: () => void;
}

/** The link is text, so it needs the touch area its type size does not give. */
const LINK_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 };

/** What each action actually asks for. "Transplant" alone assumes a nursery. */
const ACTION_HINT: Record<PlantNowRecommendation['action'], string> = {
  sow: 'Seed straight into the ground',
  transplant: 'Needs seedlings about 4 weeks old',
};

const ACTION_TITLE: Record<PlantNowRecommendation['action'], string> = {
  sow: 'Sow',
  transplant: 'Transplant',
};

interface CropTileProps {
  item: PlantNowRecommendation;
  onPress: (plantName: string, plantType: PlantType) => void;
  styles: ReturnType<typeof createStyles>;
}

/**
 * One crop. The photo is decorative — the tile speaks as a single label, so a
 * screen reader hears the crop, its figures and its deadline as one sentence
 * rather than as fragments and an image. The deadline is spoken even though
 * nothing on screen marks it: losing a visual cue is no reason to lose the
 * fact.
 */
const CropTile = React.memo(function CropTile({
  item,
  onPress,
  styles,
}: CropTileProps): React.JSX.Element {
  const handlePress = useCallback(
    () => onPress(item.label, item.plantType),
    [onPress, item.label, item.plantType]
  );

  // "25–40 days · 15 cm apart" — whichever halves the catalog actually states.
  const meta = [
    item.daysToHarvest,
    item.spacingCm !== null ? `${item.spacingCm} cm apart` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');

  const spoken = [
    item.label,
    item.closing ? 'last month to start' : null,
    meta.length > 0 ? meta : null,
  ]
    .filter((part): part is string => part !== null)
    .join(', ');

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${spoken}. Opens the catalog entry.`}
    >
      <ReferenceThumb source={getPlantImage(item.label)} variant="tile" recyclingKey={item.key} />
      <View style={styles.tileBody}>
        <Text style={styles.tileName} numberOfLines={2}>
          {item.label}
        </Text>
        {meta.length > 0 && (
          <Text style={styles.tileMeta} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const SeasonBlock = React.memo(function SeasonBlock({
  season,
  note,
  tip,
  tipTitle,
  district,
  recommendations,
  openingNext,
  perennialCare,
  onPressCrop,
  onPressDistrict,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const elapsed = season.elapsedFraction;

  const sown = recommendations.filter((recommendation) => recommendation.action === 'sow');
  const transplanted = recommendations.filter(
    (recommendation) => recommendation.action === 'transplant'
  );

  const renderGroup = (
    action: PlantNowRecommendation['action'],
    items: PlantNowRecommendation[]
  ): React.JSX.Element | null => {
    if (items.length === 0) return null;
    return (
      <View style={styles.plantGroup}>
        <Text style={styles.plantAction}>{ACTION_TITLE[action]}</Text>
        <Text style={styles.plantActionHint}>{ACTION_HINT[action]}</Text>
        <View style={styles.tileGrid}>
          {items.map((item) => (
            <CropTile key={item.key} item={item} onPress={onPressCrop} styles={styles} />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {season.monthLabel} - {season.seasonName}
        </Text>
        <Text style={styles.week}>
          Week {season.week} of {season.totalWeeks}
        </Text>
      </View>

      <View
        style={styles.bar}
        accessibilityRole="progressbar"
        accessibilityLabel={`Week ${season.week} of ${season.totalWeeks} of ${season.seasonName}`}
      >
        <View style={[styles.barElapsed, { flex: Math.max(elapsed, 0.02) }]} />
        <View style={[styles.barRemaining, { flex: Math.max(1 - elapsed, 0.02) }]} />
      </View>

      {note.length > 0 && <Text style={styles.note}>{note}</Text>}

      {recommendations.length > 0 ? (
        <>
          <Text style={styles.sowTitle}>
            {district ? `Plant now in ${district}` : 'Plant now'}
          </Text>

          {renderGroup('sow', sown)}
          {renderGroup('transplant', transplanted)}

          {openingNext.length > 0 && (
            <Text style={styles.openingNext}>Opens next month: {openingNext.join(' · ')}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sowTitle}>Plant now</Text>
          <Text style={styles.emptyText}>
            {district
              ? `Planting suggestions are only set up for Kanyakumari, and this farm is in ${district}.`
              : 'Planting suggestions need to know which district this farm is in.'}
          </Text>
          <TouchableOpacity
            onPress={onPressDistrict}
            activeOpacity={0.7}
            hitSlop={LINK_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Set your district. Opens my farm."
          >
            <Text style={styles.emptyLink}>Set your district ›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Promoted above perennial care: this is the only line that names
          something already going wrong. */}
      {tip.length > 0 && (
        <View style={styles.riskStrip}>
          <GardenIcon name="general.warning" size={16} color={theme.warningDark} />
          <View style={styles.riskBody}>
            {tipTitle.length > 0 && <Text style={styles.riskTitle}>{tipTitle}</Text>}
            <Text style={styles.riskText}>{tip}</Text>
          </View>
        </View>
      )}

      {perennialCare !== null && (
        <View style={styles.perennialCare}>
          <Text style={styles.perennialTitle}>Perennial care</Text>
          <Text style={styles.perennialText}>{perennialCare.message}</Text>
        </View>
      )}
    </View>
  );
});
