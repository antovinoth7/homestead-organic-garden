import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, refreshAuthToken } from '@/lib/firebase';
import { getData, setData, KEYS } from '@/lib/storage';
import { getCached, setCached } from '@/lib/dataCache';
import {
  PlantProfile,
  PlantProfiles,
  PlantType,
  PlantCatalog,
  PlantCareProfiles,
  WaterRequirement,
  SunlightLevel,
  SoilType,
  FertiliserType,
  GrowthStage,
  ToleranceLevel,
  FeedingIntensity,
  PlantLifecycle,
  NumericRange,
  GrowthStageDurations,
  AnnualCycleDurations,
  VarietyDetail,
} from '@/types/database.types';
import { logError } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { CATEGORY_OPTIONS } from '@/utils/plantLabels';

// ─── Constants ────────────────────────────────────────────────────────────────

export const PLANT_CATEGORIES: PlantType[] = CATEGORY_OPTIONS.map((opt) => opt.value);

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';
const CACHE_KEY = 'plantProfiles';

// ─── Default profiles (built from DEFAULT_PLANT_CATALOG data) ─────────────────

function buildDefaultProfiles(): PlantProfiles {
  const profiles = createEmptyProfiles();

  type SeedEntry = {
    type: PlantType;
    plants: string[];
    varieties?: Record<string, string[]>;
    tamilNames?: Record<string, string>;
    descriptions?: Record<string, string>;
    varietyDetails?: Record<string, Record<string, VarietyDetail>>;
  };
  const seed: SeedEntry[] = [
    {
      type: 'vegetable',
      plants: [
        'Brinjal',
        'Long Brinjal',
        'Ladies Finger',
        'Tomato',
        'Chilli',
        'Tapioca',
        'Drumstick',
        'Amaranthus',
        'Methi',
        'Cowpea',
        'Beans',
        'Bitter Gourd',
        'Snake Gourd',
        'Ridge Gourd',
        'Bottle Gourd',
        'Pumpkin',
        'Ash Gourd',
        'Cucumber',
        'Radish',
        'Onion',
        'Shallot',
        'Garlic',
        'Cabbage',
        'Cauliflower',
        'Carrot',
        'Potato',
        'Eggplant',
        'Pepper',
        'Taro',
        'Elephant Yam',
        'Sweet Potato',
        'Ash Plantain',
        'Colocasia',
      ],
      varieties: {
        Brinjal: ['Long Purple', 'Round Green', 'Striped'],
        'Long Brinjal': ['Long Green', 'Violet Long', 'Local'],
        'Ladies Finger': ['CO 4', 'CO 5', 'Arka Anamika'],
        Tomato: ['Country Tomato', 'Hybrid Tomato', 'Cherry Tomato'],
        Chilli: ["Bird's Eye", 'Gundu', 'Long Chilli'],
        Tapioca: ['Mulluvadi', 'CO 2', 'H-165'],
        Drumstick: ['PKM 1', 'PKM 2', 'Local'],
        Amaranthus: ['Arai Keerai', 'Siru Keerai', 'Mulai Keerai'],
        Methi: ['Kasuri', 'Pusa Early', 'Local'],
        Cowpea: ['Bush', 'Pole', 'Red Cowpea'],
        Beans: ['Bush Beans', 'Pole Beans', 'Double Beans'],
        'Bitter Gourd': ['Mithipagal', 'Long Green', 'CO 1'],
        'Snake Gourd': ['Long White', 'Striped', 'CO 2'],
        'Ridge Gourd': ['Long Ridge', 'Dark Green', 'CO 1'],
        'Bottle Gourd': ['Long Bottle', 'Round Bottle', 'CO 1'],
        Pumpkin: ['Parangikkai', 'CO 2', 'Red Pumpkin'],
        'Ash Gourd': ['White Ash', 'Long Ash', 'CO 1'],
        Cucumber: ['Country Cucumber', 'Hybrid Green', 'Slicing'],
        Onion: ['Bellary', 'Nasik Red', 'CO Onion'],
        Shallot: ['Sambar Onion', 'Small Red', 'CO Shallot'],
        Radish: ['Pusa Chetki', 'White Long', 'Pink'],
        Cabbage: ['Golden Acre', 'CO 1', 'Green Ball'],
        Cauliflower: ['Pusa Snowball', 'CO 1', 'Early White'],
        Taro: ['Seppan Kizhangu', 'White Taro', 'Local'],
        'Elephant Yam': ['Karunai Kizhangu', 'White Yam', 'Local'],
        'Sweet Potato': ['Orange Flesh', 'White Flesh', 'Local'],
        'Ash Plantain': ['Vazhakkai', 'Green Plantain', 'Local'],
        Colocasia: ['Purple Stem', 'Green Stem', 'Seppan'],
      },
      tamilNames: {
        Brinjal: 'கத்தரிக்காய்',
        'Long Brinjal': 'நீள கத்தரிக்காய்',
        'Ladies Finger': 'வெண்டைக்காய்',
        Tomato: 'தக்காளி',
        Chilli: 'மிளகாய்',
        Tapioca: 'மரவள்ளிக்கிழங்கு',
        Drumstick: 'முருங்கை',
        Amaranthus: 'அரைக்கீரை',
        Methi: 'வெந்தயக்கீரை',
        Cowpea: 'காராமணி',
        Beans: 'பீன்ஸ்',
        'Bitter Gourd': 'பாகற்காய்',
        'Snake Gourd': 'புடலங்காய்',
        'Ridge Gourd': 'பீர்க்கங்காய்',
        'Bottle Gourd': 'சுரைக்காய்',
        Pumpkin: 'பரங்கிக்காய்',
        'Ash Gourd': 'வெள்ளைப்பூசணி',
        Cucumber: 'வெள்ளரிக்காய்',
        Radish: 'முள்ளங்கி',
        Onion: 'வெங்காயம்',
        Shallot: 'சின்ன வெங்காயம்',
        Garlic: 'பூண்டு',
        Cabbage: 'முட்டைக்கோஸ்',
        Cauliflower: 'காலிஃபிளவர்',
        Carrot: 'கேரட்',
        Potato: 'உருளைக்கிழங்கு',
        Eggplant: 'கத்திரிக்காய்',
        Pepper: 'குடைமிளகாய்',
        Taro: 'சேப்பங்கிழங்கு',
        'Elephant Yam': 'கருணைக்கிழங்கு',
        'Sweet Potato': 'சர்க்கரைவள்ளிக்கிழங்கு',
        'Ash Plantain': 'நேந்திரம் வாழை',
        Colocasia: 'சேம்பு',
      },
      descriptions: {
        Brinjal:
          'Versatile tropical nightshade yielding glossy purple fruit for curries and grills',
        'Long Brinjal':
          'Elongated purple eggplant variety favoured in South Indian sambar and stir-fries',
        'Ladies Finger': 'Heat-loving mucilaginous pod vegetable essential in South Indian cooking',
        Tomato: 'Prolific warm-season fruit used fresh, in sambar, rasam, and chutneys',
        Chilli: 'Pungent hot pepper central to South Indian spice blends and daily cooking',
        Tapioca: 'Starchy root crop grown widely in Kanyakumari for kappa and traditional dishes',
        Drumstick: 'Fast-growing tropical tree providing nutrient-dense pods, leaves, and flowers',
        Amaranthus: 'Quick-growing leafy green rich in iron, popular as keerai in Tamil cuisine',
        Methi: 'Aromatic legume grown for its iron-rich leaves and bitter-sweet flavour',
        Cowpea: 'Heat-tolerant nitrogen-fixing legume yielding protein-rich pods and beans',
        Beans: 'Versatile climbing legume producing tender pods for stir-fries and curries',
        'Bitter Gourd': 'Warty-skinned climbing cucurbit prized for its medicinal bitter flavour',
        'Snake Gourd': 'Long striped cucurbit vine producing mild-flavoured gourds for sambar',
        'Ridge Gourd':
          'Ridged climbing vine bearing tender gourds widely used in kootu and poriyal',
        'Bottle Gourd': 'Vigorous trailing vine producing mild watery gourds for kootu and sweets',
        Pumpkin: 'Sprawling cucurbit yielding large sweet-fleshed fruit for kootu and aviyal',
        'Ash Gourd': 'Wax-coated trailing cucurbit used in petha, kootu, and traditional medicine',
        Cucumber: 'Fast-growing warm-season vine producing crisp, refreshing fruits',
        Radish: 'One of the fastest-maturing root vegetables, excellent beginner crop',
        Onion: 'Essential kitchen staple grown as a bulb crop',
        Shallot: 'Small, pungent bulb onion widely used in South Indian cooking',
        Garlic: 'Pungent bulb with potent medicinal and culinary value',
        Cabbage: 'Cool-season brassica forming dense leafy heads',
        Cauliflower: 'Cool-season brassica producing compact white curds',
        Carrot: 'Popular root vegetable rich in beta-carotene',
        Potato: 'Versatile tuberous crop grown worldwide',
        Eggplant: 'Heat-loving fruiting vegetable closely related to brinjal',
        Pepper: 'Warm-season fruiting plant producing sweet or mildly hot fruits',
        Taro: 'Tropical tuber crop with edible corms and leaves',
        'Elephant Yam': 'Large tropical tuber crop valued in South Indian cuisine',
        'Sweet Potato': 'Nutritious tropical vine producing sweet tuberous roots',
        'Ash Plantain': 'Starchy cooking banana widely used in South Indian cuisine',
        Colocasia: 'Versatile aroid grown for both corms and leaves',
      },
    },
    {
      type: 'herb',
      plants: [
        'Coriander',
        'Mint',
        'Curry Leaf',
        'Lemongrass',
        'Tulsi',
        'Basil',
        'Dill',
        'Parsley',
        'Rosemary',
        'Thyme',
        'Oregano',
        'Turmeric',
        'Ginger',
        'Betel Leaf',
      ],
      varieties: {
        Coriander: ['CO 4', 'CO 5', 'Local'],
        Mint: ['Peppermint', 'Spearmint', 'Country Mint'],
        'Curry Leaf': ['Dwarf', 'Regular', 'Local'],
        Lemongrass: ['East Indian', 'West Indian', 'Local'],
        Tulsi: ['Krishna Tulsi', 'Rama Tulsi'],
        Turmeric: ['Erode Local', 'Salem', 'Finger Turmeric', 'CO 1'],
        Ginger: ['Maran', 'Rio-de-Janeiro', 'Nadia', 'Local'],
        'Betel Leaf': ['Vetrilai', 'Kapur', 'Local'],
      },
      tamilNames: {
        Coriander: 'கொத்தமல்லி',
        Mint: 'புதினா',
        'Curry Leaf': 'கறிவேப்பிலை',
        Lemongrass: 'எலுமிச்சைப்புல்',
        Tulsi: 'துளசி',
        Basil: 'திருநீற்றுப்பச்சிலை',
        Dill: 'சதகுப்பை',
        Parsley: 'பார்சிலி',
        Rosemary: 'ரோஸ்மேரி',
        Thyme: 'தைம்',
        Oregano: 'ஓரிகானோ',
        Turmeric: 'மஞ்சள்',
        Ginger: 'இஞ்சி',
        'Betel Leaf': 'வெற்றிலை',
      },
      descriptions: {
        Coriander: 'Fast-growing cool-season herb prized for its aromatic leaves and seeds',
        Mint: 'Vigorous spreading herb that thrives in moist, partially shaded spots',
        'Curry Leaf': 'Essential South Indian culinary tree producing intensely aromatic leaves',
        Lemongrass: 'Tall aromatic grass used in teas and South-East Asian cuisine',
        Tulsi: 'Sacred herb of Indian households valued for medicinal and spiritual significance',
        Basil: 'Aromatic culinary herb used in Italian and Thai cooking',
        Dill: 'Feathery herb with a mild anise flavour, popular in pickles and rice dishes',
        Parsley: 'Slow-germinating biennial herb used as a garnish and flavouring',
        Rosemary: 'Woody Mediterranean perennial with needle-like leaves and a piney fragrance',
        Thyme: 'Low-growing perennial herb with tiny aromatic leaves',
        Oregano: 'Hardy perennial with peppery, slightly bitter leaves',
        Turmeric: 'Tropical rhizomatous herb yielding the golden spice of Indian cooking',
        Ginger: 'Pungent rhizome staple in South Indian cooking and Ayurvedic medicine',
        'Betel Leaf': 'Tropical climbing vine prized for its glossy heart-shaped leaves',
      },
    },
    {
      type: 'flower',
      plants: [
        'Marigold',
        'Jasmine',
        'Hibiscus',
        'Rose',
        'Chrysanthemum',
        'Crossandra',
        'Ixora',
        'Sunflower',
        'Dahlia',
        'Orchid',
      ],
      varieties: {
        Marigold: ['African', 'French', 'Local Orange'],
        Jasmine: ['Malli', 'Mullai', 'Jathi Malli'],
        Hibiscus: ['Red', 'Yellow', 'Double Petal'],
      },
      tamilNames: {
        Marigold: 'செண்டுமல்லி',
        Jasmine: 'மல்லிகை',
        Hibiscus: 'செம்பருத்தி',
        Rose: 'ரோஜா',
        Chrysanthemum: 'சாமந்தி',
        Crossandra: 'கனகாம்பரம்',
        Ixora: 'வெட்சி',
        Sunflower: 'சூரியகாந்தி',
        Dahlia: 'டேலியா',
        Orchid: 'ஆர்க்கிட்',
      },
      descriptions: {
        Marigold: 'Bright orange-yellow blooms that repel nematodes and attract pollinators',
        Jasmine:
          'Intensely fragrant evergreen shrub producing white flowers integral to Tamil culture',
        Hibiscus:
          'Showy tropical shrub producing large colourful blooms for hair oil and offerings',
        Rose: 'Classic garden shrub grown for fragrant blooms',
        Chrysanthemum: 'Popular festival flower grown for bright disc-shaped blooms',
        Crossandra: 'Low-growing perennial bearing vibrant orange flowers for garlands',
        Ixora: 'Evergreen tropical shrub with dense clusters of tiny tubular flowers',
        Sunflower: 'Tall, cheerful annual grown for large composite flower heads',
        Dahlia: 'Tuberous perennial producing spectacular multi-petalled blooms',
        Orchid: 'Exotic epiphytic perennial grown for elegant long-lasting blooms',
      },
    },
    {
      type: 'fruit_tree',
      plants: [
        'Banana',
        'Mango',
        'Guava',
        'Papaya',
        'Lemon',
        'Pomegranate',
        'Jackfruit',
        'Chikoo',
        'Water Apple',
        'Custard Apple',
        'Amla',
        'Orange',
        'Fig',
        'Avocado',
        'Soursop',
        'Mangosteen',
        'Rambutan',
        'Red Banana',
        'Breadfruit',
        'Pineapple',
        'Passion Fruit',
        'Star Fruit',
        'Arecanut',
      ],
      varieties: {
        Banana: ['Nendran', 'Poovan', 'Rasthali', 'Robusta', 'Monthan'],
        Mango: ['Alphonso', 'Banganapalli', 'Neelum', 'Imam Pasand'],
        Guava: ['Allahabad Safeda', 'Pink Guava', 'Local'],
        Papaya: ['Red Lady', 'CO 8', 'Local'],
        Lemon: ['Grafted Lemon', 'Country Lemon'],
        Pomegranate: ['Bhagwa', 'Ganesh', 'Arakta'],
        Jackfruit: ['Palur 1', 'Palur 2', 'Local'],
        'Custard Apple': ['Balanagar', 'Arka Sahan', 'Local'],
        Amla: ['NA 7', 'Krishna', 'Kanchan'],
        'Red Banana': ['Sevvaazhai', 'Karpura Chakkarakeli', 'Local Red'],
        Breadfruit: ['Seeni Chakka', 'Yellow Skin', 'Local'],
        Pineapple: ['Kew', 'Queen', 'Mauritius'],
        'Passion Fruit': ['Purple Passion', 'Yellow Passion', 'Local'],
        'Star Fruit': ['Sweet', 'Sour', 'Local'],
        Arecanut: ['Mangala', 'Sumangala', 'Local Tall'],
      },
      tamilNames: {
        Banana: 'வாழை',
        Mango: 'மாம்பழம்',
        Guava: 'கொய்யா',
        Papaya: 'பப்பாளி',
        Lemon: 'எலுமிச்சை',
        Pomegranate: 'மாதுளை',
        Jackfruit: 'பலாப்பழம்',
        Chikoo: 'சப்போட்டா',
        'Water Apple': 'நாவல்',
        'Custard Apple': 'சீதாப்பழம்',
        Amla: 'நெல்லிக்காய்',
        Orange: 'ஆரஞ்சு',
        Fig: 'அத்திப்பழம்',
        Avocado: 'வெண்ணெய்ப்பழம்',
        Soursop: 'முள்ளு சீதா',
        Mangosteen: 'மாங்குஸ்தான்',
        Rambutan: 'ரம்புட்டான்',
        'Red Banana': 'செவ்வாழை',
        Breadfruit: 'பிரெட்ஃப்ரூட்',
        Pineapple: 'அன்னாசி',
        'Passion Fruit': 'பேஷன் ஃப்ரூட்',
        'Star Fruit': 'கமரகம்',
        Arecanut: 'பாக்கு',
      },
      descriptions: {
        Banana: 'Fast-growing tropical fruit producing large bunches rich in potassium',
        Mango: 'King of fruits — long-lived tropical tree bearing sweet, aromatic drupes',
        Guava: 'Hardy tropical tree producing vitamin-C-rich fruits year-round',
        Papaya: 'Fast-growing single-trunk tree bearing melon-like fruits rich in papain',
        Lemon: 'Evergreen citrus tree producing tangy fruits year-round',
        Pomegranate: 'Drought-tolerant shrubby tree producing antioxidant-rich fruits',
        Jackfruit: "Massive tropical tree producing the world's largest tree-borne fruit",
        Chikoo: 'Evergreen tropical tree producing sweet, malty-flavoured fruits',
        'Water Apple': 'Tropical evergreen tree producing crisp, mildly sweet bell-shaped fruits',
        'Custard Apple': 'Deciduous tropical tree bearing soft, creamy-sweet segmented fruits',
        Amla: 'Hardy deciduous tree producing tart, vitamin-C-rich berries revered in Ayurveda',
        Orange: 'Evergreen citrus tree producing sweet, juicy fruits',
        Fig: 'Deciduous tree producing soft, sweet, fibre-rich fruits',
        Avocado: 'Evergreen tropical tree producing nutrient-dense, high-fat fruits',
        Soursop: 'Tropical evergreen tree producing large spiny fruits with creamy, tangy pulp',
        Mangosteen: 'Ultra-tropical tree bearing prized purple fruits with sweet-tangy segments',
        Rambutan:
          'Tropical evergreen tree producing hairy-skinned fruits with translucent sweet flesh',
        'Red Banana':
          'Striking red-skinned banana variety with creamy, slightly raspberry-flavoured flesh',
        Breadfruit: 'Large tropical tree producing starchy fruits used as a carbohydrate staple',
        Pineapple: 'Low-growing monocarpic bromeliad producing sweet, acidic tropical fruits',
        'Passion Fruit': 'Vigorous tropical vine producing aromatic, tangy-sweet fruits',
        'Star Fruit': 'Small tropical evergreen tree producing distinctive star-shaped waxy fruits',
        Arecanut: 'Tall, slender tropical palm cultivated for its betel nut',
      },
    },
    {
      type: 'timber_tree',
      plants: ['Neem', 'Teak', 'Mahogany', 'Rosewood', 'Sandalwood', 'Bamboo', 'Wild Jack'],
      varieties: {},
      tamilNames: {
        Neem: 'வேம்பு',
        Teak: 'தேக்கு',
        Mahogany: 'மகாகனி',
        Rosewood: 'ரோஸ்வுட்',
        Sandalwood: 'சந்தனம்',
        Bamboo: 'மூங்கில்',
        'Wild Jack': 'ஐயன்பலா',
      },
      descriptions: {
        Neem: 'Fast-growing evergreen valued for pest-repellent properties and durable timber',
        Teak: 'Premier hardwood timber tree with large deciduous leaves',
        Mahogany: 'High-value tropical timber with a straight trunk and broad canopy',
        Rosewood: 'Prized hardwood with dark fragrant heartwood, a nitrogen-fixing legume',
        Sandalwood: 'Aromatic heartwood tree and hemi-parasite that needs a host plant nearby',
        Bamboo: 'Giant clumping grass producing strong culms for construction and crafts',
        'Wild Jack': 'Large evergreen tree native to the Western Ghats yielding durable timber',
      },
    },
    {
      type: 'coconut_tree',
      plants: ['Dwarf Coconut', 'Tall Coconut', 'Hybrid Coconut', 'King Coconut'],
      varieties: {
        'Dwarf Coconut': ['COD', 'Malayan Dwarf'],
        'Tall Coconut': ['West Coast Tall', 'East Coast Tall'],
      },
      tamilNames: {
        'Dwarf Coconut': 'குட்டைத் தென்னை',
        'Tall Coconut': 'உயரத் தென்னை',
        'Hybrid Coconut': 'கலப்பினத் தென்னை',
        'King Coconut': 'ராஜ தென்னை',
      },
      descriptions: {
        'Dwarf Coconut': 'Compact coconut palm ideal for small plots, bears early',
        'Tall Coconut': 'Traditional tall coconut grown along the Kanyakumari coast',
        'Hybrid Coconut':
          'Cross between Dwarf and Tall combining early bearing with high copra yield',
        'King Coconut': 'Orange-skinned coconut prized for its naturally sweet water',
      },
    },
    {
      type: 'shrub',
      plants: [
        'Hibiscus',
        'Ixora',
        'Nandiyavattai',
        'Bougainvillea',
        'Jasmine',
        'Crossandra',
        'Lantana',
        'Gardenia',
      ],
      varieties: { Hibiscus: ['Single', 'Double', 'Red'], Ixora: ['Red', 'Yellow', 'Orange'] },
      tamilNames: {
        Hibiscus: 'செம்பருத்தி',
        Ixora: 'இட்லிப்பூ',
        Nandiyavattai: 'நந்தியாவட்டை',
        Bougainvillea: 'பூகன்வில்லியா',
        Jasmine: 'மல்லிகை',
        Crossandra: 'கனகாம்பரம்',
        Lantana: 'உன்னிச்செடி',
        Gardenia: 'கொண்டை கத்தரி',
      },
      descriptions: {
        Hibiscus: 'Bushy hedge variety producing showy blooms year-round',
        Ixora: 'Dense evergreen shrub bearing clusters of scarlet flowers',
        Nandiyavattai: 'Fragrant white-flowered shrub sacred in Tamil temple gardens',
        Bougainvillea: 'Vigorous thorny shrub-vine smothered in papery bracts',
        Jasmine: 'Vigorous woody shrub producing intensely fragrant white flowers',
        Crossandra: 'Low-growing evergreen hedge shrub bearing fan-shaped orange flowers',
        Lantana: 'Extremely hardy flowering shrub that thrives on neglect and attracts butterflies',
        Gardenia: 'Compact evergreen shrub with waxy, intensely fragrant white blooms',
      },
    },
    {
      type: 'spinach',
      plants: [
        'Palak',
        'Saag',
        'Pusa Jyoti',
        'Hybrid Leafy',
        'Local Green',
        'Pusa Green',
        'Winter Spinach',
        'Red Stem',
      ],
      varieties: {
        Palak: ['Palak Green', 'Palak Red', 'Palak Local', 'Palak Hybrid'],
        Saag: ['Palak Saag', 'Mustard Saag', 'Mixed Saag', 'Traditional Saag'],
        'Pusa Jyoti': ['CO 1', 'CO 2', 'Standard'],
        'Hybrid Leafy': ['Hybrid A', 'Hybrid B', 'Hybrid Premium'],
        'Local Green': ['Kanyakumari Local', 'Tamil Nadu Local', 'Traditional'],
        'Pusa Green': ['PB 47', 'PB 51', 'Early Pusa'],
        'Winter Spinach': ['Winter Green', 'Cool Season', 'Frost Hardy'],
        'Red Stem': ['Red Veined', 'Purple Stem', 'Ornamental Red'],
      },
      tamilNames: {
        Palak: 'பசலை',
        Saag: 'சாக்',
        'Pusa Jyoti': 'புஷா ஜோதி',
        'Hybrid Leafy': 'கலப்பின பசலை',
        'Local Green': 'தமிழ்நாடு பசலை',
        'Pusa Green': 'புஷா பசலை',
        'Winter Spinach': 'குளிர்காலப் பசலை',
        'Red Stem': 'சிவப்பு கிழங்கு பசலை',
      },
      descriptions: {
        Palak:
          'Classic spinach variety rich in iron and vitamins, smooth dark-green leaves ideal for curries and saag',
        Saag: 'Leafy green blend used in traditional Tamil and North Indian cooking for its earthy, nutritious profile',
        'Pusa Jyoti':
          'High-yielding bold-leaved variety suited to cool and moderate climates across South India',
        'Hybrid Leafy':
          'Modern hybrid combining fast growth, disease resistance, and tender leaf texture',
        'Local Green':
          'Heritage variety adapted to Tamil Nadu climate with superior bolt resistance',
        'Pusa Green': 'Cold-tolerant variety bred for winter gardens in tropical regions',
        'Winter Spinach':
          'Frost-hardy variety optimised for December–March growing season in Kanyakumari',
        'Red Stem':
          'Ornamental-edible variety with striking red veins and purple stems for aesthetic vegetable gardens',
      },
    },
  ];

  for (const cat of seed) {
    for (const name of cat.plants) {
      profiles[cat.type][name] = {
        plantType: cat.type,
        name,
        tamilName: cat.tamilNames?.[name],
        description: cat.descriptions?.[name],
        varieties: cat.varieties?.[name] ?? [],
        varietyDetails: cat.varietyDetails?.[name],
      };
    }
  }

  return profiles;
}

