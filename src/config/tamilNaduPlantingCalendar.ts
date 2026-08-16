import type { AgroClimaticZoneId } from '@/config/zones';
import type { NumericRange, PlantNowAction, PlantType } from '@/types/database.types';

export interface AgronomyEvidence {
  id: string;
  publisher: string;
  title: string;
  url: string;
  publishedOn: string | null;
  accessedOn: string;
  reviewedOn: string;
  validUntil: string;
  scope: string;
  reviewStatus: 'source_reviewed';
}

export const TODAY_AGRONOMY_EVIDENCE: Record<string, AgronomyEvidence> = {
  tnau_zone_crop_planning: {
    id: 'tnau_zone_crop_planning',
    publisher: 'Tamil Nadu Agricultural University',
    title: 'Tamil Nadu agrometeorological advisory zone bulletin',
    url: 'https://agritech.tnau.ac.in/agrometeorologicaladvisory/pdf/State%20comp%20AAS%20Bltn%20dtd.%2011.02.25.pdf',
    publishedOn: '2025-02-11',
    accessedOn: '2026-08-16',
    reviewedOn: '2026-08-16',
    validUntil: '2027-08-16',
    scope: 'Tamil Nadu agrometeorological advisory zones',
    reviewStatus: 'source_reviewed',
  },
  tnau_home_garden: {
    id: 'tnau_home_garden',
    publisher: 'Tamil Nadu Agricultural University',
    title: 'Home and roof garden crop selection and raising',
    url: 'https://agritech.tnau.ac.in/horticulture/horti_Landscaping_types%20of%20garden.html',
    publishedOn: null,
    accessedOn: '2026-08-16',
    reviewedOn: '2026-08-16',
    validUntil: '2027-08-16',
    scope: 'Tamil Nadu home and roof gardens',
    reviewStatus: 'source_reviewed',
  },
  tnau_kitchen_garden: {
    id: 'tnau_kitchen_garden',
    publisher: 'Tamil Nadu Agricultural University',
    title: 'Kitchen gardening',
    url: 'https://agritech.tnau.ac.in/horticulture/horti_Landscaping_kitchengarden.html',
    publishedOn: null,
    accessedOn: '2026-08-16',
    reviewedOn: '2026-08-16',
    validUntil: '2027-08-16',
    scope: 'Tamil Nadu kitchen gardens',
    reviewStatus: 'source_reviewed',
  },
  tnau_horticulture_guide: {
    id: 'tnau_horticulture_guide',
    publisher: 'Tamil Nadu Agricultural University',
    title: 'Crop Production Guide — Horticulture',
    url: 'https://www.agritech.tnau.ac.in/pdf/HORTICULTURE.pdf',
    publishedOn: null,
    accessedOn: '2026-08-16',
    reviewedOn: '2026-08-16',
    validUntil: '2027-08-16',
    scope: 'Tamil Nadu horticultural crops',
    reviewStatus: 'source_reviewed',
  },
};

const ALL_ZONES: AgroClimaticZoneId[] = [
  'north_eastern',
  'north_western',
  'western',
  'cauvery_delta',
  'southern',
  'south',
  'high_rainfall',
  'hilly',
];

export interface TamilNaduPlantingRule {
  id: string;
  plantType: PlantType;
  plantName: string;
  action: PlantNowAction;
  months: number[];
  windowLabel: string;
  zones: AgroClimaticZoneId[];
  maturityDays: NumericRange;
  spacingLabel?: string;
  conditions: string[];
  evidenceIds: string[];
  reviewedOn: string;
  reviewStatus: 'source_reviewed';
}

