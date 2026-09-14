import type { PlantCatalogEntry } from '../types';

export const SPINACH_ENTRIES: PlantCatalogEntry[] = [
  {
    name: 'Palak',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'பாலக் கீரை',
    shortDescription:
      'True spinach grown as a short cool-season leafy crop during Kanyakumari’s mildest months',
    varieties: ['All Green', 'Pusa Palak', 'Jobner Green', 'Local'],
  },
  {
    name: 'Water Spinach',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'நீர்க் கீரை',
    shortDescription:
      'Fast-growing tropical leafy vegetable for consistently moist beds; prevent escape into waterways',
    varieties: ['Broad Leaf', 'Narrow Leaf', 'Local'],
  },
  {
    name: 'Ponnanganni Keerai',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'பொன்னாங்கண்ணிக் கீரை',
    shortDescription:
      'Low-growing traditional Tamil leafy vegetable suited to moist soil and repeated harvest',
    varieties: ['Green', 'Red', 'Local'],
  },
  {
    name: 'Manathakkali Keerai',
    plantType: 'spinach',
    cropFamily: 'solanaceae',
    tamilName: 'மணத்தக்காளிக் கீரை',
    shortDescription:
      'Traditional short-lived Tamil green; cook leaves and use correctly identified planting material',
    varieties: ['Local Green'],
  },
  {
    name: 'Mustard Greens',
    plantType: 'spinach',
    cropFamily: 'brassica',
    tamilName: 'கடுகுக் கீரை',
    shortDescription: 'Peppery cool-season leaves best grown during the mild, less humid months',
    varieties: ['Broad Leaf', 'Local'],
  },
  {
    name: 'Vallarai Keerai',
    plantType: 'spinach',
    cropFamily: 'apiaceae',
    tamilName: 'வல்லாரைக் கீரை',
    shortDescription:
      'Moisture-loving creeping Tamil green suited to partial shade and humid home gardens',
    varieties: ['Local'],
  },
  // Moved from `vegetable`: a keerai belongs with the other keerai.
  {
    name: 'Purslane',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'பொட்டுக்கீரை',
    shortDescription:
      'Succulent edible weed rich in omega-3 fatty acids; drought-tolerant ground cover',
  },
  {
    name: 'Amaranthus',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'அரைக்கீரை',
    shortDescription: 'Quick-growing leafy green rich in iron, popular as keerai in Tamil cuisine',
    varieties: ['Arai Keerai', 'Siru Keerai', 'Mulai Keerai', 'Thandu Keerai'],
  },
  {
    name: 'Pasalai Keerai',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'பசளைக்கீரை',
    shortDescription: 'Malabar spinach — vigorous climbing leafy green thriving in Tamil Nadu heat',
    varieties: ['Green Stem', 'Red Stem', 'Local'],
  },
  {
    name: 'Fenugreek',
    plantType: 'spinach',
    cropFamily: 'legume',
    tamilName: 'வெந்தயம்',
    shortDescription:
      'Aromatic annual legume grown for its iron-rich leaves and distinctive seeds; vendhaya keerai',
    varieties: ['Kasuri', 'Pusa Early', 'Local'],
  },
  // Moved from `shrub`: agathi keerai is a keerai, whatever the plant's
  // habit. Its nitrogen fixing and chop-and-drop use are unchanged —
  // `dynamicAccumulators` and the medicinal guild match it by name.
  {
    name: 'Agathi',
    plantType: 'spinach',
    cropFamily: 'legume',
    tamilName: 'அகத்தி',
    shortDescription:
      'Tall nitrogen-fixing legume picked over for agathi keerai and its edible flowers; also a chop-and-drop dynamic accumulator',
  },
  // Keerai a Tamil Nadu kitchen actually cooks, absent until now.
  {
    name: 'Roselle',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'புளிச்சக்கீரை',
    shortDescription:
      'Sour-leaved hibiscus green for kuzhambu and thokku; known elsewhere as gongura',
    varieties: ['Green Stem', 'Red Stem', 'Local'],
  },
  {
    name: 'False Daisy',
    plantType: 'spinach',
    cropFamily: 'other',
    tamilName: 'கரிசலாங்கண்ணி',
    shortDescription:
      'Creeping marshy green cooked as keerai and long used in Siddha hair and liver preparations',
    varieties: ['Yellow Flowered', 'White Flowered', 'Local'],
  },
  {
    name: 'Madras Pea Pumpkin',
    plantType: 'spinach',
    cropFamily: 'cucurbit',
    tamilName: 'முசுமுசுக்கை',
    shortDescription:
      'Rough-leaved trailing vine of Tamil hedgerows, cooked as keerai for coughs and colds',
  },
];
