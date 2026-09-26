/**
 * The single source of truth for "these two names are the same plant".
 *
 * Three partial copies of this data used to live in `plantCatalog.ts`,
 * `plantHelpers.ts` and `referenceKeys.ts`, each serving one consumer and each
 * missing entries the others had. Catalog search, the duplicate-entry check and
 * companion lookup all need the full set, so it lives here.
 *
 * Deliberately import-free, so `config/referenceKeys.ts` can pull it in and
 * stay loadable by `scripts/reference/*` under tsx. The `@/` alias itself
 * resolves there; what does not is `@/lib/firebase` (it throws on missing env
 * at import) and the Metro-only `require('*.webp')` calls.
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
 * merely share a photo (Palak and true Spinach are different crops that use
 * one image) do not belong here — those stay in `PLANT_IMAGE_ALIASES`, which
 * answers a different question.
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
  // Long Brinjal was its own row until migration 017 made it a variety.
  'long brinjal': 'brinjal',
  kathirikkai: 'brinjal',

  // Capsicum — the catalog entry was called "Pepper" until it was renamed, which
  // read as Black Pepper (கருமிளகு) rather than குடைமிளகாய். These keep every
  // plant a user saved as "Pepper", and the obvious English spellings, resolving.
  pepper: 'capsicum',
  'bell pepper': 'capsicum',
  'sweet pepper': 'capsicum',
  kudaimilagai: 'capsicum',

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

  // Black Pepper — note `milagu` (peppercorn) and `milagai` (chilli) above are
  // different crops one letter apart. Lookups here are exact, so keep both.
  milagu: 'black pepper',
  karumilagu: 'black pepper',
  kurumulaku: 'black pepper',
  peppercorn: 'black pepper',
  peppercorns: 'black pepper',
  'piper nigrum': 'black pepper',

  // Amaranthus. `Amaranth Greens` was a second catalog row for the same plant
  // until the Tamil Nadu pass dropped it; migration 009 moves stored plants
  // across and these keep the old names searchable.
  keerai: 'amaranthus',
  'thandu keerai': 'amaranthus',
  'mulai keerai': 'amaranthus',
  'arai keerai': 'amaranthus',
  'siru keerai': 'amaranthus',
  amaranth: 'amaranthus',
  'amaranth greens': 'amaranthus',

  // Pasalai Keerai — likewise the survivor of the `Malabar Spinach` duplicate.
  'malabar spinach': 'pasalai keerai',
  'vasalai keerai': 'pasalai keerai',
  pasali: 'pasalai keerai',
  basella: 'pasalai keerai',
  'basella alba': 'pasalai keerai',

  // Agathi — the keerai is what it is grown for, and what it is searched for.
  'agathi keerai': 'agathi',
  agathikeerai: 'agathi',
  'august tree': 'agathi',
  sesbania: 'agathi',
  'sesbania grandiflora': 'agathi',

  // Banana. `Ash Plantain` was a second catalog row for the same plant — its
  // Tamil name was நேந்திரம் வாழை, which is Nendran, already a Banana variety.
  // Migration 010 moves stored plants across; these keep the old names
  // searchable, so a grower typing "vazhakkai" still lands on Banana.
  'ash plantain': 'banana',
  plantain: 'banana',
  'green plantain': 'banana',
  'cooking banana': 'banana',
  vazhai: 'banana',
  // Red Banana was its own row until migration 017 made it a variety.
  'red banana': 'banana',
  sevvazhai: 'banana',
  sevvaazhai: 'banana',
  vazhakkai: 'banana',
  vaazhakkai: 'banana',
  nendran: 'banana',

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
  // French Beans was its own row until migration 017 made it a variety.
  'french beans': 'beans',
  'french bean': 'beans',
  'bush beans': 'beans',
  kothavarai: 'cluster beans',
  kothavarangai: 'cluster beans',
  guar: 'cluster beans',
  karamani: 'cowpea',
  thattapayaru: 'cowpea',
  // Yardlong Beans was its own row until migration 017 made it a variety.
  'yardlong beans': 'cowpea',
  'yard long beans': 'cowpea',
  'long beans': 'cowpea',
  'asparagus bean': 'cowpea',
  ulundu: 'black gram',
  thuvarai: 'pigeon pea',
  'toor dal': 'pigeon pea',
  avarai: 'lablab bean',
  avarakkai: 'lablab bean',
  avaraikkai: 'lablab bean',
  mochai: 'lablab bean',
  mochakottai: 'lablab bean',
  'hyacinth bean': 'lablab bean',
  ellu: 'sesame',
  'ellu urundai': 'sesame',
  gingelly: 'sesame',
  til: 'sesame',
  'sesamum indicum': 'sesame',

  // Herbs & greens
  pudina: 'mint',
  kothamalli: 'coriander',
  cilantro: 'coriander',
  dhania: 'coriander',
  // Dill — சதகுப்பை; the seed is sold at nattu marundhu kadai as sathakuppai.
  sathakuppai: 'dill',
  sadhakuppai: 'dill',
  sadakuppai: 'dill',
  'sathakuppai keerai': 'dill',
  karuveppilai: 'curry leaf',
  'curry leaves': 'curry leaf',

  // Roots & tubers
  mullangi: 'radish',
  vengayam: 'onion',
  'chinna vengayam': 'shallot',
  poondu: 'garlic',
  'senai kizhangu': 'elephant yam',
  'elephant foot yam': 'elephant yam',
  'sweet potato kizhangu': 'sweet potato',
  sarkaraivalli: 'sweet potato',

  // Betel Leaf — the vine. "Vetrilai" was only ever a variety string, so a
  // user typing the romanised name got no match and was offered a duplicate.
  vetrilai: 'betel leaf',
  vettrilai: 'betel leaf',
  'betel vine': 'betel leaf',
  betel: 'betel leaf',
  paan: 'betel leaf',
  'piper betle': 'betel leaf',

  // Arecanut — the nut, a different plant from Betel Leaf despite the name.
  pakku: 'arecanut',
  'betel nut': 'arecanut',
  betelnut: 'arecanut',
  supari: 'arecanut',
  areca: 'arecanut',
  'areca nut': 'arecanut',
  'areca catechu': 'arecanut',

  // Flowering shrubs also listed in the flower category
  sembaruthi: 'hibiscus',
  semparuthi: 'hibiscus',
  kanakambaram: 'crossandra',
  malli: 'jasmine',
  mullai: 'jasmine',
  malligai: 'jasmine',
  vetchi: 'ixora',

  // Tamil Nadu medicinal & hedge shrubs
  aadathodai: 'adathodai',
  adhatoda: 'adathodai',
  vasaka: 'adathodai',
  'justicia adhatoda': 'adathodai',
  'nithya kalyani': 'nithyakalyani',
  periwinkle: 'nithyakalyani',
  'madagascar periwinkle': 'nithyakalyani',
  sadabahar: 'nithyakalyani',
  henna: 'maruthani',
  marudhani: 'maruthani',
  mehndi: 'maruthani',
  'lawsonia inermis': 'maruthani',
  avaram: 'aavaram',
  aavarampoo: 'aavaram',
  avarampoo: 'aavaram',
  'aavaram poo': 'aavaram',
  'avaram poo': 'aavaram',
  "tanner's cassia": 'aavaram',
  'crape jasmine': 'nandiyavattai',
  'crepe jasmine': 'nandiyavattai',
  nandhiyavattai: 'nandiyavattai',
  'tabernaemontana divaricata': 'nandiyavattai',
  notchi: 'nochi',
  vitex: 'nochi',
  'five-leaved chaste tree': 'nochi',
  thuthuvalai: 'thoothuvalai',
  thoodhuvalai: 'thoothuvalai',
  'solanum trilobatum': 'thoothuvalai',
  'arali poo': 'arali',
  oleander: 'arali',
  nerium: 'arali',
  karpuravalli: 'karpooravalli',
  omavalli: 'karpooravalli',
  'indian borage': 'karpooravalli',
  'mexican mint': 'karpooravalli',
  'cuban oregano': 'karpooravalli',

  // Tamil Nadu edible staples added in the Sep 2026 pass
  kovakkai: 'ivy gourd',
  kovaikkai: 'ivy gourd',
  kovai: 'ivy gourd',
  'little gourd': 'ivy gourd',
  tindora: 'ivy gourd',
  tendli: 'ivy gourd',
  'coccinia grandis': 'ivy gourd',
  sundakkai: 'turkey berry',
  sundaikkai: 'turkey berry',
  sundakka: 'turkey berry',
  'pea eggplant': 'turkey berry',
  'solanum torvum': 'turkey berry',

  // Keerai
  'pulicha keerai': 'roselle',
  pulichakeerai: 'roselle',
  gongura: 'roselle',
  'roselle leaves': 'roselle',
  'red sorrel': 'roselle',
  'hibiscus sabdariffa': 'roselle',
  'karisalankanni keerai': 'false daisy',
  karisalankanni: 'false daisy',
  karisalai: 'false daisy',
  bhringraj: 'false daisy',
  'eclipta prostrata': 'false daisy',
  musumusukkai: 'madras pea pumpkin',
  musumusukai: 'madras pea pumpkin',
  musumuskkai: 'madras pea pumpkin',
  'rough bryony': 'madras pea pumpkin',
  'mukia maderaspatana': 'madras pea pumpkin',

  // Coconut — one row since migration 017; the four palm-type rows it replaced
  // keep resolving here.
  'dwarf coconut': 'coconut',
  'tall coconut': 'coconut',
  'hybrid coconut': 'coconut',
  'king coconut': 'coconut',
  thennai: 'coconut',
  thennaimaram: 'coconut',
  thengai: 'coconut',
  'coconut tree': 'coconut',
  'coconut palm': 'coconut',

  // Homestead trees
  puli: 'tamarind',
  puliyam: 'tamarind',
  puliyamparam: 'tamarind',
  imli: 'tamarind',
  naval: 'jamun',
  naaval: 'jamun',
  'naval pazham': 'jamun',
  'java plum': 'jamun',
  'black plum': 'jamun',
  litchi: 'lychee',
  lichi: 'lychee',
  narthangai: 'citron',
  'lovi lovi': 'batoko plum',
  'lobi lobi': 'batoko plum',
  rukam: 'batoko plum',
  'indian blackberry': 'jamun',
  'syzygium cumini': 'jamun',
  mundhiri: 'cashew',
  munthiri: 'cashew',
  'cashew nut': 'cashew',
  cashewnut: 'cashew',
  'mundhiri paruppu': 'cashew',
  vilampazham: 'wood apple',
  vilam: 'wood apple',
  'elephant apple': 'wood apple',
  ilanthai: 'indian jujube',
  elanthai: 'indian jujube',
  ber: 'indian jujube',
  'ziziphus mauritiana': 'indian jujube',
  // Palm Tree — the catalog entry was called "Palmyra" until it was renamed.
  // These keep every plant a user saved as "Palmyra", and the search terms,
  // resolving.
  palmyra: 'palm tree',
  panai: 'palm tree',
  'panai maram': 'palm tree',
  'palmyra palm': 'palm tree',
  'toddy palm': 'palm tree',
  nungu: 'palm tree',
  karupatti: 'palm tree',
  sathukudi: 'sweet lime',
  chathukudi: 'sweet lime',
  mosambi: 'sweet lime',
  musambi: 'sweet lime',
  'sweet lemon': 'sweet lime',

  // Spices
  kirambu: 'clove',
  grambu: 'clove',
  lavangam: 'clove',
  'syzygium aromaticum': 'clove',
  karuvapattai: 'cinnamon',
  pattai: 'cinnamon',
  lavangapattai: 'cinnamon',
  'ceylon cinnamon': 'cinnamon',
  'maa inji': 'mango ginger',
  'mangai inji': 'mango ginger',
  maainji: 'mango ginger',
  'curcuma amada': 'mango ginger',
  pirandai: 'adamant creeper',
  perandai: 'adamant creeper',
  'veldt grape': 'adamant creeper',
  'cissus quadrangularis': 'adamant creeper',

  // Other
  thakkali: 'tomato',
  makkacholam: 'maize',
  nilakadalai: 'groundnut',
  verkadalai: 'groundnut',

  // Everyday romanised Tamil a grower types into search. Without these the
  // search came up empty and offered to create a duplicate plant.
  manjal: 'turmeric',
  inji: 'ginger',
  vembu: 'neem',
  veppamaram: 'neem',
  nellikai: 'amla',
  nellikkai: 'amla',
  koyya: 'guava',
  koyyapazham: 'guava',
  pappali: 'papaya',
  pappaali: 'papaya',
  maanga: 'mango',
  mangai: 'mango',
  maampazham: 'mango',
  mambazham: 'mango',
  palapazham: 'jackfruit',
  palaa: 'jackfruit',
  thulasi: 'tulsi',
  tulasi: 'tulsi',
  samanthi: 'chrysanthemum',
  sevanthi: 'chrysanthemum',
  elumichai: 'lemon',
  elumichampazham: 'lemon',
  lime: 'lemon',
  paavakkai: 'bitter gourd',
  parangikkai: 'pumpkin',
  parangikai: 'pumpkin',
  'manjal poosani': 'pumpkin',
  'vellai poosani': 'ash gourd',
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
export function isSamePlantName(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
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
