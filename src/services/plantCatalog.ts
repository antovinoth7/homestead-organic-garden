import { PlantCatalog, PlantCatalogCategory, PlantType } from '../types/database.types';
import { getData, KEYS } from '../lib/storage';

export const PLANT_CATEGORIES: PlantType[] = [
  'vegetable',
  'fruit_tree',
  'coconut_tree',
  'herb',
  'timber_tree',
  'flower',
  'shrub',
  'spinach',
];

export const DEFAULT_PLANT_CATALOG: PlantCatalog = {
  categories: {
    vegetable: {
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
        // Kanyakumari root vegetables & tubers
        'Taro',
        'Elephant Yam',
        'Sweet Potato',
        'Ash Plantain',
        'Colocasia',
        // Bed-type plants — leafy greens
        'Lettuce',
        'Purslane',
        'Pasalai Keerai',
        'Fenugreek',
        'Okra',
        'Moringa',
        // Bed-type plants — fruiting & climbing
        'Squash',
        'Yardlong Beans',
        // Bed-type plants — root & legume
        'Beetroot',
        'French Beans',
        'Cluster Beans',
        'Black Gram',
        'Groundnut',
        'Pigeon Pea',
        'Yam',
        // Bed-type plants — three sisters & grain
        'Maize',
        // Bed-type plants — aquatic
        'Lotus Stem',
        // Companion plants
        'Strawberry',
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
        Lettuce: ['Iceberg', 'Butterhead', 'Romaine', 'Loose Leaf'],
        Beetroot: ['Detroit Dark Red', 'Crimson Globe', 'Local Red'],
        'French Beans': ['Contender', 'Bush Blue Lake', 'Local Dwarf'],
        'Cluster Beans': ['Pusa Navbahar', 'Goma 1', 'Local'],
        'Yardlong Beans': ['Long Green', 'Long Purple', 'Local'],
        Squash: ['Yellow Crookneck', 'Zucchini', 'Pattypan'],
        'Black Gram': ['Vamban 6', 'CO 6', 'Local'],
        Groundnut: ['TMV 2', 'CO 3', 'Local Bunch'],
        'Pigeon Pea': ['CO 6', 'Vamban 1', 'Local'],
        Maize: ['Hybrid Sweet', 'Country Corn', 'CO 1'],
        Fenugreek: ['Kasuri', 'Pusa Early', 'Local'],
        Okra: ['CO 4', 'CO 5', 'Arka Anamika'],
        Moringa: ['PKM 1', 'PKM 2', 'Local'],
        'Pasalai Keerai': ['Green Stem', 'Red Stem', 'Local'],
        Strawberry: ['Sweet Charlie', 'Festival', 'Local Hill'],
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
        Lettuce: 'லெட்டுஸ்',
        Purslane: 'பொட்டுக்கீரை',
        'Pasalai Keerai': 'பசளைக்கீரை',
        Fenugreek: 'வெந்தயம்',
        Okra: 'வெண்டைக்காய்',
        Moringa: 'முருங்கை',
        Squash: 'ஸ்குவாஷ்',
        'Yardlong Beans': 'தட்டப்பயறு',
        Beetroot: 'பீட்ரூட்',
        'French Beans': 'பிரெஞ்சு பீன்ஸ்',
        'Cluster Beans': 'கொத்தவரை',
        'Black Gram': 'உளுந்து',
        Groundnut: 'வேர்க்கடலை',
        'Pigeon Pea': 'தொவரம்பருப்பு',
        Yam: 'கிழங்கு',
        Maize: 'மக்காச்சோளம்',
        'Lotus Stem': 'தாமரைத்தண்டு',
        Strawberry: 'ஸ்ட்ராபெர்ரி',
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
        Lettuce: 'Cool-season leafy green ideal for salads and fresh garnishes',
        Purslane:
          'Succulent edible weed rich in omega-3 fatty acids; drought-tolerant ground cover',
        'Pasalai Keerai':
          'Malabar spinach — vigorous climbing leafy green thriving in Tamil Nadu heat',
        Fenugreek: 'Aromatic annual legume grown for its iron-rich leaves and distinctive seeds',
        Okra: 'Heat-loving mucilaginous pod vegetable essential in South Indian cooking',
        Moringa: 'Multipurpose tropical tree with nutrient-dense leaves, pods, and flowers',
        Squash: 'Fast-growing cucurbit producing tender fruits; ideal ground cover in polycultures',
        'Yardlong Beans':
          'Vigorous climbing legume producing metre-long tender pods; fixes nitrogen',
        Beetroot: 'Jewel-red root vegetable with earthy sweetness, rich in folate and iron',
        'French Beans':
          'Bushy or climbing legume producing tender flat pods for stir-fries and curries',
        'Cluster Beans': 'Heat-tolerant legume yielding slender pods and nitrogen-fixing roots',
        'Black Gram':
          'Essential South Indian pulse crop yielding protein-rich seeds for idli and dosa',
        Groundnut:
          'Nitrogen-fixing oilseed legume producing underground pods rich in protein and fat',
        'Pigeon Pea': 'Perennial legume producing protein-rich toor dal; a staple of Tamil cuisine',
        Yam: 'Starchy tropical vine tuber with thick bark; distinct from elephant yam in texture',
        Maize: 'Tall cereal grass forming the structural canopy in Three Sisters polyculture',
        'Lotus Stem':
          'Aquatic perennial with crunchy, tunnel-riddled rhizomes used in South Indian cooking',
        Strawberry: 'Low-growing fruiting plant producing sweet red berries; companion to spinach',
      },
    },
    herb: {
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
        // Kanyakumari spices grown as herbs
        'Turmeric',
        'Ginger',
        'Betel Leaf',
        // Spice bed plants
        'Ajwain',
        'Cardamom',
        'Black Pepper',
        // Companion-rule plants
        'Fennel',
        'Sage',
        // Medicinal guild plants
        'Brahmi',
        'Ashwagandha',
        'Aloe Vera',
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
        Cardamom: ['Small Cardamom', 'Mysore', 'Malabar'],
        'Black Pepper': ['Panniyur 1', 'Karimunda', 'Local'],
        Brahmi: ['Water Hyssop', 'Local'],
        'Aloe Vera': ['Barbadensis', 'Local Green', 'Soap Aloe'],
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
        Ajwain: 'ஓமம்',
        Cardamom: 'ஏலக்காய்',
        'Black Pepper': 'கருமிளகு',
        Fennel: 'சோம்பு',
        Sage: 'சேஜ்',
        Brahmi: 'பிரம்மி',
        Ashwagandha: 'அஷ்வகந்தா',
        'Aloe Vera': 'கற்றாழை',
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
        Ajwain:
          'Aromatic annual herb yielding carom seeds used in South Indian tempering and digestive remedies',
        Cardamom:
          'Shade-tolerant tropical rhizome producing the queen of spices; intercropped under forest canopy',
        'Black Pepper':
          'Climbing spice vine trained on coconut trunks producing the king of spices',
        Fennel:
          'Tall aromatic herb with feathery leaves and anise-flavoured seeds; allelopathic — plant away from most crops',
        Sage: 'Woody perennial herb with grey-green aromatic leaves; used in companion planting to repel pests',
        Brahmi:
          'Low-growing medicinal creeper thriving in moist, shaded spots; revered in Ayurveda for cognitive health',
        Ashwagandha:
          'Drought-tolerant medicinal shrub producing adaptogenic roots; thrives in sandy well-drained soils',
        'Aloe Vera':
          'Succulent perennial with gel-filled leaves used in medicine, skincare, and soil conditioning',
      },
    },
    flower: {
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
    fruit_tree: {
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
        // Kanyakumari-specific fruit trees
        'Red Banana',
        'Breadfruit',
        'Pineapple',
        'Passion Fruit',
        'Star Fruit',
        'Arecanut',
        // Coconut intercrop trees
        'Cocoa',
        'Nutmeg',
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
        Cocoa: ['Forastero', 'Criollo', 'Local Hybrid'],
        Nutmeg: ['Konkan Sugandha', 'Local', 'Kerala Local'],
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
        Cocoa: 'கொக்கோ',
        Nutmeg: 'ஜாதிக்காய்',
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
        Cocoa:
          'Shade-tolerant understorey tree producing pods of prized chocolate beans; intercropped with banana and coconut',
        Nutmeg:
          'Aromatic tropical tree yielding two spices — nutmeg seed and mace aril; 7–8 years to first harvest',
      },
    },
    timber_tree: {
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
    coconut_tree: {
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
    shrub: {
      plants: [
        'Hibiscus',
        'Ixora',
        'Nandiyavattai',
        'Bougainvillea',
        'Jasmine',
        'Crossandra',
        'Lantana',
        'Gardenia',
        // Medicinal & companion shrubs
        'Agathi',
        'Castor',
        'Coleus',
      ],
      varieties: {
        Hibiscus: ['Single', 'Double', 'Red'],
        Ixora: ['Red', 'Yellow', 'Orange'],
      },
      tamilNames: {
        Hibiscus: 'செம்பருத்தி',
        Ixora: 'இட்லிப்பூ',
        Nandiyavattai: 'நந்தியாவட்டை',
        Bougainvillea: 'பூகன்வில்லியா',
        Jasmine: 'மல்லிகை',
        Crossandra: 'கனகாம்பரம்',
        Lantana: 'உன்னிச்செடி',
        Gardenia: 'கொண்டை கத்தரி',
        Agathi: 'அகத்தி',
        Castor: 'ஆமணக்கு',
        Coleus: 'கொல்லியஸ்',
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
        Agathi:
          'Fast-growing nitrogen-fixing shrub with edible leaves and flowers; dynamic accumulator for chop-and-drop',
        Castor:
          'Tall fast-growing shrub with repellent properties; pest-deterrent companion around vegetable beds',
        Coleus: 'Ornamental shade-tolerant shrub used as living mulch in coconut intercrop systems',
      },
    },
    spinach: {
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
  },
};

const REQUIRED_LOCAL_PLANTS: Partial<Record<PlantType, string[]>> = {
  vegetable: ['Brinjal', 'Ladies Finger', 'Chilli', 'Drumstick', 'Tapioca'],
};
const KNOWN_VARIETY_ALIASES: Record<string, string> = {
  "lady's finger": 'ladies finger',
  'ladies finger': 'ladies finger',
  eggplant: 'brinjal',
  aubergine: 'brinjal',
  okra: 'ladies finger',
  bhindi: 'ladies finger',
  vendakkai: 'ladies finger',
  kathirikai: 'brinjal',
  'chilli pepper': 'chilli',
  chili: 'chilli',
  chilli: 'chilli',
  maravalli: 'tapioca',
  cassava: 'tapioca',
  murungai: 'drumstick',
  drumstick: 'drumstick',
  keerai: 'amaranthus',
  pudina: 'mint',
  kothamalli: 'coriander',
  karuveppilai: 'curry leaf',
};

const toLookupKey = (value: string): string => value.toLowerCase().replace(/\s+/g, ' ').trim();

const getCanonicalPlantKey = (value: string): string => {
  const key = toLookupKey(value);
  return KNOWN_VARIETY_ALIASES[key] ?? key;
};

const hasEquivalentPlant = (plants: string[], target: string): boolean => {
  const targetKey = getCanonicalPlantKey(target);
  return plants.some((plant) => getCanonicalPlantKey(plant) === targetKey);
};

const normalizeList = (values: string[] | undefined | null): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const normalizeVarieties = (
  varieties: Record<string, string[]> | undefined | null,
  validPlants: string[]
): Record<string, string[]> => {
  const validPlantMap = new Map(validPlants.map((plant) => [toLookupKey(plant), plant]));
  const result: Record<string, string[]> = {};

  if (!varieties || typeof varieties !== 'object') return result;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const normalizedPlantName = plantName?.toString().trim();
    if (!normalizedPlantName) return;
    const plantKey = toLookupKey(normalizedPlantName);
    const aliasKey = KNOWN_VARIETY_ALIASES[plantKey];
    const canonicalPlantName =
      validPlantMap.get(plantKey) ?? (aliasKey ? validPlantMap.get(aliasKey) : undefined);
    if (!canonicalPlantName) return;
    const normalizedList = normalizeList(list);
    if (normalizedList.length === 0) return;
    result[canonicalPlantName] = normalizedList;
  });

  return result;
};

