import type { AgroClimaticZone, AgroClimaticZoneId, SeasonDefinition } from './types';

const IMD_SEASONS: SeasonDefinition[] = [
  { id: 'cool_dry', name: 'Winter', label: 'Winter (Jan–Feb)', startMonth: 1, endMonth: 2 },
  {
    id: 'summer',
    name: 'Pre-monsoon',
    label: 'Pre-monsoon (Mar–May)',
    startMonth: 3,
    endMonth: 5,
  },
  {
    id: 'sw_monsoon',
    name: 'SW Monsoon',
    label: 'SW Monsoon (Jun–Sep)',
    startMonth: 6,
    endMonth: 9,
  },
  {
    id: 'ne_monsoon',
    name: 'NE Monsoon',
    label: 'NE Monsoon (Oct–Dec)',
    startMonth: 10,
    endMonth: 12,
  },
];

const neutralWatering = (): AgroClimaticZone['wateringMultipliers'] => ({
  summer: { pot: 1, bed: 1, ground: 1 },
  sw_monsoon: { pot: 1, bed: 1, ground: 1 },
  ne_monsoon: { pot: 1, bed: 1, ground: 1 },
  cool_dry: { pot: 1, bed: 1, ground: 1 },
});

/** Statewide meteorological calendar only; never use it as a farm advisory zone. */
export const TAMIL_NADU_METEOROLOGICAL_ZONE: AgroClimaticZone = {
  id: 'tamil_nadu_meteorological',
  name: 'Tamil Nadu meteorological seasons',
  districts: [],
  annualRainfallMm: 0,
  soilTypes: [],
  seasons: IMD_SEASONS,
  wateringMultipliers: neutralWatering(),
  seasonalPestAlerts: {},
  irrigationDominant: 'not_applicable',
};

interface ZoneSeed {
  id: AgroClimaticZoneId;
  name: string;
  districts: string[];
  annualRainfallMm: number;
  soilTypes: string[];
}

function createZone(seed: ZoneSeed): AgroClimaticZone {
  return {
    ...seed,
    seasons: IMD_SEASONS,
    // Today guidance has its own reviewed advisories. Neutral values prevent
    // an unreviewed zone from silently changing recurring care elsewhere.
    wateringMultipliers: neutralWatering(),
    seasonalPestAlerts: {},
    irrigationDominant: 'varies_by_plot',
  };
}

/**
 * Operational Tamil Nadu advisory zones used by the TNAU/IMD agromet bulletins.
 * New districts inherit the advisory unit of their parent district. The app
 * stores a district, not a taluk, so known intra-district boundaries stay a
 * district-level approximation and are never presented as a GPS diagnosis.
 */
export const TAMIL_NADU_ZONES: AgroClimaticZone[] = [
  createZone({
    id: 'north_eastern',
    name: 'North Eastern Zone',
    districts: [
      'Chennai',
      'Tiruvallur',
      'Kancheepuram',
      'Chengalpattu',
      'Cuddalore',
      'Villupuram',
      'Kallakurichi',
      'Tiruvannamalai',
      'Vellore',
      'Ranipet',
      'Tirupathur',
    ],
    annualRainfallMm: 1105,
    soilTypes: ['red_sandy_loam', 'clay_loam', 'coastal_alluvium'],
  }),
  createZone({
    id: 'north_western',
    name: 'North Western Zone',
    districts: ['Dharmapuri', 'Krishnagiri', 'Salem', 'Namakkal'],
    annualRainfallMm: 875,
    soilTypes: ['red_loam', 'brown_soil', 'calcareous_black'],
  }),
  createZone({
    id: 'western',
    name: 'Western Zone',
    districts: ['Erode', 'Tiruppur', 'Coimbatore'],
    annualRainfallMm: 715,
    soilTypes: ['red_loam', 'black_soil'],
  }),
  createZone({
    id: 'cauvery_delta',
    name: 'Cauvery Delta Zone',
    districts: [
      'Thanjavur',
      'Tiruvarur',
      'Nagapattinam',
      'Mayiladuthurai',
      'Ariyalur',
      'Perambalur',
      'Tiruchirappalli',
      'Karur',
    ],
    annualRainfallMm: 985,
    soilTypes: ['alluvial', 'red_loam'],
  }),
  createZone({
    id: 'southern',
    name: 'Southern Zone',
    districts: ['Virudhunagar', 'Tirunelveli', 'Tenkasi', 'Thoothukudi'],
    annualRainfallMm: 857,
    soilTypes: ['black_soil', 'red_sandy_loam', 'coastal_alluvium'],
  }),
  createZone({
    id: 'south',
    name: 'South Zone',
    districts: ['Pudukkottai', 'Madurai', 'Dindigul', 'Theni', 'Ramanathapuram', 'Sivaganga'],
    annualRainfallMm: 857,
    soilTypes: ['black_soil', 'red_sandy_loam', 'coastal_alluvium'],
  }),
  createZone({
    id: 'hilly',
    name: 'Hilly Zone',
    districts: ['The Nilgiris'],
    annualRainfallMm: 2124,
    soilTypes: ['laterite'],
  }),
];
