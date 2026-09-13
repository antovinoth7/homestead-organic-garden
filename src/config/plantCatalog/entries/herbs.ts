import type { PlantCatalogEntry } from '../types';

export const HERB_ENTRIES: PlantCatalogEntry[] = [
  {
    name: 'Coriander',
    plantType: 'herb',
    tamilName: 'கொத்தமல்லி',
    shortDescription: 'Fast-growing cool-season herb prized for its aromatic leaves and seeds',
    varieties: ['CO 4', 'CO 5', 'Local'],
  },
  {
    name: 'Mint',
    plantType: 'herb',
    tamilName: 'புதினா',
    shortDescription: 'Vigorous spreading herb that thrives in moist, partially shaded spots',
    varieties: ['Peppermint', 'Spearmint', 'Country Mint'],
  },
  {
    name: 'Curry Leaf',
    plantType: 'herb',
    tamilName: 'கறிவேப்பிலை',
    shortDescription: 'Essential South Indian culinary tree producing intensely aromatic leaves',
    varieties: ['Dwarf', 'Regular', 'Local'],
  },
  {
    name: 'Lemongrass',
    plantType: 'herb',
    tamilName: 'எலுமிச்சைப்புல்',
    shortDescription: 'Tall aromatic grass used in teas and South-East Asian cuisine',
    varieties: ['East Indian', 'West Indian', 'Local'],
  },
  {
    name: 'Tulsi',
    plantType: 'herb',
    tamilName: 'துளசி',
    shortDescription: 'Sacred herb of Indian households valued for medicinal and spiritual significance',
    varieties: ['Krishna Tulsi', 'Rama Tulsi'],
  },
  {
    name: 'Basil',
    plantType: 'herb',
    tamilName: 'திருநீற்றுப்பச்சிலை',
    shortDescription: 'Aromatic culinary herb used in Italian and Thai cooking',
  },
  {
    name: 'Dill',
    plantType: 'herb',
    tamilName: 'சதகுப்பை',
    shortDescription: 'Feathery herb with a mild anise flavour, popular in pickles and rice dishes',
  },
  // Kanyakumari spices grown as herbs
  {
    name: 'Turmeric',
    plantType: 'herb',
    tamilName: 'மஞ்சள்',
    shortDescription: 'Tropical rhizomatous herb yielding the golden spice of Indian cooking',
    varieties: ['Erode Local', 'Salem', 'Finger Turmeric', 'CO 1'],
  },
  {
    name: 'Ginger',
    plantType: 'herb',
    tamilName: 'இஞ்சி',
    shortDescription: 'Pungent rhizome staple in South Indian cooking and Ayurvedic medicine',
    varieties: ['Maran', 'Rio-de-Janeiro', 'Nadia', 'Local'],
  },
  {
    name: 'Betel Leaf',
    plantType: 'herb',
    tamilName: 'வெற்றிலை',
    shortDescription: 'Tropical climbing vine prized for its glossy heart-shaped leaves',
    varieties: ['Vetrilai', 'Kapur', 'Local'],
  },
  // Spice bed plants
  {
    name: 'Ajwain',
    plantType: 'herb',
    tamilName: 'ஓமம்',
    shortDescription: 'Aromatic annual herb yielding carom seeds used in South Indian tempering and digestive remedies',
  },
  {
    name: 'Cardamom',
    plantType: 'herb',
    tamilName: 'ஏலக்காய்',
    shortDescription: 'Shade-tolerant tropical rhizome producing the queen of spices; intercropped under forest canopy',
    varieties: ['Small Cardamom', 'Mysore', 'Malabar'],
  },
  {
    name: 'Black Pepper',
    plantType: 'herb',
    tamilName: 'கருமிளகு',
    shortDescription: 'Climbing spice vine trained on coconut trunks producing the king of spices',
    varieties: ['Panniyur 1', 'Karimunda', 'Local'],
  },
  // Companion-rule plants
  {
    name: 'Fennel',
    plantType: 'herb',
    tamilName: 'சோம்பு',
    shortDescription: 'Tall aromatic herb with feathery leaves and anise-flavoured seeds; allelopathic — plant away from most crops',
  },
  // Medicinal guild plants
  {
    name: 'Brahmi',
    plantType: 'herb',
    tamilName: 'பிரம்மி',
    shortDescription: 'Low-growing medicinal creeper thriving in moist, shaded spots; revered in Ayurveda for cognitive health',
    varieties: ['Water Hyssop', 'Local'],
  },
  {
    name: 'Ashwagandha',
    plantType: 'herb',
    tamilName: 'அஷ்வகந்தா',
    shortDescription: 'Drought-tolerant medicinal shrub producing adaptogenic roots; thrives in sandy well-drained soils',
  },
  {
    name: 'Aloe Vera',
    plantType: 'herb',
    tamilName: 'கற்றாழை',
    shortDescription: 'Succulent perennial with gel-filled leaves used in medicine, skincare, and soil conditioning',
    varieties: ['Barbadensis', 'Local Green', 'Soap Aloe'],
  },
  // Tamil Nadu homestead medicinals. Filed by use, like Curry Leaf (a
  // tree), Black Pepper (a vine) and Ashwagandha (a shrub) above.
  {
    name: 'Adathodai',
    plantType: 'herb',
    tamilName: 'ஆடாதொடை',
    shortDescription: 'Hardy medicinal shrub of the Tamil homestead; leaves brewed for coughs and also cut as green-leaf manure',
  },
  {
    name: 'Nithyakalyani',
    plantType: 'herb',
    tamilName: 'நித்தியகல்யாணி',
    shortDescription: 'Tough evergreen flowering year-round on poor soil; self-seeds freely and needs almost no care',
    varieties: ['White', 'Pink', 'Local'],
  },
  {
    name: 'Thoothuvalai',
    plantType: 'herb',
    tamilName: 'தூதுவளை',
    shortDescription: 'Scrambling prickly climber of the kitchen doorway, cooked as a cough and cold remedy',
  },
  {
    name: 'Karpooravalli',
    plantType: 'herb',
    tamilName: 'கற்பூரவல்லி',
    shortDescription: 'Thick-leaved aromatic plant kept by the kitchen door; leaves used fresh for coughs and colds',
    varieties: ['Broad Leaf', 'Variegated', 'Local'],
  },
  // Moved from `shrub`: both are cut for a leaf harvest, one for henna
  // and one for the grain store and the pest spray.
  {
    name: 'Maruthani',
    plantType: 'herb',
    tamilName: 'மருதாணி',
    shortDescription: 'The classic Tamil boundary hedge; leaves ground for henna, and it takes hard clipping',
    varieties: ['Broad Leaf', 'Country', 'Local'],
  },
  {
    name: 'Nochi',
    plantType: 'herb',
    tamilName: 'நொச்சி',
    shortDescription: 'Aromatic shrub whose leaves are layered into stored grain and steeped as a leaf-extract pest spray',
  },
  // Moved from `shrub`: grown for its leaves and seed cake, both used
  // medicinally and as a pest input, so it is filed by use like the
  // medicinals above rather than by its woody habit.
  {
    name: 'Castor',
    plantType: 'herb',
    tamilName: 'ஆமணக்கு',
    shortDescription: 'Tall fast-growing shrub with repellent properties; pest-deterrent companion around vegetable beds',
  },
];
