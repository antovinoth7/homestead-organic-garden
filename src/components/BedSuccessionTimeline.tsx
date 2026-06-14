import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { Bed, Plant, CropFamily } from '@/types/database.types';
import { getGreenManureForMonth, getGuildTemplate } from '@/config/beds';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { createStyles } from '@/styles/bedSuccessionTimelineStyles';

const DAY_PX = 2;
const BAND_HEIGHT = 22;
const MONTH_HEIGHT = 18;
const BAR_HEIGHT = 10;
const ROW_HEIGHT = 22;

type SeasonId = 'cool_dry' | 'summer' | 'sw_monsoon' | 'ne_monsoon';

interface SeasonBand {
  id: SeasonId;
  shortLabel: string;
  startOffset: number;
  endOffset: number;
}

const SEASON_MONTHS = [
  { id: 'cool_dry' as SeasonId, shortLabel: 'Cool & Dry', startM: 1, endM: 2 },
  { id: 'summer' as SeasonId, shortLabel: 'Summer', startM: 3, endM: 5 },
  { id: 'sw_monsoon' as SeasonId, shortLabel: 'SW Monsoon', startM: 6, endM: 9 },
  { id: 'ne_monsoon' as SeasonId, shortLabel: 'NE Monsoon', startM: 10, endM: 12 },
] as const;

// Build a guild-template harvest-days index keyed by plant name.
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

function getDaysToHarvestRange(plant: Plant): { min: number; max: number } {
  const profile = getPlantCareProfile(plant.name, plant.plant_type ?? undefined);
  const range = profile?.daysToHarvest;
  if (range) return { min: range.min, max: range.max };

  buildGuildCacheIfNeeded();
  const fromGuild = GUILD_HARVEST_DAYS_CACHE.get(plant.name);
  if (fromGuild !== undefined) return { min: fromGuild, max: fromGuild };

  return { min: 55, max: 75 };
}

const NEXT_CROP_AFTER: Partial<Record<CropFamily, string>> = {
  solanaceae: 'Legume — N-fixer restores soil after tomato/brinjal',
  cucurbit: 'Legume or Brassica after cucurbits',
  legume: 'Heavy feeder — Solanaceae or Cucurbit thrive after legumes',
  brassica: 'Legume or Root crop after brassica',
  allium: 'Most families — alliums suppress soil pathogens',
  other: 'Legume recommended for soil recovery',
};

