import type { PlantCareProfile } from '@/types/database.types';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';

/**
 * Botanical identity for the nine catalog plants that carry no care-profile
 * shard of their own and so fall back to bare type defaults.
 *
 * Deliberately only the three *factual* fields — binomial, family and lifecycle.
 * Watering intervals, spacing and harvest windows are agronomic recommendations
 * for Tamil Nadu and are not invented here; those plants keep their type
 * defaults until someone with local knowledge fills them in.
 *
 * Why it matters that these three are present:
 * - `taxonomicFamily` is what `getCropFamily` reads for crop rotation. Without
 *   it, Ponnanganni Keerai and Mustard Greens both resolved to `other`, so a
 *   bed could repeat a family unnoticed.
 * - `lifecycle` is what `deriveInstanceLifecycle` reads, and it is persisted as
 *   `lifecycle_type`. Without it the `spinach` fallback made every one of these
 *   an annual — wrong for the three creeping perennial keerai below.
 *
 * Applied as a partial merge over the assembled profile (see
 * `plantCareDefaults/index.ts`), the same way `TODAY_RECOMMENDATION_CROP_OVERRIDES`
 * layers its corrections.
 */
export const BOTANICAL_IDENTITY_OVERRIDES: Record<string, Partial<PlantCareProfile>> = {
  // ── vegetable ────────────────────────────────────────────────────────────
  // Kohlrabi is botanically biennial, but like Cauliflower above it is lifted
  // inside one season, so `annual` is the answer bed management needs.
  [buildProfileKey('vegetable', 'Knol Khol')]: {
    scientificName: 'Brassica oleracea var. gongylodes',
    taxonomicFamily: 'Brassicaceae',
    lifecycle: 'annual',
  },
  // The three perennial legume vines. All are grown as annuals elsewhere, but on
  // a Tamil Nadu pandal they carry over, and they are perennials botanically.
  [buildProfileKey('vegetable', 'Lablab Bean')]: {
    scientificName: 'Lablab purpureus',
    taxonomicFamily: 'Fabaceae',
    lifecycle: 'perennial',
  },
  [buildProfileKey('vegetable', 'Winged Bean')]: {
    scientificName: 'Psophocarpus tetragonolobus',
    taxonomicFamily: 'Fabaceae',
    lifecycle: 'perennial',
  },
  [buildProfileKey('vegetable', 'Sword Bean')]: {
    scientificName: 'Canavalia gladiata',
    taxonomicFamily: 'Fabaceae',
    lifecycle: 'perennial',
  },

  // ── spinach (Greens) ─────────────────────────────────────────────────────
  // Ipomoea aquatica is a convolvulaceae — not a spinach, despite the name, and
  // not in the same rotation family as Palak.
  [buildProfileKey('spinach', 'Water Spinach')]: {
    scientificName: 'Ipomoea aquatica',
    taxonomicFamily: 'Convolvulaceae',
    lifecycle: 'perennial',
  },
  // The creeping perennial keerai: they root as they run and are cut repeatedly
  // rather than resown, which the `spinach` annual fallback got wrong.
  [buildProfileKey('spinach', 'Ponnanganni Keerai')]: {
    scientificName: 'Alternanthera sessilis',
    taxonomicFamily: 'Amaranthaceae',
    lifecycle: 'perennial',
  },
  [buildProfileKey('spinach', 'Vallarai Keerai')]: {
    scientificName: 'Centella asiatica',
    taxonomicFamily: 'Apiaceae',
    lifecycle: 'perennial',
  },
  // Solanum nigrum — a solanaceae keerai, so it shares a rotation family with
  // Brinjal and Tomato. Worth knowing before it follows them in a bed.
  [buildProfileKey('spinach', 'Manathakkali Keerai')]: {
    scientificName: 'Solanum nigrum',
    taxonomicFamily: 'Solanaceae',
    lifecycle: 'annual',
  },
  [buildProfileKey('spinach', 'Mustard Greens')]: {
    scientificName: 'Brassica juncea',
    taxonomicFamily: 'Brassicaceae',
    lifecycle: 'annual',
  },
};