export const DEFAULT_PLANT_PROFILES: PlantProfiles = buildDefaultProfiles();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyProfiles(): PlantProfiles {
  return PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);
}

export function getPlantNamesForType(profiles: PlantProfiles, type: PlantType): string[] {
  const defaults = DEFAULT_PLANT_PROFILES[type];
  const user = profiles[type] ?? {};
  const defaultNames = Object.keys(defaults);
  const userAdded = Object.keys(user).filter((n) => !defaults[n]);
  return [...defaultNames, ...userAdded];
}

export function getProfileEntry(
  profiles: PlantProfiles,
  type: PlantType,
  name: string
): PlantProfile | undefined {
  return profiles[type]?.[name] ?? DEFAULT_PLANT_PROFILES[type]?.[name];
}

// ─── Bridge helpers for unmigrated callers ────────────────────────────────────

export function toPlantCatalogShape(profiles: PlantProfiles): PlantCatalog {
  const categories = {} as PlantCatalog['categories'];
  for (const type of PLANT_CATEGORIES) {
    const plants: string[] = getPlantNamesForType(profiles, type);
    const varieties: Record<string, string[]> = {};
    const tamilNames: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    const varietyDetails: Record<string, Record<string, VarietyDetail>> = {};
    for (const name of plants) {
      const p = getProfileEntry(profiles, type, name);
      if (!p) continue;
      if (p.varieties?.length) varieties[name] = p.varieties;
      if (p.tamilName) tamilNames[name] = p.tamilName;
      if (p.description) descriptions[name] = p.description;
      if (p.varietyDetails) varietyDetails[name] = p.varietyDetails;
    }
    categories[type] = { plants, varieties, tamilNames, descriptions, varietyDetails };
  }
  return { categories };
}

