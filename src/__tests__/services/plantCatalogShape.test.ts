import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { PLANT_VARIETIES_BY_TYPE } from '@/utils/plantCareDefaults/varieties';

/**
 * A byte-for-byte pin on the bundled catalog, kept for one job: the planned
 * refactor replaces the hand-written four-parallel-map literal in
 * `plantCatalog.ts` with a derivation from one record per plant, and this is
 * what proves the derivation produces exactly what the literal did.
 *
 * `dataRegistrySnapshot` already pins the resolved care profiles, but it is
 * keyed on `(plantType, name)` only — it would not notice a Tamil name, a
 * description or a variety list going missing, because those never reach it.
 *
 * So a failure here is a real catalog change, not noise. Update it with `-u`
 * only when you meant to add, remove, rename or re-file a row; during the
 * refactor stages it must pass untouched.
 */
describe('the bundled plant catalog', () => {
  it('is unchanged', () => {
    expect(DEFAULT_PLANT_CATALOG).toMatchSnapshot();
  });

  // Order is load-bearing: `plants` drives the A-Z browse sections and the
  // picker, and a derivation that rebuilt these maps from an object could
  // silently reorder them.
  it('lists every category in a stable order', () => {
    expect(PLANT_VARIETIES_BY_TYPE).toMatchSnapshot();
  });
});
