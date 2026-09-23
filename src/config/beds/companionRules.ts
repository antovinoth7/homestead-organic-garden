export interface CompanionValidation {
  valid: boolean;
  reason?: string;
}

// Antagonist blocking pairs — order-independent
const ANTAGONIST_PAIRS: { a: string; b: string; reason: string }[] = [
  {
    a: 'Fennel',
    b: 'Brinjal',
    reason: 'Fennel secretes allelopathic compounds that inhibit brinjal growth',
  },
  { a: 'Fennel', b: 'Tomato', reason: 'Fennel inhibits tomato growth and fruit set' },
  { a: 'Fennel', b: 'Coriander', reason: 'Cross-pollination causes both to bolt prematurely' },
  { a: 'Onion', b: 'Cowpea', reason: 'Alliums inhibit legume nitrogen fixation' },
  { a: 'Garlic', b: 'Cowpea', reason: 'Alliums inhibit legume nitrogen fixation' },
  {
    a: 'Potato',
    b: 'Tomato',
    reason: 'Same family (Solanaceae) — share Late Blight and other diseases',
  },
];

/**
 * Both halves of every antagonist pair. Exported for the coverage guard in
 * `src/__tests__`: a pair naming a plant the catalog no longer offers can
 * never fire, and nothing else would notice.
 */
export const ANTAGONIST_PAIR_NAMES: string[] = [
  ...new Set(ANTAGONIST_PAIRS.flatMap((pair) => [pair.a, pair.b])),
];

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function validateCompanionPair(plantA: string, plantB: string): CompanionValidation {
  const a = normalize(plantA);
  const b = normalize(plantB);

  for (const pair of ANTAGONIST_PAIRS) {
    const pa = normalize(pair.a);
    const pb = normalize(pair.b);
    if ((a === pa && b === pb) || (a === pb && b === pa)) {
      return { valid: false, reason: pair.reason };
    }
  }

  return { valid: true };
}

export function getAntagonistPairs(): { a: string; b: string; reason: string }[] {
  return ANTAGONIST_PAIRS;
}