export function toPlantCareProfilesShape(profiles: PlantProfiles): PlantCareProfiles {
  const result = PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantCareProfiles);

  for (const type of PLANT_CATEGORIES) {
    for (const [name, p] of Object.entries(profiles[type] ?? {})) {
      const override: PlantCareProfileOverride = {};
      if (p.waterRequirement !== undefined) override.waterRequirement = p.waterRequirement;
      if (p.wateringFrequencyDays !== undefined)
        override.wateringFrequencyDays = p.wateringFrequencyDays;
      if (p.wateringEnabled !== undefined) override.wateringEnabled = p.wateringEnabled;
      if (p.fertilisingFrequencyDays !== undefined)
        override.fertilisingFrequencyDays = p.fertilisingFrequencyDays;
      if (p.fertilisingEnabled !== undefined) override.fertilisingEnabled = p.fertilisingEnabled;
      if (p.pruningFrequencyDays !== undefined)
        override.pruningFrequencyDays = p.pruningFrequencyDays;
      if (p.pruningEnabled !== undefined) override.pruningEnabled = p.pruningEnabled;
      if (p.sunlight !== undefined) override.sunlight = p.sunlight;
      if (p.soilType !== undefined) override.soilType = p.soilType;
      if (p.preferredFertiliser !== undefined) override.preferredFertiliser = p.preferredFertiliser;
      if (p.initialGrowthStage !== undefined) override.initialGrowthStage = p.initialGrowthStage;
      if (p.pruningTips !== undefined) override.pruningTips = p.pruningTips;
      if (p.shapePruningTip !== undefined) override.shapePruningTip = p.shapePruningTip;
      if (p.shapePruningMonths !== undefined) override.shapePruningMonths = p.shapePruningMonths;
      if (p.flowerPruningTip !== undefined) override.flowerPruningTip = p.flowerPruningTip;
      if (p.flowerPruningMonths !== undefined) override.flowerPruningMonths = p.flowerPruningMonths;
      if (p.scientificName !== undefined) override.scientificName = p.scientificName;
      if (p.taxonomicFamily !== undefined) override.taxonomicFamily = p.taxonomicFamily;
      if (p.lifecycle !== undefined) override.lifecycle = p.lifecycle;
      if (p.tamilName !== undefined) override.tamilName = p.tamilName;
      if (p.description !== undefined) override.description = p.description;
      if (p.daysToHarvest !== undefined) override.daysToHarvest = p.daysToHarvest;
      if (p.yearsToFirstHarvest !== undefined) override.yearsToFirstHarvest = p.yearsToFirstHarvest;
      if (p.heightCm !== undefined) override.heightCm = p.heightCm;
      if (p.spacingCm !== undefined) override.spacingCm = p.spacingCm;
      if (p.plantingDepthCm !== undefined) override.plantingDepthCm = p.plantingDepthCm;
      if (p.growingSeason !== undefined) override.growingSeason = p.growingSeason;
      if (p.germinationDays !== undefined) override.germinationDays = p.germinationDays;
      if (p.germinationTempC !== undefined) override.germinationTempC = p.germinationTempC;
      if (p.soilPhRange !== undefined) override.soilPhRange = p.soilPhRange;
      if (p.heatTolerance !== undefined) override.heatTolerance = p.heatTolerance;
      if (p.droughtTolerance !== undefined) override.droughtTolerance = p.droughtTolerance;
      if (p.waterloggingTolerance !== undefined)
        override.waterloggingTolerance = p.waterloggingTolerance;
      if (p.vitamins !== undefined) override.vitamins = p.vitamins;
      if (p.minerals !== undefined) override.minerals = p.minerals;
      if (p.petToxicity !== undefined) override.petToxicity = p.petToxicity;
      if (p.feedingIntensity !== undefined) override.feedingIntensity = p.feedingIntensity;
      if (p.customPests !== undefined) override.customPests = p.customPests;
      if (p.customDiseases !== undefined) override.customDiseases = p.customDiseases;
      if (p.customBeneficials !== undefined) override.customBeneficials = p.customBeneficials;
      if (p.growthStageDurations !== undefined)
        override.growthStageDurations = p.growthStageDurations;
      if (p.annualCycleDurations !== undefined)
        override.annualCycleDurations = p.annualCycleDurations;
      if (p.floweringStartMonth !== undefined) override.floweringStartMonth = p.floweringStartMonth;
      if (p.seedSource !== undefined) override.seedSource = p.seedSource;
      if (p.isPermanent !== undefined) override.isPermanent = p.isPermanent;
      if (p.isDynamicAccumulator !== undefined)
        override.isDynamicAccumulator = p.isDynamicAccumulator;
      if (p.chopDropIntervalDays !== undefined)
        override.chopDropIntervalDays = p.chopDropIntervalDays;
      if (p.guild !== undefined) override.guild = p.guild;
      if (Object.keys(override).length > 0) result[type][name] = override;
    }
  }
  return result;
}

