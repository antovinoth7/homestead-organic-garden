import type { PestEntry } from '@/types/database.types';

export const OTHER_PESTS: PestEntry[] = [
  // ── Other Pests ──────────────────────────────────────────────────────────
  {
    id: 'nematodes',
    name: 'Nematodes',
    tamilName: 'நூற்புழு',
    category: 'other',
    emoji: '🪱',
    identification:
      'Microscopic roundworms in soil. Visible only by symptoms: root galls (root-knot nematode), stunting, yellowing.',
    damageDescription:
      'Root galls block water/nutrient uptake. Stunted growth, yellowing, wilting despite adequate water. Facilitates fungal root rots.',
    organicPrevention: [
      'Interplant with marigold (releases nematode-repelling compounds)',
      'Rotate crops — avoid planting same family consecutively',
    ],
    organicTreatments: [
      {
        name: 'Neem cake soil application',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Broadcast 2–3 kg neem cake per 10 m² of bed. Incorporate into the top 15 cm of soil using a fork or hoe. Water thoroughly after application.',
        frequency: 'Once before planting; repeat mid-season if symptoms persist',
        timing: 'Apply 2–3 weeks before transplanting for best pre-planting suppression',
        safetyNotes:
          'Neem cake also acts as an organic nitrogen fertiliser. Do not over-apply — very heavy rates can temporarily affect beneficial soil microbes.',
      },
      {
        name: 'Marigold interplanting',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Plant African marigold (Tagetes erecta) densely around crop borders or at a 1:4 ratio within the crop (1 marigold per 4 vegetable plants). Allow roots to remain in soil between crop seasons.',
        frequency: 'Plant at or before main crop establishment; maintain for the full season',
        timing:
          'Establish marigolds 3–4 weeks before main crop for maximum nematode-suppressing root exudate release',
        safetyNotes:
          'French marigold (T. patula) is also effective. Avoid planting marigolds too close to fruiting vegetables during early stages as they may compete for water.',
      },
      {
        name: 'Trichoderma soil treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride with 10 kg well-decomposed farmyard compost. Broadcast 500 g of this mixture per m² and incorporate into the top 15 cm before planting.',
        frequency: 'At planting; one additional application at 45 days after transplanting',
        timing:
          'Apply in moist soil conditions (after rain or irrigation) for best fungal colonisation',
        safetyNotes:
          'Do NOT apply simultaneously with synthetic fungicides — they kill Trichoderma. If fungicide use is absolutely needed, use only copper or sulfur-based products.',
      },
      {
        name: 'Castor cake',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Incorporate 2–3 kg castor cake per 10 m² into the topsoil by mixing well. Apply 2–3 weeks before planting.',
        frequency: 'Once per season before planting',
        timing: 'Pre-planting, 2–3 weeks before transplanting',
        safetyNotes:
          'IMPORTANT: Castor cake contains ricin and is toxic to humans and animals if ingested — keep stored product away from children and livestock. Wear gloves when handling.',
      },
    ],
    seasonalRisk: { summer: 'moderate', sw_monsoon: 'moderate' },
    plantsAffected: ['Tomato', 'Brinjal', 'Ladies Finger', 'Banana'],
  },
  {
    id: 'termites',
    name: 'Termites',
    tamilName: 'கரையான்',
    category: 'other',
    emoji: '🐜',
    identification:
      'Small pale social insects in mud tubes on trunks and in soil. Hollow-sounding stems. Mud trails on bark.',
    damageDescription:
      'Feed on dead wood and roots. Attack living trees through wounds. Can hollow out trunks killing mature trees.',
    organicPrevention: [
      'Remove dead wood and stumps near garden',
      'Maintain soil moisture — termites prefer dry conditions',
    ],
    organicTreatments: [
      {
        name: 'Neem cake soil application',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Broadcast 2–3 kg neem cake per 10 m² around affected plants. Incorporate into topsoil. Also apply directly to active mud tubes on trunks, mixing neem cake into mud tube material.',
        frequency: 'Every 3 months in termite-prone areas; immediately on discovery',
        timing: 'Apply before monsoon to allow incorporation into soil',
        safetyNotes:
          'Neem cake disrupts termite colony activity through azadirachtin. Combine with Beauveria application for better control.',
      },
      {
        name: 'Beauveria bassiana',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Mix Beauveria bassiana WP at 5 g per litre water. Drench affected soil zone and spray directly on mud tubes and tunnels on trunks at 1–2 litres per tree.',
        frequency: 'Two applications 2 weeks apart; repeat at the start of each dry season',
        timing:
          'Evening in humid conditions — fungal spores require moisture to germinate and infect termites',
        safetyNotes:
          'Do not apply with fungicides. Results take 1–3 weeks — Beauveria must infect and kill termites through contact. Most effective in moist soil.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Timber trees', 'Coconut', 'Fruit trees'],
  },
  {
    id: 'fruit_fly',
    name: 'Fruit Fly',
    tamilName: 'பழ ஈ',
    scientificName: 'Bactrocera dorsalis',
    category: 'other',
    emoji: '🪰',
    identification:
      'Small fly (5–8 mm) with banded wings. Puncture marks on ripening fruit. Maggots inside cut fruit.',
    damageDescription:
      'Female lays eggs in ripening fruit. Maggots feed inside causing fruit rot and drop. Major post-harvest loss.',
    organicPrevention: [
      'Harvest fruit at mature-green stage',
      'Set pheromone traps before fruiting season',
      'Destroy fallen infested fruits',
    ],
    organicTreatments: [
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Hang Methyl eugenol pheromone traps (specific for Bactrocera dorsalis) at 1 per 25 trees, placed at 1.5 m height in the orchard. Follow supplier instructions for lure fitting.',
        frequency: 'Replace lure every 4–6 weeks; record catches weekly',
        timing: 'Install 4–6 weeks before fruit ripening begins',
        safetyNotes:
          'These traps are male-specific — use alongside protein bait traps for comprehensive control. High weekly catches (>25) indicate immediate spray intervention is needed.',
      },
      {
        name: 'Neem oil fruit spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray on developing and ripening fruit surfaces and surrounding foliage to deter female egg-laying.',
        frequency: 'Every 5–7 days during the fruit ripening stage',
        timing: 'Evening',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Wash fruit before eating. Neem does not kill established larvae inside fruit — prevention through deterring egg-laying is the primary mechanism.',
      },
      {
        name: 'Bait traps (jaggery + spinosad)',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Mix 50 g jaggery in 1 L water with fresh citrus peel or juice. Add 0.2 ml organic spinosad. Pour 200 ml into hanging bottles at canopy height, 1 bottle per 5 trees.',
        frequency: 'Refresh bait every 3–5 days',
        timing: 'Hang traps before fruit enters the ripening stage',
        safetyNotes:
          'Spinosad-based bait is suitable for organic farming — do NOT use malathion if organic certification is required. Dispose of used bait carefully — keep away from water sources and drains.',
      },
      {
        name: 'Early harvest',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Harvest fruits at the mature-green stage before they fully ripen on the tree. Allow fruit to ripen in shade off the tree. Avoid leaving overripe or fallen fruit in the orchard.',
        frequency:
          'Harvest every 3–4 days once fruits reach mature-green stage during peak fly season',
        timing: 'Early morning for best post-harvest quality and firmness',
        safetyNotes:
          'Collect ALL fallen and infested fruits immediately and bury at least 30 cm deep to prevent maggots from completing their lifecycle in the soil.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Mango', 'Guava', 'Papaya'],
  },
  {
    id: 'pod_fly',
    name: 'Pod Fly',
    tamilName: 'நெற்று ஈ',
    category: 'other',
    emoji: '🪰',
    identification:
      'Small fly that lays eggs on developing pods. Maggots feed inside pods causing premature drying.',
    damageDescription:
      'Larvae feed inside pods destroying seeds. Pods shrivel and dry prematurely. Major pest of drumstick.',
    organicPrevention: ['Spray neem at pod formation stage', 'Collect and destroy infested pods'],
    organicTreatments: [
      {
        name: 'Neem oil spray at pod formation',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray thoroughly on developing pods covering all surfaces, especially the pod surface and stalk junction where eggs are laid.',
        frequency: 'Every 7 days during pod development, starting immediately at pod set',
        timing: 'Evening',
        safetyNotes:
          'Spray must begin at pod set stage — once larvae are inside pods, external spraying has no effect. Pre-harvest interval: 24 hours.',
      },
      {
        name: 'Early harvest',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Harvest drumstick pods when mature but before they turn yellow or soft. Do not allow pods to over-ripen on the tree as ripe fruits attract more flies for egg-laying.',
        frequency: 'Harvest every 5–7 days once pods are mature',
        timing: 'Morning harvest for best quality',
        safetyNotes:
          'Remove and bury or burn fallen infested pods immediately — they contain larvae completing their lifecycle which will create the next generation of flies.',
      },
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Hang pod fly pheromone traps at 1.5 m height near drumstick trees. Follow supplier instructions for lure quantity and trap type.',
        frequency: 'Change lure every 4 weeks; inspect weekly',
        timing: 'Install before pod formation — primarily used for population monitoring',
        safetyNotes:
          'Catch monitoring helps time neem spray applications for peak fly oviposition activity. Record catches to predict high-risk periods.',
      },
    ],
    seasonalRisk: { summer: 'moderate', cool_dry: 'moderate' },
    plantsAffected: ['Drumstick'],
  },
  {
    id: 'leaf_defoliators',
    name: 'Leaf Defoliators',
    tamilName: 'இலை அரிப்பான்',
    category: 'other',
    emoji: '🐜',
    identification:
      'Various insects (beetles, caterpillars, sawflies) that consume leaf tissue. Irregular holes or complete defoliation.',
    damageDescription:
      'Reduces photosynthetic area. Severe defoliation weakens trees, reduces fruit set and yield. Repeated attacks can kill young trees.',
    organicPrevention: ['Encourage insectivorous birds', 'Maintain biodiversity in the garden'],
    organicTreatments: [
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2–3 g Bt kurstaki per litre water. Spray on all defoliated or actively fed-upon foliage, coating both leaf surfaces thoroughly.',
        frequency: 'Every 5–7 days; reapply after rain',
        timing: 'Evening for maximum residual activity',
        safetyNotes:
          'Bt is safe for humans, birds, and bees — use freely near harvest. Effective only when ingested by caterpillars and sawfly larvae. Not effective on adult beetles.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on foliage covering both surfaces. Neem disrupts feeding and larval development.',
        frequency: 'Every 5–7 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Most effective on young larvae. For severe infestations, increase frequency to every 3–4 days initially.',
      },
      {
        name: 'Handpicking',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Inspect trees in morning and evening. Handpick beetles, caterpillars and sawfly larvae from foliage and drop into soapy water. Check leaf undersides for egg masses and remove.',
        frequency: 'Daily during active infestation',
        timing: 'Early morning and evening when insects are most accessible on leaf surfaces',
        safetyNotes:
          'Wear gloves — some caterpillar species have irritating hairs. Inspect leaf undersides carefully for egg clusters and gregarious young larvae.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate' },
    plantsAffected: ['Timber trees', 'Teak', 'Tamarind'],
  },
];
