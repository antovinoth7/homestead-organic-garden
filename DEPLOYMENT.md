# Deployment Guide

This app uses [EAS Build](https://docs.expo.dev/build/introduction/) for building and distributing production binaries.

## Prerequisites

- Node.js 20.19.4+ (22 and 24 also supported; CI runs 24). React Native 0.86
  will not build on Node 18.
- Expo CLI: use the project-local CLI via `npx expo` — do **not** install the
  deprecated global `expo-cli` package.
- EAS CLI: `npm install -g eas-cli`
- An [Expo account](https://expo.dev/signup) linked via `eas login`
- Firebase project configured (see `README.md` for setup)

## Build Profiles

Build profiles are defined in `eas.json`:

| Profile       | Purpose                            | Distribution  |
| ------------- | ---------------------------------- | ------------- |
| `development` | Dev client for local testing       | Internal      |
| `preview`     | Internal testing builds            | Internal      |
| `production`  | Release builds for direct download | APK (Android) |
| `play`        | Google Play submission             | AAB (Android) |

## Building

### Development Build

```bash
eas build --profile development --platform android
```

### Preview Build (Internal Testing)

```bash
eas build --profile preview --platform android
```

### Production Build

```bash
eas build --profile production --platform android
```

The production profile outputs an APK (`"buildType": "apk"` in `eas.json`). Version numbers auto-increment via `"appVersionSource": "remote"`.

#### Android ABIs — why the two profiles differ

An Android build packages native libraries (`.so`) once per CPU architecture.
With nothing configured, the build produces a **universal APK carrying all four**
— `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` — even though any given device uses
exactly one. That is most of the APK's size.

The set is chosen by the `reactNativeArchitectures` Gradle property, which the
React Native Gradle plugin reads to set `abiFilters`. Both profiles set it via
`ORG_GRADLE_PROJECT_reactNativeArchitectures` in their `env` block — Gradle turns
any `ORG_GRADLE_PROJECT_*` variable into a project property, so this needs no
extra package and no change to the generated `android/` project.

- **`production` → `arm64-v8a` only.** One 64-bit APK handed straight to users.
  Every Android phone sold since roughly 2017 is arm64, and Play has required
  64-bit support since 2019.
- **`play` → all four.** Play splits an app bundle per device, so each user still
  downloads one architecture. Keeping all four costs them nothing and preserves
  installs on 32-bit handsets and x86 Chromebooks — so the Play build stays
  maximally compatible even though the direct APK does not.

The native payload is roughly **23 MB per architecture**, so each one dropped is
worth about that much.

| Build                                  | ABIs     | Size            |
| -------------------------------------- | -------- | --------------- |
| Before any of this                     | all four | 138 MB          |
| Dropped `x86`, `x86_64` (+ icon fonts) | 2        | 88 MB           |
| Dropped `armeabi-v7a`                  | 1        | ~65 MB expected |

The remaining bulk is ~32 MB of bundled reference images, ~23 MB of native code,
~8 MB of Hermes bytecode and ~2 MB of everything else.

> **A 64-bit-only APK will not install on a 32-bit-only device.** Android reports
> this as a generic "app not installed" failure rather than anything explanatory,
> so if a user on an old budget handset reports a failed install, this is the first
> thing to check. Such devices are rare and shrinking, but they are exactly the
> kind of phone some users will have. Building `play` instead — or a one-off
> `production` build with `armeabi-v7a` added back — covers them.

If you ever need to run a `production` APK on an emulator, build `preview`
instead, or add the x86 architectures back for that one build.

### Play Store Build

```bash
eas build --profile play --platform android
```

Outputs an `.aab` for Play submission. Use this instead of `production` once the
app is listed; `production` remains the profile for the directly downloaded APK.

### iOS Builds

```bash
eas build --profile production --platform ios
```

Requires an Apple Developer account and provisioning profile configuration.

## Environment Variables

Production builds pull environment variables from `eas.json` build profile `env` blocks. The Sentry DSN is configured there.

Firebase config variables (`EXPO_PUBLIC_FIREBASE_*`) are read from the `.env` file at build time. Ensure these are set in your build environment or CI.

**Never commit `.env` with real credentials.** Use `.env.example` as a template.

## Pre-Deployment Checklist

1. Run lint: `npm run lint` (expect 0 errors and 54 known warnings)
2. Run type check: `npx tsc --noEmit`
3. Run tests: `npm test`
4. Verify Firestore security rules are deployed: `firebase deploy --only firestore:rules`
5. Verify `.env` values are correct for the target environment
6. Check `npm audit` for dependency vulnerabilities

## Deploying Firestore Rules

Firestore security rules live in `firestore.rules`. Deploy them with:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules --project your-project-id
```

## Sentry Source Maps

Sentry source maps are uploaded automatically during EAS builds when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set. These are configured in `.env`.

The upload step is injected by the `@sentry/react-native` config plugin, which is
declared in `app.json` (with `organization` and `project`). The plugin generates
`android/sentry.properties` during `expo prebuild` — that file is **no longer
tracked in git**, since `android/` and `ios/` are generated output. Do not
recreate it by hand; change the values in the `app.json` plugin block instead.

The auth token is never committed. It must be present in the build environment —
as an EAS secret for cloud builds, or in your local `.env` for `eas build --local`.

## Updating the App

1. Make changes and verify locally
2. Update `CHANGELOG.md`
3. Bump version if needed (EAS auto-increments build numbers)
4. Run `eas build --profile production --platform android`
5. Distribute the APK or submit to the Play Store

## Troubleshooting

- **Build fails with missing env vars**: Ensure `.env` exists with all `EXPO_PUBLIC_FIREBASE_*` values, or set them in the `eas.json` `env` block
- **Firestore permission denied**: Verify security rules are deployed and match `firestore.rules`
- **Sentry not receiving events**: Check `EXPO_PUBLIC_SENTRY_DSN` is set in the build profile
- **EAS CLI not authenticated**: Run `eas login` and verify with `eas whoami`
