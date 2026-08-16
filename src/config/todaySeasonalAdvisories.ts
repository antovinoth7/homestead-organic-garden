import type { AgroClimaticZoneId } from '@/config/zones';
import { TODAY_AGRONOMY_EVIDENCE } from '@/config/tamilNaduPlantingCalendar';
import type { Plant, PlantType } from '@/types/database.types';

export interface SeasonalAdvisory {
  id: string;
  title: string;
  message: string;
  evidenceIds: string[];
  reviewedOn: string;
}

interface SeasonalAdvisoryRule extends SeasonalAdvisory {
  zoneIds: AgroClimaticZoneId[];
  seasonIds: string[];
  hostPlantTypes: PlantType[];
  hostNames: string[];
}

const RULES: SeasonalAdvisoryRule[] = [
  {
    id: 'wet_weather_vegetable_watch',
    title: 'Wet-weather disease watch',
    message:
      'Watch for seedling collapse, spreading leaf spots, or wilting after persistent rain. Improve drainage and confirm symptoms before treating.',
    zoneIds: ['north_eastern', 'cauvery_delta', 'high_rainfall'],
    seasonIds: ['sw_monsoon', 'ne_monsoon'],
    hostPlantTypes: ['vegetable'],
    hostNames: ['Tomato', 'Brinjal', 'Chilli'],
    evidenceIds: ['tnau_zone_crop_planning'],
    reviewedOn: '2026-08-16',
  },
];

export function getTodaySeasonalAdvisory(
  plants: Plant[],
  zoneId: AgroClimaticZoneId,
  seasonId: string,
  date: Date = new Date()
): SeasonalAdvisory | null {
  const match = RULES.find(
    (rule) =>
      rule.zoneIds.includes(zoneId) &&
      rule.seasonIds.includes(seasonId) &&
      rule.evidenceIds.every((id) => {
        const evidence = TODAY_AGRONOMY_EVIDENCE[id];
        return evidence && date <= new Date(`${evidence.validUntil}T23:59:59`);
      }) &&
      plants.some((plant) => {
        if (plant.is_deleted || plant.archived_at) return false;
        if (!rule.hostPlantTypes.includes(plant.plant_type)) return false;
        const names = [plant.name, plant.plant_variety, plant.variety]
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim().toLowerCase().split(/[^a-z]+/));
        return rule.hostNames.some((host) =>
          names.some((tokens) => tokens.includes(host.toLowerCase()))
        );
      })
  );
  if (!match) return null;
  const { id, title, message, evidenceIds, reviewedOn } = match;
  return { id, title, message, evidenceIds, reviewedOn };
}
