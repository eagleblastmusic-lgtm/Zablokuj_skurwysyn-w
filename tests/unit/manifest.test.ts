import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

interface ManifestShape {
  manifest_version: number;
  permissions?: string[];
  host_permissions?: string[];
  content_scripts: Array<{
    matches: string[];
    run_at?: string;
    world?: string;
    js: string[];
  }>;
}

const testDir = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(testDir, '../../extension/manifest/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ManifestShape;

describe('M0 manifest', () => {
  it('is MV3 and scoped only to Facebook', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions ?? []).toEqual([]);
    expect(manifest.host_permissions ?? []).toEqual([]);
    expect(manifest.content_scripts).toHaveLength(1);
    expect(manifest.content_scripts[0]?.matches).toEqual(['https://www.facebook.com/*']);
    expect(manifest.content_scripts[0]?.world).toBe('ISOLATED');
    expect(manifest.content_scripts[0]?.run_at).toBe('document_start');
    expect(manifest.content_scripts[0]?.js).toEqual(['content/probe.js']);
  });
});
