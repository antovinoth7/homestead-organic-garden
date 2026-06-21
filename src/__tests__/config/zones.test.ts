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
      expect(getZoneByDistrict(DEFAULT_DISTRICT).id).toBe(DEFAULT_ZONE.id);
    });
  });

  describe('resolveActiveZone', () => {
    it('falls back to the default zone when no config is provided', () => {
      expect(resolveActiveZone().id).toBe(DEFAULT_ZONE.id);
      expect(resolveActiveZone(null).id).toBe(DEFAULT_ZONE.id);
      expect(resolveActiveZone({}).id).toBe(DEFAULT_ZONE.id);
    });

    it('prefers an explicit zone_id', () => {
      expect(resolveActiveZone({ zone_id: DEFAULT_ZONE.id }).id).toBe(DEFAULT_ZONE.id);
    });

    it('derives the zone from the district when zone_id is absent', () => {
      expect(resolveActiveZone({ district: 'Kanyakumari' }).id).toBe(DEFAULT_ZONE.id);
    });

    it('falls back to the default zone for districts without a tuned zone', () => {
      // Until Phase H.5 ships more zones every TN district resolves to DEFAULT_ZONE.
      expect(resolveActiveZone({ district: 'Chennai' }).id).toBe(DEFAULT_ZONE.id);
    });
  });
});
