import type { PestEntry } from '@/types/database.types';

export const BORER_LARVAE_PESTS: PestEntry[] = [
  // ── Borers & Larvae ──────────────────────────────────────────────────────
  {
    id: 'fruit_borer',
    name: 'Fruit Borer',
    tamilName: 'காய்ப்புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Green/brown caterpillar (15–40 mm) that bores into fruits. Entry holes with frass visible on fruit surface.',
    damageDescription:
      'Larvae bore into fruits causing internal feeding damage, fruit rot and drop. Major pest of tomato and brinjal.',
    organicPrevention: [
      'Erect pheromone traps early in season',
      'Remove and destroy infested fruits',
    ],
    organicTreatments: [
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up species-specific pheromone traps (Helicoverpa lure) at 1 trap per 1000 m². Hang at crop canopy height on a stake or wire.',
        frequency: 'Change lures every 4–6 weeks; monitor and record catches weekly',
        timing: 'Install 2 weeks before crop flowering to establish baseline counts',
        safetyNotes:
          'Mass trapping is most effective as a community-wide effort across neighbouring plots. High catch counts (>8 per trap per night) signal need for spray intervention.',
      },
      {
        name: 'Neem seed kernel extract',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 500 g crushed neem kernels overnight in 10 L water. Strain through fine cloth. Spray crop at 10 L per 100 m².',
        frequency: 'Every 5–7 days from fruit set onwards',
        timing:
          'Evening — NSKE degrades rapidly in sunlight and loses efficacy within 12 hours of mixing',
        safetyNotes:
          'Prepare fresh on the day of use — loses efficacy after 24 hours. Strain thoroughly to avoid nozzle blockage.',
      },
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bacillus thuringiensis var. kurstaki (Bt) per litre water. Spray on fruit and foliage covering all surfaces, particularly fruit entry points.',
        frequency: 'Every 5–7 days; reapply after rain as Bt is washed off',
        timing:
          'Evening — Bt protein degrades in UV light; evening application maximises residual activity',
        safetyNotes:
          'Bt is harmless to mammals, birds and bees — safe to use close to harvest. Effective only on young caterpillars before they bore into fruit. Must be ingested.',
      },
      {
        name: 'Trichogramma egg cards',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Attach Trichogramma chilonis egg cards (1 card per 100 m²) to plant stakes inside the crop canopy. Place when cards are ready to hatch per supplier instructions.',
        frequency: 'Weekly releases for 6–8 weeks during the crop season',
        timing: 'Place cards in morning; avoid direct sunlight on cards',
        safetyNotes:
          'Keep cards moist and shaded until placement. Avoid insecticide use throughout the release period. Parasitoids attack the moth eggs before larvae hatch.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Tomato', 'Brinjal', 'Chilli'],
  },
  {
    id: 'fruit_and_shoot_borer',
    name: 'Fruit and Shoot Borer',
    tamilName: 'காய் தண்டுப்புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Pink/white larva boring into tender shoots and fruits. Wilting of shoots with bore holes at tips.',
    damageDescription:
      'Bore into shoots causing wilting and dieback. Bore into fruits causing internal damage. Major pest of ladies finger.',
    organicPrevention: [
      'Remove and destroy infested shoots early',
      'Set up pheromone traps before flowering',
    ],
    organicTreatments: [
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up Earias vittella or Leucinodes orbonalis pheromone traps at 1 per 1000 m² at canopy height.',
        frequency: 'Change lures every 4–6 weeks; inspect weekly',
        timing: 'Install at planting time as both a monitoring and suppression tool',
        safetyNotes:
          'Remove and destroy wilted shoots immediately — do not leave infested material in the field.',
      },
      {
        name: 'Neem seed kernel extract',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 500 g crushed neem kernels overnight in 10 L water. Strain. Spray on shoots and developing fruits covering all surfaces.',
        frequency: 'Every 5–7 days from first flowering',
        timing: 'Evening — NSKE degrades rapidly in UV light',
        safetyNotes:
          'Prepare fresh daily — loses efficacy after 24 hours. Thorough coverage of shoot tips is essential.',
      },
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bt kurstaki per litre water. Spray onto shoot tips and developing fruits where young larvae feed before boring.',
        frequency: 'Every 5–7 days; reapply after rain',
        timing: 'Evening for maximum UV stability',
        safetyNotes:
          'Bt must be ingested by larvae — effective only on young caterpillars before boring. Safe for beneficial insects.',
      },
      {
        name: 'Trap crops',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Plant African marigold (Tagetes erecta) or castor as a border around the main crop to attract adult moths for egg-laying. Monitor trap crops weekly and destroy infested plants.',
        frequency: 'Plant 2–3 weeks before main crop; destroy infested trap plants every 2 weeks',
        timing: 'Establish trap crop before main crop is transplanted',
        safetyNotes:
          'Trap crops must be monitored rigorously and destroyed before pests can migrate back to the main crop — a neglected trap crop becomes a pest reservoir.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Ladies Finger', 'Brinjal'],
  },
  {
    id: 'shoot_and_fruit_borer',
    name: 'Shoot and Fruit Borer',
    tamilName: 'தண்டு காய்ப்புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Similar to fruit and shoot borer. Larva bores into shoots first, then moves to fruits as they develop.',
    damageDescription:
      'Wilting of growing tips, bore holes in fruits with frass. Major yield loss in brinjal and ladies finger.',
    organicPrevention: [
      'Clip and destroy affected shoots weekly',
      'Install pheromone traps at planting',
    ],
    organicTreatments: [
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up Leucinodes orbonalis pheromone traps at 1 per 1000 m² at crop canopy height.',
        frequency: 'Change lures every 4–6 weeks; monitor catches weekly',
        timing: 'Install at planting time and maintain throughout the season',
        safetyNotes:
          'High nightly catches (>5 moths per trap) indicate need for immediate Bt spray intervention.',
      },
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bt kurstaki per litre water. Spray onto shoot tips and fruits. Ensure coverage of areas where larvae enter.',
        frequency: 'Every 5–7 days; reapply after rain',
        timing: 'Evening for maximum UV stability',
        safetyNotes:
          'Safe for humans, birds and bees. Effective only on young larvae — act early before larvae bore into fruit.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre. Spray on shoot tips and developing fruits thoroughly.',
        frequency: 'Every 5–7 days',
        timing: 'Evening or early morning',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Combine with Bt spray — use on alternate applications to broaden control.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Brinjal', 'Ladies Finger'],
  },
  {
    id: 'stem_borer',
    name: 'Stem Borer',
    tamilName: 'தண்டுத் துளைப்பான்',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Larva bores into stems and branches. Frass (sawdust-like excrement) at bore holes. Wilting of branches above entry.',
    damageDescription:
      'Tunnelling weakens stems, causes branch dieback. Can girdle and kill young trees. Bore holes allow fungal entry.',
    organicPrevention: [
      'Keep trees healthy with balanced nutrition',
      'Seal pruning cuts with Bordeaux paste',
    ],
    organicTreatments: [
      {
        name: 'Inject neem oil into bore holes',
        method: 'manual',
        effort: 'advanced',
        howToApply:
          'Use a veterinary syringe to inject 2–3 ml of undiluted neem oil (or 10% neem oil solution) into each active bore hole where fresh frass is present. Seal the hole with clay immediately after injection.',
        frequency: 'Single treatment per bore hole; reinspect after 2 weeks for new frass',
        timing: 'Any time on discovery; act immediately on finding fresh frass',
        safetyNotes:
          'Identify all active bore holes by fresh frass presence before treating. Sealing multiple entry points traps larvae inside.',
      },
      {
        name: 'Seal holes with mud',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Mix clay or garden soil with a few drops of neem oil. Press the mixture firmly into each bore hole to seal it and deprive the larva of oxygen.',
        frequency: 'Repeat if mud falls out or new frass appears alongside the seal',
        timing: 'Any time',
        safetyNotes:
          'Most effective when combined with neem oil injection. Monitor sealed holes regularly for re-emergence of frass.',
      },
      {
        name: 'Prune affected branches',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Cut the affected branch 15–20 cm below the lowest visible bore hole. Destroy pruned material by burning — do not compost.',
        frequency: 'As soon as wilting or dieback is first noticed',
        timing: 'Any time; do not delay — larvae spread to adjacent wood',
        safetyNotes:
          'Seal all pruning cuts with Bordeaux paste (copper sulfate + lime) to prevent fungal infection. Do not leave pruned material lying near the tree.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Mango', 'Guava', 'Lemon'],
  },
  {
    id: 'leaf_miner',
    name: 'Leaf Miner',
    tamilName: 'சுரங்கப்புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Tiny larvae mine between leaf surfaces creating visible serpentine trails. Adults are small flies or moths.',
    damageDescription:
      'Serpentine mines reduce leaf area for photosynthesis. Severe infestations cause leaf drop and reduced vigour.',
    organicPrevention: [
      'Remove and destroy mined leaves',
      'Yellow sticky traps to catch adult flies',
    ],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray leaf undersides and surfaces where adult flies lay eggs. Neem disrupts egg-laying behaviour.',
        frequency: 'Every 5–7 days',
        timing: "Evening — UV rapidly degrades neem's active azadirachtin",
        safetyNotes:
          'Neem is most effective at preventing egg-laying, not killing established miners. Start treatment early at first sign of mines.',
      },
      {
        name: 'Remove affected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Pick off leaves with visible serpentine mines. Place removed leaves in a sealed black plastic bag and leave in the sun for 2 days to kill larvae before disposal.',
        frequency: 'Weekly removal throughout the infestation period',
        timing: 'Any time',
        safetyNotes:
          'Do not compost mined leaves — larvae inside can survive composting. Most effective combined with yellow sticky traps for adults.',
      },
      {
        name: 'Yellow sticky traps',
        method: 'trap',
        effort: 'easy',
        howToApply:
          'Hang yellow sticky cards at canopy height, 1–2 per 5 m², to catch adult leaf miner flies.',
        frequency: 'Replace every 2–3 weeks or when covered',
        timing: 'Install at first sign of damage',
        safetyNotes:
          'Primarily for monitoring adult fly populations. High adult catch helps time neem sprays during peak egg-laying.',
      },
      {
        name: 'Spinosad spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Dilute certified organic spinosad at 0.1 ml per litre water. Spray foliage thoroughly — spinosad is systemic and reaches miners inside leaf tissue.',
        frequency: 'Every 7 days; maximum 2–3 consecutive applications, then rotate to neem',
        timing: 'Evening to minimise bee exposure',
        safetyNotes:
          'Rotate with neem to prevent resistance developing. Pre-harvest interval: 1 day. Toxic to bees when wet.',
      },
    ],
    seasonalRisk: { summer: 'moderate', cool_dry: 'moderate' },
    plantsAffected: ['Lemon', 'Tomato', 'Chilli'],
  },
  {
    id: 'bud_worm',
    name: 'Bud Worm',
    tamilName: 'மொட்டுப்புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Small caterpillar found inside flower buds. Causes bud drop and malformed flowers. Found in jasmine.',
    damageDescription:
      'Larvae feed inside flower buds causing bud drop, reducing flower yield significantly in jasmine.',
    organicPrevention: [
      'Collect and destroy fallen buds',
      'Monitor buds regularly during flowering season',
    ],
    organicTreatments: [
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bt kurstaki per litre water. Spray into flower buds and on stems where young larvae feed. Ensure spray penetrates into bud crevices.',
        frequency: 'Every 5–7 days during the flowering season',
        timing:
          'Evening — Bt degrades in UV light, evening application maximises residual activity',
        safetyNotes:
          'Bt must be ingested by larvae to work — thorough bud coverage is critical. Safe for pollinators and humans.',
      },
      {
        name: 'Neem oil',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on flower buds, stems and foliage covering all surfaces.',
        frequency: 'Every 7 days',
        timing: 'Evening or early morning',
        safetyNotes:
          'Avoid spraying fully open flowers. Neem disrupts larval feeding and egg-laying behaviour.',
      },
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up moth-specific pheromone traps (Maruca vitrata lure) at canopy height near jasmine plants.',
        frequency: 'Change lures every 4 weeks; monitor weekly',
        timing: 'Install at first sign of bud damage',
        safetyNotes:
          'Catch counts help time Bt sprays precisely for peak moth oviposition. Record catches to identify infestation patterns.',
      },
      {
        name: 'Hand picking',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Inspect flower buds daily and hand-pick infested buds showing entry holes or caterpillar frass. Place removed buds in soapy water. Destroy immediately.',
        frequency: 'Daily during the peak flowering and infestation period',
        timing: 'Morning when larvae are less active and easier to locate inside buds',
        safetyNotes:
          'Combine hand-picking with Bt spray for best control. Wash hands after handling infested buds.',
      },
    ],
    seasonalRisk: { summer: 'high', cool_dry: 'moderate' },
    plantsAffected: ['Jasmine'],
  },
  {
    id: 'bud_borer',
    name: 'Bud Borer',
    tamilName: 'மொட்டுத் துளைப்பான்',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Larva bores into vegetative and flower buds. Causes drying and death of growing tips.',
    damageDescription:
      'Tunnels into terminal buds causing die-back of shoots, reduced branching and delayed flowering.',
    organicPrevention: ['Maintain plant vigour', 'Remove and destroy affected buds early'],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on terminal buds, shoot tips and surrounding foliage.',
        frequency: 'Every 7 days during the active growing and flowering season',
        timing: 'Evening or early morning',
        safetyNotes:
          'Remove and destroy visibly dead shoot tips before spraying to reduce pest load. Pre-harvest interval: 24 hours.',
      },
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bt kurstaki per litre water. Spray onto terminal buds and growing tips where larvae feed on entry.',
        frequency: 'Every 5–7 days; reapply after rain',
        timing: 'Evening for best UV stability',
        safetyNotes:
          'Effective on young larvae before boring begins. Safe for humans, birds and beneficial insects.',
      },
    ],
    seasonalRisk: { summer: 'moderate' },
    plantsAffected: ['Jasmine', 'Flower crops'],
  },
  {
    id: 'caterpillar',
    name: 'Caterpillar',
    tamilName: 'புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Various moth/butterfly larvae feeding on leaves. Green or brown, 10–50 mm. Chewing damage on leaf edges.',
    damageDescription:
      'Defoliation from leaf feeding. Skeletonised leaves in severe cases. Reduces plant vigour and yield.',
    organicPrevention: [
      'Encourage birds and parasitic wasps',
      'Handpick and destroy visible caterpillars',
    ],
    organicTreatments: [
      {
        name: 'Bt (Bacillus thuringiensis)',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 2 g Bt kurstaki per litre water. Spray thoroughly on all foliage that caterpillars are feeding on, coating both leaf surfaces.',
        frequency: 'Every 5–7 days; reapply after rain as Bt is washed off',
        timing: 'Evening for maximum residual activity — Bt protein degrades in UV light',
        safetyNotes:
          'Bt is completely safe for mammals, birds and bees — approved for use close to harvest. Effective only when ingested by caterpillars — spray where larvae are actively feeding.',
      },
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaves covering both surfaces. Neem disrupts larval moulting and feeding.',
        frequency: 'Every 5–7 days',
        timing: 'Morning or evening',
        safetyNotes:
          'Pre-harvest interval: 24 hours. Most effective on young caterpillars (1st–2nd instar).',
      },
      {
        name: 'Handpicking',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Check plants in early morning and evening. Handpick caterpillars and drop into a bucket of soapy water. Check leaf undersides for egg masses and remove those too.',
        frequency: 'Daily during active infestation',
        timing: 'Early morning or evening when caterpillars are most active on leaf surfaces',
        safetyNotes:
          'Wear gloves — some caterpillar species have urticating (irritating) hairs. Inspect leaf undersides carefully for egg clusters.',
      },
      {
        name: 'Trichogramma egg cards',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Attach Trichogramma chilonis cards (1 card per 100 m²) inside the crop canopy on stakes at the time of card hatching per supplier instructions.',
        frequency: 'Weekly releases for 6–8 weeks',
        timing: 'Place cards in morning; shade from direct sun',
        safetyNotes:
          'Parasitoid wasps attack moth eggs — preventive and ongoing releases work best. Avoid insecticides throughout the release period.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Vegetables', 'Fruit trees'],
  },
  {
    id: 'hairy_caterpillar',
    name: 'Hairy Caterpillar',
    tamilName: 'ரோம புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Large hairy caterpillars (30–60 mm) with urticating hairs. Gregarious — cluster on leaves and stems.',
    damageDescription:
      'Rapid defoliation in swarm attacks. Can strip entire trees. Contact with hairs causes skin irritation.',
    organicPrevention: [
      'Light traps to catch adult moths at night',
      'Remove egg masses from leaf undersides',
    ],
    organicTreatments: [
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g Bt kurstaki per litre water (slightly higher rate for large caterpillars). Spray entire tree canopy at high volume ensuring all foliage is covered.',
        frequency: 'Every 5–7 days during larval stage; reapply after rain',
        timing: 'Evening',
        safetyNotes:
          'Safe for humans and beneficial insects. Most effective on young (1st–3rd instar) larvae before they grow large and hairy.',
      },
      {
        name: 'Light traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up a light trap or solar-powered light trap 1 m above ground level. Place a tray of soapy water below to drown attracted moths.',
        frequency: 'Operate nightly during adult moth season (monsoon onset)',
        timing: 'Switch on from dusk to midnight',
        safetyNotes:
          'Collect and destroy trapped moths each morning. Keep away from living areas. Light traps also attract beneficial insects — use judiciously.',
      },
      {
        name: 'Neem kernel extract',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Soak 500 g crushed neem kernels overnight in 10 L water. Strain through fine cloth. Spray entire tree canopy at high volume using a high-pressure sprayer.',
        frequency: 'Every 5–7 days during active larval feeding',
        timing: 'Evening',
        safetyNotes:
          'Prepare fresh daily — loses efficacy after 24 hours. Use high-pressure sprayer for complete coverage of large trees.',
      },
      {
        name: 'Manual collection and destruction',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Young hairy caterpillars are gregarious and cluster on leaves or branches. Locate the colony early, remove the entire infested branch or leaf and burn it immediately.',
        frequency: 'Check trees daily when caterpillars are in early gregarious larval stage',
        timing: 'Morning when caterpillars are still clustered on one branch',
        safetyNotes:
          'IMPORTANT: Wear full-sleeve clothing, gloves and eye protection — urticating hairs cause skin rash and severe eye irritation. Do NOT rub eyes after handling.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Drumstick', 'Castor', 'Moringa'],
  },
  {
    id: 'black_headed_caterpillar',
    name: 'Black-Headed Caterpillar',
    tamilName: 'கருந்தலை புழு',
    scientificName: 'Opisina arenosella',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Caterpillar with distinct black head, feeds on coconut leaflets. Creates silk galleries on frond undersides.',
    damageDescription:
      'Scrapes leaf tissue causing drying and browning of fronds. Severe infestations give coconut palm a scorched appearance, reducing yield.',
    organicPrevention: [
      'Maintain palm health',
      'Release parasitoids preventively in endemic areas',
    ],
    organicTreatments: [
      {
        name: 'Release parasitoids (Goniozus nephantidis)',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Source Goniozus nephantidis parasitoid wasp cards from biocontrol laboratories. Attach 1 card per 5 affected fronds, placing near silk galleries on the frond undersides.',
        frequency: 'Two releases 2 weeks apart per season',
        timing: 'Morning when temperature is 25–30°C',
        safetyNotes:
          'Avoid all pesticides for 4 weeks around the release period. Parasitoid release works best as a preventive measure in areas with endemic infestation history.',
      },
      {
        name: 'Bt spray on fronds',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 g Bt kurstaki per litre water. Spray fronds from crown downward, covering both surfaces. Use a high-pressure knapsack sprayer for penetration into silk galleries.',
        frequency: 'Every 7 days for 3–4 applications during active infestation',
        timing: 'Morning',
        safetyNotes:
          'Spray must penetrate the silk galleries to reach larvae inside. Wear protective gear when working at height near palms.',
      },
      {
        name: 'Remove and burn affected leaves',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Cut severely infested fronds and leaflets at the base. Remove silk galleries with larvae inside. Burn all removed material immediately.',
        frequency: 'As soon as infestation is identified; do not delay',
        timing: 'Any time',
        safetyNotes:
          'Do NOT compost infested fronds — larvae can survive. Burning removes both larvae and silk structures.',
      },
    ],
    seasonalRisk: { summer: 'high', sw_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'bark_eating_caterpillar',
    name: 'Bark Eating Caterpillar',
    tamilName: 'பட்டை அரிப்பு புழு',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Caterpillar creates web-like silk shelters on bark and branches. Frass visible at tunnel openings.',
    damageDescription:
      'Tunnels under bark weakening branches. Heavy infestation causes branch dieback. Common in mango and guava.',
    organicPrevention: ['Regular trunk inspection', 'Clean shelters from bark during pruning'],
    organicTreatments: [
      {
        name: 'Clean frass from tunnels',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Use a thin wire or rod to scrape out frass (caterpillar excrement) and silk webbing from tunnels on bark. Dispose of removed material away from the tree.',
        frequency: 'Monthly trunk inspection and cleaning',
        timing: 'Any time during the dry season when frass is most visible',
        safetyNotes:
          'Wear gloves. After cleaning, apply neem paste or Bt paste into open tunnel entrances to kill remaining larvae.',
      },
      {
        name: 'Inject neem oil',
        method: 'manual',
        effort: 'advanced',
        howToApply:
          'Use a syringe to inject 2–3 ml of undiluted neem oil into each tunnel entrance where fresh frass is present. Seal the hole with clay or moist cotton wool immediately after.',
        frequency: 'Single treatment per tunnel; reinspect after 3 weeks for new frass',
        timing: 'Any time; act quickly when fresh frass indicates active infestation',
        safetyNotes:
          'Treat only active tunnels where fresh frass is present. Seal all tunnel entries after treatment to trap larvae inside.',
      },
      {
        name: 'Apply Bt paste',
        method: 'spray',
        effort: 'moderate',
        howToApply:
          'Mix 5 g Bt kurstaki in 30–50 ml water to form a thick paste. Pack paste into tunnel entrances using a thin brush or syringe. Seal with clay after application.',
        frequency: 'Single application; repeat if new frass appears after 3 weeks',
        timing: 'Any time',
        safetyNotes:
          'Wear gloves. Ensure paste reaches deep into the tunnel to contact the larva. Seal tunnel entrance after application to prevent paste drying out before ingestion.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Mango', 'Guava'],
  },
  {
    id: 'pseudostem_borer',
    name: 'Pseudostem Borer',
    tamilName: 'போலித்தண்டு துளைப்பான்',
    category: 'borers_larvae',
    emoji: '🐛',
    identification:
      'Weevil larva boring into banana pseudostem. Entry holes with oozing sap and frass at stem base.',
    damageDescription:
      'Tunnelling weakens pseudostem causing toppling in wind. Reduces bunch weight. Can destroy entire mat.',
    organicPrevention: [
      'Remove and destroy dead pseudostems after harvest',
      'Keep field clean of plant debris',
    ],
    organicTreatments: [
      {
        name: 'Inject neem solution into pseudostem',
        method: 'manual',
        effort: 'advanced',
        howToApply:
          'Make holes at 30 cm intervals around the pseudostem using a knife or drill. Inject 50 ml of 10% neem oil solution per hole using a syringe. Seal holes with clay after injection.',
        frequency: 'Single treatment on discovery; monitor for new boring damage after 2 weeks',
        timing: 'Any time on discovery; most effective on young infestations',
        safetyNotes:
          'Treatment is more effective when infestation is detected early. Severely tunnelled pseudostems may require removal to prevent toppling.',
      },
      {
        name: 'Remove and destroy affected parts',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Cut the affected pseudostem at the base. Split it open to expose and destroy all larvae inside. Remove the entire infected mat if the rhizome is also damaged.',
        frequency: 'Immediately when wilting of pseudostem is detected',
        timing: 'Any time',
        safetyNotes:
          'Do NOT leave cut pseudostem pieces in the field — adult weevils breed in decaying banana material. Allow cut surfaces to dry for 2–3 days before considering replanting.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Banana'],
  },

];
