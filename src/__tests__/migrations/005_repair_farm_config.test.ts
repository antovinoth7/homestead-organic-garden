/**
 * Covers the repair rules for migration 005 through its extracted pure planner,
 * so no Firestore mock is needed (project rule: never mock Firestore).
 */

import { planFarmConfigRepair } from '@/migrations/farmConfigRepairLogic';

const NOW = '2026-08-01T00:00:00.000Z';
const plan = (data: Record<string, unknown>): ReturnType<typeof planFarmConfigRepair> =>
  planFarmConfigRepair(data, () => NOW);

describe('planFarmConfigRepair', () => {
  it('copies a stranded top-level district/zone_id into farmConfig', () => {
    const repaired = plan({ district: 'Tirunelveli', zone_id: 'southern_zone' });

    expect(repaired).toMatchObject({
      district: 'Tirunelveli',
      zone_id: 'southern_zone',
      families_count: 1,
      goals: ['self_sufficiency'],
      updated_at: NOW,
    });
  });

  it('preserves existing farmConfig fields while filling in the district', () => {
    const repaired = plan({
      district: 'Kanyakumari',
      zone_id: 'southern_zone',
      farmConfig: { families_count: 4, goals: ['market'], owner_name: 'Vinoth' },
    });

    expect(repaired).toMatchObject({
      families_count: 4,
      goals: ['market'],
      owner_name: 'Vinoth',
      district: 'Kanyakumari',
    });
  });

  it('does not override a zone_id already set inside farmConfig', () => {
    const repaired = plan({
      district: 'Madurai',
      zone_id: 'legacy_zone',
      farmConfig: { families_count: 1, goals: [], zone_id: 'current_zone' },
    });

    expect(repaired?.zone_id).toBe('current_zone');
  });

  it('is a no-op when farmConfig already carries a district (rerun safety)', () => {
    const data = {
      district: 'Kanyakumari',
      zone_id: 'southern_zone',
      farmConfig: { families_count: 1, goals: [], district: 'Kanyakumari' },
    };

    expect(plan(data)).toBeNull();
    // Applying the migration's own output must not schedule further writes.
    const first = plan({ district: 'Salem', zone_id: 'western_zone' });
    expect(plan({ district: 'Salem', zone_id: 'western_zone', farmConfig: first })).toBeNull();
  });

  it('is a no-op when there is no legacy data to recover', () => {
    expect(plan({})).toBeNull();
    expect(plan({ farmConfig: { families_count: 2, goals: [] } })).toBeNull();
  });

  it('ignores non-string legacy values', () => {
    expect(plan({ district: 42, zone_id: null })).toBeNull();
  });

  it('recovers a district even when zone_id is missing', () => {
    expect(plan({ district: 'Erode' })?.district).toBe('Erode');
  });
});
