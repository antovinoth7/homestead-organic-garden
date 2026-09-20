import { getAliasesFor } from '@/utils/plantAliases';
import type { PlantProfiles, PlantType } from '@/types/database.types';

export interface CatalogSearchEntry {
  plantType: PlantType;
  name: string;
  tamilName?: string;
  /** Other names for this plant — "Okra" for Ladies Finger, "Methi" for Fenugreek. */
  aliases: string[];
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
  matchedField: 'name' | 'tamilName' | 'alias' | 'tokens';
  /** The alias that matched, when `matchedField` is 'alias' — shown on the row. */
  matchedAlias?: string;
}

export interface CatalogSearchOutcome {
  results: CatalogSearchResult[];
  /** Matches before the limit was applied, so the UI can say "60 of 87". */
  totalMatches: number;
}

const DEFAULT_LIMIT = 60;

/**
 * NFC only — no diacritic stripping. Case folding and NFC are length-preserving
 * across the Latin and Tamil ranges in play, so offsets found in the normalized
 * string index correctly back into the original. Stripping marks would desync
 * them and corrupt Tamil highlights.
 *
 * The locale is pinned: the argument-less form folds using the *device* locale,
 * and a Turkish-locale phone maps I → ı, which is not length-preserving and
 * would shift every span after it.
 */
function normalize(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('en-US');
}

/**
 * Flattens every category's profiles into one searchable list.
 *
 * Pass the *merged* catalog (`getMergedProfiles`), not the raw stored overrides
 * — the latter is empty until the user edits something, which would leave the
 * index empty while the browse list still showed every bundled plant.
 */
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
        aliases: getAliasesFor(name),
        gardenCount: countsByType[type]?.[name] ?? 0,
      });
    }
  }

  return entries;
}

/**
 * Rank tiers — lower sorts first. Prefix matches win so typing "tom" surfaces
 * "Tomato" above an entry that merely contains "tom" mid-word; direct name and
 * Tamil hits outrank an alias, which in turn outranks a scattered token match.
 */
const RANK_NAME_PREFIX = 0;
const RANK_TAMIL_PREFIX = 1;
const RANK_NAME_SUBSTRING = 2;
const RANK_TAMIL_SUBSTRING = 3;
const RANK_ALIAS = 4;
const RANK_TOKENS = 5;

function rankOf(nameIndex: number, tamilIndex: number): number | null {
  if (nameIndex === 0) return RANK_NAME_PREFIX;
  if (tamilIndex === 0) return RANK_TAMIL_PREFIX;
  if (nameIndex > 0) return RANK_NAME_SUBSTRING;
  if (tamilIndex > 0) return RANK_TAMIL_SUBSTRING;
  return null;
}

/** Every string a token match is allowed to look in. */
function haystacks(entry: CatalogSearchEntry): string[] {
  const parts = [normalize(entry.name), ...entry.aliases.map(normalize)];
  if (entry.tamilName) parts.push(normalize(entry.tamilName));
  return parts;
}

function scoreEntry(entry: CatalogSearchEntry, needle: string): { rank: number; result: CatalogSearchResult } | null {
  const nameIndex = normalize(entry.name).indexOf(needle);
  const tamilIndex = entry.tamilName ? normalize(entry.tamilName).indexOf(needle) : -1;

  const rank = rankOf(nameIndex, tamilIndex);
  if (rank !== null) {
    // A name hit always wins the highlight, even when both fields match, so the
    // primary line is the one that shows why the row is here.
    const matchedOnName = nameIndex >= 0;
    return {
      rank,
      result: {
        ...entry,
        matchedField: matchedOnName ? 'name' : 'tamilName',
        nameSpan: matchedOnName ? { start: nameIndex, end: nameIndex + needle.length } : undefined,
        tamilSpan:
          !matchedOnName && tamilIndex >= 0
            ? { start: tamilIndex, end: tamilIndex + needle.length }
            : undefined,
      },
    };
  }

  // "okra" → Ladies Finger. The row still shows the canonical name, so it also
  // carries the alias that matched — otherwise the result looks unrelated.
  const alias = entry.aliases.find((item) => normalize(item).includes(needle));
  if (alias) {
    return { rank: RANK_ALIAS, result: { ...entry, matchedField: 'alias', matchedAlias: alias } };
  }

  // Last resort: every word present somewhere, in any order across any field.
  // Catches "lady finger" and "gourd bottle", which no single substring does.
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const fields = haystacks(entry);
    if (tokens.every((token) => fields.some((field) => field.includes(token)))) {
      return { rank: RANK_TOKENS, result: { ...entry, matchedField: 'tokens' } };
    }
  }

  return null;
}

export function searchCatalog(
  index: readonly CatalogSearchEntry[],
  query: string,
  limit: number = DEFAULT_LIMIT
): CatalogSearchOutcome {
  const trimmed = query.trim();
  if (!trimmed) return { results: [], totalMatches: 0 };

  const needle = normalize(trimmed);
  const scored: { rank: number; result: CatalogSearchResult }[] = [];

  for (const entry of index) {
    const hit = scoreEntry(entry, needle);
    if (hit) scored.push(hit);
  }

  // Within a tier, plants the user actually grows come first — a catalog this
  // size otherwise buries the five things in their garden under alphabetics.
  scored.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.result.gardenCount !== b.result.gardenCount) {
      return b.result.gardenCount - a.result.gardenCount;
    }
    return a.result.name.localeCompare(b.result.name);
  });

  return {
    results: scored.slice(0, limit).map((item) => item.result),
    totalMatches: scored.length,
  };
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

  const lower = trimmed.toLocaleLowerCase('en-US');
  const withoutDupe = existing.filter((item) => item.trim().toLocaleLowerCase('en-US') !== lower);
  return [trimmed, ...withoutDupe].slice(0, RECENT_SEARCH_LIMIT);
}
