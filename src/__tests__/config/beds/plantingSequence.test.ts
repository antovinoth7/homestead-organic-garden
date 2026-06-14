import { getPlantingSequence } from '@/config/beds/plantingSequence';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';

describe('getPlantingSequence', () => {
  it('returns the hand-authored Three Sisters sequence verbatim', () => {
    const seq = getPlantingSequence(GUILD_TEMPLATES.three_sisters);
    expect(seq).toEqual([
      { week: 0, action: 'Sow corn seeds 45 cm apart in rows' },
      { week: 2, action: 'Sow bean seeds at base of each corn stalk' },
      { week: 4, action: 'Transplant or sow pumpkin between rows to cover ground' },
    ]);
  });

  it('derives a multi-week sequence from succession_week for a non-authored guild', () => {
    // root_legume has wave-1 and wave-2 rows (e.g. Black Gram + Radish in wave 2).
    const seq = getPlantingSequence(GUILD_TEMPLATES.root_legume);
    expect(seq.length).toBeGreaterThanOrEqual(2);

    // Weeks are 0-based and spaced two weeks per wave.
    expect(seq[0]!.week).toBe(0);
    expect(seq[1]!.week).toBe(2);

    // Each step names the plants sown in that wave.
    expect(seq[0]!.action).toMatch(/^Sow /);
    expect(seq[1]!.action).toContain('Radish');
  });

  it('returns no sequence when every row shares one wave', () => {
    // spice rows are all succession_week 1 — nothing to sequence.
    expect(getPlantingSequence(GUILD_TEMPLATES.spice)).toEqual([]);
  });
});
