/**
 * District → coordinates lookup for weather queries.
 *
 * Open-Meteo needs a lat/lng. When a plot has no manually-entered GPS pin we
 * fall back to the farm's district HQ-town coordinates (district-level accuracy
 * is fine for a 7-day forecast). Keys match `TAMIL_NADU_DISTRICTS`
 * (`./districts.ts`); the Kanyakumari value mirrors `KANYAKUMARI_LAT/LNG` in
 * `@/services/weather` so the per-coordinate weather cache key stays stable.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/** HQ-town coordinates for every Tamil Nadu district. */
export const DISTRICT_COORDINATES: Record<string, Coordinates> = {
  Kanyakumari: { lat: 8.0883, lng: 77.5385 },
  Tirunelveli: { lat: 8.7139, lng: 77.7567 },
  Thoothukudi: { lat: 8.7642, lng: 78.1348 },
  Tenkasi: { lat: 8.9594, lng: 77.3152 },
  Virudhunagar: { lat: 9.568, lng: 77.9624 },
  Madurai: { lat: 9.9252, lng: 78.1198 },
  Theni: { lat: 10.0104, lng: 77.4768 },
  Dindigul: { lat: 10.3624, lng: 77.9695 },
  Ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  Sivaganga: { lat: 9.8433, lng: 78.4809 },
  Pudukkottai: { lat: 10.3833, lng: 78.8001 },
  Thanjavur: { lat: 10.787, lng: 79.1378 },
  Tiruvarur: { lat: 10.7726, lng: 79.6368 },
  Nagapattinam: { lat: 10.7656, lng: 79.8424 },
  Mayiladuthurai: { lat: 11.1018, lng: 79.6552 },
  Ariyalur: { lat: 11.1401, lng: 79.0782 },
  Perambalur: { lat: 11.2342, lng: 78.8807 },
  Tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
  Karur: { lat: 10.9601, lng: 78.0766 },
  Namakkal: { lat: 11.2189, lng: 78.1674 },
  Salem: { lat: 11.6643, lng: 78.146 },
  Dharmapuri: { lat: 12.1211, lng: 78.1582 },
  Krishnagiri: { lat: 12.5186, lng: 78.2137 },
  Erode: { lat: 11.341, lng: 77.7172 },
  Tiruppur: { lat: 11.1085, lng: 77.3411 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  'The Nilgiris': { lat: 11.4102, lng: 76.695 },
  Cuddalore: { lat: 11.748, lng: 79.7714 },
  Villupuram: { lat: 11.9401, lng: 79.4861 },
  Kallakurichi: { lat: 11.7383, lng: 78.9597 },
  Chengalpattu: { lat: 12.6819, lng: 79.9888 },
  Kancheepuram: { lat: 12.8342, lng: 79.7036 },
  Tiruvannamalai: { lat: 12.2253, lng: 79.0747 },
  Vellore: { lat: 12.9165, lng: 79.1325 },
  Ranipet: { lat: 12.9249, lng: 79.3308 },
  Tirupathur: { lat: 12.4955, lng: 78.568 },
  Tiruvallur: { lat: 13.1431, lng: 79.908 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
};

/** Default coordinates when no plot GPS and no known district (Kanyakumari town). */
export const DEFAULT_COORDINATES: Coordinates = { lat: 8.0883, lng: 77.5385 };

/** Coordinates for a district name, or null when unknown/absent. */
export function getDistrictCoordinates(district?: string | null): Coordinates | null {
  if (!district) return null;
  return DISTRICT_COORDINATES[district] ?? null;
}
