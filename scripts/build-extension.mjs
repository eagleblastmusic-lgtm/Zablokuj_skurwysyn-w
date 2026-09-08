import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const manifestPath = resolve(rootDir, 'extension/manifest/manifest.json');
const outDir = resolve(rootDir, 'dist');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

if (manifest.manifest_version !== 3) {
  throw new Error('M0 requires Manifest V3.');
}

mkdirSync(outDir, { recursive: true });
copyFileSync(manifestPath, resolve(outDir, 'manifest.json'));
