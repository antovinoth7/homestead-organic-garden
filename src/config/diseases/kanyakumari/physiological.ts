import type { DiseaseEntry } from '@/types/database.types';

export const PHYSIOLOGICAL_DISEASES: DiseaseEntry[] = [
  // ── Physiological ────────────────────────────────────────────────────────
  {
    id: 'nut_fall',
    name: 'Nut Fall',
    tamilName: 'தேங்காய் உதிர்வு',
    category: 'physiological',
    emoji: '🥥',
    identification:
      'Premature dropping of developing coconut nuts at various stages. Buttons, tender nuts or mature nuts fall.',
    damageDescription:
      'Direct yield loss. Can be caused by mite damage, nutrient deficiency (boron), water stress or hormonal imbalance.',
    organicPrevention: [
      'Maintain adequate irrigation',
      'Apply boron (borax) as foliar spray',
      'Control eriophyid mite',
    ],
    organicTreatments: [
      {
        name: 'Borax spray during flowering',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 10 g borax (sodium tetraborate) in 1 L warm water, then dilute to 10 L. Spray on flower spathe and developing buttons at the early nut stage (button stage).',
        frequency:
          'Twice per year — at spathe emergence and again at early button stage (3–4 months after spathe)',
        timing: 'Morning when spathe is open and accessible to the spray',
        safetyNotes:
          'Boron deficiency is a major cause of premature nut fall in this region — this is a nutritional correction, not a pesticide. Do not exceed the recommended dose — excessive boron is toxic to palms.',
      },
      {
        name: 'Maintain nutrition',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Apply balanced organic nutrition per palm per year: 5 kg wood ash (potassium), 3 kg bone meal (phosphorus), 5 kg neem cake (nitrogen). Split into 2 applications. Incorporate at drip zone and water thoroughly.',
        frequency: 'Twice per year — pre-monsoon (May) and post-NE Monsoon (January)',
        timing: 'Apply before rain so nutrients incorporate naturally into soil',
        safetyNotes:
          'Potassium deficiency is a leading cause of nut fall in Kanyakumari coconut areas — wood ash is the most accessible organic potassium source. Adequate potassium improves nut retention significantly.',
      },
      {
        name: 'Pest control for mites',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil (5 ml/L) + wettable sulfur (3 g/L) on developing nut bunches targeting the perianth area where eriophyid mites feed. Refer to the Eriophyid Mite entry in the Pests section for the full treatment protocol.',
        frequency: 'Monthly during dry season (March–May) when mite populations peak',
        timing: 'Morning or evening',
        safetyNotes:
          'Eriophyid mite damage to the perianth directly triggers button shedding — mite control is essential alongside nutritional management for premature nut fall. Do NOT apply sulfur and oil simultaneously.',
      },
    ],
    seasonalRisk: { summer: 'high' },
    plantsAffected: ['Coconut'],
  },
];
