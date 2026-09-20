/**
 * Generates the reference-image prompt manifest from the app's config data.
 *
 * Writes:
 *   assets-src/manifest.json — machine-readable id registry + prompts,
 *     consumed by scripts/reference/ingest-images.js to validate filenames.
 *   assets-src/PROMPTS.md — human-readable, ready-to-paste image-generation
 *     prompts, grouped by kind, with missing/done status.
 *
 * Usage: npm run reference:manifest   (re-run any time; idempotent)
 */

import * as fs from 'fs';
import * as path from 'path';

import { getAllDiseases } from '../../src/config/diseases';
import { getAllOrganicInputs } from '../../src/config/organicInputs';
import { getAllPests } from '../../src/config/pests';
import {
  getKnownReferencePlantNames,
  PLANT_IMAGE_ALIASES,
  slugifyReferenceKey,
} from '../../src/config/referenceKeys';
import type { DiseaseEntry, OrganicInputEntry, PestEntry } from '../../src/types/database.types';
import { getKnownPlantNames } from '../../src/utils/plantHelpers';

const ROOT = path.resolve(__dirname, '..', '..');
const STAGING_DIR = path.join(ROOT, 'assets-src');
const OUTPUT_DIR = path.join(ROOT, 'assets', 'reference');

type ManifestKind = 'pest' | 'disease' | 'plant' | 'organicInput';

interface ManifestEntry {
  kind: ManifestKind;
  id: string;
  file: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category?: string;
  aliasFor?: string[];
  prompt: string;
  status: 'missing' | 'done';
}

const KIND_DIRS: Record<ManifestKind, string> = {
  pest: 'pests',
  disease: 'diseases',
  plant: 'plants',
  organicInput: 'organic-inputs',
};

const STYLE_SUFFIX =
  'natural daylight, photorealistic, 4:3 landscape aspect ratio, no text, no watermark, no people';

