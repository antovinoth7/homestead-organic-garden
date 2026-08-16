/**
 * SeasonBlock - the Today screen's compact seasonal guide.
 *
 * The crop groups deliberately consume a small, source-reviewed district
 * calendar. They never enumerate the user's whole plant catalogue.
 *
 * Every crop is a tap target into its catalog entry: a name alone is not a
 * decision, and the spacing and days-to-harvest that make it one already live
 * there. The tile is the crop's photo — the fastest way to recognise one — with
 * the name set beneath it and no border of its own, plus what the catalog states
 * about how long the crop occupies the ground, the month that lands in, and how
 * much room it needs.
 *
 * The header states the season as the card's subject rather than as a caption:
 * how far through it we are in days, and how many are left. "Day 77 of 122" and
 * "45 days left" are the same fact from both ends, and growers plan against the
 * second one.
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
import type { VisualIconKey } from '@/types/visual.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonBlockStyles';

interface Props {
  season: SeasonProgress;
  note: string;
  /** This month's almanac headline, e.g. "Mid-monsoon". Subtitles the season. */
  monthHighlight: string;
  /** The almanac's icon for this month, shown in the header badge. */
  monthIconKey: VisualIconKey;
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

/**
 * `daysRemaining` counts the days after today, so the last day of a season is 0
 * rather than 1 and has to be named instead of counted.
 */
function daysLeftLabel(daysRemaining: number): string {
  if (daysRemaining <= 0) return 'Last day';
  if (daysRemaining === 1) return '1 day left';
  return `${daysRemaining} days left`;
}

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
 *
 * The time to yield leads the figures because it is the one that decides
 * whether the crop fits the bed and the season that is left; spacing follows it.
 * Each line is dropped rather than placeheld when the catalog is silent, so a
 * profile-less crop is still a name and a photo and still opens its entry.
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

  const yieldLine = item.daysToHarvest !== null ? `Yield in ${item.daysToHarvest}` : null;
  const spacing = item.spacingCm !== null ? `${item.spacingCm} cm apart` : null;

  const spoken = [
    item.label,
    item.closing ? 'last month to start' : null,
    item.daysToHarvest !== null ? `yield in ${item.daysToHarvest}` : null,
    item.harvestByLabel,
    spacing,
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
        {yieldLine !== null && (
          <Text style={styles.tileYield} numberOfLines={1}>
            {yieldLine}
          </Text>
        )}
        {item.harvestByLabel !== null && (
          <Text style={styles.tileHarvest} numberOfLines={1}>
            {item.harvestByLabel}
          </Text>
        )}
        {spacing !== null && (
          <Text style={styles.tileMeta} numberOfLines={1}>
            {spacing}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export const SeasonBlock = React.memo(function SeasonBlock({
  season,
  note,
  monthHighlight,
  monthIconKey,
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

  const subtitle = [monthHighlight, season.monthLabel]
    .filter((part) => part.length > 0)
    .join(' · ');

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
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.iconBadge}>
            <GardenIcon name={monthIconKey} size={20} color={theme.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {season.seasonName}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View style={styles.daysLeftPill}>
            <Text style={styles.daysLeftText}>{daysLeftLabel(season.daysRemaining)}</Text>
          </View>
        </View>

        <View
          style={styles.bar}
          accessibilityRole="progressbar"
          accessibilityLabel={`Day ${season.dayOfSeason} of ${season.totalDays} of ${season.seasonName}, ${daysLeftLabel(season.daysRemaining).toLowerCase()}`}
        >
          <View style={[styles.barElapsed, { flex: Math.max(elapsed, 0.02) }]} />
          <View style={[styles.barRemaining, { flex: Math.max(1 - elapsed, 0.02) }]} />
        </View>

        <View style={styles.barLabels}>
          <Text style={styles.barLabel}>
            Day {season.dayOfSeason} of {season.totalDays}
          </Text>
          <Text style={styles.barLabel}>
            Week {season.week} of {season.totalWeeks}
          </Text>
        </View>
      </View>

      {/* The header band closes with a hairline of its own, so the rule is only
          earned once there is a note between the two. */}
      {note.length > 0 && (
        <>
          <Text style={styles.note}>{note}</Text>
          <View style={styles.sectionRule} />
        </>
      )}

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
