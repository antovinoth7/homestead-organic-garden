/**
 * "What to Plant Now" derivation — pure logic (Phase C, C.1).
 *
 * Maps a plant's free-text `growingSeason` (and optional `seasonSuitability`
 * list) onto Kanyakumari season ids, then filters to varieties sowable in the
 * current season. Heuristic string matching keeps it resilient to the mixed
 * season vocabularies used across `plantCareDefaults` and the catalog.
 */

import { PlantType } from '@/types/database.types';

/** Kanyakumari season ids (see `src/config/zones/`). */
export type KKSeasonId = 'summer' | 'sw_monsoon' | 'ne_monsoon' | 'cool_dry';

export interface PlantingCandidate {
  plantType: PlantType;
  variety: string;
  /** Free-text growing season (e.g. "Year Round", "Summer (Mar-May)"). */
  growingSeason?: string;
  /** Optional structured season suitability strings. */
  seasonSuitability?: string[];
}

export interface PlantingSuggestion {
  plantType: PlantType;
  variety: string;
}

/**
 * Map a free-text season phrase to the KK season ids it covers. Unknown
 * phrases return an empty set; "year round" / "all season" cover every season.
 */
export function mapSeasonTextToIds(text: string): Set<KKSeasonId> {
  const t = text.toLowerCase();
  const ids = new Set<KKSeasonId>();
  if (!t.trim()) return ids;

  if (t.includes('year round') || t.includes('all season') || t.includes('perennial')) {
    return new Set<KKSeasonId>(['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry']);
  }

  if (t.includes('summer')) ids.add('summer');
  // SW monsoon / Kharif
  if (
    t.includes('southwest') ||
    t.includes('south-west') ||
    t.includes('sw monsoon') ||
    t.includes('kharif') ||
    t.includes('jun')
  ) {
    ids.add('sw_monsoon');
  }
  // NE monsoon
  if (t.includes('northeast') || t.includes('north-east') || t.includes('ne monsoon')) {
    ids.add('ne_monsoon');
  }
  // Rabi / winter / cool-dry (Oct–Jan spans NE monsoon + cool dry)
  if (t.includes('rabi') || t.includes('winter') || t.includes('cool')) {
    ids.add('cool_dry');
    ids.add('ne_monsoon');
  }
  // Bare "monsoon" with no direction → assume SW (main cropping monsoon)
  if (t.includes('monsoon') && ids.size === 0) ids.add('sw_monsoon');

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
    suggestions.push({ plantType: c.plantType, variety: c.variety });
  }
  return suggestions.sort((a, b) => a.variety.localeCompare(b.variety));
}
