import type { PlantProfiles, PlantType } from '@/types/database.types';

export interface CatalogSearchEntry {
  plantType: PlantType;
  name: string;
  tamilName?: string;
  /** How many garden plants currently use this catalog entry. */
  gardenCount: number;
}

/** Half-open highlight range into the *original* (un-normalized) string. */
export interface MatchSpan {
  start: number;
  end: number;
}

export interface CatalogSearchResult extends CatalogSearchEntry {
  nameSpan?: MatchSpan;
  tamilSpan?: MatchSpan;
  matchedField: 'name' | 'tamilName';
}

const DEFAULT_LIMIT = 60;

/**
 * NFC only — no diacritic stripping. Case folding and NFC are length-preserving
 * across the Latin and Tamil ranges in play, so offsets found in the normalized
 * string index correctly back into the original. Stripping marks would desync
 * them and corrupt Tamil highlights.
 */
function normalize(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase();
}

/** Flattens every category's profiles into one searchable list. */
export function buildCatalogSearchIndex(
  profiles: PlantProfiles,
  countsByType: Record<PlantType, Record<string, number>>
): CatalogSearchEntry[] {
  const entries: CatalogSearchEntry[] = [];

  for (const [type, byName] of Object.entries(profiles) as [
    PlantType,
    Record<string, { tamilName?: string }>,
  ][]) {
    if (!byName) continue;
    for (const [name, profile] of Object.entries(byName)) {
      entries.push({
        plantType: type,
        name,
        tamilName: profile?.tamilName,
        gardenCount: countsByType[type]?.[name] ?? 0,
      });
    }
  }

  return entries;
}

/**
 * Rank tiers — lower sorts first. Prefix matches win so typing "tom" surfaces
 * "Tomato" above an entry that merely contains "tom" mid-word.
 */
function rankOf(nameIndex: number, tamilIndex: number): number | null {
  if (nameIndex === 0) return 0;
  if (tamilIndex === 0) return 1;
  if (nameIndex > 0) return 2;
  if (tamilIndex > 0) return 3;
  return null;
}

export function searchCatalog(
  index: readonly CatalogSearchEntry[],
  query: string,
  limit: number = DEFAULT_LIMIT
): CatalogSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = normalize(trimmed);
  const scored: { rank: number; result: CatalogSearchResult }[] = [];

  for (const entry of index) {
    const nameIndex = normalize(entry.name).indexOf(needle);
    const tamilIndex = entry.tamilName ? normalize(entry.tamilName).indexOf(needle) : -1;

    const rank = rankOf(nameIndex, tamilIndex);
    if (rank === null) continue;

    // A name hit always wins the highlight, even when both fields match, so the
    // primary line is the one that shows why the row is here.
    const matchedOnName = nameIndex >= 0;

    scored.push({
      rank,
      result: {
        ...entry,
        matchedField: matchedOnName ? 'name' : 'tamilName',
        nameSpan: matchedOnName
          ? { start: nameIndex, end: nameIndex + needle.length }
          : undefined,
        tamilSpan:
          !matchedOnName && tamilIndex >= 0
            ? { start: tamilIndex, end: tamilIndex + needle.length }
            : undefined,
      },
    });
  }

  scored.sort((a, b) =>
    a.rank !== b.rank ? a.rank - b.rank : a.result.name.localeCompare(b.result.name)
  );

  return scored.slice(0, limit).map((item) => item.result);
}

/** Splits a string into before / match / after around a span, for highlighting. */
export function splitAtSpan(text: string, span?: MatchSpan): [string, string, string] {
  if (!span) return [text, '', ''];
  return [text.slice(0, span.start), text.slice(span.start, span.end), text.slice(span.end)];
}

const RECENT_SEARCH_LIMIT = 6;

/**
 * Most-recent-first, case-insensitively deduped, capped. Committed only when a
 * search is acted on — never on every keystroke.
 */
export function pushRecentSearch(existing: readonly string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [...existing];

  const lower = trimmed.toLocaleLowerCase();
  const withoutDupe = existing.filter((item) => item.trim().toLocaleLowerCase() !== lower);
  return [trimmed, ...withoutDupe].slice(0, RECENT_SEARCH_LIMIT);
}
