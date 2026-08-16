import {
  getTamilNaduPlantingWindows,
  TAMIL_NADU_PLANTING_RULES,
  TODAY_AGRONOMY_EVIDENCE,
} from '@/config/tamilNaduPlantingCalendar';
import type { AgroClimaticZoneId } from '@/config/zones';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';

const at = (year: number, month: number, day = 16): Date => new Date(year, month - 1, day);
const ZONES: AgroClimaticZoneId[] = [
  'north_eastern',
  'north_western',
  'western',
  'cauvery_delta',
  'southern',
  'south',
  'high_rainfall',
  'hilly',
];

describe('Tamil Nadu Today planting rules', () => {
  it('shows only the explicitly reviewed August home-garden windows', () => {
    const windows = getTamilNaduPlantingWindows('high_rainfall', at(2026, 8));
    expect(windows.state).toBe('available');
    expect(windows.current.map((rule) => [rule.plantName, rule.action])).toEqual([
      ['Amaranthus', 'sow'],
      ['Brinjal', 'transplant'],
      ['Chilli', 'transplant'],
      ['Cluster Beans', 'sow'],
      ['Radish', 'sow'],
    ]);
  });

  it.each(ZONES)('resolves reviewed rules for %s', (zoneId) => {
    const windows = getTamilNaduPlantingWindows(zoneId, at(2026, 8));
    expect(windows.state).toBe('available');
    expect(windows.current.length).toBeGreaterThan(0);
    expect(windows.current.every((rule) => rule.zones.includes(zoneId))).toBe(true);
  });

  it('states unknown irrigation and wet-bed conditions instead of assuming them', () => {
    const western = getTamilNaduPlantingWindows('western', at(2026, 8));
    const highRainfall = getTamilNaduPlantingWindows('high_rainfall', at(2026, 8));

    expect(western.current[0]?.conditions.join(' ')).toContain('reliable irrigation');
    expect(highRainfall.current[0]?.conditions.join(' ')).toContain('water is standing');
    expect(
      western.current[0]?.evidenceIds.includes('tnau_zone_crop_planning')
    ).toBe(true);
  });

  it('distinguishes closing windows from crops continuing next month', () => {
    const windows = getTamilNaduPlantingWindows('western', at(2026, 8));
    expect(windows.closing.map((rule) => rule.plantName)).toEqual([
      'Amaranthus',
      'Brinjal',
      'Chilli',
      'Cluster Beans',
    ]);
    expect(windows.openingNext.map((rule) => rule.plantName)).toEqual([
      'Fenugreek',
      'Palak',
      'Turnip',
    ]);
  });

  it('rolls December into January without falsely closing tomato or radish', () => {
    const windows = getTamilNaduPlantingWindows('south', at(2026, 12));
    expect(windows.current.some((rule) => rule.plantName === 'Tomato')).toBe(true);
    expect(windows.closing.map((rule) => rule.plantName)).not.toContain('Tomato');
    expect(windows.closing.map((rule) => rule.plantName)).not.toContain('Radish');
  });

  it('withholds rules after their source review expires', () => {
    const windows = getTamilNaduPlantingWindows('hilly', at(2027, 8, 17));
    expect(windows.state).toBe('review_expired');
    expect(windows.current).toEqual([]);
    expect(windows.closing).toEqual([]);
    expect(windows.openingNext).toEqual([]);
  });

  it('gives every rule traceable evidence, conditions, and review metadata', () => {
    const ids = new Set<string>();
    for (const rule of TAMIL_NADU_PLANTING_RULES) {
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
      expect(rule.conditions.length).toBeGreaterThan(0);
      expect(rule.windowLabel.length).toBeGreaterThan(0);
      expect(rule.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rule.reviewStatus).toBe('source_reviewed');
      expect(rule.evidenceIds.length).toBeGreaterThan(0);
      for (const evidenceId of rule.evidenceIds) {
        expect(TODAY_AGRONOMY_EVIDENCE[evidenceId]).toMatchObject({
          id: evidenceId,
          reviewStatus: 'source_reviewed',
          scope: expect.stringContaining('Tamil Nadu'),
          accessedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        });
      }
    }
  });

  it('has complete core catalog details for every linked Today crop', () => {
    const crops = new Map(
      TAMIL_NADU_PLANTING_RULES.map((rule) => [`${rule.plantType}:${rule.plantName}`, rule])
    );
    const auditedFields = [
      'scientificName',
      'taxonomicFamily',
      'lifecycle',
      'tamilName',
      'description',
      'daysToHarvest',
      'heightCm',
      'spacingCm',
      'plantingDepthCm',
      'growingSeason',
      'germinationDays',
      'germinationTempC',
      'soilPhRange',
      'heatTolerance',
      'droughtTolerance',
      'waterloggingTolerance',
      'petToxicity',
      'feedingIntensity',
    ] as const;

    for (const rule of crops.values()) {
      const profile = getPlantCareProfile(rule.plantName, rule.plantType);
      expect(profile).not.toBeNull();
      for (const field of auditedFields) {
        expect(profile?.[field]).toBeDefined();
      }
      expect(profile?.daysToHarvest).toEqual(rule.maturityDays);
    }
  });
});