// Needed for bridge type reference
type PlantCareProfileOverride = import('@/types/database.types').PlantCareProfileOverride;

// ─── Normalization ────────────────────────────────────────────────────────────

const WATER_REQS: WaterRequirement[] = ['low', 'medium', 'high'];
const SUNLIGHT_LEVELS: SunlightLevel[] = ['full_sun', 'partial_sun', 'shade'];
const SOIL_TYPES: SoilType[] = [
  'garden_soil',
  'potting_mix',
  'coco_peat',
  'red_laterite',
  'coastal_sandy',
  'black_cotton',
  'alluvial',
  'custom',
];
const FERTILISERS: FertiliserType[] = [
  'compost',
  'vermicompost',
  'cow_dung_slurry',
  'neem_cake',
  'panchagavya',
  'jeevamrutham',
  'groundnut_cake',
  'fish_emulsion',
  'seaweed',
  'other',
];
const GROWTH_STAGES: GrowthStage[] = [
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'dormant',
  'mature',
];
const TOLERANCE_LEVELS: ToleranceLevel[] = ['low', 'medium', 'high'];
const FEEDING_INTENSITIES: FeedingIntensity[] = ['light', 'medium', 'heavy'];
const LIFECYCLES: PlantLifecycle[] = ['annual', 'biennial', 'perennial', 'permanent'];

