import type { DiseaseEntry } from '@/types/database.types';

export const BACTERIAL_DISEASES: DiseaseEntry[] = [
  // ── Bacterial ────────────────────────────────────────────────────────────
  {
    id: 'bacterial_wilt',
    name: 'Bacterial Wilt',
    tamilName: 'பாக்டீரிய வாடல்',
    scientificName: 'Ralstonia solanacearum',
    category: 'bacterial',
    emoji: '🦠',
    identification:
      'Sudden wilting of entire plant despite wet soil. Cut stem placed in water shows milky bacterial ooze streaming out.',
    damageDescription:
      'Rapid plant death — no recovery once wilting starts. Soil-borne pathogen persists for years. Devastating to solanaceous crops.',
    organicPrevention: [
      'Crop rotation with non-solanaceous crops',
      'Improve soil drainage',
      'Use resistant varieties where available',
    ],
    organicTreatments: [
      {
        name: 'Trichoderma soil treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride into 10 kg well-composted manure. Apply 2 kg per m² in the planting zone and incorporate into soil 2–3 weeks before transplanting.',
        frequency:
          'At planting; repeat at 45-day intervals as a suppressive treatment for healthy surrounding plants',
        timing: 'Apply 2–3 weeks before transplanting for best soil colonisation',
        safetyNotes:
          'Trichoderma cannot cure established bacterial wilt. Remove and destroy infected plants immediately. Apply Trichoderma to protect healthy plants in adjacent areas.',
      },
      {
        name: 'Pseudomonas fluorescens',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 250 g Pseudomonas fluorescens (Pf1) into 10 kg compost. Apply to root zone at planting. Alternatively, drench root zone with 5 g in 1 L water per plant every 30 days.',
        frequency: 'At planting and every 30 days as a preventive soil treatment',
        timing: 'Apply to moist soil after irrigation',
        safetyNotes:
          'Store product in the refrigerator. Do NOT apply with synthetic bactericides. Pseudomonas works by colonising roots and producing antibiotics that suppress Ralstonia.',
      },
      {
        name: 'Crop rotation',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Do not plant tomato, brinjal or chilli in the same bed for a minimum of 3 years after bacterial wilt has occurred. Use non-solanaceous crops (corn, banana, leafy vegetables) in the rotation. Soil solarisation (covering moist soil with transparent plastic for 6 weeks in summer) before replanting reduces soil pathogen levels.',
        frequency: 'Mandatory 3-year rotation after bacterial wilt outbreak',
        timing: 'Implement immediately after removing the infected crop',
        safetyNotes:
          'Ralstonia solanacearum survives in soil for many years — rotation is the most important long-term management tool. Solarisation significantly reduces inoculum levels.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Raise beds 20–25 cm for tomato and solanaceous crops. Create channels to divert waterflow away from roots. Incorporate sand and organic matter into clay soils before planting.',
        frequency: 'Before every planting season',
        timing: '2–3 weeks before transplanting',
        safetyNotes:
          'Bacterial wilt thrives in warm, waterlogged soil — drainage is the most critical structural prevention. Waterlogged roots create entry points for the pathogen.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Tomato', 'Brinjal', 'Chilli'],
  },
  {
    id: 'bacterial_blight',
    name: 'Bacterial Blight',
    tamilName: 'பாக்டீரிய கருகல்',
    category: 'bacterial',
    emoji: '🦠',
    identification:
      'Water-soaked lesions on leaves that turn brown. Angular spots limited by veins. Gummy exudates in humid conditions.',
    damageDescription:
      'Severe defoliation and stem cankers. Reduces yield significantly. Spreads by wind-driven rain and contaminated tools.',
    organicPrevention: [
      'Use certified disease-free seed/planting material',
      'Avoid working in wet fields',
    ],
    organicTreatments: [
      {
        name: 'Copper-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper hydroxide or copper oxychloride per litre water. Spray on all plant surfaces including stems and leaf undersides at first sign of angular water-soaked spots.',
        frequency: 'Every 7–10 days during wet season; preventively before expected rain',
        timing:
          'Morning or evening. Do not spray in wind-driven rain — this actively spreads the bacteria.',
        safetyNotes:
          'Pre-harvest interval: 7 days. Do not work in the field when foliage is wet — contaminated hands and tools spread bacteria rapidly between plants. Disinfect tools between plants.',
      },
      {
        name: 'Resistant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Select and plant tapioca/cassava varieties known to have resistance to bacterial blight. Obtain certified planting material from government agriculture farms or research stations.',
        frequency: 'One-time planting decision',
        timing: 'Before planting season',
        safetyNotes:
          'Variety resistance is the most durable and sustainable long-term management strategy for bacterial blight in tapioca.',
      },
      {
        name: 'Crop rotation',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'After a bacterial blight outbreak, do not replant tapioca in the same field for at least 1 full season. Use legume crops (groundnut, cowpea) to improve soil and break the disease cycle.',
        frequency: 'Minimum 1-season break from tapioca after outbreak',
        timing: 'Implement after harvest of infected crop',
        safetyNotes:
          'Use only disease-free stakes from verified healthy plants for subsequent planting — infected stakes transmit bacterial blight to 100% of new plants.',
      },
      {
        name: 'Remove infected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Cut out stems and branches showing angular water-soaked lesions. Destroy by burning. Disinfect tools between every cut with dilute bleach solution.',
        frequency: 'Weekly during monsoon season when disease is most active',
        timing: 'During dry weather — avoid working with infected plants in rain',
        safetyNotes:
          'Movement through wet foliage spreads bacterial blight dramatically. Avoid working in the field after rain or when foliage is wet.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Tapioca'],
  },
  {
    id: 'wilt',
    name: 'Wilt',
    tamilName: 'வாடல் நோய்',
    category: 'bacterial',
    emoji: '🥀',
    identification:
      'Progressive wilting of plant despite adequate irrigation. Leaves lose turgidity, droop and dry. Vascular browning on cut stem.',
    damageDescription:
      'Plant death from blocked vascular system. Soil pathogen that persists between seasons. Can affect multiple plant families.',
    organicPrevention: [
      'Use resistant varieties',
      'Ensure good drainage',
      'Treat soil with Trichoderma before planting',
    ],
    organicTreatments: [
      {
        name: 'Trichoderma soil treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride into 10 kg compost. Apply 2 kg per m² and incorporate before planting. For established plants, drench root zone with 100 g in 10 L water.',
        frequency: 'At planting; every 45 days as a preventive for surrounding healthy plants',
        timing: '2–3 weeks before transplanting; apply to moist soil',
        safetyNotes:
          'Trichoderma is a preventive, not a cure. Remove and burn affected plants (including roots) immediately — root debris in soil is the primary source of future infections.',
      },
      {
        name: 'Pseudomonas fluorescens',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 250 g Pseudomonas fluorescens into 10 kg compost. Apply at planting. Alternatively, drench root zone with 5 g per litre water per plant.',
        frequency: 'At planting and every 30 days',
        timing: 'Apply to moist soil after irrigation',
        safetyNotes:
          'Refrigerate product until use. Do NOT combine with synthetic bactericides or fungicides.',
      },
      {
        name: 'Crop rotation',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Do not replant guava or jasmine in the same location for 2–3 years after wilt. Soil solarisation with transparent plastic for 6 weeks in summer reduces Fusarium inoculum significantly.',
        frequency: 'Mandatory 2–3 year gap after wilt outbreak',
        timing: 'Immediately after removing infected plant',
        safetyNotes:
          'Remove and burn all affected plants including roots — leaving infected roots in soil contaminates the site for years.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Raise planting beds and create channels to divert water away from root zones. Incorporate sand and compost into clay soils before planting.',
        frequency: 'Before every planting',
        timing: 'Before planting season',
        safetyNotes:
          'Waterlogged roots are highly susceptible to wilt pathogens — drainage improvement is the structural foundation of all management.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Guava', 'Jasmine'],
  },
  {
    id: 'citrus_canker',
    name: 'Citrus Canker',
    tamilName: 'எலுமிச்சை புண்',
    scientificName: 'Xanthomonas citri',
    category: 'bacterial',
    emoji: '🦠',
    identification:
      'Raised corky lesions on leaves, stems and fruit with oily margin. Crater-like appearance. Yellow halo around lesions.',
    damageDescription:
      'Defoliation, fruit drop, fruit blemish reducing market value. Spreads by wind-driven rain. Very contagious.',
    organicPrevention: [
      'Windbreaks to reduce rain splash spread',
      'Disinfect pruning tools between trees',
    ],
    organicTreatments: [
      {
        name: 'Copper-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–4 g copper oxychloride or copper hydroxide per litre water. Spray all plant surfaces — leaves, stems and fruit — at monthly intervals and additionally after each new flush emergence.',
        frequency: 'Monthly; additionally after each new flush emergence and after rain',
        timing: 'Morning or evening. Do not spray in wind — bacteria spread via rain splash.',
        safetyNotes:
          'Pre-harvest interval: 7 days. Very contagious — disinfect hands and tools between every tree. Copper sprays reduce new infections but cannot cure existing corky lesions.',
      },
      {
        name: 'Remove and burn infected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Prune all leaves, shoots and fruit showing raised corky lesions. Cut 10 cm beyond the last visible lesion into healthy tissue. Burn all removed material immediately.',
        frequency:
          'Whenever lesions are detected; additional thorough pruning after monsoon season',
        timing: 'During dry weather only',
        safetyNotes:
          'CRITICAL: Disinfect tools with 1% sodium hypochlorite (bleach) between every single cut and between every tree — Citrus Canker is extremely contagious. Do not allow removed material to contact healthy plants.',
      },
      {
        name: 'Avoid rain splash',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Plant tall windbreak rows (banana, drumstick, casuarina) around the citrus block to block wind-driven rain. Use only drip irrigation — no overhead watering. Avoid all orchard operations during and immediately after rain.',
        frequency: 'Permanent orchard management — establish windbreaks before first monsoon',
        timing: 'Establish windbreaks in the season before orchard establishment',
        safetyNotes:
          'Wind-driven rain is the primary vector for citrus canker spread between trees and between orchards. Windbreak protection significantly reduces spread in endemic areas.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high' },
    plantsAffected: ['Lemon', 'Lime', 'Orange'],
  },
  {
    id: 'panama_wilt',
    name: 'Panama Wilt',
    tamilName: 'பனாமா வாடல்',
    scientificName: 'Fusarium oxysporum f.sp. cubense',
    category: 'fungal',
    emoji: '🥀',
    identification:
      'Yellowing of older leaves starting from margins. Leaves break at petiole. Pseudostem splitting. Brown vascular discolouration.',
    damageDescription:
      'Soil-borne — persists for decades. Kills plants before harvest. No cure once infected. Plant resistant varieties only.',
    organicPrevention: [
      'Use resistant banana varieties (Poovan, Karpuravalli)',
      'Avoid planting in previously infected soil',
    ],
    organicTreatments: [
      {
        name: 'Use resistant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Plant only Panama wilt-resistant banana varieties: Poovan (Rasthali), Karpuravalli, Nendran or Red Banana. Avoid susceptible varieties (Robusta, Cavendish) in all fields with any Panama wilt history.',
        frequency: 'One-time variety selection decision at planting',
        timing: 'Before planting season',
        safetyNotes:
          'There is NO effective cure for Panama wilt. Variety selection is the ONLY reliable management strategy. Fusarium oxysporum f.sp. cubense persists in soil for 30+ years.',
      },
      {
        name: 'Trichoderma soil treatment',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 250 g Trichoderma viride per planting hole into compost. Apply 500 ml/10 L Trichoderma drench per plant every 45 days to suppress soil Fusarium levels around healthy plants.',
        frequency: 'At planting and every 45 days',
        timing: 'Apply to moist soil after irrigation',
        safetyNotes:
          'Trichoderma can suppress Fusarium levels in soil but cannot cure infected plants. Remove and burn infected plants including the entire rhizome immediately — infected rhizomes contaminate surrounding soil.',
      },
      {
        name: 'Avoid infected fields',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'If a field has confirmed Panama wilt history, avoid planting susceptible banana varieties there indefinitely. Grow sugarcane, tapioca or vegetables instead. Never transport soil, tools or plant material from infected fields to clean ones.',
        frequency:
          'Permanent restriction on susceptible banana cultivation in confirmed infected fields',
        timing: 'Permanent management decision',
        safetyNotes:
          'Fusarium survives in soil for decades. Soil contamination spreads on boots, tools and vehicles — clean and disinfect all equipment leaving infected areas.',
      },
    ],
    seasonalRisk: { summer: 'moderate', sw_monsoon: 'moderate' },
    plantsAffected: ['Banana'],
  },
  {
    id: 'thanjavur_wilt',
    name: 'Thanjavur Wilt',
    tamilName: 'தஞ்சாவூர் வாடல்',
    scientificName: 'Ganoderma lucidum',
    category: 'fungal',
    emoji: '🥀',
    identification:
      'Yellowing and drooping of outer fronds. Brown exudation from trunk base. Bracket fungus may appear on trunk.',
    damageDescription:
      'Slow decline and death of coconut palm over 1–3 years. Root and basal trunk rot. Major problem in TN coconut belt.',
    organicPrevention: [
      'Maintain basin hygiene — remove debris',
      'Avoid waterlogging at palm base',
    ],
    organicTreatments: [
      {
        name: 'Neem cake + Trichoderma in basin',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 2 kg neem cake + 100 g Trichoderma viride into 5 kg compost. Apply this mixture in a ring at the drip zone of the palm basin. Incorporate into topsoil and water thoroughly.',
        frequency: 'Twice per year — before SW Monsoon (May) and before NE Monsoon (September)',
        timing: 'Apply when soil is moist for best Trichoderma colonisation',
        safetyNotes:
          'This treatment is suppressive, not curative. Apply to all palms near infected trees as a preventive measure. Remove and destroy any Ganoderma bracket fungus (conk) visible on the trunk.',
      },
      {
        name: 'Avoid water stagnation',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Clear drainage channels around palm basins regularly. Create raised bunding to direct water away from the trunk base. Ensure no water ponds within 1 metre of the trunk after rain.',
        frequency: 'Before every monsoon; maintain drainage throughout wet season',
        timing: 'Pre-monsoon preparation (May)',
        safetyNotes:
          'Waterlogging at the palm base greatly accelerates Ganoderma infection and spread — keeping the trunk base dry is the single most important prevention. Check and clear channels after every heavy rain.',
      },
      {
        name: 'Auger and treat with fungicide',
        method: 'manual',
        effort: 'advanced',
        howToApply:
          'Drill 4–5 holes (2.5 cm diameter, 30 cm deep) at a 45° angle into the trunk base. Fill each hole with Trichoderma paste (100 g Trichoderma in 100 ml water) or copper oxychloride paste. Seal holes with cork or clay.',
        frequency: 'Once per year on affected palms; repeat if decline continues',
        timing: 'During dry weather (February–May)',
        safetyNotes:
          'This is an advanced treatment requiring care. Effective only at early-to-moderate Thanjavur Wilt stages — severely affected palms do not respond. Mark treated palms and monitor monthly.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'root_wilt',
    name: 'Root Wilt',
    tamilName: 'வேர் வாடல்',
    category: 'phytoplasma',
    emoji: '🥀',
    identification:
      'Yellowing (ribbing) of leaflets. Flaccidity of fronds. Reduced crown size. Gradual decline in nut production.',
    damageDescription:
      'Chronic decline disease of coconut. Reduces yield progressively over years. Caused by phytoplasma transmitted by plant hoppers.',
    organicPrevention: [
      'Control plant hopper vectors',
      'Maintain palm nutrition (especially potash)',
    ],
    organicTreatments: [
      {
        name: 'Trichoderma + Pseudomonas soil drench',
        method: 'soil',
        effort: 'moderate',
        howToApply:
          'Mix 100 g Trichoderma viride + 100 g Pseudomonas fluorescens into 5 kg compost. Apply to root zone or drench with 200 g of the mixture dissolved in 20 L water per palm.',
        frequency: 'Twice per year — before SW Monsoon (May) and before NE Monsoon (September)',
        timing: 'Apply to moist soil after irrigation',
        safetyNotes:
          'Root Wilt is caused by phytoplasma transmitted by plant hoppers — these soil treatments strengthen root health and tolerance but cannot eliminate the phytoplasma. Controlling the plant hopper vector is essential to slow spread.',
      },
      {
        name: 'Neem cake application',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Apply 2–3 kg neem cake per palm in the root zone drip circle. Incorporate into topsoil and water thoroughly.',
        frequency: 'Once per year before monsoon',
        timing: 'Pre-monsoon (May)',
        safetyNotes:
          'Neem cake improves soil biology and supplies organic nitrogen, boosting palm health and tolerance to root wilt symptoms. Also suppresses some soil-borne pests.',
      },
      {
        name: 'Maintain basin hygiene',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Remove all fallen fronds, coconut husks and organic debris from the palm basin. Keep a clean 2-m radius around each palm free of weeds and debris.',
        frequency: 'Monthly; increase frequency during monsoon season',
        timing: 'Any time',
        safetyNotes:
          'Organic debris in the basin harbours plant hoppers — the phytoplasma vector for Root Wilt. Keeping basins clean and weed-free directly reduces the vector population near each palm.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },

];
