import { recomputePlantFields } from '@/migrations/recomputedPlantFieldsLogic';

describe('recomputePlantFields', () => {
  describe('lifecycle_type — the fruit_tree/permanent bug', () => {
    it('moves the replanted and ratooned fruits off `permanent`', () => {
      // These are the five `fruit_tree` entries that are not trees. Being
      // `permanent` excluded them from the recurring harvest-leaves task.
      for (const variety of ['Banana', 'Red Banana', 'Papaya', 'Pineapple', 'Passion Fruit']) {
        expect(
          recomputePlantFields({
            plant_variety: variety,
            plant_type: 'fruit_tree',
            lifecycle_type: 'permanent',
            crop_family: null,
          })?.lifecycle_type
        ).toBe('perennial');
      }
    });

    it('leaves the orchard trees, timber and coconuts `permanent`', () => {
      const cases: [string, string][] = [
        ['Mango', 'fruit_tree'],
        ['Jackfruit', 'fruit_tree'],
        ['Arecanut', 'fruit_tree'],
        ['Teak', 'timber_tree'],
        ['Tall Coconut', 'coconut_tree'],
      ];
      for (const [variety, plant_type] of cases) {
        const changes = recomputePlantFields({
          plant_variety: variety,
          plant_type,
          lifecycle_type: 'permanent',
          crop_family: 'other',
        });
        expect(changes?.lifecycle_type).toBeUndefined();
      }
    });

    it('corrects the creeping perennial keerai that defaulted to annual', () => {
      for (const variety of ['Ponnanganni Keerai', 'Vallarai Keerai', 'Water Spinach']) {
        expect(
          recomputePlantFields({
            plant_variety: variety,
            plant_type: 'spinach',
            lifecycle_type: 'annual',
            crop_family: null,
          })?.lifecycle_type
        ).toBe('perennial');
      }
    });

    it('leaves a genuinely annual bed crop alone', () => {
      expect(
        recomputePlantFields({
          plant_variety: 'Tomato',
          plant_type: 'vegetable',
          lifecycle_type: 'annual',
          crop_family: 'solanaceae',
        })
      ).toBeNull();
    });
  });

  describe('crop_family — the rotation gap', () => {
    it('fills in the families the guild-template scan never resolved', () => {
      const cases: [string, string, string][] = [
        ['Potato', 'vegetable', 'solanaceae'],
        ['Cabbage', 'vegetable', 'brassica'],
        ['Onion', 'vegetable', 'allium'],
        ['Cucumber', 'vegetable', 'cucurbit'],
        ['Amaranthus', 'spinach', 'amaranthaceae'],
        ['Turmeric', 'herb', 'zingiberaceae'],
      ];
      for (const [plant_variety, plant_type, expected] of cases) {
        expect(
          recomputePlantFields({ plant_variety, plant_type, lifecycle_type: null, crop_family: null })
            ?.crop_family
        ).toBe(expected);
      }
    });

    it('falls back to the plant name when there is no variety', () => {
      expect(
        recomputePlantFields({
          plant_variety: null,
          name: 'Brinjal',
          plant_type: 'vegetable',
          lifecycle_type: null,
          crop_family: null,
        })?.crop_family
      ).toBe('solanaceae');
    });
  });

  describe('idempotence and bad input', () => {
    it('returns null once both fields are already right, so a re-run is free', () => {
      expect(
        recomputePlantFields({
          plant_variety: 'Mango',
          plant_type: 'fruit_tree',
          lifecycle_type: 'permanent',
          crop_family: 'other',
        })
      ).toBeNull();
    });

    it('returns only the field that changed', () => {
      const changes = recomputePlantFields({
        plant_variety: 'Banana',
        plant_type: 'fruit_tree',
        lifecycle_type: 'permanent',
        crop_family: 'other',
      });
      expect(changes).toEqual({ lifecycle_type: 'perennial' });
    });

    it('skips a document with no or unknown plant_type', () => {
      expect(recomputePlantFields({ plant_variety: 'Tomato', plant_type: null })).toBeNull();
      expect(recomputePlantFields({ plant_variety: 'Tomato', plant_type: 'sasquatch' })).toBeNull();
    });

    it('skips a document with neither variety nor name', () => {
      expect(recomputePlantFields({ plant_type: 'vegetable' })).toBeNull();
    });
  });
});
