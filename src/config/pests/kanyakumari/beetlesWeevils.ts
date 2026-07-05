import type { PestEntry } from '@/types/database.types';

export const BEETLE_WEEVIL_PESTS: PestEntry[] = [
  // ── Beetles & Weevils ────────────────────────────────────────────────────
  {
    id: 'red_palm_weevil',
    name: 'Red Palm Weevil',
    tamilName: 'சிவப்பு பனை வண்டு',
    scientificName: 'Rhynchophorus ferrugineus',
    category: 'beetles_weevils',
    emoji: '🪲',
    identification:
      'Large reddish-brown snout beetle (30–40 mm). Larvae are creamy grubs found inside palm trunk. Fermented smell from trunk.',
    damageDescription:
      'Larvae tunnel inside palm trunk destroying vascular tissue. Usually fatal — tree collapses when damage discovered. Most destructive coconut pest.',
    organicPrevention: [
      'Seal all pruning wounds with Bordeaux paste',
      'Install pheromone traps around plantation',
      'Monitor for fermented smell from crown',
    ],
    organicTreatments: [
      {
        name: 'Pheromone traps',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up aggregation pheromone traps (Rhynchopherol lure + sugarcane pieces) at 1 trap per 25 trees, placed at 1 m height. Inspect and empty every 3 days.',
        frequency: 'Change lures every 6–8 weeks; inspect every 3 days year-round',
        timing: 'Install year-round — this is the most important early-warning tool for this pest',
        safetyNotes:
          'Community-level trapping across neighbouring plots is far more effective than individual plots. Record catches and alert neighbours. Burn or drown all captured beetles.',
      },
      {
        name: 'Inject neem oil into trunk',
        method: 'manual',
        effort: 'advanced',
        howToApply:
          'Drill 4 holes (1 cm diameter) at the base of the crown, spaced 90° apart. Inject 50–100 ml of 10% neem oil + neem cake extract using a syringe into each hole. Seal holes with clay.',
        frequency:
          'Repeat every 2 months in endemic areas; immediately on first signs of infestation',
        timing:
          'Any time; URGENCY IS CRITICAL — act immediately on first signs (fermented odour, frass, wilting fronds)',
        safetyNotes:
          'IMPORTANT: Red Palm Weevil can kill a palm within 3–6 months of infestation. Do not delay treatment. Consult your local agriculture department if infestation is confirmed — subsidised treatment programmes exist.',
      },
      {
        name: 'Entomopathogenic nematodes',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Apply Steinernema or Heterorhabditis nematodes at 5 million nematodes per litre. Inject into bore holes or drench into crown base and root zone at dusk.',
        frequency: 'Two applications 2 weeks apart',
        timing:
          'Evening — nematodes are UV-sensitive and die in direct sunlight. Apply when temperature is below 30°C.',
        safetyNotes:
          'Keep nematode sachets refrigerated (4–8°C) until use. Apply immediately after dilution — viability drops rapidly. Use rainwater or settled water — chlorinated tap water kills nematodes.',
      },
      {
        name: 'Clean crown regularly',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Remove dry fronds and accumulated debris from the crown every 2–3 months. Seal any fresh cuts or wounds immediately with Bordeaux paste (copper sulfate + lime) mixed with neem cake.',
        frequency: 'Every 2–3 months',
        timing: 'Dry season preferred to reduce risk of fungal infection at pruning cuts',
        safetyNotes:
          'NEVER leave open, unsealed wounds on palms — the weevil is strongly attracted to fermenting plant sap at wound sites.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'high', summer: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'rhinoceros_beetle',
    name: 'Rhinoceros Beetle',
    tamilName: 'காண்டாமிருக வண்டு',
    scientificName: 'Oryctes rhinoceros',
    category: 'beetles_weevils',
    emoji: '🪲',
    identification:
      'Large black beetle (30–50 mm) with horn on head. Bores into coconut crown at night. V-shaped cuts on fronds.',
    damageDescription:
      'Bores into the growing point of palms. Damages emerging fronds causing characteristic V-shaped cuts. Creates entry for Red Palm Weevil.',
    organicPrevention: [
      'Remove breeding sites (compost heaps near palms, decaying logs)',
      'Fill bore holes with neem cake mixture',
    ],
    organicTreatments: [
      {
        name: 'Rhinolure pheromone trap',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Set up Rhinolure pheromone trap with funnel-bucket design at 1 per 25 trees, placed at 1–1.5 m height. Add a small piece of fermenting palm material to enhance attraction.',
        frequency: 'Inspect every 3 days; change lure every 6 weeks',
        timing: 'Year-round; most important during SW Monsoon onset when adults are most active',
        safetyNotes:
          'Community-level trapping significantly reduces population. Burn or drown all captured beetles daily. Coordinate with neighbouring farms for maximum impact.',
      },
      {
        name: 'Metarhizium anisopliae (fungal biocontrol)',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Apply Metarhizium anisopliae WP at 5 g per litre water. Spray on compost heaps, decaying organic matter near palms, and on the crown base of palms.',
        frequency: 'Every 2–3 months; apply to every compost batch made near palms',
        timing:
          'Apply in humid conditions (>70% RH) for best fungal establishment. Spray in evening.',
        safetyNotes:
          'Metarhizium requires moist conditions to germinate and infect beetles. Do NOT mix with fungicides. Store in the refrigerator. Results take 1–3 weeks to show as fungus must infect and kill beetles.',
      },
      {
        name: 'Hook out adults from crown',
        method: 'manual',
        effort: 'moderate',
        howToApply:
          'Use a long metal hook (a bent metal rod works) to carefully probe the crown funnel and extract adult beetles found boring in the growing point. Destroy removed beetles by crushing or drowning.',
        frequency: 'Weekly crown monitoring; hook out beetles immediately on finding them',
        timing: 'Morning when adults are resting after nocturnal feeding',
        safetyNotes:
          'Check for fresh entry holes (V-shaped cuts on emerging fronds). Seal entry holes with neem cake paste + clay after extraction to repel further entry.',
      },
      {
        name: 'Neem cake in manure pits',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Mix 2 kg neem cake per 100 kg compost heap. Incorporate neem cake into all compost or organic matter pits maintained near palms to prevent beetle breeding.',
        frequency: 'Add to every compost batch; reapply annually to established compost pits',
        timing: 'When preparing fresh compost or adding new organic matter to pits',
        safetyNotes:
          'Rhinoceros beetle primarily breeds in decomposing organic matter — treating all compost heaps near palms is a priority preventive action.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'high', ne_monsoon: 'moderate' },
    plantsAffected: ['Coconut'],
  },
  {
    id: 'epilachna_beetle',
    name: 'Epilachna Beetle',
    tamilName: 'எபிலாக்னா வண்டு',
    category: 'beetles_weevils',
    emoji: '🪲',
    identification:
      'Yellowish-brown ladybird-like beetle (6–8 mm) with dark spots. Both adults and grubs feed on leaves.',
    damageDescription:
      'Scrapes leaf surface leaving only veins (skeletonisation). Grubs are more damaging than adults. Major pest of brinjal.',
    organicPrevention: ['Handpick adults and egg masses', 'Remove alternate weed hosts'],
    organicTreatments: [
      {
        name: 'Neem oil spray',
        method: 'spray',
        effort: 'easy',
        howToApply:
          'Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces covering all feeding areas. Ensure egg masses on leaf undersides are also contacted.',
        frequency: 'Every 5–7 days for 3–4 applications',
        timing: 'Morning or evening',
        safetyNotes:
          'Also spray yellow egg clusters visible on leaf undersides. Pre-harvest interval: 24 hours.',
      },
      {
        name: 'Handpicking',
        method: 'manual',
        effort: 'easy',
        howToApply:
          'Inspect plants in early morning. Collect adults, grubs and yellow egg clusters from both leaf surfaces. Drop into a bucket of soapy water.',
        frequency: 'Daily until infestation is controlled',
        timing: 'Early morning when beetles are less active and easier to collect',
        safetyNotes:
          'Wear gloves. Check leaf undersides carefully — eggs are bright yellow and laid in neat clusters. Remove egg masses before they hatch.',
      },
      {
        name: 'Bt spray',
        method: 'spray',
        effort: 'easy',
        howToApply: 'Mix 2 g Bt kurstaki per litre water. Spray both leaf surfaces thoroughly.',
        frequency: 'Every 7 days',
        timing: 'Evening',
        safetyNotes:
          'Bt is effective only on larvae (grubs), not adult beetles — combine with handpicking of adults for complete control.',
      },
    ],
    seasonalRisk: { summer: 'moderate', sw_monsoon: 'moderate' },
    plantsAffected: ['Brinjal', 'Bitter gourd'],
  },
  {
    id: 'rhizome_weevil',
    name: 'Rhizome Weevil',
    tamilName: 'கிழங்கு வண்டு',
    category: 'beetles_weevils',
    emoji: '🪲',
    identification:
      'Dark brown weevil (10–15 mm). Larvae feed inside banana rhizome. Wilting and yellowing of outer leaves.',
    damageDescription:
      'Larvae tunnel through rhizome destroying root system. Causes toppling, reduced bunch size. Spreads through infested suckers.',
    organicPrevention: [
      'Use healthy pest-free suckers for planting',
      'Pare and treat rhizome before planting',
    ],
    organicTreatments: [
      {
        name: 'Trap with pseudostems',
        method: 'trap',
        effort: 'moderate',
        howToApply:
          'Cut fresh pseudostem sections (50 cm long) lengthwise to expose the moist interior. Place flat-side-down on soil near plants as attractant traps. Collect and destroy all weevils found underneath every 3 days.',
        frequency: 'Replace trap pieces every 7–10 days; inspect every 3 days',
        timing: 'Place traps at planting time and maintain throughout the growing season',
        safetyNotes:
          'Trap pieces MUST be removed and replaced regularly — neglected pseudostem traps become breeding sites rather than traps.',
      },
      {
        name: 'Neem cake in soil',
        method: 'soil',
        effort: 'easy',
        howToApply:
          'Mix 250 g neem cake per planting hole at establishment. For established plants, broadcast 1 kg per m² in the root zone and incorporate into the top 10 cm of soil.',
        frequency: 'At planting and every 3 months thereafter',
        timing:
          'Apply before planting or during regular soil amendment; water thoroughly after application',
        safetyNotes:
          'Neem cake is also an organic nitrogen source — it improves soil fertility while suppressing pests.',
      },
      {
        name: 'Beauveria bassiana',
        method: 'biocontrol',
        effort: 'advanced',
        howToApply:
          'Mix Beauveria bassiana WP at 5 g per litre water. Drench soil around the rhizome zone, applying 500 ml per plant.',
        frequency: 'Twice per season — at planting and again 3 months later',
        timing: 'Evening or early morning in humid conditions for best fungal spore establishment',
        safetyNotes:
          'Do NOT apply in direct sunlight — UV radiation kills spores. Do NOT mix with fungicides. Keep product refrigerated until use. Results take 1–3 weeks as fungus must infect and kill weevils.',
      },
    ],
    seasonalRisk: { sw_monsoon: 'moderate', ne_monsoon: 'moderate' },
    plantsAffected: ['Banana'],
  },

];
