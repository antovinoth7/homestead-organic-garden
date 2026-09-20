import type { PestEntry } from '@/types/database.types';

export const SAP_SUCKING_PESTS: PestEntry[] = [
  // ── Sap-Sucking ──────────────────────────────────────────────────────────
  {
    id: 'aphids',
    name: 'Aphids',
    tamilName: 'அசுவினி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Tiny soft-bodied insects (1–3 mm), green/black/yellow. Cluster on tender shoots, underside of leaves, and flower buds. Secrete sticky honeydew.',
    damageDescription:
      'Suck plant sap causing leaf curling, stunted growth, and yellowing. Honeydew promotes sooty mold. Can transmit viral diseases.',
    organicPrevention: [
      'Encourage natural predators (ladybirds, lacewings)',
      'Avoid excessive nitrogen fertilisation',
      'Interplant with repellent herbs (basil, coriander)',
    ],
    organicTreatments: [
      {
        name: 'Neem oil spray (2–3 ml/L)',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2–3 ml cold-pressed neem oil with 1 L water and a few drops of liquid soap as emulsifier. Shake well. Spray thoroughly on leaf undersides and growing tips.',
        frequency: 'Every 5–7 days until infestation clears',
        timing: 'Dusk or early morning to avoid leaf burn and protect pollinators',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Avoid spraying open flowers to protect pollinators.',
      },
      {
        name: 'Soapnut water spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 10–12 soapnut (reetha) shells in 1 L warm water overnight. Strain and dilute 1:3 with water before spraying on affected areas.',
        frequency: 'Every 3–5 days',
        timing: 'Early morning or evening',
        safetyNotes:
          'Test on a few leaves first — can cause phytotoxicity on sensitive plants at high concentration.',
      },
      {
        name: 'Garlic-chili spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Blend 10 garlic cloves and 5 dried chilies in 1 L water. Strain through fine cloth. Dilute 1:10 with water before spraying.',
        frequency: 'Every 5–7 days',
        timing: 'Evening — UV breaks down active compounds quickly in direct sun',
        safetyNotes:
          'Wear gloves and avoid touching eyes. Strain thoroughly to prevent nozzle blockage.',
      },
      {
        name: 'Lady beetle release',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Release purchased Coccinella septempunctata beetles at dusk near aphid colonies — 10–20 beetles per plant. Mist plants lightly before release.',
        frequency: 'Single release; repeat if population resurges',
        timing: 'Dusk to prevent beetles flying away',
        safetyNotes:
          'Avoid pesticide sprays for 2 weeks before and after release to protect the biocontrol agents.',
      },
    ],
    seasonalRisk: {
      summer: 'high',
      sw_monsoon: 'moderate',
      ne_monsoon: 'moderate',
      cool_dry: 'low',
    },
    plantsAffected: [
      'Chilli',
      'Brinjal',
      'Ladies Finger',
      'Papaya',
      'Banana',
      'Jasmine',
      'Drumstick',
    ],
  },
  {
    id: 'whiteflies',
    name: 'Whiteflies',
    tamilName: 'வெள்ளை ஈ',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Tiny white moth-like insects (1–2 mm) that fly up in clouds when disturbed. Found on leaf undersides.',
    damageDescription:
      'Suck sap causing yellowing, leaf drop. Excrete honeydew leading to sooty mold. Vector for viral diseases (leaf curl, mosaic).',
    organicPrevention: [
      'Yellow sticky traps as early warning',
      'Avoid monoculture — diversify plantings',
      'Remove and destroy severely infested leaves',
    ],
    organicTreatments: [
      {
        name: 'Yellow sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Hang yellow sticky cards at plant canopy height, 1 trap per 2 m². Replace when fully covered with insects.',
        frequency: 'Check weekly; replace every 2–4 weeks',
        timing: 'Install at first sign of infestation or as a preventive measure',
        safetyNotes:
          'Keep out of reach of children. Avoid placing directly next to flowering plants to reduce accidental trapping of beneficial insects.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre of water. Spray leaf undersides where whiteflies congregate. Ensure complete coverage.',
        frequency: 'Every 5–7 days for 3 consecutive applications',
        timing: 'Dusk or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Avoid spraying during open bloom to protect pollinators.',
      },
      {
        name: 'Soapnut solution',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3 with water. Spray directly onto whitefly colonies on leaf undersides.',
        frequency: 'Every 3–5 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Test on a small leaf area first — can cause phytotoxicity on sensitive plants at high concentration.',
      },
      {
        name: 'Garlic extract spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Blend 10 garlic cloves in 500 ml water, strain well. Dilute 1:10 with water before use. Spray on leaf undersides.',
        frequency: 'Every 5–7 days',
        timing: 'Evening',
        safetyNotes:
          'Strong odour — avoid contact with eyes. Wash hands thoroughly after handling.',
      },
    ],
    seasonalRisk: {
      summer: 'high',
      sw_monsoon: 'moderate',
      ne_monsoon: 'moderate',
      cool_dry: 'low',
    },
    plantsAffected: ['Tomato', 'Chilli', 'Brinjal', 'Ladies Finger', 'Papaya', 'Tapioca'],
  },
  {
    id: 'spiralling_whitefly',
    name: 'Spiralling Whitefly',
    tamilName: 'சுருள் வெள்ளை ஈ',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Larger than common whitefly. Lays eggs in spiral patterns on leaf undersides. White waxy coating on leaves.',
    damageDescription:
      'Heavy sap loss, copious honeydew, dense sooty mold reducing photosynthesis. Affects many fruit and ornamental trees.',
    organicPrevention: [
      'Monitor undersides of leaves regularly',
      'Encourage Encarsia parasitoid naturally',
    ],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil + 1 ml liquid soap per litre. Spray both leaf surfaces thoroughly, paying attention to spiral egg masses on undersides.',
        frequency: 'Every 7 days for 3–4 applications',
        timing: 'Dusk or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Repeat after rain as neem degrades rapidly in water.',
      },
      {
        name: 'Release Encarsia parasitoid',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Obtain Encarsia formosa cards from biocontrol suppliers. Hang 1 card per 10 plants in a shaded area near the infestation, following supplier instructions.',
        frequency: 'Two releases 1–2 weeks apart',
        timing: 'During warm weather above 20°C when whitefly populations are building',
        safetyNotes:
          'Do not use any pesticides for 3 weeks around the release period. Keep cards out of direct sunlight.',
      },
      {
        name: 'Yellow sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Hang yellow sticky cards at canopy height, 1 per 2–3 m². Replace when covered.',
        frequency: 'Check weekly; replace every 2–4 weeks',
        timing: 'Install as a preventive before heavy infestation builds',
        safetyNotes:
          'Primarily for monitoring population levels. Avoid placing near flowering plants.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Tapioca', 'Guava', 'Coconut'],
  },
  {
    id: 'mealybugs',
    name: 'Mealybugs',
    tamilName: 'மாவுப்பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Soft oval insects (2–5 mm) covered with white waxy coating. Cluster at nodes, leaf axils, and fruit bases.',
    damageDescription:
      'Suck sap causing wilting, yellowing, and honeydew/sooty mold. Heavy infestations can kill young plants.',
    organicPrevention: [
      'Inspect new plants before introducing to garden',
      'Maintain plant health to resist infestations',
      'Encourage natural enemies (Cryptolaemus beetle)',
    ],
    organicTreatments: [
      {
        name: 'Neem oil + soap spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 2 ml liquid soap per litre water. Spray directly on mealybug colonies, especially in leaf axils and nodes. Use a brush to dislodge dense clusters first.',
        frequency: 'Every 5–7 days for 4–5 applications',
        timing: 'Morning or evening',
        safetyNotes:
          'Mealybugs hide in crevices — be thorough. Waxy coating resists sprays, so multiple applications are essential.',
      },
      {
        name: 'Isopropyl alcohol swab',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dab a cotton swab in 70% isopropyl alcohol. Touch each mealybug cluster directly to dissolve the wax and kill on contact. Best for small, accessible infestations.',
        frequency: 'As needed when visible colonies appear',
        timing: 'Any time',
        safetyNotes:
          'Test on a small area first — some plants are sensitive to alcohol. Do not spray alcohol directly on edible parts close to harvest.',
      },
      {
        name: 'Release lacewings',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Release green lacewing (Chrysoperla carnea) eggs or early-stage larvae near mealybug colonies — 5–10 per infested plant, placed at dusk.',
        frequency: 'Single release; repeat after 3 weeks if population remains high',
        timing: 'Dusk, in temperatures between 20–30°C',
        safetyNotes:
          'Avoid all pesticide applications 2 weeks before and after release to protect lacewing larvae.',
      },
      {
        name: 'Diatomaceous earth',
        method: 'soil',
        effort: 'easy',
        howToApply:
          "Dust food-grade diatomaceous earth (DE) lightly around the base of affected plants and along stems. Creates a physical barrier that damages the insects' waxy coating.",
        frequency: 'Reapply after each rain event or every 1–2 weeks in dry weather',
        timing: 'Any time; most effective in dry conditions',
        safetyNotes:
          'Wear a dust mask when applying — DE is a lung irritant. Use food-grade DE only. Avoid applying directly to open flowers.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Guava', 'Papaya', 'Mango', 'Tapioca'],
  },
  {
    id: 'coconut_mealybug',
    name: 'Coconut Mealybug',
    tamilName: 'தென்னை மாவுப்பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'White waxy masses on coconut fronds, especially at the base of leaflets and on the crown.',
    damageDescription:
      'Yellowing of fronds, reduced nut yield, sooty mold on leaves. Spreading rapidly in Tamil Nadu.',
    organicPrevention: ['Maintain clean crowns', 'Monitor regularly for early detection'],
    organicTreatments: [
      {
        name: 'Release Cryptolaemus beetle',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Source Cryptolaemus montrouzieri beetles from biocontrol laboratories. Release 10–15 adults per tree near mealybug colonies in the crown.',
        frequency: 'One release; monitor over 4–6 weeks for population reduction',
        timing: 'Release in evening during warm weather (25–32°C)',
        safetyNotes:
          'No pesticide application 3 weeks before or after release. Larvae of Cryptolaemus resemble mealybugs — learn to distinguish before culling.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil per litre water with 1 ml liquid soap. Spray on frond bases and crown area where mealybugs congregate. Use a knapsack sprayer with a long lance for better reach.',
        frequency: 'Every 7–10 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Wear protective clothing when spraying coconut crowns. Work systematically from the base of the palm upward.',
      },
      {
        name: 'Soapnut solution',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3. Spray directly onto mealybug colonies on fronds.',
        frequency: 'Every 5–7 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Test on a small frond section first. For severe infestations, combine with neem oil.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'papaya_mealybug',
    name: 'Papaya Mealybug',
    tamilName: 'பப்பாளி மாவுப்பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Dense white waxy clusters on leaves, stems and fruit of papaya. Also attacks mulberry and tapioca.',
    damageDescription:
      'Curling and distortion of leaves, stunted growth, fruit drop. Can devastate entire papaya orchards.',
    organicPrevention: ['Quarantine new plants', 'Encourage Acerophagus papayae parasitoid'],
    organicTreatments: [
      {
        name: 'Release Acerophagus papayae',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Obtain Acerophagus papayae parasitoid wasp cards from biocontrol laboratories. Release 50–100 adults per heavily infested tree near mealybug colonies.',
        frequency: 'Two releases 2 weeks apart per season',
        timing: 'Morning, when temperature is 25–32°C',
        safetyNotes:
          'Avoid all pesticides for 4 weeks before and after release. Mark treated trees to avoid accidental spraying.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 2 ml liquid soap per litre water. Spray directly on colonies at leaf axils, stems and fruit surfaces. Use a brush to dislodge dense clusters before spraying.',
        frequency: 'Every 5–7 days for 4–5 applications',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Waxy mealybug coating reduces penetration — thorough application is critical.',
      },
      {
        name: 'Soapnut spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 10 soapnut shells in 1 L warm water overnight. Strain. Dilute 1:3. Spray directly on mealybug clusters.',
        frequency: 'Every 5–7 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Test on a small leaf area first. Combine with neem oil spray for better efficacy.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Papaya'],
  },
  {
    id: 'scale_insects',
    name: 'Scale Insects',
    tamilName: 'செதில் பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Small (1–5 mm) flat or domed insects with hard shell-like covering. Attach to stems, branches and leaves.',
    damageDescription:
      'Suck sap causing yellowing, dieback of branches. Honeydew and sooty mold. Hard to detect early.',
    organicPrevention: [
      'Regular inspection of woody stems',
      'Prune and destroy heavily infested branches',
    ],
    organicTreatments: [
      {
        name: 'Neem oil + soap spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 5 ml neem oil + 2 ml liquid soap per litre water. Apply directly to scale-covered stems using a brush or fine-mist sprayer. Work solution under scales for penetration.',
        frequency: 'Every 7 days for 3–4 weeks',
        timing: 'Morning or evening',
        safetyNotes:
          'Scales have a hard protective coating — coverage and repetition are key. Dormant-season application (cool dry) is most effective.',
      },
      {
        name: 'Manual removal with brush',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Dip an old toothbrush or stiff-bristle brush in soapy water. Scrub scale insects firmly off stems and branches, working in one direction.',
        frequency: 'Weekly until controlled',
        timing: 'Any time; follow up immediately with a neem oil spray',
        safetyNotes:
          'Dispose of removed scales away from the garden — do not compost. Wear gloves.',
      },
      {
        name: 'Horticultural oil',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dilute certified horticultural oil at 1–2% in water (follow product label). Spray thoroughly on all infested bark and stem surfaces — works by smothering the scales.',
        frequency: 'Once during dormant season; repeat after 3 weeks if needed',
        timing:
          'Apply in the cooler part of the day. Do NOT apply above 30°C — risk of severe leaf burn.',
        safetyNotes:
          'Never apply to drought-stressed plants. Pre-harvest interval: 24 hours. Can affect beneficial insects when wet.',
      },
      {
        name: 'Release parasitic wasps',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Obtain Metaphycus or Aphytis parasitoid wasps from biocontrol suppliers. Release near scale colonies following supplier instructions on quantity and placement.',
        frequency: 'Single release per season is typically sufficient',
        timing: 'When scale populations are building (summer or early monsoon)',
        safetyNotes:
          'No pesticide use for 4 weeks before or after release. Wasps are small and require a hand lens to observe.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Guava', 'Lemon', 'Mango', 'Coconut', 'Tapioca'],
  },
  {
    id: 'jassids',
    name: 'Jassids',
    tamilName: 'தத்துப்பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Small wedge-shaped leafhoppers (2–3 mm), green to yellowish. Hop sideways when disturbed.',
    damageDescription:
      "Feed on leaf undersides causing curling of leaf margins ('hopper burn'). Yellowing and drying of leaves.",
    organicPrevention: ['Avoid excess nitrogen', 'Grow resistant varieties where available'],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaf undersides where jassids feed. Ensure thorough coverage.',
        frequency: 'Every 5–7 days',
        timing: 'Evening — jassids are more active in cooler hours',
        safetyNotes: 'Pre-harvest interval: 24 hours. Avoid bloom period to protect pollinators.',
      },
      {
        name: 'Yellow sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Hang yellow sticky cards at crop canopy height, 1–2 per 5 m². Replace when covered.',
        frequency: 'Check weekly; replace every 2–3 weeks',
        timing: 'Install at first sign of damage',
        safetyNotes:
          'Useful for monitoring population density and timing sprays. Keep away from flowering plants.',
      },
      {
        name: 'Garlic-chili spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Blend 10 garlic cloves + 5 dried chilies in 1 L water. Strain. Dilute 1:10. Spray on leaf undersides.',
        frequency: 'Every 5–7 days',
        timing: 'Evening',
        safetyNotes:
          'Wear gloves. Avoid contact with eyes. Strain thoroughly to prevent nozzle blockage.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Ladies Finger', 'Brinjal', 'Cotton'],
  },
  {
    id: 'thrips',
    name: 'Thrips',
    tamilName: 'இலைப்பேன்',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Tiny slender insects (1–2 mm), pale yellow to dark brown. Barely visible to the naked eye. Found in flowers and on leaf surfaces.',
    damageDescription:
      'Rasping-sucking damage causes silvery streaks on leaves, flower drop, deformed fruit. Vector for tospo viruses.',
    organicPrevention: [
      'Blue sticky traps for monitoring',
      'Mulch to reduce soil pupation',
      'Avoid monoculture',
    ],
    organicTreatments: [
      {
        name: 'Blue sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Hang blue sticky cards at flower or canopy height, 1–2 per 5 m². Thrips are strongly attracted to blue colour.',
        frequency: 'Check weekly; replace every 2–3 weeks or when full',
        timing: 'Install at first sign of damage or as a preventive',
        safetyNotes:
          'Place away from open flowers to reduce trapping of beneficial insects. Most effective for monitoring — combine with sprays for control.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray into flowers and on leaf surfaces where thrips hide. Ensure spray reaches inside flowers.',
        frequency: 'Every 5 days for 3–4 applications',
        timing: 'Early morning when thrips are less active. Reapply after rain.',
        safetyNotes:
          'Thrips hide deep inside flowers — good penetration is essential. Pre-harvest interval: 24 hours.',
      },
      {
        name: 'Spinosad (organic)',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dilute certified organic spinosad at 0.1–0.2 ml per litre water. Spray foliage and flowers in the evening to minimise bee contact.',
        frequency: 'Every 7 days; maximum 3 consecutive applications, then rotate to neem',
        timing: 'Evening only — spinosad is toxic to bees when wet',
        safetyNotes:
          'Do not exceed 3 consecutive applications to prevent resistance developing. Pre-harvest interval: 1 day.',
      },
      {
        name: 'Garlic extract',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Blend 10 garlic cloves in 500 ml water. Strain through fine cloth. Dilute 1:10. Spray on foliage and into flower buds.',
        frequency: 'Every 5–7 days',
        timing: 'Evening',
        safetyNotes:
          'Strain very finely to avoid blocking spray nozzle. Wear gloves — avoid eye contact.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Chilli', 'Jasmine', 'Banana', 'Drumstick'],
  },
  {
    id: 'citrus_psylla',
    name: 'Citrus Psylla',
    tamilName: 'எலுமிச்சை சில்லிட்',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Small brownish jumping insect (3–4 mm). Nymphs produce white waxy threads. Found on new flush growth.',
    damageDescription:
      'Sucks sap from tender shoots. Vector for Citrus Greening Disease (Huanglongbing) which kills trees.',
    organicPrevention: ['Remove water sprouts that attract psylla', 'Monitor new flush regularly'],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Focus spray on new flush growth where nymphs concentrate. Cover all tender shoots thoroughly.',
        frequency: 'Every 5–7 days during each flush emergence',
        timing: 'Evening; treat each new flush as it appears — psylla colonises within days',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Critical to spray every new flush as it emerges, not just once.',
      },
      {
        name: 'Yellow sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Place yellow sticky cards within the tree canopy at new flush level, 2–3 per tree. Replace when covered.',
        frequency: 'Replace every 2–3 weeks',
        timing: 'Install before flush emergence as a monitoring tool',
        safetyNotes: 'Used primarily for population monitoring to time neem sprays effectively.',
      },
      {
        name: 'Remove affected shoots',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Prune out psylla-infested new flush shoots at their base. Destroy removed material immediately — do not compost. Clean pruning tools between cuts with dilute bleach.',
        frequency: 'Weekly during flush periods',
        timing: 'Any time; immediate removal prevents spread to remaining flush',
        safetyNotes:
          'Do not compost infested material — psylla can spread. Sanitise pruning tools between trees to prevent Citrus Greening transmission.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Lemon', 'Lime', 'Orange'],
  },
  {
    id: 'mango_hopper',
    name: 'Mango Hopper',
    tamilName: 'மாம்பூத் தத்துப்பூச்சி',
    category: 'sap_sucking',
    emoji: '🪰',
    identification:
      'Small wedge-shaped hoppers (3–5 mm), greenish-brown. Found in large numbers on flower panicles.',
    damageDescription:
      'Suck sap from flower panicles causing flower drop and poor fruit set. Honeydew leads to sooty mold on leaves.',
    organicPrevention: [
      'Prune trees to allow air circulation',
      'Avoid excess watering during flowering',
    ],
    organicTreatments: [
      {
        name: 'Neem oil spray at flowering',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–5 ml neem oil + 2 ml liquid soap per 1 L water. Spray on flower panicles covering all surfaces — both sides of the panicle stalk.',
        frequency: '2–3 sprays at 7-day intervals during panicle emergence and early flowering',
        timing: 'Evening only — avoid daytime spraying during peak bloom to protect pollinators',
        safetyNotes:
          'Do not spray when flowers are fully open. Apply when panicles are 20–30% open. Over-spraying during peak bloom reduces fruit set.',
      },
      {
        name: 'Sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Place yellow sticky cards within the tree canopy near flower panicles, 4–6 per tree.',
        frequency: 'Replace when full, approximately every 2 weeks',
        timing: 'Install at panicle emergence',
        safetyNotes:
          'Remove traps once fruit have set to avoid trapping beneficial insects during the growing season.',
      },
      {
        name: 'Garlic-chili spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Blend 10 garlic cloves + 5 dry chilies in 1 L water. Strain. Dilute 1:5. Spray on panicles and adjacent foliage.',
        frequency: 'Every 5–7 days during panicle emergence',
        timing: 'Evening',
        safetyNotes:
          'Avoid when flowers are fully open — strong odour may repel pollinators. Strain thoroughly before use.',
      },
    ],
    seasonalRisk: { cool_dry: 'high', summer: 'high' },
    plantsAffected: ['Mango'],
  },

];
