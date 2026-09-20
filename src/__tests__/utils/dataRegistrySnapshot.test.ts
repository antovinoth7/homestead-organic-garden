import { getAllDiseases } from '@/config/diseases';
import { getAllPests } from '@/config/pests';
import { PlantCareProfile } from '@/types/database.types';
import {
  getPlantCareProfile,
  getPlantingCandidates,
  getStaticPruningDefaults,
  PruningInfo,
} from '@/utils/plantCareDefaults';

// Guards the data-module split refactor: the assembled registries must stay
// byte-identical no matter how the underlying data files are sharded.
describe('data registry snapshots', () => {
  it('pest registry is unchanged', () => {
    expect(getAllPests()).toMatchSnapshot();
  });

  it('disease registry is unchanged', () => {
    expect(getAllDiseases()).toMatchSnapshot();
  });

  it('care profiles and pruning defaults for every variety are unchanged', () => {
    const byKey: Record<string, { profile: PlantCareProfile | null; pruning: PruningInfo }> = {};
    for (const candidate of getPlantingCandidates()) {
      byKey[`${candidate.plantType}:${candidate.variety}`] = {
        profile: getPlantCareProfile(candidate.variety, candidate.plantType),
        pruning: getStaticPruningDefaults(candidate.plantType, candidate.variety),
      };
    }
    expect(byKey).toMatchSnapshot();
  });
});
