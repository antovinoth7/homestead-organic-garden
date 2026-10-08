import { AgroClimaticZone } from './types';

export const HIGH_RAINFALL_ZONE: AgroClimaticZone = {
  id: 'high_rainfall',
  name: 'High Rainfall Zone',
  districts: ['Kanyakumari'],
  annualRainfallMm: 1361.2,
  soilTypes: ['laterite', 'alluvial', 'red_sandy_loam'],
  irrigationDominant: 'well',

  seasons: [
    {
      id: 'cool_dry',
      name: 'Winter',
      label: 'Winter (Jan\u2013Feb)',
      startMonth: 1,
      endMonth: 2,
    },
    {
      id: 'summer',
      name: 'Pre-monsoon',
      label: 'Pre-monsoon (Mar\u2013May)',
      startMonth: 3,
      endMonth: 5,
    },
    {
      id: 'sw_monsoon',
      name: 'SW Monsoon',
      label: 'SW Monsoon (Jun\u2013Sep)',
      startMonth: 6,
      endMonth: 9,
    },
    {
      id: 'ne_monsoon',
      name: 'NE Monsoon',
      label: 'NE Monsoon (Oct\u2013Dec)',
      startMonth: 10,
      endMonth: 12,
    },
  ],

  wateringMultipliers: {
    summer: { pot: 0.5, bed: 0.6, ground: 0.6 },
    sw_monsoon: { pot: 1.2, bed: 2.5, ground: 2.5 },
    ne_monsoon: { pot: 1.5, bed: 3.0, ground: 3.0 },
    cool_dry: { pot: 1.0, bed: 1.0, ground: 1.0 },
  },
};
