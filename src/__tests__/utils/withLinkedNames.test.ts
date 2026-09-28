import { withLinkedNames } from '@/utils/plantHelpers';

describe('withLinkedNames', () => {
  it('appends the farmer’s linked names after the built-in list', () => {
    expect(withLinkedNames(['Aphids', 'Fruit Borer'], ['Tea Mosquito Bug'])).toEqual([
      'Aphids',
      'Fruit Borer',
      'Tea Mosquito Bug',
    ]);
  });

  it('drops a linked name the built-in list already has, whatever its case', () => {
    expect(withLinkedNames(['Aphids'], ['aphids', ' Mealybug '])).toEqual(['Aphids', 'Mealybug']);
  });

  it('returns the built-in list alone when nothing is linked', () => {
    expect(withLinkedNames(['Aphids'], undefined)).toEqual(['Aphids']);
  });
});
