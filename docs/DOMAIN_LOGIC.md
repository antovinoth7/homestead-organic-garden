# Domain Logic

The Today seasonal experience supports all 38 Tamil Nadu districts. Other older features may still carry Kanyakumari-specific defaults; do not let those defaults enter Today guidance.

## Agro-Climatic Zone System

Season logic, watering multipliers, and pest alerts are parameterized by zone config rather than hardcoded.

- **Zone definitions**: `src/config/zones/` — each zone exports an `AgroClimaticZone` object.
- **Legacy default zone**: `HIGH_RAINFALL_ZONE` (Kanyakumari) remains for backward compatibility outside Today.
- **Zone registry**: `src/config/zones/index.ts` — `getZoneById(id)`, `getZoneByDistrict(district)`, `DEFAULT_ZONE`.
- **Today consumer pattern**: Resolve the saved district with `resolveActiveZone()` and pass the result explicitly. An unknown or missing district must display setup guidance, never use the legacy default.
- **Adding a new zone**: Create a new file in `src/config/zones/`, register it in `src/config/zones/index.ts`.

### Season Model

Every Tamil Nadu zone uses the IMD meteorological boundaries: Winter (`cool_dry`, Jan–Feb), Pre-monsoon (`summer`, Mar–May), SW Monsoon (Jun–Sep), and NE Monsoon (Oct–Dec). Crop pattam/window labels are separate planting-rule metadata and are not season names.

### Today planting and advisory model

- `tamilNaduPlantingCalendar.ts` is the source-reviewed rule registry. Rules carry zone scope, establishment action, window, conditions, maturity measured from that action, evidence IDs, and review date.
- Evidence expires closed: Today hides recommendations when the review date has lapsed.
- Citations live in `TODAY_AGRONOMY_EVIDENCE` and are mirrored in `docs/tamil-nadu-reference-audit.md`. In the app they surface on the catalog plant detail screen, which every Today crop tile opens; the Today card itself prints no source line.
- `todaySeasonalAdvisories.ts` contains non-diagnostic risk rules. A rule must match the resolved zone, current season, and an active host crop.
- Seasonal possibilities never enter `FarmAlert` as `pest_spotted`; that stream is reserved for actual observations.
- Missing values remain omitted. Images are illustrative and are never diagnostic evidence.

---

## Plant Helpers

`src/utils/plantHelpers.ts` contains important domain behavior for:

- Expected harvest dates
- Companion planting
- Pest and disease suggestions
- Coconut age-based care guidance
- Coconut nutrient deficiency guidance

`src/utils/plantCareDefaults/` (directory module — type defaults, variety lists, per-category override shards in `overrides/`, pruning data; assembled by its `index.ts`) provides:

- Plant care profiles
- Pruning techniques
- Static pruning defaults

---

## Season Helpers

`src/utils/seasonHelpers.ts` functions accept an optional `zone?: AgroClimaticZone` param. They default to `DEFAULT_ZONE` for backward compatibility.

Watering frequencies, seasonal pest alerts, and reminders are all zone-aware.
