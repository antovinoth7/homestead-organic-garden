import type { PestEntry } from '@/types/database.types';

export const MITE_PESTS: PestEntry[] = [
  // ── Mites ────────────────────────────────────────────────────────────────
  {
    id: 'mites',
    name: 'Mites',
    tamilName: 'சிறு பூச்சி',
    category: 'mites',
    emoji: '🕷️',
    identification:
      'Microscopic arthropods (<1 mm). Cause fine webbing on leaf undersides. Barely visible without magnification.',
    damageDescription:
      'Stippling and bronzing of leaves, fine webbing, leaf drop in severe cases. Thrive in hot dry conditions.',
    organicPrevention: [
      'Maintain humidity around plants',
      'Spray water on leaf undersides regularly',
    ],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Focus spray on leaf undersides where mites colonise. Ensure complete coverage of all webbing.',
        frequency: 'Every 5 days for 3 applications',
        timing: 'Morning or evening; avoid hot afternoon application above 30°C',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Resistance can develop — rotate with sulfur spray after 3 applications.',
      },
      {
        name: 'Sulfur-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dilute wettable sulfur powder at 2–3 g per litre of water. Spray leaf undersides thoroughly, ensuring all mite colonies are covered.',
        frequency: 'Every 7 days; maximum 3 consecutive applications',
        timing:
          'Morning only. NEVER apply above 35°C — severe and irreversible leaf burn will result.',
        safetyNotes:
          'Do NOT apply within 2 weeks of any oil-based spray — sulfur combined with oil causes phytotoxicity. Wear gloves and mask as sulfur is an irritant.',
      },
      {
        name: 'Predatory mite release',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Order Phytoseiid predatory mites (e.g. Neoseiulus californicus) from biocontrol suppliers. Release 50–100 per plant directly onto infested leaves.',
        frequency: 'Single release; check effectiveness after 2 weeks',
        timing: 'Cooler part of day when humidity is above 60%',
        safetyNotes:
          'No sulfur or acaricide use for 3 weeks before or after release. High temperatures above 35°C reduce predatory mite survival significantly.',
      },
      {
        name: 'Strong water jet',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Use a garden hose with a strong nozzle to blast water forcefully on leaf undersides, dislodging mites and their webbing.',
        frequency: 'Daily for 1 week to disrupt the mite lifecycle',
        timing: 'Morning to allow foliage to dry before evening',
        safetyNotes:
          'Effective as a knockdown treatment — follow up with neem oil. Avoid on young seedlings as strong water pressure can damage tender growth.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Chilli', 'Brinjal', 'Ladies Finger', 'Papaya', 'Jasmine'],
  },
  {
    id: 'red_spider_mite',
    name: 'Red Spider Mite',
    tamilName: 'சிவப்பு சிலந்தி',
    category: 'mites',
    emoji: '🕷️',
    identification:
      'Tiny reddish mites visible as moving dots under magnification. Dense webbing on leaf undersides.',
    damageDescription:
      'Severe stippling, bronzing and drying of leaves. Can defoliate plants in hot weather. Causes fruit scarring.',
    organicPrevention: [
      'Overhead irrigation to increase humidity',
      'Avoid dusty conditions near plants',
    ],
    organicTreatments: [
      {
        name: 'Wettable sulfur spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 3 g wettable sulfur per litre water. Spray thoroughly on both leaf surfaces, especially undersides where colonies are densest.',
        frequency: 'Every 7–10 days for 2–3 applications',
        timing: 'Morning only. NEVER spray above 32°C — risk of severe, irreversible leaf burn.',
        safetyNotes:
          'CRITICAL: Do NOT apply within 2 weeks of any oil spray. Do NOT apply above 32°C. Wear gloves, mask and eye protection — sulfur is a respiratory and skin irritant.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Spray all leaf surfaces with particular focus on undersides. Ensure webbing is penetrated.',
        frequency: 'Every 5 days for 3 applications',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Rotate with sulfur spray to prevent resistance. Do not apply both simultaneously.',
      },
      {
        name: 'Predatory mite release',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Release Phytoseiulus persimilis or Neoseiulus californicus at 50–100 per plant on infested leaves, following supplier instructions.',
        frequency: 'Single release; reassess after 2 weeks',
        timing: 'Cooler part of day, humidity above 60%',
        safetyNotes:
          'No sulfur or acaricide applications for 3 weeks before or after release. High heat (>35°C) kills predatory mites.',
      },
      {
        name: 'Increase humidity',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Mist foliage with water twice daily. Overhead irrigation or placing potted plants on trays with water also helps raise local humidity.',
        frequency: 'Twice daily in dry or hot weather',
        timing: 'Morning and late afternoon',
        safetyNotes:
          'Red spider mites thrive in dry conditions — humidity above 60% suppresses populations significantly. Ensure good air circulation to prevent fungal disease alongside misting.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Tapioca', 'Brinjal', 'Tomato'],
  },
  {
    id: 'eriophyid_mite',
    name: 'Eriophyid Mite',
    tamilName: 'எரியோபிட் சிறு பூச்சி',
    category: 'mites',
    emoji: '🕷️',
    identification:
      'Microscopic elongated mites found on coconut perianth. Invisible to the naked eye. Diagnosed by nut scarring.',
    damageDescription:
      'Scarring and browning of coconut husk, reduced copra quality, button shedding. Causes coconut eriophyid mite disease.',
    organicPrevention: [
      'Maintain palm nutrition (especially boron)',
      'Remove and destroy heavily infested nuts',
    ],
    organicTreatments: [
      {
        name: 'Neem oil + garlic spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 5 ml neem oil + 5 garlic cloves (finely ground) + 1 ml liquid soap per litre water. Filter well through fine cloth. Spray on developing nuts and crown area.',
        frequency: 'Monthly during dry season (March–May)',
        timing: 'Morning or evening',
        safetyNotes:
          'Coconut mites are located deep in the perianth area — use a knapsack sprayer with a long lance for better crown penetration. Wear protective clothing.',
      },
      {
        name: 'Wettable sulfur',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 3 g wettable sulfur per litre water. Spray on developing nut bunches focusing on perianth (base of nut).',
        frequency: 'Every 15–20 days during dry summer months',
        timing: 'Morning only. Do not spray above 32°C.',
        safetyNotes:
          'Do not apply within 2 weeks of oil sprays. Wear gloves and mask. Sulfur is most effective when temperature is between 20–28°C.',
      },
      {
        name: 'Azadirachtin spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Use certified Azadirachtin 0.03% EC. Dilute as per label (typically 5 ml/L). Spray on developing nuts covering the perianth area thoroughly.',
        frequency: 'Every 15–20 days during summer',
        timing: 'Evening for best efficacy — Azadirachtin degrades rapidly in UV light',
        safetyNotes:
          'Pre-harvest interval: 3 days. Store in a cool, dark place. Apply in evening to maximise effectiveness.',
      },
      {
        name: 'Root feeding neem cake',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Mix 2–3 kg neem cake per tree. Apply in a ring at the drip zone, incorporate into topsoil with a fork, then water thoroughly.',
        frequency: 'Once per season, applied before the onset of monsoon',
        timing: 'Pre-monsoon (May) for best root absorption with subsequent rains',
        safetyNotes:
          'Neem cake also improves soil nitrogen. Apply away from the stem base to prevent rot. Doubles as organic fertiliser.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'coconut_mite',
    name: 'Coconut Mite',
    tamilName: 'தென்னை சிறு பூச்சி',
    category: 'mites',
    emoji: '🕷️',
    identification:
      'Related to eriophyid mite. Feeds beneath the perianth of developing nuts. Diagnosed by brown scarring on nuts.',
    damageDescription:
      'Feeding causes brown necrotic patches on husk, stunted nuts, premature nut fall. Reduces copra yield.',
    organicPrevention: ['Regular crown cleaning', 'Adequate nutrition and irrigation'],
    organicTreatments: [
      {
        name: 'Wettable sulfur spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dissolve 3 g wettable sulfur per litre water. Spray on developing nut bunches targeting the perianth (base of each nut).',
        frequency: 'Every 15 days during nut development in dry months',
        timing: 'Morning only. Never apply above 32°C.',
        safetyNotes:
          'Do NOT apply within 2 weeks of any oil-based spray. Wear gloves and a dust mask during preparation and spraying.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray on nut bunches, particularly at the perianth (base of nut) where mites shelter.',
        frequency: 'Every 15 days during nut development',
        timing: 'Morning or evening',
        safetyNotes:
          'Use a high-pressure sprayer with long lance for adequate crown coverage. Wear protective clothing.',
      },
      {
        name: 'Azadirachtin 1%',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dilute Azadirachtin 1% EC at 1–2 ml per litre water. Spray thoroughly on nut bunches targeting the perianth area of each developing nut.',
        frequency: 'Every 21 days during nut development',
        timing:
          'Evening — Azadirachtin degrades in UV light, evening application improves persistence',
        safetyNotes:
          'Pre-harvest interval: 3 days. Avoid spraying in rain. Store product in cool, dark place.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },

];
