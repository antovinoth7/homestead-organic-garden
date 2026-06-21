import {
  BED_TYPE_EMOJI,
  BED_TYPE_NAME,
  BED_TYPE_SHORT,
  bedTypeTitle,
} from '@/config/beds/bedTypeMeta';
import type { BedType } from '@/types/database.types';

const ALL_BED_TYPES: BedType[] = [
  'leafy',
  'fruiting',
  'spice',
  'root_legume',
  'climber_trellis',
  'three_sisters',
  'medicinal_guild',
];

describe('bed type metadata', () => {
  it('defines emoji, full name, and short name for every bed type', () => {
    for (const type of ALL_BED_TYPES) {
      expect(BED_TYPE_EMOJI[type]).toBeTruthy();
      expect(BED_TYPE_NAME[type]).toBeTruthy();
      expect(BED_TYPE_SHORT[type]).toBeTruthy();
    }
  });

  it('has no extra keys beyond the known bed types', () => {
    expect(Object.keys(BED_TYPE_EMOJI).sort()).toEqual([...ALL_BED_TYPES].sort());
    expect(Object.keys(BED_TYPE_NAME).sort()).toEqual([...ALL_BED_TYPES].sort());
    expect(Object.keys(BED_TYPE_SHORT).sort()).toEqual([...ALL_BED_TYPES].sort());
  });
});

describe('bedTypeTitle', () => {
  it('builds an emoji + Create + name title', () => {
    expect(bedTypeTitle('leafy', 'create')).toBe('🥬 Create Leafy Greens');
    expect(bedTypeTitle('fruiting', 'create')).toBe('🍅 Create Veggie Bed');
  });

  it('builds an emoji + Edit + name title', () => {
    expect(bedTypeTitle('leafy', 'edit')).toBe('🥬 Edit Leafy Greens');
    expect(bedTypeTitle('three_sisters', 'edit')).toBe('🌽 Edit Three Sisters');
  });

  it('produces a non-empty title for every bed type in both modes', () => {
    for (const type of ALL_BED_TYPES) {
      expect(bedTypeTitle(type, 'create')).toContain('Create');
      expect(bedTypeTitle(type, 'edit')).toContain('Edit');
    }
  });
});
