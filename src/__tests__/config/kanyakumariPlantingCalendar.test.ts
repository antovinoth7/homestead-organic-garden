import {
  getKanyakumariPlantingRecommendations,
  KANYAKUMARI_PLANTING_CALENDAR,
} from '@/config/kanyakumariPlantingCalendar';

const at = (month: number): Date => new Date(2026, month - 1, 15);

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
      { plantType: 'vegetable', variety: 'Brinjal', action: 'transplant' },
      { plantType: 'vegetable', variety: 'Chilli', action: 'transplant' },
      { plantType: 'vegetable', variety: 'Cluster Beans', action: 'sow' },
      { plantType: 'vegetable', variety: 'Radish', action: 'sow' },
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
