import { getAllDiseases } from '@/config/diseases';
import { getAllPests } from '@/config/pests';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import type { DiseaseEntry, PestEntry, PlantType } from '@/types/database.types';

type PlantReference = PestEntry | DiseaseEntry;

/** Broad labels intentionally used by reference entries. */
export const REFERENCE_GROUP_BY_PLANT_TYPE: Partial<Record<PlantType, string>> = {
  vegetable: 'Vegetables',
  fruit_tree: 'Fruit trees',
  coconut_tree: 'Coconut',
  flower: 'Flower crops',
  timber_tree: 'Timber trees',
};

/** Legitimate hosts mentioned by the regional guide but not offered by the plant catalog. */
export const RECOGNISED_EXTERNAL_HOSTS = new Set([
  'Citrus',
  'Cotton',
  'Lime',
  'Orange',
  'Tamarind',
]);

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('en-IN');
}

function referenceAppliesToPlant(
  reference: PlantReference,
  plantName: string,
  plantType: PlantType
): boolean {
  const acceptedLabels = new Set(
    [plantName, REFERENCE_GROUP_BY_PLANT_TYPE[plantType]].filter(Boolean).map((name) =>
      normalise(name!)
    )
  );

  return reference.plantsAffected.some((host) => acceptedLabels.has(normalise(host)));
}

export interface PlantReferenceCoverage {
  plantName: string;
  plantType: PlantType;
  pestIds: string[];
  diseaseIds: string[];
}

/**
 * Cross-reference the pest and disease application labels against every catalog
 * plant. The result makes missing coverage explicit instead of implying that a
 * short regional guide is exhaustive.
 */
export function getPlantReferenceCoverage(): PlantReferenceCoverage[] {
  const results: PlantReferenceCoverage[] = [];

  for (const [plantType, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
    for (const plantName of category.plants) {
      results.push({
        plantName,
        plantType: plantType as PlantType,
        pestIds: getAllPests()
          .filter((pest) => referenceAppliesToPlant(pest, plantName, plantType as PlantType))
          .map((pest) => pest.id),
        diseaseIds: getAllDiseases()
          .filter((disease) => referenceAppliesToPlant(disease, plantName, plantType as PlantType))
          .map((disease) => disease.id),
      });
    }
  }

  return results;
}

/** Return affected-plant labels that are neither catalog plants, groups, nor reviewed external hosts. */
export function getUnknownReferenceHosts(): string[] {
  const catalogHosts = Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap(
    (category) => category.plants
  );
  const knownHosts = new Set(
    [
      ...catalogHosts,
      ...Object.values(REFERENCE_GROUP_BY_PLANT_TYPE),
      ...RECOGNISED_EXTERNAL_HOSTS,
    ].map(normalise)
  );

  return [
    ...new Set(
      [...getAllPests(), ...getAllDiseases()]
        .flatMap((reference) => reference.plantsAffected)
        .filter((host) => !knownHosts.has(normalise(host)))
    ),
  ].sort();
}