function normalizeStr(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function normalizeNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
}

function normalizeRange(v: unknown): NumericRange | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const o = v as Record<string, unknown>;
  const min = Number(o.min);
  const max = Number(o.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return undefined;
  return { min, max };
}

function normalizeStrArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const items = v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  return items.length > 0 ? items : undefined;
}

function normalizeEntry(raw: unknown): PlantProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = normalizeStr(r.name);
  const plantType = r.plantType as PlantType;
  if (!name || !PLANT_CATEGORIES.includes(plantType)) return null;

  const entry: PlantProfile = { plantType, name };
  const tamilName = normalizeStr(r.tamilName);
  if (tamilName) entry.tamilName = tamilName;
  const description = normalizeStr(r.description);
  if (description) entry.description = description;
  const varieties = normalizeStrArr(r.varieties);
  if (varieties) entry.varieties = varieties;
  if (r.isUserAdded === true) entry.isUserAdded = true;
  if (r.varietyDetails && typeof r.varietyDetails === 'object')
    entry.varietyDetails = r.varietyDetails as Record<string, VarietyDetail>;
  if (WATER_REQS.includes(r.waterRequirement as WaterRequirement))
    entry.waterRequirement = r.waterRequirement as WaterRequirement;
  if (SUNLIGHT_LEVELS.includes(r.sunlight as SunlightLevel))
    entry.sunlight = r.sunlight as SunlightLevel;
  if (SOIL_TYPES.includes(r.soilType as SoilType)) entry.soilType = r.soilType as SoilType;
  if (FERTILISERS.includes(r.preferredFertiliser as FertiliserType))
    entry.preferredFertiliser = r.preferredFertiliser as FertiliserType;
  if (GROWTH_STAGES.includes(r.initialGrowthStage as GrowthStage))
    entry.initialGrowthStage = r.initialGrowthStage as GrowthStage;
  if (LIFECYCLES.includes(r.lifecycle as PlantLifecycle))
    entry.lifecycle = r.lifecycle as PlantLifecycle;
  if (TOLERANCE_LEVELS.includes(r.heatTolerance as ToleranceLevel))
    entry.heatTolerance = r.heatTolerance as ToleranceLevel;
  if (TOLERANCE_LEVELS.includes(r.droughtTolerance as ToleranceLevel))
    entry.droughtTolerance = r.droughtTolerance as ToleranceLevel;
  if (TOLERANCE_LEVELS.includes(r.waterloggingTolerance as ToleranceLevel))
    entry.waterloggingTolerance = r.waterloggingTolerance as ToleranceLevel;
  if (FEEDING_INTENSITIES.includes(r.feedingIntensity as FeedingIntensity))
    entry.feedingIntensity = r.feedingIntensity as FeedingIntensity;
  const wDays = normalizeNum(r.wateringFrequencyDays);
  if (wDays) entry.wateringFrequencyDays = wDays;
  if (r.wateringEnabled === false) entry.wateringEnabled = false;
  const fDays = normalizeNum(r.fertilisingFrequencyDays);
  if (fDays) entry.fertilisingFrequencyDays = fDays;
  if (r.fertilisingEnabled === false) entry.fertilisingEnabled = false;
  const pDays = normalizeNum(r.pruningFrequencyDays);
  if (pDays) entry.pruningFrequencyDays = pDays;
  if (r.pruningEnabled === false) entry.pruningEnabled = false;
  const pruningTips = normalizeStrArr(r.pruningTips);
  if (pruningTips) entry.pruningTips = pruningTips;
  const shapePruningTip = normalizeStr(r.shapePruningTip);
  if (shapePruningTip) entry.shapePruningTip = shapePruningTip;
  const shapePruningMonths = normalizeStr(r.shapePruningMonths);
  if (shapePruningMonths) entry.shapePruningMonths = shapePruningMonths;
  const flowerPruningTip = normalizeStr(r.flowerPruningTip);
  if (flowerPruningTip) entry.flowerPruningTip = flowerPruningTip;
  const flowerPruningMonths = normalizeStr(r.flowerPruningMonths);
  if (flowerPruningMonths) entry.flowerPruningMonths = flowerPruningMonths;
  const scientificName = normalizeStr(r.scientificName);
  if (scientificName) entry.scientificName = scientificName;
  const taxonomicFamily = normalizeStr(r.taxonomicFamily);
  if (taxonomicFamily) entry.taxonomicFamily = taxonomicFamily;
  const daysToHarvest = normalizeRange(r.daysToHarvest);
  if (daysToHarvest) entry.daysToHarvest = daysToHarvest;
  const heightCm = normalizeRange(r.heightCm);
  if (heightCm) entry.heightCm = heightCm;
  const germinationDays = normalizeRange(r.germinationDays);
  if (germinationDays) entry.germinationDays = germinationDays;
  const germinationTempC = normalizeRange(r.germinationTempC);
  if (germinationTempC) entry.germinationTempC = germinationTempC;
  const soilPhRange = normalizeRange(r.soilPhRange);
  if (soilPhRange) entry.soilPhRange = soilPhRange;
  const spacingCm = normalizeNum(r.spacingCm);
  if (spacingCm) entry.spacingCm = spacingCm;
  const plantingDepthCm = normalizeNum(r.plantingDepthCm);
  if (plantingDepthCm) entry.plantingDepthCm = plantingDepthCm;
  const yearsToFirstHarvest = normalizeNum(r.yearsToFirstHarvest);
  if (yearsToFirstHarvest) entry.yearsToFirstHarvest = yearsToFirstHarvest;
  const chopDropIntervalDays = normalizeNum(r.chopDropIntervalDays);
  if (chopDropIntervalDays) entry.chopDropIntervalDays = chopDropIntervalDays;
  const floweringStartMonth = normalizeNum(r.floweringStartMonth);
  if (floweringStartMonth && floweringStartMonth >= 1 && floweringStartMonth <= 12)
    entry.floweringStartMonth = floweringStartMonth;
  const growingSeason = normalizeStr(r.growingSeason);
  if (growingSeason) entry.growingSeason = growingSeason;
  const seedSource = normalizeStr(r.seedSource);
  if (seedSource) entry.seedSource = seedSource;
  const guild = normalizeStr(r.guild);
  if (guild) entry.guild = guild;
  if (r.isPermanent === true) entry.isPermanent = true;
  if (r.isDynamicAccumulator === true) entry.isDynamicAccumulator = true;
  if (typeof r.petToxicity === 'boolean') entry.petToxicity = r.petToxicity;
  const vitamins = normalizeStrArr(r.vitamins);
  if (vitamins) entry.vitamins = vitamins;
  const minerals = normalizeStrArr(r.minerals);
  if (minerals) entry.minerals = minerals;
  const customPests = normalizeStrArr(r.customPests);
  if (customPests) entry.customPests = customPests;
  const customDiseases = normalizeStrArr(r.customDiseases);
  if (customDiseases) entry.customDiseases = customDiseases;
  const customBeneficials = normalizeStrArr(r.customBeneficials);
  if (customBeneficials) entry.customBeneficials = customBeneficials;
  if (r.growthStageDurations && typeof r.growthStageDurations === 'object')
    entry.growthStageDurations = r.growthStageDurations as GrowthStageDurations;
  if (r.annualCycleDurations && typeof r.annualCycleDurations === 'object')
    entry.annualCycleDurations = r.annualCycleDurations as AnnualCycleDurations;
  if (r.cropFamily) entry.cropFamily = r.cropFamily as PlantProfile['cropFamily'];
  if (r.layer) entry.layer = r.layer as PlantProfile['layer'];
  return entry;
}

