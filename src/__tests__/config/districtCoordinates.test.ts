import {
  DISTRICT_COORDINATES,
  DEFAULT_COORDINATES,
  getDistrictCoordinates,
} from '@/config/zones/districtCoordinates';
import { TAMIL_NADU_DISTRICTS } from '@/config/zones/districts';

describe('districtCoordinates', () => {
  it('has coordinates for every Tamil Nadu district (guards future omissions)', () => {
    for (const district of TAMIL_NADU_DISTRICTS) {
      expect(DISTRICT_COORDINATES[district]).toBeDefined();
    }
  });

  it('keeps every coordinate within Tamil Nadu-ish bounds', () => {
    for (const { lat, lng } of Object.values(DISTRICT_COORDINATES)) {
      expect(lat).toBeGreaterThan(7);
      expect(lat).toBeLessThan(14);
      expect(lng).toBeGreaterThan(76);
      expect(lng).toBeLessThan(81);
    }
  });

  it('defaults to Kanyakumari and matches the legacy weather constants', () => {
    expect(DEFAULT_COORDINATES).toEqual({ lat: 8.0883, lng: 77.5385 });
    expect(DISTRICT_COORDINATES.Kanyakumari).toEqual({ lat: 8.0883, lng: 77.5385 });
  });

  it('returns null for unknown or empty district names', () => {
    expect(getDistrictCoordinates('Atlantis')).toBeNull();
    expect(getDistrictCoordinates(null)).toBeNull();
    expect(getDistrictCoordinates(undefined)).toBeNull();
  });
});