const createVarietyLookup = (
  varieties: Record<string, string[]> | undefined | null
): Record<string, string[]> => {
  const lookup: Record<string, string[]> = {};
  if (!varieties || typeof varieties !== 'object') return lookup;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const key = toLookupKey(plantName);
    const normalized = normalizeList(list);
    if (!key || normalized.length === 0) return;
    lookup[key] = normalized;
  });

  return lookup;
};

const getKnownVarietiesForPlant = (
  plantName: string,
  defaultVarietyLookup: Record<string, string[]>
): string[] => {
  const plantKey = toLookupKey(plantName);
  const aliasKey = KNOWN_VARIETY_ALIASES[plantKey];
  const defaults =
    defaultVarietyLookup[plantKey] ?? (aliasKey ? defaultVarietyLookup[aliasKey] : undefined);
  return defaults ? [...defaults] : [];
};

const normalizeCategory = (
  category: PlantCatalogCategory | undefined | null,
  defaultPlants: string[],
  defaultVarieties: Record<string, string[]>,
  requiredPlants: string[],
  hasCategory: boolean,
  defaultTamilNames?: Record<string, string>,
  defaultDescriptions?: Record<string, string>
): PlantCatalogCategory => {
  const plants = normalizeList(category?.plants);
  const resolvedPlants = hasCategory ? [...plants] : [...defaultPlants];
  requiredPlants.forEach((plantName) => {
    if (!hasEquivalentPlant(resolvedPlants, plantName)) {
      resolvedPlants.push(plantName);
    }
  });
  const normalizedIncomingVarieties = normalizeVarieties(category?.varieties, resolvedPlants);
  const incomingVarietySet = new Set(
    Object.keys(normalizedIncomingVarieties).map((plant) => toLookupKey(plant))
  );
  const defaultVarietyLookup = createVarietyLookup(defaultVarieties);
  const mergedVarieties: Record<string, string[]> = {
    ...normalizedIncomingVarieties,
  };

  resolvedPlants.forEach((plantName) => {
    if (incomingVarietySet.has(toLookupKey(plantName))) return;
    const defaults = getKnownVarietiesForPlant(plantName, defaultVarietyLookup);
    if (defaults.length > 0) {
      mergedVarieties[plantName] = defaults;
    }
  });

  // Merge tamilNames: incoming overrides defaults
  const mergedTamilNames: Record<string, string> = {
    ...defaultTamilNames,
    ...category?.tamilNames,
  };

  // Merge descriptions: incoming overrides defaults
  const mergedDescriptions: Record<string, string> = {
    ...defaultDescriptions,
    ...category?.descriptions,
  };

  const result: PlantCatalogCategory = {
    plants: resolvedPlants,
    varieties: mergedVarieties,
  };

  if (Object.keys(mergedTamilNames).length > 0) {
    result.tamilNames = mergedTamilNames;
  }
  if (Object.keys(mergedDescriptions).length > 0) {
    result.descriptions = mergedDescriptions;
  }

  return result;
};

