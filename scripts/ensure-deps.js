#!/usr/bin/env node
/**
 * Runs `npm install` only when needed: node_modules missing or
 * package-lock.json changed since the last install. Used by the
 * Claude Code SessionStart hook to avoid a full install on every session.
 */
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCK = path.join(ROOT, 'package-lock.json');
const STAMP = path.join(ROOT, 'node_modules', '.deps-stamp');

function lockHash() {
  return crypto.createHash('sha256').update(fs.readFileSync(LOCK)).digest('hex');
}

function main() {
  const hash = fs.existsSync(LOCK) ? lockHash() : 'no-lockfile';
  const fresh =
    fs.existsSync(path.join(ROOT, 'node_modules')) &&
    fs.existsSync(STAMP) &&
    fs.readFileSync(STAMP, 'utf8') === hash;

  if (fresh) return;

  execSync('npm install --no-audit --no-fund --silent', { cwd: ROOT, stdio: 'inherit' });
  fs.writeFileSync(STAMP, hash, 'utf8');
}

main();
