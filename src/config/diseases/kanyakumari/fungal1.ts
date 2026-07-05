import type { DiseaseEntry } from '@/types/database.types';

export const FUNGAL_DISEASES_1: DiseaseEntry[] = [
  // ── Fungal ───────────────────────────────────────────────────────────────
  {
    id: 'powdery_mildew',
    name: 'Powdery Mildew',
    tamilName: 'சாம்பல் நோய்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'White powdery growth on leaf surfaces, stems and flowers. Starts as small circular patches and spreads rapidly.',
    damageDescription:
      'Reduces photosynthesis, causes leaf distortion and premature leaf drop. Flower infection leads to poor fruit set.',
    organicPrevention: [
      'Ensure good air circulation between plants',
      'Avoid overhead watering',
      'Remove and destroy infected plant parts',
    ],
    organicTreatments: [
      {
        name: 'Baking soda spray (1 tsp/L)',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 1 tsp (5 g) baking soda in 1 L water. Add 1 ml liquid soap to help it stick to leaves. Spray on both leaf surfaces, thoroughly coating all powdery growth.',
        frequency: 'Every 5–7 days for 3–4 applications',
        timing:
          'Morning — allows foliage to dry before evening and avoids baking residue from afternoon heat',
        safetyNotes:
          'Do not exceed 1 tsp/L — higher concentrations cause leaf tip burn. Test on a few leaves first. Rinse edible crops before consuming.',
      },
      {
        name: 'Neem oil',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on all affected leaf surfaces, covering both sides thoroughly.',
        frequency: 'Every 5–7 days',
        timing: 'Evening or early morning to prevent leaf burn and protect pollinators',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Neem disrupts spore germination — begin treatment at first signs for best results.',
      },
      {
        name: 'Milk spray (1:9)',
        method: 'spray',
        effort: 'easy',
        howToApply:
          "Mix 1 part fresh cow's milk with 9 parts water. Spray on both leaf surfaces. Milk proteins create an alkaline environment hostile to powdery mildew fungi.",
        frequency: 'Every 7 days for 3–4 applications',
        timing: 'Morning — requires UV light to activate the antimicrobial compounds in milk',
        safetyNotes:
          'Use within 24 hours of mixing — spoiled milk is ineffective and attracts insects. Most effective as a preventive and on early-stage infections.',
      },
      {
        name: 'Sulfur-based fungicide',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 2–3 g wettable sulfur per litre water. Spray on all affected surfaces, particularly the upper leaf surface where powdery growth is visible.',
        frequency: 'Every 7–10 days',
        timing:
          'Morning only. NEVER apply above 32°C — severe and irreversible leaf burn will result.',
        safetyNotes:
          'Do NOT apply within 2 weeks of any oil-based spray. Do NOT apply above 32°C. Wear gloves and a dust mask when handling.',
      },
    ],
    seasonalRisk: { cool_dry: 'high', summer: 'moderate' },
    plantsAffected: ['Chilli', 'Ladies Finger', 'Drumstick', 'Mango'],
  },
  {
    id: 'anthracnose',
    name: 'Anthracnose',
    tamilName: 'கரும்புள்ளி நோய்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Dark sunken lesions on fruits, leaves and stems. Lesions may have concentric rings. Salmon-pink spore masses in wet weather.',
    damageDescription:
      'Fruit rot, leaf blight, twig dieback. Major post-harvest disease causing fruit loss. Spreads rapidly in humid conditions.',
    organicPrevention: [
      'Prune to improve air circulation',
      'Remove and destroy fallen infected fruit',
      'Avoid wetting foliage during irrigation',
    ],
    organicTreatments: [
      {
        name: 'Copper-based fungicide',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix copper hydroxide or copper oxychloride at 3–4 g per litre water (follow product label). Spray on all plant surfaces — leaves, stems and fruit — as a protective cover.',
        frequency: 'Every 7–10 days during monsoon season; preventively before fruit set',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper accumulates in soil with repeated use — apply only when needed. Wear gloves.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Spray on all plant surfaces covering fruit, leaves and stems thoroughly.',
        frequency: 'Every 5–7 days alternating with copper spray',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Most effective as a preventive — begin spraying before symptoms appear during high-risk monsoon periods.',
      },
      {
        name: 'Remove infected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Prune and remove all affected leaves, shoots and fruit showing dark sunken lesions. Bag removed material immediately and burn — do not compost. Collect all fallen infected fruit from the ground.',
        frequency: 'Weekly throughout the growing season',
        timing: 'Any time; act immediately on discovery',
        safetyNotes:
          'Disinfect pruning tools between cuts with dilute bleach (1:10). Leaving infected material on the ground or tree dramatically increases spore load for next season.',
      },
      {
        name: 'Improve air circulation',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Prune interior crossing branches to open the canopy. Remove weeds from around plants. Thin fruit clusters to improve airflow. Avoid overhead irrigation.',
        frequency: 'Once or twice per season — before monsoon and after harvest',
        timing: 'During dry weather so pruning wounds heal before rain',
        safetyNotes:
          'Seal large pruning wounds with Bordeaux paste to prevent fungal entry. Dense humid canopies favour Anthracnose spread significantly.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high', summer: 'moderate' },
    plantsAffected: ['Mango', 'Chilli', 'Guava', 'Papaya', 'Banana'],
  },
  {
    id: 'leaf_spot',
    name: 'Leaf Spot',
    tamilName: 'இலைப்புள்ளி நோய்',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Circular to irregular brown/dark spots on leaves, often with yellow halo. May merge in severe cases.',
    damageDescription:
      'Reduces photosynthetic area. Severe infections cause premature defoliation. Weakens plant over time.',
    organicPrevention: [
      'Remove and destroy fallen leaves',
      'Avoid overhead watering',
      'Maintain plant spacing for air flow',
    ],
    organicTreatments: [
      {
        name: 'Copper hydroxide spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper hydroxide (Kocide) per litre water. Spray on both leaf surfaces thoroughly, starting with lower leaves where spots first appear.',
        frequency: 'Every 7–10 days during monsoon; preventively in high-humidity periods',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Avoid repeated copper applications to the same soil — copper accumulation can cause toxicity. Wear gloves.',
      },
      {
        name: 'Neem oil',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces.',
        frequency: 'Every 5–7 days',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Begin at first sign of spots — neem is more effective as a preventive than curative treatment.',
      },
      {
        name: 'Remove and burn infected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Pick off all leaves showing spots. Place in bags and burn or bury deeply — do not leave on the ground. Also rake and remove fallen spotted leaves from around the plant base.',
        frequency: 'Weekly throughout the growing season',
        timing: 'Any time',
        safetyNotes:
          'Do not compost spotted leaves — fungal spores survive composting and reinfect next season. Wash hands after handling diseased material.',
      },
      {
        name: 'Avoid overhead watering',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Switch to drip irrigation or water only at the base of plants. If overhead watering is unavoidable, water in early morning only so foliage dries completely before evening.',
        frequency: 'Permanent cultural practice throughout the growing season',
        timing: 'If overhead watering is used, only in early morning',
        safetyNotes:
          'Wet foliage is the primary driver of fungal leaf spot spread — keeping leaves dry is the most effective long-term prevention strategy.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Guava', 'Drumstick', 'Jasmine', 'Vegetables'],
  },
  {
    id: 'cercospora_leaf_spot',
    name: 'Cercospora Leaf Spot',
    tamilName: 'செர்கோஸ்போரா இலைப்புள்ளி',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Small circular spots with grey centres and dark brown borders. Often appears on older leaves first.',
    damageDescription:
      'Progressive defoliation from lower leaves upward. Reduces yield in vegetables. Common in humid weather.',
    organicPrevention: ['Maintain good drainage', 'Rotate crops — avoid replanting same family'],
    organicTreatments: [
      {
        name: 'Copper oxychloride spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper oxychloride per litre water. Spray on both leaf surfaces, starting with lower (older) leaves where disease begins.',
        frequency: 'Every 7–10 days during wet weather',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Wear gloves and mask — copper oxychloride is a moderate irritant.',
      },
      {
        name: 'Remove infected foliage',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Remove lower infected leaves at first sign of grey-centred spots. Bag and burn or bury. This slows upward disease progression significantly.',
        frequency: 'Weekly throughout the crop season',
        timing: 'Any time',
        safetyNotes:
          'Do not compost — spores survive. Removing lower infected leaves is one of the most effective early interventions.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Create raised beds or earthen channels to divert standing water away from plant roots. In heavy soils, incorporate sand or coco peat to improve drainage before planting.',
        frequency: 'Before planting season; maintain drainage infrastructure throughout',
        timing: 'Establish before monsoon season',
        safetyNotes:
          'Wet soil and wet foliage together create ideal conditions for Cercospora — improving drainage is a permanent, long-term solution.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Ladies Finger', 'Tapioca'],
  },
  {
    id: 'sigatoka_leaf_spot',
    name: 'Sigatoka Leaf Spot',
    tamilName: 'சிகடோகா இலைப்புள்ளி',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Elongated brown streaks on banana leaves, starting parallel to veins. Leaves dry from edges inward.',
    damageDescription:
      'Severe defoliation reduces bunch weight and fruit quality. Premature ripening. Major banana disease worldwide.',
    organicPrevention: [
      'Remove and destroy affected leaves promptly',
      'Avoid overcrowding — maintain 2m spacing',
    ],
    organicTreatments: [
      {
        name: 'Remove affected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Cut out banana leaves showing elongated brown streaks entirely — cut at the leaf base (petiole). Burn removed material immediately. Do not drag removed leaves through the healthy canopy.',
        frequency: 'Weekly scouting; remove affected leaves without delay',
        timing: 'Any time; do not postpone removal',
        safetyNotes:
          'Do not compost — Sigatoka spores survive. Leaf removal is the single most effective organic management tool for this disease. Wear gloves.',
      },
      {
        name: 'Copper spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 4 g copper oxychloride per litre water. Spray lower and middle leaves where disease starts — cover both leaf surfaces thoroughly. Use a high-volume sprayer for banana canopy.',
        frequency: 'Every 10–14 days during monsoon season',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper is a contact fungicide — thorough coverage of leaf undersides (where spores germinate) is critical.',
      },
      {
        name: 'Improve spacing',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Thin banana stools to 1 mother plant + 1 follower sucker per mat. Remove all additional suckers promptly. Maintain minimum 2 m spacing between mats for adequate air circulation.',
        frequency: 'Ongoing — thin suckers every 2–3 months',
        timing: 'Any time during growing season',
        safetyNotes:
          'Crowded plantations trap moisture on leaf surfaces far longer, dramatically worsening Sigatoka spread. Spacing management must be maintained persistently.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high' },
    plantsAffected: ['Banana'],
  },
  {
    id: 'root_rot',
    name: 'Root Rot',
    tamilName: 'வேர் அழுகல்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Wilting despite adequate water. Roots are brown/black and mushy when pulled. Foul smell from root zone.',
    damageDescription:
      'Destroys root system — plant cannot absorb water/nutrients. Progressive wilting and death. Caused by waterlogged conditions.',
    organicPrevention: [
      'Ensure good drainage — raise beds in heavy soils',
      'Avoid overwatering',
      'Use Trichoderma as preventive soil treatment',
    ],
    organicTreatments: [
      {
        name: 'Trichoderma viride soil drench',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride into 5 kg well-composted manure first (allows colonisation). Apply 500 ml–1 L soil drench (100 g in 10 L water) per affected plant directly into the root zone.',
        frequency: 'At planting as a preventive; repeat every 45 days if infection is present',
        timing: 'Apply to moist soil after irrigation or rain for best fungal colonisation',
        safetyNotes:
          'Do NOT apply with synthetic fungicides — they destroy Trichoderma. If fungicide use is unavoidable, wait 2 weeks before applying Trichoderma.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Create raised beds for susceptible crops. Install channels to divert water away from plant stems. Incorporate sand or coco peat into heavy clay soils. Ensure water never ponds near plant stems.',
        frequency: 'Before planting; maintain permanent drainage infrastructure',
        timing: 'Establish before monsoon season for maximum benefit',
        safetyNotes:
          'Root rot is almost entirely caused by waterlogged soil — no treatment is effective without addressing drainage first. A wilting plant may be overwatered, not underwatered — check roots before increasing irrigation.',
      },
      {
        name: 'Reduce watering',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Allow the top 5 cm of soil to dry between waterings. Check soil moisture by inserting a finger — water only when dry at 5 cm depth. Use drip irrigation for precision.',
        frequency:
          'Adjust watering schedule based on weather — significantly reduce in rainy season',
        timing: 'Water in morning only to allow surface drying before evening',
        safetyNotes:
          'Overwatering is the leading cause of root rot. Plants showing early root rot symptoms need less water, not more — counter-intuitive but critical.',
      },
      {
        name: 'Neem cake in soil',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Incorporate 2 kg neem cake per 10 m² into the top 15 cm of soil. For established plants, mix 500 g into the root zone as a top-dressing and water in well.',
        frequency: 'Once per season before planting',
        timing: '2–3 weeks before transplanting for best pre-planting soil suppression',
        safetyNotes:
          'Neem cake suppresses soil fungal pathogens (Pythium, Phytophthora) and simultaneously improves soil nitrogen levels.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high' },
    plantsAffected: ['Papaya', 'Jasmine', 'Drumstick', 'Vegetables'],
  },
  {
    id: 'rhizome_rot',
    name: 'Rhizome Rot',
    tamilName: 'கிழங்கு அழுகல்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Yellowing and wilting of lower leaves. Rhizome is soft and brown when cut. Water-soaked rot at base.',
    damageDescription:
      'Destroys rhizome leading to plant collapse. Spreads to adjacent plants through soil. Common in poorly drained fields.',
    organicPrevention: ['Plant in well-drained raised beds', 'Use disease-free planting material'],
    organicTreatments: [
      {
        name: 'Trichoderma treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride into 5 kg compost first. Apply to planting hole before transplanting. For standing crops, drench root zone with 100 g in 10 L water per plant.',
        frequency: 'At planting; repeat every 45 days in affected fields',
        timing: 'Apply to moist soil after watering for best colonisation',
        safetyNotes:
          'Remove and destroy affected rhizomes before treating remaining healthy plants. Do not apply with synthetic fungicides.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Raise beds 15–20 cm above ground level for ginger, turmeric and banana. Dig drainage channels between rows. In heavy soils, mix in coarse sand at 25% by volume before planting.',
        frequency: 'Before planting; maintain drainage throughout the season',
        timing: 'Before monsoon season',
        safetyNotes:
          'Never plant ginger, turmeric or banana in poorly drained areas — rhizome rot will be endemic and severe every rainy season.',
      },
      {
        name: 'Neem cake application',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Mix 2 kg neem cake per 10 m² into topsoil before planting. For standing crops, apply 500 g around each plant and incorporate into top soil layer.',
        frequency: 'At planting and once mid-season',
        timing: '2 weeks before transplanting for best effect',
        safetyNotes:
          'Combine with Trichoderma treatment for best suppression of rhizome rot pathogens. Neem cake also provides organic nitrogen.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Banana', 'Turmeric', 'Ginger'],
  },
  {
    id: 'stem_rot',
    name: 'Stem Rot',
    tamilName: 'தண்டு அழுகல்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Water-soaked lesions on stem near soil line. Stem becomes soft, dark and collapses. White mycelium may be visible.',
    damageDescription:
      'Stem collapse leads to plant death. Spreads through contaminated soil. Common in waterlogged conditions.',
    organicPrevention: ['Avoid waterlogging near stem base', 'Mulch to prevent soil splash'],
    organicTreatments: [
      {
        name: 'Trichoderma soil treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride into 5 kg compost. Apply to planting zone. For established plants with stem rot, drench soil around affected stem with 100 g in 10 L water.',
        frequency: 'At planting; repeat at 45-day intervals in affected plots',
        timing: 'Apply when soil is moist after irrigation',
        safetyNotes:
          'Remove affected plant debris before treating soil. Do not apply with synthetic fungicides.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Raise beds or create channels to prevent water pooling around stem bases. Use dry mulch (straw, coco peat) around stem base to prevent soil splash onto stems.',
        frequency: 'Before planting; maintain permanently during wet season',
        timing: 'Before onset of monsoon',
        safetyNotes:
          'Stem rot is triggered almost entirely by waterlogging — addressing drainage and water splash is the primary intervention. No spray treatment is effective without correcting water management.',
      },
      {
        name: 'Copper-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper oxychloride per litre water. Spray on the lower stem and as a soil drench around the stem base as a protective barrier.',
        frequency: 'Every 10–14 days during wet season as a preventive',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper cannot cure established rot but can protect healthy stem tissue adjacent to developing lesions.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Timber trees', 'Vegetables'],
  },
  {
    id: 'damping_off',
    name: 'Damping Off',
    tamilName: 'நாற்று அழுகல்',
    category: 'fungal',
    emoji: '💧',
    identification:
      'Seedlings collapse at soil line. Stem pinches at base and seedling falls over. Seeds may rot before emergence.',
    damageDescription:
      'Kills seedlings before or just after emergence. Can wipe out entire nursery trays. Caused by Pythium/Rhizoctonia fungi.',
    organicPrevention: [
      'Use well-drained sterile potting mix',
      'Avoid overwatering seedlings',
      'Provide good air circulation in nursery',
    ],
    organicTreatments: [
      {
        name: 'Trichoderma seed treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Coat seeds with 10 g Trichoderma viride per kg seeds before sowing. Alternatively, drench nursery trays with 50 g Trichoderma in 10 L water before sowing — repeat at 15 days if symptoms appear.',
        frequency: 'Once at sowing as a preventive; cannot cure established damping off',
        timing: 'At sowing time — Trichoderma is a preventive, not a curative',
        safetyNotes:
          'Do not apply with fungicide-dressed seeds or synthetic fungicides. Trichoderma cannot cure established damping off — it works by colonising soil before the pathogen establishes.',
      },
      {
        name: 'Well-drained soil',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Use a seedling mix of equal parts coco peat, coarse sand and compost. Ensure all trays have adequate drainage holes. Before use, sterilise potting mix by solar pasteurisation — cover moist soil under transparent plastic for 4–6 weeks in summer heat.',
        frequency: 'Permanent practice for all nursery operations',
        timing: 'Set up and sterilise mix before sowing',
        safetyNotes:
          'Solar pasteurisation kills Pythium and Rhizoctonia spores without chemicals. Prepare sterilised mix well in advance of sowing season.',
      },
      {
        name: 'Avoid overwatering',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Water seedling trays only when the top 1 cm feels dry. Use a fine mist nozzle to avoid disturbing soil surface. Avoid wetting seedling stems — water at soil level only.',
        frequency: 'Daily assessment — water when needed, not on a fixed schedule',
        timing: 'Morning only, so foliage dries completely before evening',
        safetyNotes:
          'The most common cause of damping off is overwatering combined with poor air circulation. Ensure continuous airflow around seedling trays — a small fan is very effective in enclosed nurseries.',
      },
      {
        name: 'Cinnamon powder',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Dust a thin, even layer of food-grade cinnamon powder on the soil surface of seedling trays after sowing. Cinnamon contains cinnamaldehyde which has natural antifungal properties.',
        frequency: 'At sowing; reapply lightly after watering washes it away',
        timing: 'At sowing and after each watering event',
        safetyNotes:
          'Use as a supporting treatment alongside Trichoderma — cinnamon alone is insufficient for severe infections. It is a safe, low-cost preventive addition to standard nursery hygiene.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Tomato', 'Chilli', 'Brinjal', 'Papaya'],
  },
  {
    id: 'rust',
    name: 'Rust',
    tamilName: 'துரு நோய்',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Orange-brown powdery pustules on leaf undersides. Upper leaf surface shows yellow spots corresponding to pustules.',
    damageDescription:
      'Reduces photosynthesis, causes premature leaf fall. Weakens plants over multiple seasons. Spores spread by wind.',
    organicPrevention: ['Remove infected leaves promptly', 'Ensure good air circulation'],
    organicTreatments: [
      {
        name: 'Sulfur-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 2–3 g wettable sulfur per litre water. Spray on leaf undersides where orange-brown pustules are visible — thorough coverage is critical.',
        frequency: 'Every 7–10 days for 2–3 applications',
        timing: 'Morning only. NEVER apply above 32°C — severe, irreversible leaf burn.',
        safetyNotes:
          'Do NOT apply within 2 weeks of any oil spray. Do NOT apply above 32°C. Wear gloves and a dust mask — sulfur is a respiratory irritant.',
      },
      {
        name: 'Neem oil',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaf undersides focusing on pustule areas. Disrupts spore germination.',
        frequency: 'Every 5–7 days',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. More effective as a preventive than curative — begin treatment early at first signs of rust.',
      },
      {
        name: 'Remove infected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Remove all leaves showing orange pustules. Place directly into a bag — do not shake leaves as spores will spread. Burn all removed material.',
        frequency: 'Weekly throughout the active rust period',
        timing: 'Any time; do not handle affected plants in wind',
        safetyNotes:
          'Wear gloves — rust spores are a respiratory irritant if inhaled in quantity. Destroy removed leaves by burning — spores survive composting and wintering.',
      },
      {
        name: 'Improve air circulation',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Prune interior branches and thin dense canopy. Remove weeds. Maintain recommended plant spacing. Avoid overhead irrigation.',
        frequency: 'Once or twice per season',
        timing: 'During dry weather for wound healing after pruning',
        safetyNotes:
          'Good air circulation reduces leaf wetness — rust requires moisture on leaf surfaces for spore germination. Structural improvement is more durable than repeated spraying.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Jasmine', 'Beans'],
  },
];
