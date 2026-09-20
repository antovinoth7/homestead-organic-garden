import { getDiseaseById } from '@/config/diseases';
import { getOrganicInputById } from '@/config/organicInputs';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import {
  getPlantReferenceCoverage,
  getUnknownReferenceHosts,
} from '@/utils/referencePlantCoverage';

describe('Tamil Nadu reference-data accuracy checks', () => {
  it('uses pathogen categories that match the stated causal organism', () => {
    expect(getDiseaseById('panama_wilt')?.category).toBe('fungal');
    expect(getDiseaseById('thanjavur_wilt')?.category).toBe('fungal');
    expect(getDiseaseById('greening_disease')?.category).toBe('bacterial');
    expect(getDiseaseById('root_wilt')?.category).toBe('phytoplasma');
    expect(getDiseaseById('little_leaf_disease')?.category).toBe('phytoplasma');
  });

  it('contains no unreviewed affected-plant labels', () => {
    expect(getUnknownReferenceHosts()).toEqual([]);
  });

  it('reports application coverage for every catalog row', () => {
    const coverage = getPlantReferenceCoverage();
    const catalogRows = Object.values(DEFAULT_PLANT_CATALOG.categories).reduce(
      (total, category) => total + category.plants.length,
      0
    );
    expect(coverage).toHaveLength(catalogRows);
    expect(coverage.find((row) => row.plantName === 'Tomato')?.pestIds.length).toBeGreaterThan(0);
    expect(
      coverage.find((row) => row.plantName === 'Tomato')?.diseaseIds.length
    ).toBeGreaterThan(0);
  });

  it('keeps corrected organic-input safety and localisation details', () => {
    expect(getOrganicInputById('pongamia')?.tamilName).toBe('புங்க எண்ணெய்');
    expect(getOrganicInputById('sulfur')?.applicationRate).toContain('soil-test');
    expect(getOrganicInputById('neem')?.applicationRate).toContain('3-5 mL per litre');
  });
});
