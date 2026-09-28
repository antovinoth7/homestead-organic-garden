import type { PlantCatalogEntry } from '../types';

/**
 * One Coconut row, with the palm types as its varieties. Dwarf, Tall, Hybrid
 * and King Coconut used to be four catalog rows — four copies of the same
 * crop's pests, care and photo that a grower had to choose between before
 * they could choose a cultivar. Migration 017 moves stored entries and garden
 * plants onto this row.
 *
 * Tall types lead: West Coast Tall is the standard for humid Kanyakumari.
 */
export const COCONUT_TREE_ENTRIES: PlantCatalogEntry[] = [
  {
    name: 'Coconut',
    group: 'plantation_timber',
    subGroup: 'plantation_crops',
    habit: 'palm',
    tags: ['plantation'],
    plantType: 'coconut_tree',
    cropFamily: 'other',
    tamilName: 'தென்னை',
    shortDescription:
      'Long-lived palm for nuts, tender coconut and leaves; tall types suit humid Kanyakumari, dwarfs bear earlier',
    varieties: [
      'West Coast Tall',
      'East Coast Tall',
      'Tiptur Tall',
      'Arasampatti Tall',
      'Chowghat Orange Dwarf',
      'Chowghat Green Dwarf',
      'Malayan Yellow Dwarf',
      'VHC 1',
      'VHC 2',
      'VHC 3',
      'Kerasankara',
      'Chandrasankara',
      'King Coconut',
    ],
  },
];
