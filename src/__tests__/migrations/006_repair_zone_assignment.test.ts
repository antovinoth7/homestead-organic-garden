import { planZoneAssignmentRepair } from '@/migrations/zoneAssignmentRepairLogic';

const NOW = '2026-08-16T00:00:00.000Z';
const plan = (
  data: Record<string, unknown>
): ReturnType<typeof planZoneAssignmentRepair> => planZoneAssignmentRepair(data, () => NOW);

describe('planZoneAssignmentRepair', () => {
  it('repairs non-Kanyakumari farms that inherited high_rainfall', () => {
    expect(
      plan({
        farmConfig: {
          district: 'Coimbatore',
          zone_id: 'high_rainfall',
          families_count: 3,
          goals: ['self_sufficiency'],
          owner_name: 'Garden owner',
        },
      })
    ).toEqual({
      district: 'Coimbatore',
      zone_id: 'western',
      families_count: 3,
      goals: ['self_sufficiency'],
      owner_name: 'Garden owner',
      updated_at: NOW,
    });
  });

  it('repairs any stale known zone id from the saved district', () => {
    expect(
      plan({ farmConfig: { district: 'Chennai', zone_id: 'south', families_count: 1, goals: [] } })
        ?.zone_id
    ).toBe('north_eastern');
  });

  it('is idempotent once the district and zone agree', () => {
    const data = {
      farmConfig: { district: 'Kanyakumari', zone_id: 'high_rainfall', families_count: 1, goals: [] },
    };
    expect(plan(data)).toBeNull();
  });

  it('withholds a repair for missing or unknown districts', () => {
    expect(plan({ farmConfig: { zone_id: 'high_rainfall' } })).toBeNull();
    expect(
      plan({ farmConfig: { district: 'Unknown district', zone_id: 'high_rainfall' } })
    ).toBeNull();
  });
});
