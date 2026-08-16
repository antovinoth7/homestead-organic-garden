/// <reference types="jest" />
import {
  resolveActiveZone,
  getZoneByDistrict,
  DEFAULT_ZONE,
  TAMIL_NADU_DISTRICTS,
  DEFAULT_DISTRICT,
} from '../../config/zones';

describe('zones config', () => {
  describe('districts', () => {
    it('lists Kanyakumari first as the default district', () => {
      expect(DEFAULT_DISTRICT).toBe('Kanyakumari');
      expect(TAMIL_NADU_DISTRICTS[0]).toBe('Kanyakumari');
    });

    it('has no duplicate districts', () => {
      expect(new Set(TAMIL_NADU_DISTRICTS).size).toBe(TAMIL_NADU_DISTRICTS.length);
    });

    it('maps the default district to a real zone', () => {
      expect(getZoneByDistrict(DEFAULT_DISTRICT)?.id).toBe(DEFAULT_ZONE.id);
    });

    it('maps every Tamil Nadu district exactly once without a fallback', () => {
      expect(TAMIL_NADU_DISTRICTS).toHaveLength(38);
      for (const district of TAMIL_NADU_DISTRICTS) {
        expect(getZoneByDistrict(district)).not.toBeNull();
      }
      expect(getZoneByDistrict('Not a Tamil Nadu district')).toBeNull();
    });
  });

  describe('resolveActiveZone', () => {
    it('returns null when no resolvable config is provided', () => {
      expect(resolveActiveZone()).toBeNull();
      expect(resolveActiveZone(null)).toBeNull();
      expect(resolveActiveZone({})).toBeNull();
    });

    it('prefers an explicit zone_id', () => {
      expect(resolveActiveZone({ zone_id: DEFAULT_ZONE.id })?.id).toBe(DEFAULT_ZONE.id);
    });

    it('derives the zone from the district when zone_id is absent', () => {
      expect(resolveActiveZone({ district: 'Kanyakumari' })?.id).toBe(DEFAULT_ZONE.id);
    });

    it('resolves non-Kanyakumari districts to their reviewed zone', () => {
      expect(resolveActiveZone({ district: 'Chennai' })?.id).toBe('north_eastern');
      expect(resolveActiveZone({ district: 'Coimbatore' })?.id).toBe('western');
    });

    it('repairs a stale explicit high-rainfall id by trusting the district', () => {
      expect(
        resolveActiveZone({ district: 'Coimbatore', zone_id: 'high_rainfall' })?.id
      ).toBe('western');
    });
  });
});
