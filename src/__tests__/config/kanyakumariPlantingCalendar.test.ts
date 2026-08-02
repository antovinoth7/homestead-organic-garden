import {
  getKanyakumariPlantingRecommendations,
  KANYAKUMARI_PLANTING_CALENDAR,
} from '@/config/kanyakumariPlantingCalendar';

const at = (month: number) => new Date(2026, month - 1, 15);

describe('Kanyakumari planting calendar', () => {
  it('contains a reviewed set for all twelve months', () => {
    expect(Object.keys(KANYAKUMARI_PLANTING_CALENDAR)).toHaveLength(12);
    for (let month = 1; month <= 12; month += 1) {
      expect(getKanyakumariPlantingRecommendations(at(month)).length).toBeGreaterThan(0);
    }
  });

  it('shows the August monsoon set in reviewed order', () => {
    expect(getKanyakumariPlantingRecommendations(at(8))).toEqual([
      { plantType: 'vegetable', variety: 'Amaranthus', action: 'sow' },
      { plantType: 'vegetable', variety: 'Ladies Finger', action: 'sow' },
      { plantType: 'vegetable', variety: 'Ash Gourd', action: 'sow' },
      { plantType: 'vegetable', variety: 'Pumpkin', action: 'sow' },
      { plantType: 'vegetable', variety: 'Snake Gourd', action: 'sow' },
      { plantType: 'vegetable', variety: 'Brinjal', action: 'transplant' },
      { plantType: 'vegetable', variety: 'Chilli', action: 'transplant' },
    ]);
  });

  it('contains food crops only', () => {
    for (const entries of Object.values(KANYAKUMARI_PLANTING_CALENDAR)) {
      for (const entry of entries) {
        expect(['vegetable', 'spinach']).toContain(entry.plantType);
      }
    }
  });
});