// 0-indexed day offset from Jan 1 of baseYear; exceeds 365 for next-year dates
function dayOffset(date: Date, baseYear: number): number {
  const yearStart = new Date(baseYear, 0, 1);
  return Math.round((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
}

// Calendar month (1–12) for a given day offset
function monthForOffset(offset: number, baseYear: number): number {
  const d = new Date(baseYear, 0, 1);
  d.setDate(d.getDate() + offset);
  return d.getMonth() + 1;
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function buildMonthLabels(
  baseYear: number,
  maxOffset: number,
): { label: string; offset: number }[] {
  const result: { label: string; offset: number }[] = [];
  let year = baseYear;
  let month = 0;
  for (;;) {
    const date = new Date(year, month, 1);
    const off = dayOffset(date, baseYear);
    if (off > maxOffset + 30) break;
    const short = date.toLocaleString('en', { month: 'short' });
    const suffix = year > baseYear ? ` '${String(year).slice(2)}` : '';
    result.push({ label: short + suffix, offset: off });
    if (++month === 12) { month = 0; year++; }
    if (year > baseYear + 2) break;
  }
  return result;
}

function buildSeasonBands(baseYear: number, maxOffset: number): SeasonBand[] {
  const bands: SeasonBand[] = [];
  for (let y = baseYear; y <= baseYear + 2; y++) {
    for (const s of SEASON_MONTHS) {
      const start = new Date(y, s.startM - 1, 1);
      const end = new Date(y, s.endM, 0); // last day of endM
      const startOff = dayOffset(start, baseYear);
      const endOff = dayOffset(end, baseYear);
      if (startOff > maxOffset + 60) return bands;
      bands.push({ id: s.id, shortLabel: s.shortLabel, startOffset: startOff, endOffset: endOff });
    }
  }
  return bands;
}

interface PlantBar {
  name: string;
  startOffset: number;
  growEndOffset: number;
  harvestEndOffset: number;
  /** True when no sow/planting date was recorded — the bar is anchored at today as an estimate. */
  estimated: boolean;
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
  const baseYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayOffset = useMemo(() => dayOffset(today, baseYear), [today, baseYear]);

  // Build one bar per unique plant species (earliest planting date wins)
  const plantBars = useMemo((): PlantBar[] => {
    const earliestDate = new Map<string, Date>();
    const representativePlant = new Map<string, Plant>();
    for (const p of plants) {
      const d = parseDate(p.sow_date) ?? parseDate(p.planting_date);
      if (!representativePlant.has(p.name)) representativePlant.set(p.name, p);
      if (!d) continue;
      const existing = earliestDate.get(p.name);
      if (!existing || d < existing) earliestDate.set(p.name, d);
    }
    const uniqueNames = [...new Set(plants.map((p) => p.name))];
    return uniqueNames
      .map((name) => {
        // No recorded sow/planting date → anchor at today and flag as an estimate
        // (rather than the bed's creation date, which can be months off).
        const recorded = earliestDate.get(name);
        const plantDate = recorded ?? today;
        const startOff = dayOffset(plantDate, baseYear);
        const rep = representativePlant.get(name);
        const dth = rep ? getDaysToHarvestRange(rep) : { min: 55, max: 75 };
        return {
          name,
          startOffset: startOff,
          growEndOffset: startOff + dth.min,
          harvestEndOffset: startOff + dth.max,
          estimated: !recorded,
        };
      })
      .filter((bar) => bar.startOffset < 730);
  }, [plants, today, baseYear]);

  const canvasWidth = useMemo(() => {
    const maxHarvest =
      plantBars.length > 0
        ? Math.max(...plantBars.map((b) => b.harvestEndOffset))
        : todayOffset + 30;
    return Math.max(maxHarvest + 30, 365) * DAY_PX;
  }, [plantBars, todayOffset]);

  // Green manure window: 1 week after last harvest, 30 days long
  const greenManureInfo = useMemo(() => {
    const lastEnd =
      plantBars.length > 0
        ? Math.max(...plantBars.map((b: PlantBar) => b.harvestEndOffset))
        : todayOffset;
    const gmStart = lastEnd + 7;
    const gmEnd = gmStart + 30;
    const month = monthForOffset(gmStart, baseYear);
    const gm = getGreenManureForMonth(month > 0 ? month : currentMonth);
    return { startOffset: gmStart, endOffset: gmEnd, gm };
  }, [plantBars, todayOffset, baseYear, currentMonth]);

  const maxOffset = Math.max(
    greenManureInfo.endOffset,
    plantBars.length > 0 ? Math.max(...plantBars.map((b) => b.harvestEndOffset)) : todayOffset,
  );

  const monthLabels = useMemo(
    () => buildMonthLabels(baseYear, maxOffset),
    [baseYear, maxOffset],
  );

  const seasonBands = useMemo(
    () => buildSeasonBands(baseYear, maxOffset),
    [baseYear, maxOffset],
  );

  const nextCropHint = bed.prev_crop_family
    ? (NEXT_CROP_AFTER[bed.prev_crop_family] ?? null)
    : null;

  // Scroll so "today" is visible with some left margin
  useEffect(() => {
    const scrollX = Math.max(0, todayOffset * DAY_PX - 80);
    scrollRef.current?.scrollTo({ x: scrollX, y: 0, animated: false });
  }, [todayOffset]);

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
                {bar.estimated ? ' (est.)' : ''}
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

        {/* Horizontally scrollable canvas */}
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.canvasRelative, { width: canvasWidth, height: canvasHeight }]}>

            {/* Season bands */}
            {seasonBands.map((band, idx) => (
              <View
                key={`${band.id}-${idx}`}
                style={[
                  styles.band,
                  bandBg(band.id),
                  {
                    left: band.startOffset * DAY_PX,
                    width: (band.endOffset - band.startOffset + 1) * DAY_PX,
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
            {monthLabels.map(({ label, offset }) => (
              <Text
                key={label}
                style={[
                  styles.monthLabel,
                  { left: offset * DAY_PX + 1, top: BAND_HEIGHT + 2 },
                ]}
              >
                {label}
              </Text>
            ))}

            {/* Plant bars: growing period + harvest window */}
            {plantBars.map((bar: PlantBar, i: number) => {
              const barTop =
                BAND_HEIGHT +
                MONTH_HEIGHT +
                i * ROW_HEIGHT +
                Math.round((ROW_HEIGHT - BAR_HEIGHT) / 2);
              return (
                <React.Fragment key={bar.name}>
                  {/* Growing period: sow → harvest window start */}
                  <View
                    style={[
                      styles.growingBar,
                      {
                        left: bar.startOffset * DAY_PX,
                        width: Math.max((bar.growEndOffset - bar.startOffset) * DAY_PX, 4),
                        top: barTop,
                        height: BAR_HEIGHT,
                      },
                      bar.estimated && styles.estimatedBar,
                    ]}
                  />
                  {/* Harvest window: harvest start → harvest end */}
                  <View
                    style={[
                      styles.harvestBar,
                      {
                        left: bar.growEndOffset * DAY_PX,
                        width: Math.max((bar.harvestEndOffset - bar.growEndOffset) * DAY_PX, 4),
                        top: barTop,
                        height: BAR_HEIGHT,
                      },
                      bar.estimated && styles.estimatedBar,
                    ]}
                  />
                </React.Fragment>
              );
            })}

            {/* Green manure fallow bar */}
            <View
              style={[
                styles.greenManureBar,
                {
                  left: greenManureInfo.startOffset * DAY_PX,
                  width: Math.max(
                    (greenManureInfo.endOffset - greenManureInfo.startOffset) * DAY_PX,
                    6,
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
                { left: todayOffset * DAY_PX, height: canvasHeight },
              ]}
            />

            {/* "Today" tick marker at month-label row */}
            <Text
              style={[
                styles.todayTick,
                { left: todayOffset * DAY_PX - 5, top: BAND_HEIGHT },
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
          <View style={[styles.legendDot, styles.legendDotGrowing]} />
          <Text style={styles.legendText}>Growing period</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotGreen]} />
          <Text style={styles.legendText}>Harvest window</Text>
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