const direct = (
  plantName: string,
  months: number[],
  windowLabel: string,
  maturityDays: NumericRange,
  options: Partial<Pick<TamilNaduPlantingRule, 'plantType' | 'spacingLabel' | 'conditions'>> = {}
): TamilNaduPlantingRule => ({
  id: `home_garden_${plantName.toLowerCase().replace(/\s+/g, '_')}_${months.join('_')}`,
  plantType: options.plantType ?? 'vegetable',
  plantName,
  action: 'sow',
  months,
  windowLabel,
  zones: ALL_ZONES,
  maturityDays,
  spacingLabel: options.spacingLabel,
  conditions: options.conditions ?? ['Use a well-drained home-garden bed.'],
  evidenceIds: ['tnau_home_garden', 'tnau_horticulture_guide'],
  reviewedOn: '2026-08-16',
  reviewStatus: 'source_reviewed',
});

const transplant = (
  plantName: string,
  months: number[],
  windowLabel: string,
  maturityDays: NumericRange,
  spacingLabel?: string
): TamilNaduPlantingRule => ({
  ...direct(plantName, months, windowLabel, maturityDays, { spacingLabel }),
  action: 'transplant',
  conditions: ['Use healthy nursery seedlings about 30–40 days old.', 'Avoid standing water.'],
});

/**
 * Conservative home-garden windows stated explicitly by TNAU. Crop-pattern
 * rows that merely describe an occupied season are not converted into a new
 * sowing month; that was the source of the former over-broad August list.
 */
export const TAMIL_NADU_PLANTING_RULES: TamilNaduPlantingRule[] = [
  direct('Amaranthus', [2, 3], 'February–March window', { min: 25, max: 30 }),
  direct('Amaranthus', [7, 8], 'July–August window', { min: 25, max: 30 }),
  direct('Beetroot', [10, 11, 12], 'October–December window', { min: 90, max: 100 }),
  direct('Bitter Gourd', [2, 3], 'February–March window', { min: 55, max: 60 }, {
    spacingLabel: '1.5–2 m apart with a trellis',
  }),
  transplant('Brinjal', [1, 2], 'Thai pattam · January–February', { min: 45, max: 60 }, '60 cm apart'),
  transplant('Brinjal', [7, 8], 'July–August window', { min: 45, max: 60 }, '60 cm apart'),
  transplant('Chilli', [1, 2], 'Thai pattam · January–February', { min: 50, max: 60 }, '60 cm apart'),
  transplant('Chilli', [7, 8], 'July–August window', { min: 50, max: 60 }, '60 cm apart'),
  direct('Cluster Beans', [7, 8], 'July–August window', { min: 30, max: 35 }, {
    spacingLabel: '15 cm apart in rows 45 cm apart',
  }),
  direct('Cowpea', [1, 2], 'Thai pattam · January–February', { min: 60, max: 65 }, {
    spacingLabel: '45 cm apart',
  }),
  direct('Cucumber', [2, 3], 'February–March window', { min: 45, max: 50 }),
  direct('Fenugreek', [9, 10, 11, 12], 'September–December window', { min: 45, max: 50 }),
  direct('Ladies Finger', [6, 7], 'Aadi pattam · June–July', { min: 30, max: 35 }),
  transplant('Onion', [6, 7], 'Aadi pattam · June–July', { min: 75, max: 80 }, '10 cm apart in rows 15 cm apart'),
  transplant('Onion', [10, 11], 'October–November window', { min: 75, max: 80 }, '10 cm apart in rows 15 cm apart'),
  direct('Radish', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 'Year-round home-garden window', { min: 25, max: 30 }, {
    spacingLabel: '10 cm apart in rows 15 cm apart',
  }),
  direct('Palak', [9, 10], 'Purattasi pattam · September–October', { min: 50, max: 55 }, {
    plantType: 'spinach',
  }),
  transplant('Tomato', [12, 1], 'December–January window', { min: 60, max: 65 }, '60 cm apart'),
  transplant('Tomato', [6, 7], 'Aadi pattam · June–July', { min: 60, max: 65 }, '60 cm apart'),
  direct('Turnip', [9, 10], 'Purattasi pattam · September–October', { min: 40, max: 45 }),
];