function normalizeProfiles(raw: unknown): PlantProfiles {
  const result = createEmptyProfiles();
  if (!raw || typeof raw !== 'object') return result;
  const r = raw as Record<string, unknown>;
  for (const type of PLANT_CATEGORIES) {
    const cat = r[type];
    if (!cat || typeof cat !== 'object') continue;
    for (const [name, entryRaw] of Object.entries(cat as Record<string, unknown>)) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const entry = normalizeEntry({ ...(entryRaw as object), name: trimmed, plantType: type });
      if (entry) result[type][trimmed] = entry;
    }
  }
  return result;
}

// ─── One-time lazy migration from legacy stores ───────────────────────────────

async function migrateFromLegacyStores(): Promise<PlantProfiles> {
  const [rawCatalog, rawCare] = await Promise.all([
    getData<PlantCatalog>(KEYS.PLANT_CATALOG),
    getData<PlantCareProfiles>(KEYS.PLANT_CARE_PROFILES),
  ]);

  const unified = createEmptyProfiles();

  // Step 1: Build from PlantCatalog shape
  const catalog = rawCatalog[0];
  if (catalog?.categories) {
    for (const type of PLANT_CATEGORIES) {
      const cat = catalog.categories[type];
      if (!cat) continue;
      for (const name of cat.plants ?? []) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        unified[type][trimmed] = {
          plantType: type,
          name: trimmed,
          tamilName: cat.tamilNames?.[trimmed],
          description: cat.descriptions?.[trimmed],
          varieties: cat.varieties?.[trimmed] ?? [],
          varietyDetails: cat.varietyDetails?.[trimmed],
        };
      }
    }
  }

  // Step 2: Merge care overrides onto matching entries; add new entries for care-only plants
  const careProfiles = rawCare[0];
  if (careProfiles) {
    for (const type of PLANT_CATEGORIES) {
      const careCategory = (careProfiles as Record<string, unknown>)[type];
      if (!careCategory || typeof careCategory !== 'object') continue;
      for (const [rawName, overrideRaw] of Object.entries(
        careCategory as Record<string, unknown>
      )) {
        if (!overrideRaw || typeof overrideRaw !== 'object') continue;
        const override = overrideRaw as Record<string, unknown>;
        // Resolve the plant name — care profiles may use lowercased_underscored keys
        const candidateName =
          Object.keys(unified[type]).find(
            (n) => n.toLowerCase().replace(/\s+/g, '_') === rawName || n === rawName
          ) ?? rawName;
        const existing = unified[type][candidateName] ?? {
          plantType: type,
          name: candidateName,
          isUserAdded: true,
        };
        unified[type][candidateName] = {
          ...existing,
          ...normalizeEntry({ ...override, name: candidateName, plantType: type }),
        };
      }
    }
  }

  await setData(KEYS.PLANT_PROFILES, [unified]);
  logger.info('Plant profiles migration: legacy stores merged');
  return unified;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getPlantProfiles(): Promise<PlantProfiles> {
  const cached = getCached<PlantProfiles>(CACHE_KEY);
  if (cached) return cached;

  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const normalized = normalizeProfiles(stored[0]);
    setCached(CACHE_KEY, normalized);
    // Fire Firestore sync in background
    void syncFromFirestore();
    return normalized;
  }

  // Nothing in new key — run one-time migration from legacy stores
  const migrated = await migrateFromLegacyStores();
  setCached(CACHE_KEY, migrated);
  void syncFromFirestore();
  return migrated;
}

