#!/usr/bin/env node
/**
 * Generates docs/CODEMAP.md — a per-directory inventory of src/ and docs/
 * with line counts, so agents/readers can navigate without exploring.
 *
 * Usage: npm run codemap
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'CODEMAP.md');
const LARGE_FILE_LINES = 800;
const SOURCE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.length === 0) return 0;
  let lines = 1;
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '\n') lines += 1;
  }
  return lines;
}

/** Recursively collect { relPath, lines } for files matching filter, grouped by top-level dir. */
function walk(dir, filter, base = dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, filter, base));
    } else if (filter(entry.name)) {
      results.push({
        relPath: path.relative(base, full).replace(/\\/g, '/'),
        lines: countLines(full),
      });
    }
  }
  return results;
}

function groupByDir(files) {
  const groups = new Map();
  for (const f of files) {
    const dir = f.relPath.includes('/') ? f.relPath.slice(0, f.relPath.lastIndexOf('/')) : '.';
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(f);
  }
  return groups;
}

function renderGroup(name, files) {
  const total = files.reduce((sum, f) => sum + f.lines, 0);
  const lines = [`### ${name}/ — ${files.length} files, ${total.toLocaleString()} lines`, ''];
  files.sort((a, b) => b.lines - a.lines);
  for (const f of files) {
    const fileName = f.relPath.slice(f.relPath.lastIndexOf('/') + 1);
    const flag = f.lines > LARGE_FILE_LINES ? ' ⚠️ large — Grep/search inside, do not read whole' : '';
    lines.push(`- ${fileName} (${f.lines})${flag}`);
  }
  lines.push('');
  return lines;
}

function main() {
  const srcFiles = walk(path.join(ROOT, 'src'), (name) => SOURCE_EXTS.has(path.extname(name)));
  const docFiles = walk(path.join(ROOT, 'docs'), (name) => name.endsWith('.md'));

  const srcTotal = srcFiles.reduce((sum, f) => sum + f.lines, 0);
  const largeFiles = srcFiles.filter((f) => f.lines > LARGE_FILE_LINES).sort((a, b) => b.lines - a.lines);

  const out = [
    '# Codemap',
    '',
    '> **Generated file — do not edit.** Regenerate with `npm run codemap`.',
    `> Snapshot: ${new Date().toISOString().slice(0, 10)} — src/: ${srcFiles.length} files, ${srcTotal.toLocaleString()} lines.`,
    '>',
    `> Files marked ⚠️ exceed ${LARGE_FILE_LINES} lines: search inside them (Grep) instead of reading them whole.`,
    '',
    '## Large files (search, don\'t read whole)',
    '',
    ...largeFiles.map((f) => `- src/${f.relPath} (${f.lines})`),
    '',
    '## src/',
    '',
  ];

  const groups = groupByDir(srcFiles);
  const sortedDirs = [...groups.keys()].sort();
  for (const dir of sortedDirs) {
    out.push(...renderGroup(`src/${dir === '.' ? '' : dir}`.replace(/\/$/, ''), groups.get(dir)));
  }

  out.push('## docs/', '');
  docFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));
  for (const f of docFiles) {
    out.push(`- ${f.relPath} (${f.lines})`);
  }
  out.push('');

  fs.writeFileSync(OUT, out.join('\n'), 'utf8');
  console.log(`Wrote ${path.relative(ROOT, OUT)} — src/: ${srcFiles.length} files, docs/: ${docFiles.length} files.`);
}

main();
