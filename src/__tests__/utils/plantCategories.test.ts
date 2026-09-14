import { PLANT_CATEGORIES } from '@/utils/plantCategories';
import { PLANT_CATEGORIES as CATALOG_CATEGORIES, DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { CATEGORY_OPTIONS, CATEGORY_LABELS } from '@/utils/plantLabels';

describe('PLANT_CATEGORIES', () => {
  it('covers every category the catalog defines, once each', () => {
    const fromCatalog = Object.keys(DEFAULT_PLANT_CATALOG.categories).sort();
    expect([...PLANT_CATEGORIES].sort()).toEqual(fromCatalog);
    expect(new Set(PLANT_CATEGORIES).size).toBe(PLANT_CATEGORIES.length);
  });

  // The catalog service and the label module each kept their own copy and had
  // drifted — Greens was the last tab in one and the third entry in the other.
  it('is the one order both the tabs and the form options read', () => {
    expect(CATALOG_CATEGORIES).toBe(PLANT_CATEGORIES);
    expect(CATEGORY_OPTIONS.map((option) => option.value)).toEqual(PLANT_CATEGORIES);
  });

  it('puts Greens near the front, where a daily keerai crop belongs', () => {
    expect(PLANT_CATEGORIES.indexOf('spinach')).toBe(2);
    expect(CATEGORY_LABELS.spinach).toBe('Greens');
  });
});
