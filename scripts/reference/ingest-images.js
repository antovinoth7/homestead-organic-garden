#!/usr/bin/env node
/**
 * Ingests staged reference images and regenerates the bundled asset map.
 *
 * 1. Reads assets-src/manifest.json (run `npm run reference:manifest` first)
 *    to learn the valid ids per kind.
 * 2. Converts every image in assets-src/{pests,diseases,plants,organic-inputs}/ to a
 *    400×300 cover-cropped WebP ≤ 50 KB in assets/reference/<kind>/<id>.webp
 *    (quality starts at 80 and steps down by 5 to a floor of 45).
 * 3. Regenerates src/config/referenceImages.gen.ts from the WebP files that
 *    exist on disk — the gen file must be committed after every run.
 *
 * Usage: npm run reference:ingest [-- --missing-only]
 *
 * `--missing-only` preserves existing bundled WebPs and converts only staged
 * sources that do not already have an output file. The generated asset map is
 * still rebuilt from every bundled WebP.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const STAGING_DIR = path.join(ROOT, 'assets-src');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'reference');
const GEN_FILE = path.join(ROOT, 'src', 'config', 'referenceImages.gen.ts');

const MAX_BYTES = 50 * 1024;
const WIDTH = 400;
const HEIGHT = 300;
const QUALITY_START = 80;
const QUALITY_FLOOR = 45;
const QUALITY_STEP = 5;
const MISSING_ONLY = process.argv.includes('--missing-only');

const KINDS = [
  { kind: 'pest', dir: 'pests', mapName: 'PEST_IMAGES' },
  { kind: 'disease', dir: 'diseases', mapName: 'DISEASE_IMAGES' },
  { kind: 'plant', dir: 'plants', mapName: 'PLANT_IMAGES' },
  { kind: 'organicInput', dir: 'organic-inputs', mapName: 'ORGANIC_INPUT_IMAGES' },
];
const INPUT_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function loadManifestIds() {
  const manifestPath = path.join(STAGING_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('assets-src/manifest.json not found — run `npm run reference:manifest` first.');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const idsByKind = { pest: new Set(), disease: new Set(), plant: new Set(), organicInput: new Set() };
  for (const entry of manifest.entries) {
    if (idsByKind[entry.kind]) idsByKind[entry.kind].add(entry.id);
  }
  return idsByKind;
}

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Encode to WebP under MAX_BYTES, stepping quality down; returns quality used or null. */
async function encodeUnderLimit(inputPath, outputPath) {
  for (let quality = QUALITY_START; quality >= QUALITY_FLOOR; quality -= QUALITY_STEP) {
    const buffer = await sharp(inputPath)
      .resize(WIDTH, HEIGHT, { fit: 'cover' })
      .webp({ quality })
      .toBuffer();
    if (buffer.length <= MAX_BYTES) {
      fs.writeFileSync(outputPath, buffer);
      return { quality, bytes: buffer.length };
    }
  }
  return null;
}

async function ingestKind({ dir }, validIds, summary) {
  const stagingKindDir = path.join(STAGING_DIR, dir);
  const outputKindDir = path.join(OUTPUT_DIR, dir);
  fs.mkdirSync(outputKindDir, { recursive: true });

  if (!fs.existsSync(stagingKindDir)) return;

  for (const fileName of fs.readdirSync(stagingKindDir).sort()) {
    const ext = path.extname(fileName).toLowerCase();
    if (!INPUT_EXTS.has(ext)) continue;

    const id = slugify(path.basename(fileName, ext));
    const inputPath = path.join(stagingKindDir, fileName);

    if (!validIds.has(id)) {
      summary.skipped.push(`${dir}/${fileName} (no matching id "${id}" in manifest)`);
      continue;
    }

    const outputPath = path.join(outputKindDir, `${id}.webp`);
    if (MISSING_ONLY && fs.existsSync(outputPath)) continue;

    const result = await encodeUnderLimit(inputPath, outputPath);
    if (result) {
      summary.converted.push(
        `${dir}/${id}.webp (${(result.bytes / 1024).toFixed(1)} KB @ q${result.quality})`
      );
    } else {
      summary.oversize.push(`${dir}/${fileName} (still > 50 KB at quality ${QUALITY_FLOOR})`);
    }
  }
}

/** Rebuild the gen file from the WebP files on disk, validated against manifest ids. */
function regenerateGenFile(idsByKind, summary) {
  const sections = KINDS.map(({ kind, dir, mapName }) => {
    const outputKindDir = path.join(OUTPUT_DIR, dir);
    const ids = fs.existsSync(outputKindDir)
      ? fs
          .readdirSync(outputKindDir)
          .filter((f) => f.endsWith('.webp'))
          .map((f) => path.basename(f, '.webp'))
          .sort()
      : [];

    const lines = [];
    for (const id of ids) {
      if (!idsByKind[kind].has(id)) {
        summary.unknown.push(`${dir}/${id}.webp (id not in manifest — excluded from gen file)`);
        continue;
      }
      lines.push(`  ${id}: require('../../assets/reference/${dir}/${id}.webp'),`);
    }
    const body = lines.length > 0 ? `{\n${lines.join('\n')}\n}` : '{}';
    return `export const ${mapName}: Record<string, ImageSource> = ${body};`;
  });

  const content = `/**
 * AUTO-GENERATED by scripts/reference/ingest-images.js — DO NOT EDIT.
 *
 * Maps reference-entry ids to bundled WebP images in \`assets/reference/\`.
 * Regenerate by dropping source images into \`assets-src/<kind>/\` and running
 * \`npm run reference:ingest\`. Keys are validated against config ids by
 * src/__tests__/config/referenceAssets.test.ts.
 */

import type { ImageSource } from 'expo-image';

${sections.join('\n\n')}
`;

  fs.writeFileSync(GEN_FILE, content, 'utf8');
}

async function main() {
  const idsByKind = loadManifestIds();
  const summary = { converted: [], skipped: [], oversize: [], unknown: [] };

  for (const kindDef of KINDS) {
    await ingestKind(kindDef, idsByKind[kindDef.kind], summary);
  }
  regenerateGenFile(idsByKind, summary);

  console.log('── Reference image ingest ──');
  for (const line of summary.converted) console.log(`✔ ${line}`);
  for (const line of summary.skipped) console.log(`⤳ skipped: ${line}`);
  for (const line of summary.oversize) console.log(`✖ oversize: ${line}`);
  for (const line of summary.unknown) console.log(`⚠ ${line}`);

  for (const { kind, dir } of KINDS) {
    const outputKindDir = path.join(OUTPUT_DIR, dir);
    const have = new Set(
      fs.existsSync(outputKindDir)
        ? fs
            .readdirSync(outputKindDir)
            .filter((f) => f.endsWith('.webp'))
            .map((f) => path.basename(f, '.webp'))
        : []
    );
    const missing = [...idsByKind[kind]].filter((id) => !have.has(id));
    console.log(`${dir}: ${have.size} bundled, ${missing.length} missing`);
    if (missing.length > 0 && missing.length <= 40) console.log(`  missing: ${missing.join(', ')}`);
  }
  console.log('Regenerated src/config/referenceImages.gen.ts — commit it with the new assets.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
