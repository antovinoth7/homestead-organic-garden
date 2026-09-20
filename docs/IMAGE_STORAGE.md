# Image Storage

Covers **user-captured photos** (plant and journal images). These never go to Firestore or cloud
storage — they are stored on-device only.

For the bundled pest/disease/plant reference photos that ship with the app, see
`docs/REFERENCE_IMAGES.md`.

## Filename Convention

Store only filenames in Firestore and backups:

- Plant photos: `photo_filename`
- Journal photos: `photo_filenames`

Treat local URIs as derived values:

- Plant UI field: `photo_url`
- Journal UI field: `photo_urls`

## API

- Use `saveImageLocallyWithFilename()` from `src/lib/imageStorage.ts` before saving plant or journal records.
- Use `resolveLocalImageUri()` or `resolveLocalImageUris()` before rendering images.

### Module imports are pinned to the legacy APIs — on purpose

`src/lib/imageStorage.ts` imports **`expo-media-library/legacy`** and
**`expo-file-system/legacy`**, not the bare package names. As of SDK 57 both
packages' default exports are new object-oriented APIs (`expo-file-system` split
this way in SDK 54; `expo-media-library` followed in 57), and the imperative
functions this file uses — `getAssetsAsync`, `getAssetInfoAsync`,
`createAssetAsync`, `getAlbumAsync`, `documentDirectory`, `copyAsync`,
`getInfoAsync` — live under `/legacy`.

Do not switch these imports as a side effect of other work. This file has **no
test coverage** and holds the app's largest block of native surface, so an API
drift would surface only as a photo save/load failure on a real device. A planned
migration (with tests written first) is tracked in
`docs/IMPLEMENTATION_ROADMAP.md` → Post-Upgrade Backlog, together with the
deprecated `Constants.appOwnership` Expo Go check in the same file.

## Platform Behavior

- **Android dev builds**: prefer `expo-media-library` storage in `Pictures/GardenPlanner`.
- **Android Expo Go**: fall back to `FileSystem.documentDirectory/garden_images/`.
- **iOS**: use `FileSystem.documentDirectory/garden_images/`.
- **Web**: use blob URLs.

## Migration Behavior

- `App.tsx` runs `migrateImagesToMediaLibrary()` after authentication on Android.
- `src/services/backup.ts` also runs Android migration after image import.
- Preserve this flow when changing image storage.
