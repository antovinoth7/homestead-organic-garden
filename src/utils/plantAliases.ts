/**
 * The single source of truth for "these two names are the same plant".
 *
 * Three partial copies of this data used to live in `plantCatalog.ts`,
 * `plantHelpers.ts` and `referenceKeys.ts`, each serving one consumer and each
 * missing entries the others had. Catalog search, the duplicate-entry check and
 * companion lookup all need the full set, so it lives here.
 *
 * Deliberately import-free: `config/referenceKeys.ts` pulls this in, and that
 * module is loaded by `scripts/reference/*` under tsx, where the `@/` alias and
 * Metro-only `require('*.webp')` calls do not resolve.
 */

/** Lowercased, whitespace-collapsed form used as the key for every lookup. */
export function toLookupKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Alias → canonical catalog name, both as lookup keys.
 *
 * An entry here asserts the two names are *the same catalog entry*, so the
 * canonical side must be a real name in `DEFAULT_PLANT_CATALOG`. Names that
 * merely share a photo (Palak/Spinach, Green Peas/Peas) do not belong here —
 * those stay in `PLANT_IMAGE_ALIASES`, which answers a different question.
 */
export const PLANT_NAME_ALIASES: Record<string, string> = {
  // Ladies Finger
  okra: 'ladies finger',
  bhindi: 'ladies finger',
  bhendi: 'ladies finger',
  vendakkai: 'ladies finger',
  vendaikkai: 'ladies finger',
  "lady's finger": 'ladies finger',
  'lady finger': 'ladies finger',
  ladyfinger: 'ladies finger',

  // Brinjal
  eggplant: 'brinjal',
  aubergine: 'brinjal',
  kathirikai: 'brinjal',
  kathirikkai: 'brinjal',

  // Tapioca
  cassava: 'tapioca',
  maravalli: 'tapioca',
  'maravalli kizhangu': 'tapioca',

  // Drumstick
  moringa: 'drumstick',
  murungai: 'drumstick',
  'murungai kai': 'drumstick',

  // Fenugreek
  methi: 'fenugreek',
  vendhayam: 'fenugreek',
  venthayam: 'fenugreek',
  vendayam: 'fenugreek',
  'vendhaya keerai': 'fenugreek',

  // Taro
  colocasia: 'taro',
  seppankizhangu: 'taro',
  chembu: 'taro',

  // Chilli
  chili: 'chilli',
  'chilli pepper': 'chilli',
  milagai: 'chilli',

  // Amaranthus
  keerai: 'amaranthus',
  'thandu keerai': 'amaranthus',
  'mulai keerai': 'amaranthus',

  // Gourds
  pudalangai: 'snake gourd',
  pudalai: 'snake gourd',
  peerkangai: 'ridge gourd',
  peerkkangai: 'ridge gourd',
  turai: 'ridge gourd',
  sorakkai: 'bottle gourd',
  suraikkai: 'bottle gourd',
  lauki: 'bottle gourd',
  pavakkai: 'bitter gourd',
  paagarkai: 'bitter gourd',
  karela: 'bitter gourd',
  neerpoosanikai: 'ash gourd',
  poosanikai: 'ash gourd',

  // Beans & pulses
  kothavarai: 'cluster beans',
  kothavarangai: 'cluster beans',
  guar: 'cluster beans',
  karamani: 'cowpea',
  thattapayaru: 'cowpea',
  ulundu: 'black gram',
  thuvarai: 'pigeon pea',
  'toor dal': 'pigeon pea',
  avarai: 'lablab bean',

  // Herbs & greens
  pudina: 'mint',
  kothamalli: 'coriander',
  cilantro: 'coriander',
  dhania: 'coriander',
  karuveppilai: 'curry leaf',
  'curry leaves': 'curry leaf',

  // Roots & tubers
  mullangi: 'radish',
  vengayam: 'onion',
  'chinna vengayam': 'shallot',
  poondu: 'garlic',
  'senai kizhangu': 'elephant yam',
  'sweet potato kizhangu': 'sweet potato',
  sarkaraivalli: 'sweet potato',

  // Other
  thakkali: 'tomato',
  makkacholam: 'maize',
  nilakadalai: 'groundnut',
  verkadalai: 'groundnut',
};

/**
 * Resolves any known alias to its canonical catalog name, as a lookup key.
 * Unknown names pass through normalized, so this is safe to call on user input.
 */
export function getCanonicalPlantKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = toLookupKey(value);
  return PLANT_NAME_ALIASES[key] ?? key;
}

/** True when two names refer to the same plant, ignoring case and aliases. */
export function isSamePlantName(a: string | null | undefined, b: string | null | undefined): boolean {
  const keyA = getCanonicalPlantKey(a);
  const keyB = getCanonicalPlantKey(b);
  return keyA !== null && keyA === keyB;
}

/** Reverse index, built once: canonical lookup key → every alias pointing at it. */
const ALIASES_BY_CANONICAL: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const [alias, canonical] of Object.entries(PLANT_NAME_ALIASES)) {
    (map[canonical] ??= []).push(alias);
  }
  return map;
})();

/**
 * Every alternate name for a plant, for search to match on. Returns display-ish
 * lowercase forms; callers that need them cased should title-case at render.
 */
export function getAliasesFor(plantName: string): string[] {
  return ALIASES_BY_CANONICAL[toLookupKey(plantName)] ?? [];
}
