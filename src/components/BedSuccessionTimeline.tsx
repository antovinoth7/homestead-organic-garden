import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { Bed, Plant, CropFamily } from '@/types/database.types';
import { getGreenManureForMonth, getGuildTemplate } from '@/config/beds';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { createStyles } from '@/styles/bedSuccessionTimelineStyles';

const DAY_PX = 2;
const TOTAL_WIDTH = 365 * DAY_PX;
const BAND_HEIGHT = 22;
const MONTH_HEIGHT = 18;
const BAR_HEIGHT = 10;
const ROW_HEIGHT = 22;

type SeasonId = 'cool_dry' | 'summer' | 'sw_monsoon' | 'ne_monsoon';

interface SeasonBand {
  id: SeasonId;
  shortLabel: string;
  startDay: number;
  endDay: number;
}

const SEASON_BANDS: SeasonBand[] = [
  { id: 'cool_dry', shortLabel: 'Cool & Dry', startDay: 1, endDay: 59 },
  { id: 'summer', shortLabel: 'Summer', startDay: 60, endDay: 151 },
  { id: 'sw_monsoon', shortLabel: 'SW Monsoon', startDay: 152, endDay: 273 },
  { id: 'ne_monsoon', shortLabel: 'NE Monsoon', startDay: 274, endDay: 365 },
];

const MONTH_STARTS: { label: string; doy: number }[] = [
  { label: 'Jan', doy: 1 },
  { label: 'Feb', doy: 32 },
  { label: 'Mar', doy: 60 },
  { label: 'Apr', doy: 91 },
  { label: 'May', doy: 121 },
  { label: 'Jun', doy: 152 },
  { label: 'Jul', doy: 182 },
  { label: 'Aug', doy: 213 },
  { label: 'Sep', doy: 244 },
  { label: 'Oct', doy: 274 },
  { label: 'Nov', doy: 305 },
  { label: 'Dec', doy: 335 },
];

// Build a guild-template harvest-days index keyed by plant name.
// Populated lazily the first time it's needed (avoids importing all 8 templates at module load).
const GUILD_HARVEST_DAYS_CACHE = new Map<string, number>();
let guildCacheBuilt = false;

function buildGuildCacheIfNeeded(): void {
  if (guildCacheBuilt) return;
  guildCacheBuilt = true;
  const BED_TYPES = [
    'leafy', 'fruiting', 'spice', 'root_legume',
    'climber_trellis', 'three_sisters', 'medicinal_guild',
  ] as const;
  for (const t of BED_TYPES) {
    for (const row of getGuildTemplate(t).plant_rows) {
      if (row.days_to_harvest !== undefined && !GUILD_HARVEST_DAYS_CACHE.has(row.name)) {
        GUILD_HARVEST_DAYS_CACHE.set(row.name, row.days_to_harvest);
      }
    }
  }
}

function getDaysToHarvest(plant: Plant): number {
  // 1. Plant care profile (170+ varieties, returns midpoint of min/max range)
  const profile = getPlantCareProfile(plant.name, plant.plant_type ?? undefined);
  const range = profile?.daysToHarvest;
  if (range) return Math.round((range.min + range.max) / 2);

  // 2. Guild template plant_rows (single integer, covers all 8 guilds)
  buildGuildCacheIfNeeded();
  const fromGuild = GUILD_HARVEST_DAYS_CACHE.get(plant.name);
  if (fromGuild !== undefined) return fromGuild;

  return 60; // generic fallback
}

const NEXT_CROP_AFTER: Partial<Record<CropFamily, string>> = {
  solanaceae: 'Legume — N-fixer restores soil after tomato/brinjal',
  cucurbit: 'Legume or Brassica after cucurbits',
  legume: 'Heavy feeder — Solanaceae or Cucurbit thrive after legumes',
  brassica: 'Legume or Root crop after brassica',
  allium: 'Most families — alliums suppress soil pathogens',
  other: 'Legume recommended for soil recovery',
};

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function monthForDoy(doy: number): number {
  let idx = 0;
  for (let i = 0; i < MONTH_STARTS.length; i++) {
    if (MONTH_STARTS[i]!.doy <= doy) idx = i;
  }
  return idx + 1;
}

