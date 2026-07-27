import {
  getAllOrganicInputs,
  getOrganicInputById,
  getOrganicInputByName,
  getOrganicInputsByCategory,
  getGroupedOrganicInputs,
  getCategoryLabel,
  formatIdealFor,
  getRecipeById,
  ORGANIC_RECIPES,
  CATEGORY_DESCRIPTIONS,
} from '@/config/organicInputs';
import type { OrganicInputCategory } from '@/types/database.types';

describe('Organic Input Registry', () => {
  const inputs = getAllOrganicInputs();

  it('has unique ids', () => {
    const ids = inputs.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has the fields the list and detail screens render', () => {
    inputs.forEach((input) => {
      expect(input.id).toBeTruthy();
      expect(input.name).toBeTruthy();
      expect(input.emoji).toBeTruthy();
      expect(input.description).toBeTruthy();
      expect(input.category).toBeTruthy();
      expect(Array.isArray(input.plantsIdeal)).toBe(true);
    });
  });

  it('every category in use has a label and a help description', () => {
    inputs.forEach((input) => {
      expect(getCategoryLabel(input.category)).toBeTruthy();
      expect(CATEGORY_DESCRIPTIONS[input.category]).toBeTruthy();
    });
  });

  describe('recipe linkage', () => {
    it('every recipeId resolves to a real recipe', () => {
      inputs
        .filter((i) => i.recipeId)
        .forEach((input) => {
          expect(getRecipeById(input.recipeId)).toBeDefined();
        });
    });

    it('every recipe is reachable from a catalog entry', () => {
      const linked = new Set(inputs.map((i) => i.recipeId).filter(Boolean));
      ORGANIC_RECIPES.forEach((recipe) => {
        expect(linked.has(recipe.id)).toBe(true);
      });
    });

    it('no two inputs claim the same recipe', () => {
      const linked = inputs.map((i) => i.recipeId).filter(Boolean);
      expect(new Set(linked).size).toBe(linked.length);
    });
  });

  describe('lookups', () => {
    it('getOrganicInputById finds a known entry and misses cleanly', () => {
      expect(getOrganicInputById('compost_basic')?.name).toBe('Compost');
      expect(getOrganicInputById('not_a_real_input')).toBeUndefined();
    });

    it('getOrganicInputByName is case-insensitive', () => {
      expect(getOrganicInputByName('  nEEm ExTrAcT ')?.id).toBe('neem');
      expect(getOrganicInputByName('nothing')).toBeUndefined();
    });

    it('getOrganicInputsByCategory returns only that category', () => {
      const promoters = getOrganicInputsByCategory('growth_promoters');
      expect(promoters.length).toBeGreaterThan(0);
      promoters.forEach((i) => expect(i.category).toBe('growth_promoters'));
    });
  });

  describe('getGroupedOrganicInputs', () => {
    const groups = getGroupedOrganicInputs();

    it('accounts for every input exactly once', () => {
      const grouped = groups.flatMap((g) => g.inputs);
      expect(grouped).toHaveLength(inputs.length);
      expect(new Set(grouped.map((i) => i.id)).size).toBe(inputs.length);
    });

    it('emits no empty groups', () => {
      groups.forEach((g) => expect(g.inputs.length).toBeGreaterThan(0));
    });

    it('orders categories fertilizers → promoters → amendments → biopesticides', () => {
      const expected: OrganicInputCategory[] = [
        'fertilizers',
        'growth_promoters',
        'soil_amendments',
        'biopesticides',
      ];
      expect(groups.map((g) => g.category)).toEqual(
        expected.filter((c) => groups.some((g) => g.category === c))
      );
    });

    it('labels each group', () => {
      groups.forEach((g) => expect(g.label).toBe(getCategoryLabel(g.category)));
    });
  });

  describe('formatIdealFor', () => {
    it('maps known slugs to reader-facing labels', () => {
      expect(formatIdealFor('leafy')).toBe('Leafy greens');
      expect(formatIdealFor('all crops')).toBe('All crops');
    });

    it('is insensitive to case and surrounding space', () => {
      expect(formatIdealFor('  Herbs ')).toBe('Herbs');
    });

    it('sentence-cases an unmapped slug rather than rendering it raw', () => {
      expect(formatIdealFor('mystery gourd')).toBe('Mystery gourd');
    });
  });
});