export interface TamilNaduPlantingWindows {
  state: 'available' | 'no_current_window' | 'review_expired';
  current: TamilNaduPlantingRule[];
  closing: TamilNaduPlantingRule[];
  openingNext: TamilNaduPlantingRule[];
  /**
   * The month `openingNext` opens in, 1-12. Always set, including when the
   * review has lapsed and the list is empty, so callers can name the month
   * without recomputing the wrap from December to January.
   */
  openingNextMonth: number;
  evidence: AgronomyEvidence[];
}

function isEvidenceCurrent(evidenceId: string, date: Date): boolean {
  const evidence = TODAY_AGRONOMY_EVIDENCE[evidenceId];
  if (!evidence) return false;
  const validThrough = new Date(`${evidence.validUntil}T23:59:59`);
  return date <= validThrough;
}

function ruleKey(rule: TamilNaduPlantingRule): string {
  return `${rule.plantType}:${rule.plantName}:${rule.action}`;
}

function applyZoneConditions(
  rule: TamilNaduPlantingRule,
  zoneId: AgroClimaticZoneId
): TamilNaduPlantingRule {
  const zoneCondition =
    zoneId === 'north_eastern' || zoneId === 'cauvery_delta' || zoneId === 'high_rainfall'
      ? 'Postpone sowing or transplanting while water is standing in the bed.'
      : zoneId === 'hilly'
        ? 'Confirm that the crop temperature and exposure suit the plot elevation.'
        : 'Start only where reliable irrigation or adequate stored soil moisture is available.';
  return {
    ...rule,
    conditions: [...rule.conditions, zoneCondition],
    evidenceIds: [...new Set([...rule.evidenceIds, 'tnau_zone_crop_planning'])],
  };
}

export function getTodayCropEvidence(
  plantType: PlantType,
  plantName: string
): AgronomyEvidence[] {
  const evidenceIds = [
    ...new Set(
      TAMIL_NADU_PLANTING_RULES.filter(
        (rule) => rule.plantType === plantType && rule.plantName === plantName
      ).flatMap((rule) => rule.evidenceIds)
    ),
  ];
  return evidenceIds
    .map((id) => TODAY_AGRONOMY_EVIDENCE[id])
    .filter((entry): entry is AgronomyEvidence => entry !== undefined);
}

export function getTamilNaduPlantingWindows(
  zoneId: AgroClimaticZoneId,
  date: Date = new Date()
): TamilNaduPlantingWindows {
  const zoneRules = TAMIL_NADU_PLANTING_RULES.filter((rule) => rule.zones.includes(zoneId)).map(
    (rule) => applyZoneConditions(rule, zoneId)
  );
  const evidenceIds = [...new Set(zoneRules.flatMap((rule) => rule.evidenceIds))];
  const evidence = evidenceIds
    .map((id) => TODAY_AGRONOMY_EVIDENCE[id])
    .filter((entry): entry is AgronomyEvidence => entry !== undefined);
  const month = date.getMonth() + 1;
  const nextMonth = (month % 12) + 1;

  if (zoneRules.some((rule) => rule.evidenceIds.some((id) => !isEvidenceCurrent(id, date)))) {
    return {
      state: 'review_expired',
      current: [],
      closing: [],
      openingNext: [],
      openingNextMonth: nextMonth,
      evidence,
    };
  }

  const current = zoneRules.filter((rule) => rule.months.includes(month));
  const next = zoneRules.filter((rule) => rule.months.includes(nextMonth));
  const currentKeys = new Set(current.map(ruleKey));
  const nextKeys = new Set(next.map(ruleKey));

  return {
    state: current.length > 0 ? 'available' : 'no_current_window',
    current,
    closing: current.filter((rule) => !nextKeys.has(ruleKey(rule))),
    openingNext: next.filter((rule) => !currentKeys.has(ruleKey(rule))),
    openingNextMonth: nextMonth,
    evidence,
  };
}