interface PlantBar {
  name: string;
  startDay: number;
  endDay: number;
}

interface Props {
  bed: Bed;
  plants: Plant[];
}

export function BedSuccessionTimeline({ bed, plants }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const scrollRef = useRef<ScrollView>(null);

  const today = useMemo(() => new Date(), []);
  const todayDoy = useMemo(() => dayOfYear(today), [today]);
  const currentMonth = today.getMonth() + 1;

  // Build one bar per unique plant species (earliest planting date wins)
  const plantBars = useMemo((): PlantBar[] => {
    // Collect earliest planting date and a representative Plant per species
    const earliestDate = new Map<string, Date>();
    const representativePlant = new Map<string, Plant>();
    for (const p of plants) {
      const d = parseDate(p.sow_date) ?? parseDate(p.planting_date);
      if (!representativePlant.has(p.name)) representativePlant.set(p.name, p);
      if (!d) continue;
      const existing = earliestDate.get(p.name);
      if (!existing || d < existing) earliestDate.set(p.name, d);
    }
    const fallback = parseDate(bed.created_at) ?? today;
    const uniqueNames = [...new Set(plants.map((p) => p.name))];
    return uniqueNames
      .map((name) => {
        const plantDate = earliestDate.get(name) ?? fallback;
        const startDay = Math.min(dayOfYear(plantDate), 364);
        const rep = representativePlant.get(name);
        const dth = rep ? getDaysToHarvest(rep) : 60;
        const endDay = Math.min(startDay + dth, 365);
        return { name, startDay, endDay };
      })
      .filter((bar) => bar.startDay < 365);
  }, [plants, bed.created_at, today]);

  // Green manure window: 1 week after last harvest, 30 days long
  const greenManureInfo = useMemo(() => {
    const lastEnd =
      plantBars.length > 0 ? Math.max(...plantBars.map((b: PlantBar) => b.endDay)) : todayDoy;
    const gmStart = Math.min(lastEnd + 7, 358);
    const gmEnd = Math.min(gmStart + 30, 365);
    const month = monthForDoy(gmStart);
    const gm = getGreenManureForMonth(month > 0 ? month : currentMonth);
    return { startDay: gmStart, endDay: gmEnd, gm };
  }, [plantBars, todayDoy, currentMonth]);

  const nextCropHint = bed.prev_crop_family
    ? (NEXT_CROP_AFTER[bed.prev_crop_family] ?? null)
    : null;

  // Scroll so "today" is visible with some left margin
  useEffect(() => {
    const scrollX = Math.max(0, (todayDoy - 1) * DAY_PX - 80);
    scrollRef.current?.scrollTo({ x: scrollX, y: 0, animated: false });
  }, [todayDoy]);

  const totalRows = plantBars.length + 1; // +1 for green manure
  const canvasHeight = BAND_HEIGHT + MONTH_HEIGHT + totalRows * ROW_HEIGHT + 4;

  const bandBg = (id: SeasonId): ViewStyle => {
    const s =
      id === 'summer'
        ? styles.bandSummer
        : id === 'sw_monsoon'
          ? styles.bandSwMonsoon
          : id === 'ne_monsoon'
            ? styles.bandNeMonsoon
            : styles.bandCoolDry;
    // createStyles() returns the loose StyleSheet union; these keys are ViewStyles.
    return s as ViewStyle;
  };

  const bandTxt = (id: SeasonId): TextStyle => {
    const s =
      id === 'summer'
        ? styles.bandLabelSummer
        : id === 'sw_monsoon'
          ? styles.bandLabelSwMonsoon
          : id === 'ne_monsoon'
            ? styles.bandLabelNeMonsoon
            : styles.bandLabelCoolDry;
    return s as TextStyle;
  };

  return (
    <View style={styles.container}>
      {/* Layout: fixed name column + scrollable canvas */}
      <View style={styles.timelineRow}>
        {/* Fixed left column — plant names */}
        <View style={[styles.leftCol, { height: canvasHeight }]}>
          <View style={{ height: BAND_HEIGHT + MONTH_HEIGHT }} />
          {plantBars.map((bar: PlantBar) => (
            <View key={bar.name} style={styles.leftLabel}>
              <Text style={styles.leftLabelText} numberOfLines={1}>
                {bar.name}
              </Text>
            </View>
          ))}
          <View style={styles.leftLabel}>
            <Text style={styles.leftLabelGm} numberOfLines={1}>
              {greenManureInfo.gm.tamilName}
            </Text>
            <Text style={styles.leftLabelGmSub} numberOfLines={1}>
              {greenManureInfo.gm.name}
            </Text>
          </View>
        </View>

        {/* Horizontally scrollable year canvas */}
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.canvasRelative, { width: TOTAL_WIDTH, height: canvasHeight }]}>

            {/* Season bands */}
            {SEASON_BANDS.map((band) => (
              <View
                key={band.id}
                style={[
                  styles.band,
                  bandBg(band.id),
                  {
                    left: (band.startDay - 1) * DAY_PX,
                    width: (band.endDay - band.startDay + 1) * DAY_PX,
                    height: BAND_HEIGHT,
                  },
                ]}
              >
                <Text style={[styles.bandLabel, bandTxt(band.id)]} numberOfLines={1}>
                  {band.shortLabel}
                </Text>
              </View>
            ))}

            {/* Month tick labels */}
            {MONTH_STARTS.map(({ label, doy }) => (
              <Text
                key={label}
                style={[
                  styles.monthLabel,
                  { left: (doy - 1) * DAY_PX + 1, top: BAND_HEIGHT + 2 },
                ]}
              >
                {label}
              </Text>
            ))}

            {/* Plant harvest bars */}
            {plantBars.map((bar: PlantBar, i: number) => (
              <View
                key={bar.name}
                style={[
                  styles.harvestBar,
                  {
                    left: (bar.startDay - 1) * DAY_PX,
                    width: Math.max((bar.endDay - bar.startDay) * DAY_PX, 6),
                    top:
                      BAND_HEIGHT +
                      MONTH_HEIGHT +
                      i * ROW_HEIGHT +
                      Math.round((ROW_HEIGHT - BAR_HEIGHT) / 2),
                    height: BAR_HEIGHT,
                  },
                ]}
              />
            ))}

            {/* Green manure fallow bar */}
            <View
              style={[
                styles.greenManureBar,
                {
                  left: (greenManureInfo.startDay - 1) * DAY_PX,
                  width: Math.max(
                    (greenManureInfo.endDay - greenManureInfo.startDay) * DAY_PX,
                    6
                  ),
                  top:
                    BAND_HEIGHT +
                    MONTH_HEIGHT +
                    plantBars.length * ROW_HEIGHT +
                    Math.round((ROW_HEIGHT - BAR_HEIGHT) / 2),
                  height: BAR_HEIGHT,
                },
              ]}
            />

            {/* Today vertical line */}
            <View
              style={[
                styles.todayLine,
                { left: (todayDoy - 1) * DAY_PX, height: canvasHeight },
              ]}
            />

            {/* "Today" tick marker at month-label row */}
            <Text
              style={[
                styles.todayTick,
                { left: (todayDoy - 1) * DAY_PX - 5, top: BAND_HEIGHT },
              ]}
            >
              ▼
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotGreen]} />
          <Text style={styles.legendText}>Crop harvest window</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotAccent]} />
          <Text style={styles.legendText}>{greenManureInfo.gm.name} (green manure)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotToday]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>

      {/* Green manure rationale */}
      <View style={styles.gmRationale}>
        <Text style={styles.gmRationaleText}>🌱 {greenManureInfo.gm.rationale}</Text>
      </View>

      {/* Next crop rotation hint */}
      {nextCropHint && (
        <View style={styles.nextCropCard}>
          <Text style={styles.nextCropLabel}>NEXT ROTATION →</Text>
          <Text style={styles.nextCropText}>{nextCropHint}</Text>
        </View>
      )}
    </View>
  );
}
