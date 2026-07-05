import type { DiseaseEntry } from '@/types/database.types';

export const FUNGAL_DISEASES_2: DiseaseEntry[] = [
  {
    id: 'bud_rot',
    name: 'Bud Rot',
    tamilName: 'குருத்து அழுகல்',
    scientificName: 'Phytophthora palmivora',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Yellowing and drooping of central whorl of coconut fronds. Rotten smell from crown. Spindle leaf falls easily.',
    damageDescription:
      'Destroys the growing point (bud) of coconut palm. Fatal if not treated early. Most common in young palms during monsoon.',
    organicPrevention: [
      'Ensure drainage around palm base',
      'Apply Bordeaux paste preventively before monsoon',
    ],
    organicTreatments: [
      {
        name: 'Bordeaux paste on crown',
        method: 'spray',
        effort: 'moderate',
        howToApply:
          'Make Bordeaux paste: dissolve 100 g copper sulfate in 1 L water; dissolve 100 g quicklime in 1 L water separately. Mix both together. Apply the paste directly into the coconut crown (between fronds at the growing point) using a long brush.',
        frequency: 'Preventively before monsoon onset; repeat monthly during SW Monsoon',
        timing: 'Apply only during dry weather — paste must dry before rain arrives',
        safetyNotes:
          'Bordeaux paste is protective — it cannot cure bud rot that has already destroyed the growing tip. Wear gloves. Act at the FIRST sign of crown yellowing — delay is fatal for the palm.',
      },
      {
        name: 'Remove infected tissue',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Using a clean sharp knife, carefully remove all soft, rotted tissue from the crown until firm, healthy white tissue is reached. Disinfect the wound with 1% copper sulfate solution, then immediately apply a thick layer of Bordeaux paste.',
        frequency:
          'Single intervention on discovery; follow with monthly preventive Bordeaux paste',
        timing: 'During dry weather only — do not treat in rain as copper is washed away',
        safetyNotes:
          'If the bud (growing point) is completely rotted through, the palm cannot be saved — focus resources on protecting adjacent healthy palms. Wear gloves and disinfect all tools.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Clear drainage channels around the palm basin. Ensure water does not pool at the base after rain. Mound soil slightly away from the trunk base to encourage water to flow away.',
        frequency: 'Before monsoon; maintain drainage after each heavy rain event',
        timing: 'Pre-monsoon (May) preparation',
        safetyNotes:
          'Waterlogging around palm base greatly increases susceptibility to Phytophthora bud rot — keeping the root zone well-drained is critical preventive management.',
      },
      {
        name: 'Copper oxychloride',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 4 g copper oxychloride per litre water. Spray directly into the crown area between fronds covering all inner surfaces thoroughly.',
        frequency: 'Monthly during monsoon as a protective spray',
        timing: 'During dry spells within the monsoon season',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper is protective, not curative — must be applied before infection or at very early stages.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'early_blight',
    name: 'Early Blight',
    tamilName: 'ஆரம்ப கருகல்',
    scientificName: 'Alternaria solani',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Dark brown spots with concentric rings (target-board pattern) on older leaves. Starts from lower leaves.',
    damageDescription:
      'Progressive defoliation from bottom up. Reduces fruit size and yield. Common in stressed plants.',
    organicPrevention: [
      'Mulch to prevent soil splash',
      'Adequate spacing for air circulation',
      'Avoid overhead irrigation',
    ],
    organicTreatments: [
      {
        name: 'Copper-based fungicide',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper hydroxide or copper oxychloride per litre water. Spray on all plant surfaces starting with lower leaves where disease initiates. Coat both leaf surfaces.',
        frequency: 'Every 7–10 days from first symptom appearance',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper is protective — early application stops disease progression. Wear gloves.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces.',
        frequency: 'Every 5–7 days, alternating with copper spray',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Alternating neem and copper reduces copper accumulation in soil while maintaining disease control.',
      },
      {
        name: 'Remove infected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Remove all leaves showing target-board spots, beginning with the lowest branches. Bag and burn all removed material.',
        frequency: 'Weekly throughout the growing season',
        timing: 'Any time',
        safetyNotes:
          'Do not compost infected material — Alternaria spores survive in soil on plant debris. Early removal significantly reduces the inoculum load for the current and next season.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Tomato'],
  },
  {
    id: 'late_blight',
    name: 'Late Blight',
    tamilName: 'பிற்கால கருகல்',
    scientificName: 'Phytophthora infestans',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Water-soaked dark green/brown lesions on leaves, spreading rapidly. White mold on leaf undersides in humid conditions.',
    damageDescription:
      'Can destroy entire crop within days in cool wet weather. Affects leaves, stems and fruits. Devastating to tomato and potato.',
    organicPrevention: [
      'Use resistant varieties',
      'Avoid overhead irrigation',
      'Increase spacing for air flow',
    ],
    organicTreatments: [
      {
        name: 'Copper-based fungicide',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 4 g copper oxychloride per litre water. Spray preventively before symptoms appear, or at first sign of water-soaked lesions. Cover all plant surfaces thoroughly.',
        frequency: 'Every 5–7 days during cool wet weather (NE Monsoon and Cool Dry season)',
        timing:
          'Morning — Late Blight spreads at night in humid conditions; morning application provides daytime protection',
        safetyNotes:
          'URGENT — Late Blight can destroy an entire crop in 5–7 days. Act immediately at first symptoms. Pre-harvest interval: 7 days. Alert neighbouring farmers.',
      },
      {
        name: 'Remove and burn infected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Remove all leaves and stems showing water-soaked dark lesions. Bag removed material immediately — do not leave it in the field or on paths. Burn all removed material that day.',
        frequency: 'Daily removal during active infection',
        timing: 'Act immediately — every hour of delay increases infection spread',
        safetyNotes:
          'Do NOT compost — Phytophthora spores are extremely persistent and can spread to neighbouring gardens. Late Blight spreads via wind-carried sporangia — alert neighbours to protect their crops.',
      },
      {
        name: 'Improve air circulation',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Stake and tie tomato plants to create an open, upright canopy. Remove all side suckers. Keep lower leaves off the soil surface. Use drip irrigation instead of overhead watering.',
        frequency: 'Ongoing weekly maintenance throughout the growing season',
        timing: 'Throughout crop season — begin at transplanting',
        safetyNotes:
          'Cool, wet, humid conditions are ideal for Late Blight — improving air circulation is the most important long-term preventive structural measure.',
      },
    ],
    seasonalRisk: { ne_monsoon: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Tomato'],
  },
  {
    id: 'phomopsis_blight',
    name: 'Phomopsis Blight',
    tamilName: 'போமாப்சிஸ் கருகல்',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Circular pale brown spots on leaves and fruit. Fruit rot starts at blossom end. Pycnidia (tiny dots) visible on lesions.',
    damageDescription:
      'Fruit rot and leaf blight in brinjal. Can cause significant pre- and post-harvest losses.',
    organicPrevention: ['Use healthy seed', 'Remove crop debris after harvest'],
    organicTreatments: [
      {
        name: 'Copper-based fungicide',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g copper oxychloride per litre water. Spray on all plant surfaces including developing fruit, focusing on the blossom end where infection begins.',
        frequency: 'Every 7–10 days during wet season; begin at flowering',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Start spraying preventively at the flowering stage before fruit set — infection enters through the blossom end.',
      },
      {
        name: 'Remove infected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Remove spotted leaves and infected fruit showing blossom-end rot. Bag and burn all removed material. Do not leave infected fruit on the plant or on the ground.',
        frequency: 'Weekly throughout the crop season',
        timing: 'Any time',
        safetyNotes:
          'Do not compost infected material. Disinfect pruning tools with dilute bleach between plants.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Brinjal'],
  },
  {
    id: 'leaf_blight',
    name: 'Leaf Blight',
    tamilName: 'இலைக் கருகல்',
    category: 'fungal',
    emoji: '🍂',
    identification:
      'Large irregular brown lesions starting from leaf tips/margins. Rapid browning and drying of leaf tissue.',
    damageDescription:
      'Large-scale leaf damage reducing canopy. Affects photosynthesis and yield. Common in coconut and other palms.',
    organicPrevention: ['Remove and destroy affected fronds', 'Maintain adequate plant nutrition'],
    organicTreatments: [
      {
        name: 'Copper fungicide spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–4 g copper oxychloride per litre water. Spray on both sides of leaves focusing on tip and marginal lesion areas. Use high-volume sprayer for tree canopy.',
        frequency: 'Every 10–14 days during monsoon season',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper is protective — spray before lesions spread. Thorough coverage of leaf undersides is important.',
      },
      {
        name: 'Remove affected fronds',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Cut severely affected fronds at the petiole base. Burn all removed fronds immediately. Avoid dragging removed fronds through the healthy canopy during removal.',
        frequency: 'As symptoms appear; do not allow blighted fronds to remain on the tree',
        timing: 'During dry weather when possible',
        safetyNotes:
          'Do not compost blighted fronds — spores survive. Keep pruning tools clean with dilute bleach solution between trees.',
      },
      {
        name: 'Improve air circulation',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Thin the canopy by removing crossing interior branches. Maintain recommended spacing between trees. Remove weeds that trap humidity at the canopy base.',
        frequency: 'Twice per season — before monsoon and after monsoon',
        timing: 'During dry weather before monsoon onset',
        safetyNotes:
          'Dense, humid canopies create persistent leaf wetness — the primary condition for Leaf Blight spread. Open canopy management is essential in high-rainfall areas.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut', 'Jasmine'],
  },
  {
    id: 'dieback',
    name: 'Dieback',
    tamilName: 'நுனிக் கருகல்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Progressive drying of twigs from tips backward. Dark discolouration of affected branches. Bark peeling.',
    damageDescription:
      'Branch-by-branch death. Reduces canopy and yield. Can kill young trees. Often associated with Colletotrichum.',
    organicPrevention: ['Prune dead wood promptly', 'Maintain balanced nutrition'],
    organicTreatments: [
      {
        name: 'Prune and burn affected branches',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Cut affected branch 10–15 cm below the visible dieback margin, cutting back into firm healthy green wood. Burn all removed material immediately.',
        frequency: 'As soon as dieback is noticed; monitor cut ends for further progression',
        timing: 'During dry weather — avoid pruning in rain to prevent fungal entry',
        safetyNotes:
          'Always cut back to healthy wood — cutting within affected tissue allows disease to continue progressing. Disinfect tools between cuts with 1% bleach solution.',
      },
      {
        name: 'Copper fungicide paste on cuts',
        method: 'spray',
        effort: 'moderate',
        howToApply:
          'Make a thick paste of copper oxychloride (100 g in 200 ml water). Paint directly onto all pruning wounds and exposed wood immediately after cutting, using a brush.',
        frequency: 'Apply immediately after each pruning cut — do not delay',
        timing: 'Immediately after cutting, before spores can enter',
        safetyNotes:
          'Every fresh cut is a fungal entry point — never leave pruning wounds unsealed in dieback-prone areas like mango orchards. Wear gloves.',
      },
      {
        name: 'Balanced nutrition',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Apply balanced organic fertiliser (compost + neem cake + bone meal or wood ash) to the root zone. Test soil pH — dieback is worsened by acidic soil or potassium deficiency.',
        frequency: 'Once per season at the start of the growing period',
        timing: 'Pre-monsoon or pre-fruiting stage',
        safetyNotes:
          'Stressed, nutrient-deficient plants are far more susceptible to dieback. Adequate potassium improves plant disease resistance.',
      },
    ],
    seasonalRisk: { summer: 'moderate', cool_dry: 'moderate' },
    plantsAffected: ['Chilli', 'Mango', 'Guava'],
  },
  {
    id: 'gummosis',
    name: 'Gummosis',
    tamilName: 'பிசின் நோய்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Oozing of gummy sap from bark cracks on trunk and branches. Dark water-soaked bark lesions.',
    damageDescription:
      'Bark cankers girdle branches causing dieback. Gum exudation weakens tree. Common in citrus during wet weather.',
    organicPrevention: ['Avoid trunk injuries', 'Maintain good drainage around base'],
    organicTreatments: [
      {
        name: 'Bordeaux paste on trunk',
        method: 'spray',
        effort: 'moderate',
        howToApply:
          'Scrape away all loose bark and gummy exudate from the lesion using a clean knife. Apply 1% copper sulfate solution to the wound. Then paint a thick layer of Bordeaux paste (100 g copper sulfate + 100 g lime per litre) onto the scraped wound and the surrounding bark.',
        frequency:
          'Apply after scraping; reapply every 2–3 months or after heavy rain removes paste',
        timing: 'During dry weather so paste adheres and dries before rain',
        safetyNotes:
          'Remove and burn all scraped bark material — it harbours fungal spores. Wear gloves — copper sulfate is toxic. Mark treated trees to monitor healing progress.',
      },
      {
        name: 'Improve drainage',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Create a basin around the trunk that slopes away from the stem. Install drainage channels to divert water away from the trunk base after rain. Avoid mounding soil against the trunk.',
        frequency: 'Permanent cultural practice; inspect and clear channels after each monsoon',
        timing: 'Before monsoon season',
        safetyNotes:
          'Water accumulation at trunk base is the primary cause of gummosis in citrus — ensuring dry bark conditions at the trunk base prevents and controls the disease long-term.',
      },
      {
        name: 'Remove infected bark',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Use a clean sharp knife to scrape out all soft, discoloured bark within the lesion. Continue scraping until firm, healthy tissue is reached. Disinfect the exposed area with 1% copper sulfate solution. Apply Bordeaux paste immediately.',
        frequency: 'Single debridement; monitor for re-growth of lesion every 2 months',
        timing: 'During dry weather only',
        safetyNotes:
          'Sterilise knife with bleach between trees. Burn all removed bark. If the lesion has girdled more than 50% of the trunk circumference, the tree may not recover fully.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Lemon', 'Citrus'],
  },
  {
    id: 'sooty_mold',
    name: 'Sooty Mold',
    tamilName: 'கரிப்பூசணம்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Black powdery coating on leaf surfaces. Easily wiped off unlike other leaf diseases. Grows on honeydew from sap-sucking insects.',
    damageDescription:
      'Blocks sunlight reducing photosynthesis. Cosmetic damage to fruits. Indicates underlying sap-sucking pest infestation.',
    organicPrevention: [
      'Control the underlying pest (aphids, mealybugs, scale)',
      'Wash honeydew off leaves periodically',
    ],
    organicTreatments: [
      {
        name: 'Control sap-sucking insects first',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Identify the pest producing honeydew (aphids, mealybugs, scale insects or whiteflies) and apply the relevant organic treatment from the pest reference section. Sooty mold cannot be controlled without first stopping honeydew production.',
        frequency:
          'Treat the underlying pest per pest-specific schedule — all other sooty mold treatments are secondary',
        timing: 'Treat pests first — do not focus on the mold until the pest is under control',
        safetyNotes:
          'Sooty mold is a symptom of a pest infestation, not a primary disease. Treating only the mold without controlling the pest is completely ineffective.',
      },
      {
        name: 'Wash with soapnut water',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3. Use a soft cloth or sponge to gently wipe sooty mold off leaves and fruit surfaces.',
        frequency: 'Every 5–7 days until mold clears (only effective once the pest is controlled)',
        timing: 'Morning so leaves dry during the day',
        safetyNotes:
          'Do not scrub aggressively — leaf surface is delicate under the mold. Once the pest producing honeydew is controlled, sooty mold gradually washes off in rain.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on mold-covered surfaces — neem helps dissolve the mold and simultaneously controls residual pest insects.',
        frequency: 'Every 5–7 days alongside pest control treatments',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Wash fruit before eating. Neem addresses both the mold and the underlying pest in one application.',
      },
    ],
    seasonalRisk: { summer: 'moderate', sw_monsoon: 'moderate' },
    plantsAffected: ['Mango', 'Lemon', 'Coconut'],
  },
  {
    id: 'stem_bleeding',
    name: 'Stem Bleeding',
    tamilName: 'தண்டு இரத்தக்கசிவு',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Dark reddish-brown liquid oozing from trunk cracks in coconut palm. Bark becomes dark and depressed at lesion sites.',
    damageDescription:
      'Progressive bark decay, reduced nut yield, eventual palm decline. Caused by Thielaviopsis paradoxa.',
    organicPrevention: ['Avoid trunk injuries during climbing/harvest', 'Maintain palm nutrition'],
    organicTreatments: [
      {
        name: 'Apply Bordeaux paste',
        method: 'spray',
        effort: 'moderate',
        howToApply:
          'Scrape away all bleeding bark and dark soft tissue using a clean chisel or knife until firm, healthy wood is reached. Swab the wound with 1% copper sulfate solution. Paint a thick layer of Bordeaux paste onto the entire wound and 5 cm of surrounding bark.',
        frequency: 'Apply after scraping; reapply every 2–3 months or after heavy rain',
        timing: 'During dry weather — paste must adhere and dry before rain',
        safetyNotes:
          'Wear gloves — copper sulfate is toxic. Burn all scraped material away from the palm. Mark treated palms to monitor healing progress monthly.',
      },
      {
        name: 'Avoid trunk injury',
        method: 'cultural',
        effort: 'easy',
        howToApply:
          'Instruct all palm climbers to use soft rope slings or pole-climbing techniques that do not wound the bark. Seal any accidental wounds immediately with Bordeaux paste on the day of injury.',
        frequency: 'Permanent practice — every person handling the palm must follow this protocol',
        timing: 'Any time bark is accidentally damaged',
        safetyNotes:
          'Trunk wounds are the primary and almost exclusive entry point for Thielaviopsis — preventing injuries is more effective than all curative treatments combined.',
      },
      {
        name: 'Neem cake basal application',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Apply 2–3 kg neem cake per palm in the root zone drip circle. Incorporate into topsoil and water thoroughly.',
        frequency: 'Once per season before monsoon',
        timing: 'Pre-monsoon (May)',
        safetyNotes:
          'Neem cake improves root health, soil biology and nitrogen levels — a healthy palm with strong root development is more resistant to stem bleeding.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'canker',
    name: 'Canker',
    tamilName: 'புண்',
    category: 'fungal',
    emoji: '🍄',
    identification:
      'Sunken dead areas on bark of stems and branches. May crack and expose inner wood. Dark discolouration.',
    damageDescription:
      'Girdles branches causing dieback above the canker. Entry point for secondary infections. Reduces tree vigour.',
    organicPrevention: ['Protect bark from injuries', 'Apply Bordeaux paste to pruning wounds'],
    organicTreatments: [
      {
        name: 'Copper-based spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3–4 g copper oxychloride per litre water. Spray on all plant surfaces — stem, branches and leaves — as a protective treatment, particularly after pruning operations.',
        frequency: 'Every 10–14 days during monsoon; after every pruning operation',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 7 days. Copper protects healthy tissue around existing cankers but cannot cure established cankers. Pruning is more important than spraying.',
      },
      {
        name: 'Remove and burn infected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Prune branches with visible cankers at least 15 cm below the lowest canker margin, cutting into healthy wood. Seal all wounds immediately with Bordeaux paste. Burn all removed material.',
        frequency: 'On discovery; monitor for new canker development monthly',
        timing: 'During dry weather for wound healing',
        safetyNotes:
          'Disinfect pruning tools between every cut with 1:10 bleach solution — never transfer canker spores to healthy wood. Do not leave pruned material near the tree.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate' },
    plantsAffected: ['Guava', 'Mango'],
  },

];
