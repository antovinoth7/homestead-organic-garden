# Reference Images

Bundled reference photos for pests, diseases, catalog plants, and organic inputs. These illustrative images appear in list rows and detail-screen heroes.

These are committed repo assets under `assets/reference/`, generated once and shipped with the app. They are unrelated to user-captured photos, which are device-local and never committed; see `docs/IMAGE_STORAGE.md`.

## Commands

| Command | Script | What it does |
| --- | --- | --- |
| `npm run reference:manifest` | `scripts/reference/generate-manifest.ts` | Writes the staging manifest and prompt list. |
| `npm run reference:ingest` | `scripts/reference/ingest-images.js` | Converts staged images and regenerates the asset map. |
| `npm run reference:ingest -- --missing-only` | `scripts/reference/ingest-images.js` | Converts only staged images without an existing WebP, then regenerates the asset map. |

`reference:manifest` reads `getAllPests()`, `getAllDiseases()`, `getAllOrganicInputs()`, and `getKnownPlantNames()` and writes into `assets-src/`:

- `manifest.json`: machine-readable ID allow-list consumed by the ingest.
- `PROMPTS.md`: one ready-to-use image-generation prompt per entry, with per-kind coverage counts.

Re-run it after catalog changes or after an ingest to refresh completion counts. Plant names are deduped to their canonical slug via `PLANT_IMAGE_ALIASES`.

`reference:ingest` rewrites `src/config/referenceImages.gen.ts` from staged sources and the committed WebP assets. Pass `-- --missing-only` when adding coverage without re-encoding already bundled images.

## Workflow

Partial coverage is safe: each UI surface falls back to a themed semantic icon when no bundled image exists. Catalog `emoji` fields remain data-compatible but are not used by the primary UI.

1. Run `npm run reference:manifest`.
2. Generate or collect the image described by a missing prompt in `assets-src/PROMPTS.md`.
3. Save the original as the listed filename in `assets-src/pests/`, `assets-src/diseases/`, `assets-src/plants/`, or `assets-src/organic-inputs/`.
4. Run `npm run reference:ingest`.
5. Commit `assets/reference/**` and `src/config/referenceImages.gen.ts` together.

The ingest accepts `.png`, `.jpg`, `.jpeg`, and `.webp` at any resolution. It slugifies filenames, so matching the generated prompt filename is safest.

## Size Budget

The repository currently bundles 225 WebP assets: 141 plants, 36 pests, 36 diseases, and 12 organic inputs. The ingest converts each source to an 800 x 600 cover-cropped WebP, stepping quality from 80 down to 60 until it fits within 160 KB, so the current set adds about 27 MB to the app bundle. Most assets land at q80 and well under the cap; the floor exists for the few busy images that do not.

The constants live in `scripts/reference/ingest-images.js`. `sharp` is a build-time dev dependency and does not ship to the device.

## Image Access

`src/config/referenceImages.gen.ts` contains the generated `PEST_IMAGES`, `DISEASE_IMAGES`, `PLANT_IMAGES`, and `ORGANIC_INPUT_IMAGES` static-require maps. UI code must use the public resolvers in `src/config/referenceAssets.ts`:

- `getPestImage(id, imageAsset?)`
- `getDiseaseImage(id, imageAsset?)`
- `getPlantImage(plantName)`
- `getOrganicInputImage(id, imageAsset?)`

Render sites:

| Consumer | Size |
| --- | --- |
| Pest, disease, and plant list rows | 36 x 36 |
| Journal pest/disease chips | 20 x 20 |
| Pest and disease heroes | full width x 250; tappable fullscreen preview |
| Catalog plant hero | full width x 250; tappable fullscreen preview (shares `ReferenceHero`) |
| Organic-input list cards | 44 x 44 |
| Organic-input hero | full width x 250; tappable fullscreen preview |
| Bed preview pins and crop cards | compact 20–44 px thumbnails with a leaf-icon fallback |

A full-width hero renders the 800 x 600 source at roughly 1.35x on a 1080 px phone, and the
fullscreen preview magnifies it from there. The sources in `assets-src/` are 1448 x 1086, so
there is headroom left: raise `WIDTH`/`HEIGHT`/`MAX_BYTES` in the ingest script and re-run it
for all of them together rather than shrinking one consumer.

Bundle size is the constraint on that headroom — this set was 400 x 300 / 50 KB / q45 and 8.3 MB
until the softness at hero size became the more expensive problem.

## Validation and Staging

`src/__tests__/config/referenceAssets.test.ts` validates that every generated-map key is a known pest, disease, organic-input ID (or declared `imageAsset`), or canonical plant slug.

`assets-src/` is gitignored. Preserve original source images somewhere durable: only the processed assets under `assets/reference/` and their generated TypeScript map belong in commits.
