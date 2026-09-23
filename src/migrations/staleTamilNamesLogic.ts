import type { PlantProfiles, PlantType } from '@/types/database.types';

/**
 * Bundled Tamil names that were wrong, and what they should say.
 *
 * `getProfileEntry` returns `stored ?? DEFAULT` — a whole-entry replacement,
 * never a field merge — and migration 003 wrote a full stored entry, Tamil name
 * included, for every plant belonging to a user who had a stored `plantCatalog`.
 * So correcting the bundled value alone never reaches an existing install; the
 * stored copy has to be repaired too.
 *
 * Keyed by plant name, like `MERGED_PLANT_NAMES` and `RECATEGORISED_PLANTS`, so
 * the next correction extends the map rather than adding another migration.
 */
export const STALE_TAMIL_NAMES: Record<
  string,
  { type: PlantType; stale: string; corrected: string }
> = {
  // நாவல் is Syzygium cumini — Jamun, now its own catalog row. This row is
  // Syzygium aqueum, a different species in the same genus, and had carried
  // Jamun's name since the catalog was written.
  'Water Apple': { type: 'fruit_tree', stale: 'நாவல்', corrected: 'ஜாம்பு' },
};

/**
 * Migration 017's corrections. A separate map because accounts past v11 never
 * run 011 again: the wrong names were English words written in Tamil script or
 * a word for the product rather than the plant.
 */
export const STALE_TAMIL_NAMES_V17: typeof STALE_TAMIL_NAMES = {
  // The split dal (toor paruppu), not the plant.
  'Pigeon Pea': { type: 'vegetable', stale: 'தொவரம்பருப்பு', corrected: 'துவரை' },
  // Just "tuber"; Dioscorea alata is the greater yam.
  Yam: { type: 'vegetable', stale: 'கிழங்கு', corrected: 'பெருவள்ளிக்கிழங்கு' },
  'Water Spinach': { type: 'spinach', stale: 'நீர்க் கீரை', corrected: 'வள்ளைக்கீரை' },
  Breadfruit: { type: 'fruit_tree', stale: 'பிரெட்ஃப்ரூட்', corrected: 'ஈரப்பலா' },
  'Passion Fruit': { type: 'fruit_tree', stale: 'பேஷன் ஃப்ரூட்', corrected: 'கொடித்தோடை' },
  Rosewood: { type: 'timber_tree', stale: 'ரோஸ்வுட்', corrected: 'ஈட்டி' },
  Bougainvillea: { type: 'shrub', stale: 'பூகன்வில்லியா', corrected: 'காகிதப்பூ' },
  Ashwagandha: { type: 'herb', stale: 'அஷ்வகந்தா', corrected: 'அமுக்கரா' },
};

/**
 * Repairs stored Tamil names that still hold the stale bundled string.
 *
 * Returns `null` when there is nothing to do, so the caller can skip the write
 * entirely. A name the user has edited themselves no longer matches `stale` and
 * is left exactly as they set it — this repairs the app's own mistake, not
 * theirs. Idempotent: a second run finds the corrected value and stops.
 */
export function planTamilNameRepair(
  profiles: PlantProfiles,
  corrections: typeof STALE_TAMIL_NAMES = STALE_TAMIL_NAMES
): PlantProfiles | null {
  let changed = false;
  const next: PlantProfiles = { ...profiles };

  for (const [name, { type, stale, corrected }] of Object.entries(corrections)) {
    const entry = profiles[type]?.[name];
    if (!entry || entry.tamilName !== stale) continue;

    next[type] = { ...next[type], [name]: { ...entry, tamilName: corrected } };
    changed = true;
  }

  return changed ? next : null;
}
