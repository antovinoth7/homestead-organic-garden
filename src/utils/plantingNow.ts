/**
 * "What to Plant Now" derivation — pure logic (Phase C, C.1).
 *
 * Maps a plant's free-text `growingSeason` (and optional `seasonSuitability`
 * list) onto Kanyakumari season ids, then filters to varieties sowable in the
 * current season. Heuristic string matching keeps it resilient to the mixed
 * season vocabularies used across `plantCareDefaults` and the catalog.
 */

import { NumericRange, PlantType } from '@/types/database.types';

/** Kanyakumari season ids (see `src/config/zones/`). */
export type KKSeasonId = 'summer' | 'sw_monsoon' | 'ne_monsoon' | 'cool_dry';

export interface PlantingCandidate {
  plantType: PlantType;
  variety: string;
  /** Free-text growing season (e.g. "Year Round", "Summer (Mar-May)"). */
  growingSeason?: string;
  /** Optional structured season suitability strings. */
  seasonSuitability?: string[];
  /** Harvest window from the care profile, e.g. `{ min: 100, max: 140 }`. */
  daysToHarvest?: NumericRange;
}

export interface PlantingSuggestion {
  plantType: PlantType;
  variety: string;
  daysToHarvest?: NumericRange;
}

const MONTH_INDEX: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

/** The zone model's season for a month: Jan–Feb cool-dry, Mar–May summer, Jun–Sep SW, Oct–Dec NE. */
function seasonForMonth(month: number): KKSeasonId {
  if (month <= 2) return 'cool_dry';
  if (month <= 5) return 'summer';
  if (month <= 9) return 'sw_monsoon';
  return 'ne_monsoon';
}

/**
 * Seasons covered by month ranges written in words — "January–February",
 * "Jun–Aug", "Oct–Feb" (wrapping the year end). A lone month counts as itself.
 */
function seasonIdsFromMonths(t: string): Set<KKSeasonId> {
  const ids = new Set<KKSeasonId>();
  const monthWord = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
  const range = new RegExp(`\\b${monthWord}(?:\\s*[–-]\\s*${monthWord})?`, 'g');
  for (const match of t.matchAll(range)) {
    const start = MONTH_INDEX[match[1] ?? ''];
    const end = MONTH_INDEX[match[2] ?? match[1] ?? ''];
    if (!start || !end) continue;
    let month = start;
    for (let step = 0; step < 12; step += 1) {
      ids.add(seasonForMonth(month));
      if (month === end) break;
      month = (month % 12) + 1;
    }
  }
  return ids;
}

/**
 * Map a free-text season phrase to the KK season ids it covers. Unknown
 * phrases return an empty set; "year round" / "all season" cover every season.
 */
export function mapSeasonTextToIds(text: string): Set<KKSeasonId> {
  const t = text.toLowerCase();
  const ids = new Set<KKSeasonId>();
  if (!t.trim()) return ids;

  // "Year-round in a managed home garden" too — the hyphen used to defeat this.
  if (/year[\s-]*round/.test(t) || t.includes('all season') || t.includes('perennial')) {
    return new Set<KKSeasonId>(['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry']);
  }

  if (t.includes('summer')) ids.add('summer');
  // SW monsoon (Aadi pattam); "kharif" is the retired label, kept for old text.
  if (
    t.includes('southwest') ||
    t.includes('south-west') ||
    t.includes('sw monsoon') ||
    t.includes('sw +') ||
    t.includes('kharif')
  ) {
    ids.add('sw_monsoon');
  }
  // NE monsoon (Purattasi / Karthigai pattam)
  if (t.includes('northeast') || t.includes('north-east') || t.includes('ne monsoon')) {
    ids.add('ne_monsoon');
  }
  // Winter (Thai pattam) is the zone model's Jan–Feb cool-dry season only.
  if (t.includes('winter')) ids.add('cool_dry');
  // Retired "Rabi" (Oct–Jan) and the bundled "Cool Dry" phrasing span the NE
  // monsoon and the cool-dry season.
  if (t.includes('rabi') || t.includes('cool')) {
    ids.add('cool_dry');
    ids.add('ne_monsoon');
  }
  // Bare "monsoon" with no direction → assume SW (main cropping monsoon)
  if (t.includes('monsoon') && ids.size === 0) ids.add('sw_monsoon');

  // Only months, no season named ("June–July and October–November", "Jun–Aug"):
  // the source-defined sowing windows and the tree rows are written this way,
  // and read as no season at all before.
  if (ids.size === 0) {
    for (const id of seasonIdsFromMonths(t)) ids.add(id);
  }

  return ids;
}

/** All season ids a candidate can be sown in, merging growingSeason + suitability. */
export function candidateSeasonIds(candidate: PlantingCandidate): Set<KKSeasonId> {
  const ids = new Set<KKSeasonId>();
  const phrases = [candidate.growingSeason ?? '', ...(candidate.seasonSuitability ?? [])];
  for (const phrase of phrases) {
    for (const id of mapSeasonTextToIds(phrase)) ids.add(id);
  }
  return ids;
}

/**
 * Filter candidates to those sowable in the current season. Candidates with no
 * recognizable season are excluded (we only suggest when we're confident).
 */
export function getWhatToPlantNow(
  candidates: PlantingCandidate[],
  currentSeason: KKSeasonId
): PlantingSuggestion[] {
  const suggestions: PlantingSuggestion[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    const ids = candidateSeasonIds(c);
    if (!ids.has(currentSeason)) continue;
    const key = `${c.plantType}:${c.variety}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({
      plantType: c.plantType,
      variety: c.variety,
      daysToHarvest: c.daysToHarvest,
    });
  }
  return suggestions.sort((a, b) => a.variety.localeCompare(b.variety));
}

/**
 * Collapsed-card summary line, e.g. "Agathi, Aloe Vera, Amaranthus + 5 more".
 * Names the first `previewCount` varieties and counts the rest.
 */
export function formatSuggestionSummary(
  suggestions: PlantingSuggestion[],
  previewCount = 3
): string {
  if (suggestions.length === 0) return '';
  const names = suggestions.slice(0, previewCount).map((s) => s.variety);
  const remaining = suggestions.length - names.length;
  const list = names.join(', ');
  return remaining > 0 ? `${list} + ${remaining} more` : list;
}
