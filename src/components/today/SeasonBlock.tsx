/**
 * SeasonBlock - the Today screen's compact seasonal guide.
 *
 * The crop groups deliberately consume a small, source-reviewed district
 * calendar. They never enumerate the user's whole plant catalogue.
 *
 * The citations behind that calendar are not printed here. They are recorded in
 * `TODAY_AGRONOMY_EVIDENCE` and mirrored in `docs/tamil-nadu-reference-audit.md`,
 * and the catalog entry every tile opens states them in full — four lines of
 * fine print on the daily screen said the same thing a tap away from where it
 * belongs. The review dates still govern this card: guidance is withheld once
 * its source review lapses, which is what `review_expired` says below.
 *
 * Every crop is a tap target into its catalog entry: a name alone is not a
 * decision, and the spacing and days-to-harvest that make it one already live
 * there. The tile is a card — the crop's photo, the fastest way to recognise
 * one, over its name and the two figures that decide whether it fits a bed.
 *
 * Two figures and no more. The window the crop opens in is what the card's own
 * header already establishes, month and season both; the harvest month is
 * days-to-harvest counted forward, so the figure says it already; and the
 * growing conditions are a paragraph the catalog entry is better placed to
 * hold. All three are still spoken by the tile's label — losing a line is no
 * reason to lose a fact.
 *
 * The header states the season as the card's subject rather than as a caption:
 * how far through it we are in days, and how many are left. "Day 77 of 122" and
 * "45 days left" are the same fact from both ends, and growers plan against the
 * second one.
 *
 * The one caption under that title names the zone, because the zone is the only
 * thing in the header the rest of the screen does not already say — and it is
 * what selects the advisory printed two lines below. The calendar month and the
 * almanac's headline for it both stood here once and were removed: the month is
 * in the hero date, and the headline was, in every one of the twelve months,
 * either the season name again or the advisory compressed to three words.
 *
 * The badge is keyed to the season for the same reason, having previously been
 * keyed to the calendar month: it would turn over on the 1st under a title that
 * had not changed, and mid-monsoon it drew the watering icon above a note that
 * says to postpone sowing while water is standing.
 *
 * Next month's crops close the planting section as a labelled block rather than
 * as a trailing sentence. They are still context and not work — no photos, no
 * tap targets, one line of names — but set as bare tertiary type under two
 * photo tiles they read as debris left over from the grid rather than as
 * something the card meant to say. The card already owns a recipe for context
 * that closes a section, the one perennial care uses: a rule, an uppercase
 * label, and a line of body text. This is that recipe, and it names the month
 * rather than saying "next month", because the calendar knows which month it
 * counted and a grower buying seed is working to a name. The label is worded
 * as the "Plant now in …" heading is, so the section reads as the same
 * instruction moved to a later date rather than as a different kind of fact.
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
import { formatSpacingFigure } from '@/utils/growSpecFormat';
import {
  PerennialCareBrief,
  PlantNowRecommendation,
  PlantingRecommendationState,
  PlantType,
  SeasonProgress,
} from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/seasonBlockStyles';

interface Props {
  season: SeasonProgress;
  note: string;
  /** The season's own icon, shown in the header badge. See `getSeasonIconKey`. */
  seasonIconKey: VisualIconKey;
  tip: string;
  tipTitle: string;
  district: string | null;
  zoneLabel: string | null;
  plantingState: PlantingRecommendationState;
  recommendations: PlantNowRecommendation[];
  /** Crop names whose window opens next month — context, not tiles. */
  openingNext: string[];
  /** The month those windows open in, e.g. "September". */
  openingNextLabel: string;
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
 * rather than as fragments and an image. The window, the harvest month and the
 * conditions are spoken even though nothing on screen marks them: they left the
 * card for density, not because they stopped being true.
 *
 * The time to yield leads the meta line because it is the figure that decides
 * whether the crop fits the bed and the season that is left; the spacing follows
 * it, marked with an arrow rather than spelled "apart". The word cost six of the
 * eighteen or so characters the card has room for, which is what used to push
 * the line into an ellipsis; the mark says the same thing in one and keeps the
 * figure from being read as a height. `formatSpacingFigure` owns both the mark
 * and the choice of number.
 *
 * Where a crop's spacing is a sentence with two pitches in it, only the first —
 * the distance between plants — reaches the card. The row pitch is still spoken
 * below and still stated in full by the entry this tile opens. The whole line is
 * dropped rather than placeheld when both figures are silent, so a profile-less
 * crop is still a name and a photo, and still opens its entry.
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

  const spacing = formatSpacingFigure(item.spacingCm, item.spacingLabel);
  const meta = [item.daysToHarvest, spacing]
    .filter((part): part is string => part !== null)
    .join(' · ');

  const spoken = [
    item.label,
    item.closing ? 'last month to start' : null,
    item.daysToHarvest !== null ? `yield in ${item.daysToHarvest}` : null,
    item.harvestByLabel,
    // The spoken form keeps the catalog's full phrasing — "150 cm apart" is a
    // sentence, where the card's "150 cm" is a column of figures.
    item.spacingLabel,
    item.windowLabel,
    item.conditions.map((condition) => condition.replace(/[.\s]+$/, '')).join('. '),
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
        <Text style={styles.tileName} numberOfLines={1}>
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
  seasonIconKey,
  tip,
  tipTitle,
  district,
  zoneLabel,
  plantingState,
  recommendations,
  openingNext,
  openingNextLabel,
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

  /** Withheld rather than blanked: an unset district leaves no caption to write. */
  const subtitle = zoneLabel ?? '';

  // Echoes the "Plant now in …" heading above it, so the two read as the same
  // instruction at two dates rather than as two different kinds of fact. The
  // fallback is unreachable in practice — no month label means no zone, and no
  // zone means no crops to list — but it keeps the heading off "Plant in ".
  const openingNextTitle = openingNextLabel ? `Plant in ${openingNextLabel}` : 'Plant next month';

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
            <GardenIcon name={seasonIconKey} size={20} color={theme.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {season.seasonName}
            </Text>
            {subtitle.length > 0 && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
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

      {plantingState === 'available' && recommendations.length > 0 ? (
        <>
          <Text style={styles.sowTitle}>
            {district ? `Plant now in ${district}` : 'Plant now'}
          </Text>

          {renderGroup('sow', sown)}
          {renderGroup('transplant', transplanted)}

          {openingNext.length > 0 && (
            <View
              style={styles.openingNext}
              accessible
              accessibilityLabel={`${openingNextTitle}: ${openingNext.join(', ')}`}
            >
              <Text style={styles.openingNextTitle}>{openingNextTitle}</Text>
              <Text style={styles.openingNextCrops}>{openingNext.join(' · ')}</Text>
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={styles.sowTitle}>Plant now</Text>
          <Text style={styles.emptyText}>
            {plantingState === 'missing_district'
              ? 'Planting suggestions need to know which Tamil Nadu district this farm is in.'
              : plantingState === 'unsupported_district'
                ? `${district ?? 'This location'} is not in the reviewed Tamil Nadu district registry.`
                : plantingState === 'review_expired'
                  ? 'Planting guidance is hidden until its TNAU source review is renewed.'
                  : `No reviewed home-garden crop window is open in ${district ?? 'this district'} this month.`}
          </Text>
          {(plantingState === 'missing_district' || plantingState === 'unsupported_district') && (
            <TouchableOpacity
              onPress={onPressDistrict}
              activeOpacity={0.7}
              hitSlop={LINK_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Set your district. Opens my farm."
            >
              <Text style={styles.emptyLink}>Set your district ›</Text>
            </TouchableOpacity>
          )}
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