export const normalizeCatalog = (catalog?: PlantCatalog | null): PlantCatalog => {
  const categories = {} as Record<PlantType, PlantCatalogCategory>;
  const incomingCategories = catalog?.categories ?? ({} as Record<PlantType, PlantCatalogCategory>);

  PLANT_CATEGORIES.forEach((type) => {
    const defaultCategory = DEFAULT_PLANT_CATALOG.categories[type];
    const incomingCategory = incomingCategories?.[type];
    const hasCategory = Boolean(incomingCategory);
    categories[type] = normalizeCategory(
      incomingCategory,
      defaultCategory.plants,
      defaultCategory.varieties,
      REQUIRED_LOCAL_PLANTS[type] ?? [],
      hasCategory,
      defaultCategory.tamilNames,
      defaultCategory.descriptions
    );
  });

  return { categories };
};

const _getCachedCatalog = async (): Promise<PlantCatalog> => {
  const stored = await getData<PlantCatalog>(KEYS.PLANT_CATALOG);
  if (stored.length > 0 && stored[0]) {
    return normalizeCatalog(stored[0]);
  }

  return DEFAULT_PLANT_CATALOG;
};

/** @deprecated Use getPlantProfiles from @/services/plantProfiles */
export const getPlantCatalog = async (): Promise<PlantCatalog> => {
  const { getPlantProfiles, toPlantCatalogShape } = await import('@/services/plantProfiles');
  return toPlantCatalogShape(await getPlantProfiles());
};

/** @deprecated Mutations go through savePlantProfile in @/services/plantProfiles */
export const savePlantCatalog = async (_catalog: PlantCatalog): Promise<PlantCatalog> => {
  const { logger } = await import('@/utils/logger');
  logger.warn('savePlantCatalog is deprecated — use savePlantProfile instead');
  return _catalog;
};
