import type { DiseaseEntry } from '@/types/database.types';

export const VIRAL_DISEASES: DiseaseEntry[] = [
  // ── Viral ────────────────────────────────────────────────────────────────
  {
    id: 'mosaic_virus',
    name: 'Mosaic Virus',
    tamilName: 'தேமல் நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Alternating light and dark green patches on leaves in mosaic pattern. Leaf distortion, curling, and reduced size.',
    damageDescription:
      'Stunted growth, reduced fruit yield, malformed fruit. No cure — infected plants remain symptomatic. Spread by sap-sucking insects.',
    organicPrevention: [
      'Control aphid/whitefly vectors promptly',
      'Remove and destroy infected plants',
      'Use virus-free seed',
    ],
    organicTreatments: [
      {
        name: 'Remove infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot entire infected plants including roots. Bag immediately in black plastic. Do not allow removed plants to contact healthy ones. Burn or bury deeply (>30 cm) away from the garden.',
        frequency:
          'Immediately on detection — every day of delay allows insect vectors to spread virus to more plants',
        timing: 'Act on the same day symptoms are identified',
        safetyNotes:
          'Viral diseases have no cure — removing infected plants is the only way to stop further spread. Do NOT compost infected material.',
      },
      {
        name: 'Control aphid vectors',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on all surrounding healthy plants to repel aphids carrying the virus. Install yellow sticky traps around the crop at 1 per 2 m².',
        frequency: 'Every 5–7 days on surrounding healthy plants after removing infected ones',
        timing: 'Evening for neem spray',
        safetyNotes:
          'Even 1–2 remaining infected plants are a continuous reservoir for vector-mediated spread. Strict removal combined with vector control is the complete management strategy.',
      },
      {
        name: 'Use resistant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'For subsequent plantings, source varieties listed as resistant or tolerant to mosaic virus from the local government agriculture office or certified seed supplier.',
        frequency: 'One-time variety selection for next planting',
        timing: 'Before next planting season',
        safetyNotes:
          'Once mosaic virus is established in a field, resistant variety selection is the most sustainable long-term management solution.',
      },
    ],
    seasonalRisk: { summer: 'moderate' },
    plantsAffected: ['Vegetables'],
  },
  {
    id: 'leaf_curl_virus',
    name: 'Leaf Curl Virus',
    tamilName: 'இலைச் சுருட்டு நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Upward curling and puckering of leaves. Thick leathery texture. Stunted plant with bushy appearance.',
    damageDescription:
      'Severe stunting, reduced leaf area, fruit drop. Plants become unproductive. Transmitted by whitefly.',
    organicPrevention: [
      'Control whitefly population with sticky traps',
      'Use resistant varieties (e.g. Arka Rakshak tomato)',
    ],
    organicTreatments: [
      {
        name: 'Remove infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot entire infected plants immediately, including roots. Bag in black plastic bags without delay. Burn or bury deeply away from the garden.',
        frequency: 'Immediately on detection',
        timing: 'Act on the same day of detection',
        safetyNotes:
          'There is no cure for Leaf Curl Virus. Every infected plant is a source for whitefly-mediated spread to healthy plants — immediate removal is the most important action.',
      },
      {
        name: 'Control whiteflies',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on all remaining healthy plants, focusing on leaf undersides where whiteflies feed. Install yellow sticky traps at 1 per 2 m².',
        frequency: 'Every 5–7 days for neem spray; check traps weekly',
        timing: 'Evening for neem spray',
        safetyNotes:
          'Leaf Curl Virus is transmitted within minutes by a single whitefly feeding — aggressive vector control must begin before plants show symptoms in high-risk seasons.',
      },
      {
        name: 'Resistant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'For tomato, plant varieties with Ty-1 resistance to Tomato Leaf Curl Virus: Arka Rakshak, Arka Samrat, Arka Vishal or hybrid varieties labelled TLCV-R. Source from verified seed suppliers.',
        frequency: 'One-time variety selection',
        timing: 'Before planting',
        safetyNotes:
          'Resistance genes do not fully prevent infection under very heavy whitefly pressure — always combine resistant varieties with active vector management.',
      },
    ],
    seasonalRisk: { summer: 'high' },
    plantsAffected: ['Tomato', 'Chilli'],
  },
  {
    id: 'yellow_vein_mosaic_virus',
    name: 'Yellow Vein Mosaic Virus',
    tamilName: 'மஞ்சள் நரம்பு நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Bright yellow network pattern on leaf veins. Leaves become entirely yellow in severe cases. Fruit malformation.',
    damageDescription:
      'Dramatic yield reduction. Fruits become small, tough, and unmarketable. Major disease of ladies finger.',
    organicPrevention: ['Control whitefly vectors', 'Use resistant varieties (e.g. Arka Anamika)'],
    organicTreatments: [
      {
        name: 'Remove infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot and bag infected plants immediately on detection of yellow vein symptoms. Burn or bury deeply. Do not allow removed plants to contact healthy crop.',
        frequency: 'Immediately on detection; weekly field inspection for new symptomatic plants',
        timing: 'Act on same day of detection',
        safetyNotes:
          'YVMV has no cure. Infected plants are highly visible — act immediately. Every infected plant is a source for whitefly-mediated spread.',
      },
      {
        name: 'Control whiteflies',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on healthy plants focusing on leaf undersides. Install yellow sticky traps at 1 per 2 m². Also spray garlic extract (1:10 dilution) as a repellent.',
        frequency: 'Every 5–7 days throughout the crop season',
        timing: 'Evening for neem spray',
        safetyNotes:
          'YVMV is transmitted within minutes by a single whitefly — aggressive vector control from seedling stage is essential. Combined use of neem spray + yellow traps + resistant variety is the recommended management package.',
      },
      {
        name: 'Resistant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Plant YVMV-resistant ladies finger varieties: Arka Anamika, Arka Abhay, Kashi Pragati or hybrid varieties labelled YVMV-R. Source seeds from verified, certified suppliers.',
        frequency: 'One-time variety selection',
        timing: 'Before planting',
        safetyNotes:
          'In areas with high YVMV incidence, planting susceptible varieties is high risk — resistant variety selection is the primary and most cost-effective management tool.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Ladies Finger'],
  },
  {
    id: 'cassava_mosaic_disease',
    name: 'Cassava Mosaic Disease',
    tamilName: 'மரவள்ளி தேமல் நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Chlorotic mosaic pattern on tapioca leaves. Leaf distortion and size reduction. Some leaves almost entirely yellow.',
    damageDescription:
      'Reduces tuber yield by 20–80%. Stunted plants. Spread by whitefly and through infected planting stakes.',
    organicPrevention: [
      'Use certified disease-free planting stakes',
      'Control whitefly population',
    ],
    organicTreatments: [
      {
        name: 'Use disease-free stakes',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Source all tapioca planting stakes only from certified disease-free nurseries or from confirmed healthy plants showing no mosaic symptoms. Inspect: healthy stakes come from plants with fully normal leaf size and colour.',
        frequency: 'One-time decision at planting — the most important intervention',
        timing: 'Before planting',
        safetyNotes:
          'Infected stakes transmit CMD to 100% of plants grown from them. Using certified disease-free planting material is the single most important prevention step for CMD.',
      },
      {
        name: 'Remove infected plants early',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot and destroy plants showing mosaic patterns within 2 weeks of detection. Burn or bury deeply. Do not use stakes from infected plants for any future planting.',
        frequency: 'Weekly field inspection; remove immediately on detection',
        timing:
          'Act early — rogueing before whitefly populations build on the infected plant is most effective',
        safetyNotes:
          'CMD spreads by both whitefly (field-to-field) and infected planting material (stake-to-plant) — both routes must be managed simultaneously.',
      },
      {
        name: 'Control whiteflies',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on crop canopy. Install yellow sticky traps at 1 per 2–3 m². Whitefly (Bemisia tabaci) is the primary vector for CMD spread between fields.',
        frequency: 'Every 7 days during whitefly-active periods',
        timing: 'Evening for neem spray',
        safetyNotes:
          'CMD is now endemic in many parts of Tamil Nadu — certified planting material combined with vector management is the most practical integrated approach.',
      },
    ],
    seasonalRisk: { summer: 'moderate', sw_monsoon: 'moderate' },
    plantsAffected: ['Tapioca'],
  },
  {
    id: 'bunchy_top_virus',
    name: 'Bunchy Top Virus',
    tamilName: 'குட்டை நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Leaves become narrow, upright and bunched at top. Dark green streaks on petioles. Plant severely stunted.',
    damageDescription:
      'Infected plants never produce marketable bunches. Disease spreads to neighbouring plants via banana aphid.',
    organicPrevention: [
      'Use virus-free tissue culture suckers',
      'Control banana aphid (Pentalonia nigronervosa)',
    ],
    organicTreatments: [
      {
        name: 'Remove and destroy infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot and destroy infected banana plants immediately including the entire rhizome. Inject kerosene or undiluted bleach into the pseudostem before uprooting to kill quickly and prevent regrowth. Burn all plant material.',
        frequency:
          'Immediately on detection — do not allow infected plant to remain for even 1–2 days',
        timing: 'Act on the same day of detection',
        safetyNotes:
          'Bunchy Top spreads via banana aphid — an infected plant is a continuous inoculum source. Each day of delay results in more neighbouring plants infected. Do NOT compost any infected material.',
      },
      {
        name: 'Control banana aphid',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Spray neem oil (3 ml/L) on all remaining healthy banana plants, focusing on pseudostem, petiole bases and suckers where banana aphid (Pentalonia nigronervosa) clusters. Install yellow sticky traps.',
        frequency: 'Every 7 days in areas with confirmed Bunchy Top; every 14 days preventively',
        timing: 'Evening for neem spray',
        safetyNotes:
          'Banana aphid clusters on pseudostem and leaf bases — thorough spraying of these specific areas is critical. The aphid is small and dark — use a hand lens to confirm presence.',
      },
      {
        name: 'Use virus-free suckers',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Source all banana planting material only from certified government tissue culture laboratories or from plots with no Bunchy Top history. Never take suckers from any plant in a Bunchy Top-affected plot.',
        frequency: 'One-time sourcing decision at replanting',
        timing: 'Before replanting',
        safetyNotes:
          'Bunchy Top is one of the most destructive banana diseases — it spreads rapidly and no suckers from infected mats are safe. Never replant from untested field material in Bunchy Top-endemic areas.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate' },
    plantsAffected: ['Banana'],
  },
  {
    id: 'papaya_ringspot_virus',
    name: 'Papaya Ringspot Virus',
    tamilName: 'பப்பாளி வளைய புள்ளி நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Ring-shaped spots on fruit. Oily water-soaked streaks on stems. Mosaic and shoe-string leaves.',
    damageDescription:
      'Fruit quality destroyed. Progressive decline of plant. No cure. Transmitted by aphids.',
    organicPrevention: ['Remove infected plants immediately', 'Control aphid vectors'],
    organicTreatments: [
      {
        name: 'Remove infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Uproot and destroy infected papaya plants including the root stump. Burn or bury deeply. Mark the location to monitor for regrowth from remaining root pieces.',
        frequency: 'Immediately on detection',
        timing: 'Act immediately',
        safetyNotes:
          'PRSV has no cure. Infected plants become progressively less productive and remain continuous virus sources. Early removal reduces aphid-mediated spread to surrounding healthy plants.',
      },
      {
        name: 'Control aphid vectors',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Spray neem oil (3 ml/L) on remaining healthy plants, focusing on new flush where aphids cluster. Install yellow sticky traps. Plant barrier crops of corn or sorghum (2–3 rows) around the papaya border to physically intercept incoming winged aphids.',
        frequency: 'Every 7 days on healthy plants',
        timing: 'Evening for neem spray',
        safetyNotes:
          'Corn/sorghum barrier crops are very effective at reducing alate aphid ingress carrying PRSV in endemic areas — establish the barrier crop 3–4 weeks before papaya transplanting.',
      },
      {
        name: 'Use tolerant varieties',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Plant PRSV-tolerant papaya varieties: CO7, Pusa Nanha (dwarf), Red Lady (hybrid) or Taiwan 786 where available. Source only from certified nurseries with documented disease-free status.',
        frequency: 'One-time variety selection',
        timing: 'Before planting',
        safetyNotes:
          'In Tamil Nadu, PRSV is ubiquitous. Planting susceptible varieties in an endemic area without vector management is extremely high risk. Tolerant variety + barrier crop + neem spray is the recommended integrated approach.',
      },
    ],
    seasonalRisk: { summer: 'moderate' },
    plantsAffected: ['Papaya'],
  },
  {
    id: 'greening_disease',
    name: 'Greening Disease',
    tamilName: 'பசுமை நோய்',
    scientificName: 'Candidatus Liberibacter asiaticus',
    category: 'viral',
    emoji: '🧬',
    identification:
      'Asymmetric yellowing (blotchy mottle) on leaves. Fruit remains green, small, lopsided and bitter. Tree decline.',
    damageDescription:
      'Fatal disease of citrus. No cure — trees decline over 3–5 years. Transmitted by citrus psylla. Most devastating citrus disease.',
    organicPrevention: [
      'Control citrus psylla vector aggressively',
      'Use disease-free nursery stock',
    ],
    organicTreatments: [
      {
        name: 'Remove infected trees',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Remove and destroy confirmed Greening-infected citrus trees immediately. Cut down and burn the entire tree including roots. Bag and dispose of all fruit from infected trees without processing.',
        frequency: 'Immediately on confirmation — do not delay',
        timing: 'Act on the same day of confirmation',
        safetyNotes:
          'There is NO cure for Citrus Greening (HLB). Tree removal is the only way to prevent further spread. Alert the local horticulture department — HLB is a notifiable disease in India. Every infected tree is a psylla breeding ground.',
      },
      {
        name: 'Control citrus psylla',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on all healthy citrus at each flush emergence — psylla colonises new growth within days of emergence. Install yellow sticky traps. Remove water shoots and suckers that attract psylla.',
        frequency: 'Every 5–7 days during flush periods; maintain year-round monitoring',
        timing: 'Evening for neem spray; inspect for psylla nymphs at every new flush',
        safetyNotes:
          'Citrus psylla transmits HLB bacteria within minutes of feeding. Psylla control on healthy trees is the single most important preventive measure — do not neglect it even for one flush period.',
      },
      {
        name: 'Use disease-free planting material',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Source all citrus planting material ONLY from certified government nurseries or registered budwood programmes that test for HLB by PCR. Never propagate from field trees in any HLB-affected region.',
        frequency: 'One-time sourcing decision',
        timing: 'Before planting',
        safetyNotes:
          'Budwood from infected trees produces infected plants from day one — the disease spreads throughout the entire orchard as those trees mature. This is how HLB entered most commercial orchards in India.',
      },
    ],
    seasonalRisk: { summer: 'moderate' },
    plantsAffected: ['Lemon', 'Lime', 'Orange'],
  },
  {
    id: 'little_leaf_disease',
    name: 'Little Leaf Disease',
    tamilName: 'சிறு இலை நோய்',
    category: 'viral',
    emoji: '🧬',
    identification:
      "Leaves become abnormally small, narrow and yellow. Shortened internodes give bushy witches'-broom appearance.",
    damageDescription:
      'Stunted plants, no fruit production. Transmitted by leafhoppers. Common in brinjal.',
    organicPrevention: ['Remove infected plants immediately', 'Control leafhopper vectors'],
    organicTreatments: [
      {
        name: 'Remove and destroy infected plants',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          "Uproot plants showing witches'-broom symptoms (abnormally small, bushy growth). Remove the entire plant including roots. Burn all removed material.",
        frequency: 'Immediately on detection; weekly field inspection for new symptomatic plants',
        timing: 'Act immediately on detection',
        safetyNotes:
          'Little Leaf is caused by phytoplasma — there is no cure. Infected plants are a permanent inoculum source for leafhopper vectors. Do not compost infected plants.',
      },
      {
        name: 'Control sap-sucking insects first',
        method: 'cultural',
        effort: 'moderate',
        howToApply:
          'Apply neem oil spray (3 ml/L) on all remaining healthy brinjal plants to control leafhoppers (Amrasca biguttula biguttula — the phytoplasma vector). Install yellow sticky traps at 1 per 2 m².',
        frequency: 'Every 5–7 days throughout the crop season',
        timing: 'Evening for neem spray',
        safetyNotes:
          'Leafhopper vector control must be maintained continuously throughout the season — even a brief gap allows phytoplasma transmission to healthy plants.',
      },
    ],
    seasonalRisk: { summer: 'moderate' },
    plantsAffected: ['Brinjal'],
  },

];
