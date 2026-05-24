import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import type { CropFamily } from '@/types/database.types';

/**
 * Look up the CropFamily for a plant name by scanning all guild templates'
 * plant_rows. Used when persisting wizard placeholders so the resulting Plant
 * has the family needed for rotation tracking. Returns null when no template
 * mentions the plant.
 */
export function cropFamilyFromName(name: string): CropFamily | null {
  const target = name.trim().toLowerCase();
  if (!target) return null;
  for (const template of Object.values(GUILD_TEMPLATES)) {
    for (const row of template.plant_rows) {
      if (row.name.toLowerCase() === target) {
        return row.crop_family;
      }
    }
  }
  return null;
}
