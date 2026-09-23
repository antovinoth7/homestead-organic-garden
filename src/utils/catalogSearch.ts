import { getAliasesFor, getCanonicalPlantKey } from '@/utils/plantAliases';
import { getTaxonomy } from '@/config/plants/catalogTaxonomy';
import { TAG_LABELS } from '@/utils/plantLabels';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

export interface CatalogSearchEntry {
  plantType: PlantType;
  name: string;
  tamilName?: string;
  /** Other names for this plant — "Okra" for Ladies Finger, "Methi" for Fenugreek. */
  aliases: string[];
  /**
   * Tag labels, so a search for what a plant *is for* finds it: "keerai" reaches
   * the greens, "green manure" reaches Agathi, "trellis" reaches the climbers.
   */
  tagLabels: string[];
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
  matchedField: 'name' | 'tamilName' | 'alias' | 'tag' | 'tokens';
  /** The alias that matched, when `matchedField` is 'alias' — shown on the row. */
  matchedAlias?: string;
  /** The tag that matched, when `matchedField` is 'tag' — shown on the row. */
  matchedTag?: string;
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
export function normalize(value: string): string {
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
        tagLabels: getTaxonomy(name, type).tags.map((tag) => TAG_LABELS[tag]),
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
/** Below an alias: a tag says what a plant is for, not what it is called. */
const RANK_TAG = 5;
const RANK_TOKENS = 6;

function rankOf(nameIndex: number, tamilIndex: number): number | null {
  if (nameIndex === 0) return RANK_NAME_PREFIX;
  if (tamilIndex === 0) return RANK_TAMIL_PREFIX;
  if (nameIndex > 0) return RANK_NAME_SUBSTRING;
  if (tamilIndex > 0) return RANK_TAMIL_SUBSTRING;
  return null;
}

/** Every string a token match is allowed to look in. */
function haystacks(entry: CatalogSearchEntry): string[] {
  const parts = [
    normalize(entry.name),
    ...entry.aliases.map(normalize),
    ...entry.tagLabels.map(normalize),
  ];
  if (entry.tamilName) parts.push(normalize(entry.tamilName));
  return parts;
}

/**
 * Tamil is typed consonant first, vowel sign second, so a half-typed query
 * often ends on a bare consonant ("வெண்ட"). Cutting the highlight there
 * splits a letter from its vowel sign and the sign renders on a dotted circle.
 * Grow the span over any trailing combining marks (vowel signs, virama).
 */
export function extendPastCombiningMarks(text: string, end: number): number {
  let next = end;
  while (next < text.length && /[\u0B82\u0BBE-\u0BCD\u0BD7]/.test(text[next] ?? '')) next += 1;
  return next;
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
          !matchedOnName && tamilIndex >= 0 && entry.tamilName
            ? {
                start: tamilIndex,
                end: extendPastCombiningMarks(entry.tamilName, tamilIndex + needle.length),
              }
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

  // "keerai" → every green; "green manure" → Agathi and Aavaram. Ranked below an
  // alias, since a tag answers what the plant is *for* rather than its name.
  const tag = entry.tagLabels.find((item) => normalize(item).includes(needle));
  if (tag) {
    return { rank: RANK_TAG, result: { ...entry, matchedField: 'tag', matchedTag: tag } };
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

/**
 * The catalog plant a typed name already refers to, if any: the same name, an
 * alias of it ("Okra" is Ladies Finger), or its Tamil name typed exactly. Used
 * before offering to create a plant, since a second entry for a known name is
 * how the catalog's duplicates got there.
 */
export function findCatalogPlant(
  profiles: PlantProfiles,
  typed: string
): { name: string; plantType: PlantType } | undefined {
  const canonical = getCanonicalPlantKey(typed);
  const typedNorm = normalize(typed.trim());
  if (!typedNorm) return undefined;
  for (const [plantType, byName] of Object.entries(profiles) as [
    PlantType,
    Record<string, PlantProfile> | undefined,
  ][]) {
    for (const [name, entry] of Object.entries(byName ?? {})) {
      if (entry?.isDeleted) continue;
      if (getCanonicalPlantKey(name) === canonical) return { name, plantType };
      if (entry?.tamilName && normalize(entry.tamilName) === typedNorm) return { name, plantType };
    }
  }
  return undefined;
}