async function syncFromFirestore(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await refreshAuthToken();
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });
    if (!snapshot.exists()) return;
    const data = snapshot.data() as Record<string, unknown>;
    const remote = data[PLANT_PROFILES_FIELD];
    if (!remote) return;
    const normalized = normalizeProfiles(remote);
    await setData(KEYS.PLANT_PROFILES, [normalized]);
    setCached(CACHE_KEY, normalized);
  } catch (err) {
    logError('network', 'plantProfiles: Firestore sync failed', err as Error);
  }
}

export async function savePlantProfiles(profiles: PlantProfiles): Promise<PlantProfiles> {
  const normalized = normalizeProfiles(profiles);
  await setData(KEYS.PLANT_PROFILES, [normalized]);
  setCached(CACHE_KEY, normalized);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [PLANT_PROFILES_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false }
    );
  } catch (err) {
    logError('network', 'plantProfiles: Firestore save failed', err as Error);
  }

  return normalized;
}

export async function savePlantProfile(
  type: PlantType,
  name: string,
  data: Omit<PlantProfile, 'plantType' | 'name'>
): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  const existing = current[type][name] ?? DEFAULT_PLANT_PROFILES[type]?.[name] ?? {};
  const updated: PlantProfiles = {
    ...current,
    [type]: {
      ...current[type],
      [name]: { ...existing, ...data, plantType: type, name },
    },
  };
  return savePlantProfiles(updated);
}

export async function deletePlantProfile(type: PlantType, name: string): Promise<PlantProfiles> {
  const current = await getPlantProfiles();
  const updated = { ...current, [type]: { ...current[type] } };
  delete updated[type][name];
  return savePlantProfiles(updated);
}
