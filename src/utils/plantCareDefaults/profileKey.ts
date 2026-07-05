import { PlantType } from '@/types/database.types';

export const buildProfileKey = (plantType: PlantType, plantVariety: string): string =>
  `${plantType}:${plantVariety}`;
