# Reference Images

Bundled reference photos for pests, diseases and catalog plants — the illustrative images shown on
detail screens and in list rows.

These are **committed repo assets** under `assets/reference/`, generated once and shipped with the
app. They are unrelated to user-captured photos, which are device-local and never committed — see
`docs/IMAGE_STORAGE.md` for those.

## The Two Commands

| Command | Script | What it does |
| --- | --- | --- |
| `npm run reference:manifest` | `scripts/reference/generate-manifest.ts` | Writes the staging manifest + prompt list |
| `npm run reference:ingest` | `scripts/reference/ingest-images.js` | Converts staged images and regenerates the asset map |

**`reference:manifest`** reads `getAllPests()`, `getAllDiseases()` and `getKnownPlantNames()` from
`src/config` and writes into `assets-src/`:

- `manifest.json` — the id allow-list the ingest validates against.
- `PROMPTS.md` — a human-readable image-generation prompt per entry, with `⬜` / `✅` status and
  per-kind done counts.

Re-run it any time the pest/disease/plant config changes, or to refresh the done counts after an
ingest. Plant names are deduped to a canonical slug via `PLANT_IMAGE_ALIASES` in
`src/config/referenceKeys.ts` (eggplant→brinjal, lime→lemon, moringa→drumstick, …), which is why
there are 88 plant prompts rather than one per catalog name.

**`reference:ingest`** does the conversion and rewrites `src/config/referenceImages.gen.ts`.

## Workflow

Can be done in batches — partial coverage always ships safely.

1. `npm run reference:manifest`
2. Feed a `⬜` prompt from `assets-src/PROMPTS.md` to the image model.
3. Save the output as the listed filename into `assets-src/pests|diseases|plants/`.
   Any of `.png .jpg .jpeg .webp` is accepted **at any resolution — do not pre-shrink**. Hand the
   ingest the largest, cleanest original: it downsamples from the source, so a pre-compressed input
   only costs quality. A 2 MB PNG straight from the model is exactly what it expects.
   Filenames are slugified (`[^a-z0-9]+` → `_`), so `Red Palm Weevil.png` resolves to
   `red_palm_weevil`, but matching `PROMPTS.md` exactly is safest.
4. `npm run reference:ingest`
5. Commit `assets/reference/**` **and** `src/config/referenceImages.gen.ts` together. The gen file
   is regenerated from what is on disk, so committing one without the other silently drops images.

## Size Budget

Constants live in `scripts/reference/ingest-images.js`:

| Constant | Value |
| --- | --- |
| `WIDTH` × `HEIGHT` | 400 × 300 (`fit: 'cover'`) |
| `MAX_BYTES` | 50 KB |
| `QUALITY_START` / `QUALITY_FLOOR` / `QUALITY_STEP` | 80 / 45 / 5 |

Each image is resized to 400×300 and encoded to WebP, stepping quality down from 80 until the
buffer fits under 50 KB. At full coverage that is 160 entries × ≤50 KB ≈ **≤8 MB** added to the app
bundle.

Encoding uses `sharp`, a devDependency — it runs at build time only and never ships to the device.

## Reading the Ingest Output

| Line | Meaning | Fix |
| --- | --- | --- |
| `✔ <file> (N KB @ qNN)` | Converted and written | — |
| `⤳ skipped: … (no matching id "x" in manifest)` | Filename doesn't slugify to a manifest id | Rename to match `PROMPTS.md`, or re-run `reference:manifest` if the config changed |
| `✖ oversize: … (still > 50 KB at quality 45)` | Nothing was written | Busy, high-frequency-detail source — regenerate with shallower depth of field / plainer background rather than editing the constants |
| `⚠ … (id not in manifest — excluded from gen file)` | Stale `.webp` in `assets/reference/` | Delete it |

The per-kind footer (`pests: 12 bundled, 24 missing`) tracks overall progress, and lists the missing
ids when there are 40 or fewer.

## How Images Are Consumed

`src/config/referenceImages.gen.ts` (`PEST_IMAGES` / `DISEASE_IMAGES` / `PLANT_IMAGES`) is
auto-generated and never imported directly by UI. Go through `src/config/referenceAssets.ts`:

- `getPestImage(id, imageAsset?)`
- `getDiseaseImage(id, imageAsset?)`
- `getPlantImage(plantName)`

A missing image returns `undefined` and the UI falls back to an emoji, so partial coverage is always
safe to ship.

Render sites:

| Consumer | Size |
| --- | --- |
| `ReferenceThumb` `variant="row"` — pest/disease/plant list rows | 36×36 |
| `ReferenceThumb` `variant="chip"` — journal pest/disease section | 20×20 |
| Hero on `PestDetailScreen` / `DiseaseDetailScreen` | full width × 240 |
| Hero on `CatalogPlantDetailScreen` | full width × 180 |

**Known tradeoff:** heroes are full-width, so on a 3× screen a 400×300 asset upscales roughly 3×.
This is a deliberate bundle-size choice. Raising `WIDTH` / `HEIGHT` / `MAX_BYTES` in
`ingest-images.js` and re-running the ingest is the single lever if hero sharpness ever matters more
than the ~8 MB budget — everything re-encodes from `assets-src/`, so keep the originals.

## Validation

`src/__tests__/config/referenceAssets.test.ts` asserts every key in the three maps corresponds to a
known pest/disease id (or `imageAsset`) or a canonical plant slug, so a bad ingest fails `npm test`.

## Gotcha: `assets-src/` Is Gitignored

The staging directory — the multi-megabyte originals, `manifest.json` and `PROMPTS.md` — is ignored
by git. Nothing there is backed up by a commit. Keep the source images somewhere durable if the
ingest constants might ever be retuned, since re-tuning re-encodes from those originals.