/** First ~180 chars of the identification text, cut at a word boundary. */
function excerpt(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function pestPrompt(p: PestEntry): string {
  const host = p.plantsAffected[0] ?? 'vegetable';
  const sci = p.scientificName ? ` (${p.scientificName})` : '';
  return (
    `Photorealistic macro field photograph of ${p.name}${sci} on a ${host} plant in an organic garden. ` +
    `Identification cues: ${excerpt(p.identification)} ` +
    `Show the pest clearly with visible feeding damage, shallow depth of field, ${STYLE_SUFFIX}`
  );
}

function diseasePrompt(d: DiseaseEntry): string {
  const host = d.plantsAffected[0] ?? 'vegetable';
  const sci = d.scientificName ? ` (caused by ${d.scientificName})` : '';
  return (
    `Photorealistic close-up photograph of a ${host} plant showing ${d.name} symptoms${sci}. ` +
    `Symptoms: ${excerpt(d.identification)} ` +
    `Fill the frame with the affected leaves/stem/fruit, ${STYLE_SUFFIX}`
  );
}

function plantPrompt(names: string[]): string {
  const display = names.join(' / ');
  return (
    `Photorealistic photograph of a healthy mature ${display} plant growing in an organic home garden ` +
    `in Tamil Nadu, India, showing its characteristic foliage and produce, whole plant in frame, ${STYLE_SUFFIX}`
  );
}

function organicInputPrompt(input: OrganicInputEntry): string {
  const ingredients = input.ingredients?.join(', ');
  const material = ingredients
    ? `Visible preparation materials: ${ingredients}. `
    : 'Show the input in its typical prepared form. ';

  return (
    `Photorealistic editorial photograph of ${input.name}, an organic farm input used in a home garden in Tamil Nadu, India. ` +
    `Show the material clearly in a practical, unbranded garden setting. ${material}` +
    `Context: ${input.description}. Natural daylight, realistic textures, 4:3 landscape aspect ratio, no text, no watermark, no people.`
  );
}

function isDone(kind: ManifestKind, id: string): boolean {
  return fs.existsSync(path.join(OUTPUT_DIR, KIND_DIRS[kind], `${id}.webp`));
}

function buildEntries(): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  for (const p of getAllPests()) {
    entries.push({
      kind: 'pest',
      id: p.id,
      file: `${p.id}.webp`,
      name: p.name,
      tamilName: p.tamilName,
      scientificName: p.scientificName,
      category: p.category,
      prompt: pestPrompt(p),
      status: isDone('pest', p.id) ? 'done' : 'missing',
    });
  }

  for (const d of getAllDiseases()) {
    entries.push({
      kind: 'disease',
      id: d.id,
      file: `${d.id}.webp`,
      name: d.name,
      tamilName: d.tamilName,
      scientificName: d.scientificName,
      category: d.category,
      prompt: diseasePrompt(d),
      status: isDone('disease', d.id) ? 'done' : 'missing',
    });
  }

  for (const input of getAllOrganicInputs()) {
    entries.push({
      kind: 'organicInput',
      id: input.imageAsset ?? input.id,
      file: `${input.imageAsset ?? input.id}.webp`,
      name: input.name,
      tamilName: input.tamilName,
      category: input.category,
      prompt: organicInputPrompt(input),
      status: isDone('organicInput', input.imageAsset ?? input.id) ? 'done' : 'missing',
    });
  }

  // Plants: dedupe alias names onto their canonical slug so only one image
  // is requested per crop.
  const byCanonical = new Map<string, string[]>();
  for (const name of getKnownReferencePlantNames(getKnownPlantNames())) {
    const slug = slugifyReferenceKey(name);
    const canonical = PLANT_IMAGE_ALIASES[slug] ?? slug;
    const names = byCanonical.get(canonical) ?? [];
    names.push(name);
    byCanonical.set(canonical, names);
  }
  for (const [slug, names] of [...byCanonical.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    entries.push({
      kind: 'plant',
      id: slug,
      file: `${slug}.webp`,
      name: names[0] ?? slug,
      aliasFor: names.length > 1 ? names : undefined,
      prompt: plantPrompt(names),
      status: isDone('plant', slug) ? 'done' : 'missing',
    });
  }

  return entries;
}

function writePromptsMarkdown(entries: ManifestEntry[]): void {
  const lines: string[] = [
    '# Reference Image Prompts',
    '',
    '_Generated by `npm run reference:manifest` — do not edit by hand._',
    '',
    'Feed each prompt to an image model, save the output as the listed filename',
    'into `assets-src/pests|diseases|plants|organic-inputs/`, then run `npm run reference:ingest`.',
    '',
  ];

  for (const kind of ['pest', 'disease', 'plant', 'organicInput'] as ManifestKind[]) {
    const group = entries.filter((e) => e.kind === kind);
    const done = group.filter((e) => e.status === 'done').length;
    lines.push(`## ${KIND_DIRS[kind]} (${done}/${group.length} done)`, '');
    for (const e of group) {
      const status = e.status === 'done' ? '✅' : '⬜';
      const sci = e.scientificName ? ` — _${e.scientificName}_` : '';
      lines.push(`### ${status} \`${e.file}\` — ${e.name}${sci}`, '', '```', e.prompt, '```', '');
    }
  }

  fs.writeFileSync(path.join(STAGING_DIR, 'PROMPTS.md'), lines.join('\n'), 'utf8');
}

function main(): void {
  for (const dir of Object.values(KIND_DIRS)) {
    fs.mkdirSync(path.join(STAGING_DIR, dir), { recursive: true });
  }

  const entries = buildEntries();
  fs.writeFileSync(
    path.join(STAGING_DIR, 'manifest.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2),
    'utf8'
  );
  writePromptsMarkdown(entries);

  const missing = entries.filter((e) => e.status === 'missing').length;
  console.log(
    `Manifest written: ${entries.length} entries (${missing} missing) → assets-src/manifest.json + PROMPTS.md`
  );
}

main();
