import type { PlantCatalogEntry } from '../types';

export const SPINACH_ENTRIES: PlantCatalogEntry[] = [
  {
    name: 'Palak',
    plantType: 'spinach',
    tamilName: 'பாலக் கீரை',
    shortDescription: 'True spinach grown as a short cool-season leafy crop during Kanyakumari’s mildest months',
    varieties: ['All Green', 'Pusa Palak', 'Jobner Green', 'Local'],
  },
  {
    name: 'Water Spinach',
    plantType: 'spinach',
    tamilName: 'நீர்க் கீரை',
    shortDescription: 'Fast-growing tropical leafy vegetable for consistently moist beds; prevent escape into waterways',
    varieties: ['Broad Leaf', 'Narrow Leaf', 'Local'],
  },
  {
    name: 'Ponnanganni Keerai',
    plantType: 'spinach',
    tamilName: 'பொன்னாங்கண்ணிக் கீரை',
    shortDescription: 'Low-growing traditional Tamil leafy vegetable suited to moist soil and repeated harvest',
    varieties: ['Green', 'Red', 'Local'],
  },
  {
    name: 'Manathakkali Keerai',
    plantType: 'spinach',
    tamilName: 'மணத்தக்காளிக் கீரை',
    shortDescription: 'Traditional short-lived Tamil green; cook leaves and use correctly identified planting material',
    varieties: ['Local Green'],
  },
  {
    name: 'Mustard Greens',
    plantType: 'spinach',
    tamilName: 'கடுகுக் கீரை',
    shortDescription: 'Peppery cool-season leaves best grown during the mild, less humid months',
    varieties: ['Broad Leaf', 'Local'],
  },
  {
    name: 'Vallarai Keerai',
    plantType: 'spinach',
    tamilName: 'வல்லாரைக் கீரை',
    shortDescription: 'Moisture-loving creeping Tamil green suited to partial shade and humid home gardens',
    varieties: ['Local'],
  },
  // Moved from `vegetable`: a keerai belongs with the other keerai.
  {
    name: 'Purslane',
    plantType: 'spinach',
    tamilName: 'பொட்டுக்கீரை',
    shortDescription: 'Succulent edible weed rich in omega-3 fatty acids; drought-tolerant ground cover',
  },
  {
    name: 'Amaranthus',
    plantType: 'spinach',
    tamilName: 'அரைக்கீரை',
    shortDescription: 'Quick-growing leafy green rich in iron, popular as keerai in Tamil cuisine',
    varieties: ['Arai Keerai', 'Siru Keerai', 'Mulai Keerai'],
  },
  {
    name: 'Pasalai Keerai',
    plantType: 'spinach',
    tamilName: 'பசளைக்கீரை',
    shortDescription: 'Malabar spinach — vigorous climbing leafy green thriving in Tamil Nadu heat',
    varieties: ['Green Stem', 'Red Stem', 'Local'],
  },
  {
    name: 'Fenugreek',
    plantType: 'spinach',
    tamilName: 'வெந்தயம்',
    shortDescription: 'Aromatic annual legume grown for its iron-rich leaves and distinctive seeds; vendhaya keerai',
    varieties: ['Kasuri', 'Pusa Early', 'Local'],
  },
  // Moved from `shrub`: agathi keerai is a keerai, whatever the plant's
  // habit. Its nitrogen fixing and chop-and-drop use are unchanged —
  // `dynamicAccumulators` and the medicinal guild match it by name.
  {
    name: 'Agathi',
    plantType: 'spinach',
    tamilName: 'அகத்தி',
    shortDescription: 'Tall nitrogen-fixing legume picked over for agathi keerai and its edible flowers; also a chop-and-drop dynamic accumulator',
  },
];
