/**
 * Tamil Nadu districts for onboarding district selection.
 *
 * Only the Kanyakumari high-rainfall zone is fully parameterized today
 * (see `highRainfall.ts`); every other district resolves to DEFAULT_ZONE via
 * `getZoneByDistrict` until Phase H.5 ships full multi-zone tuning. Storing the
 * district + derived `zone_id` now keeps onboarding forward-compatible.
 */

/** All 38 Tamil Nadu districts, Kanyakumari first as the app's default locale. */
export const TAMIL_NADU_DISTRICTS: string[] = [
  'Kanyakumari',
  'Tirunelveli',
  'Thoothukudi',
  'Tenkasi',
  'Virudhunagar',
  'Madurai',
  'Theni',
  'Dindigul',
  'Ramanathapuram',
  'Sivaganga',
  'Pudukkottai',
  'Thanjavur',
  'Tiruvarur',
  'Nagapattinam',
  'Mayiladuthurai',
  'Ariyalur',
  'Perambalur',
  'Tiruchirappalli',
  'Karur',
  'Namakkal',
  'Salem',
  'Dharmapuri',
  'Krishnagiri',
  'Erode',
  'Tiruppur',
  'Coimbatore',
  'The Nilgiris',
  'Cuddalore',
  'Villupuram',
  'Kallakurichi',
  'Chengalpattu',
  'Kancheepuram',
  'Tiruvannamalai',
  'Vellore',
  'Ranipet',
  'Tirupathur',
  'Tiruvallur',
  'Chennai',
];

export const DEFAULT_DISTRICT = 'Kanyakumari';
