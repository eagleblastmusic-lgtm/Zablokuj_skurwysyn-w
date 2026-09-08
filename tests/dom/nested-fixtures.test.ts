// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { FacebookDOMAdapter } from '../../src/facebook/FacebookDOMAdapter';

const testDir = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): string {
  return readFileSync(resolve(testDir, `../fixtures/${name}`), 'utf8');
}

function mountFixture(markup: string): void {
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const nodes = [...parsed.body.childNodes].map((node) => document.importNode(node, true));
  document.body.replaceChildren(...nodes);
}

describe('nested-content fixture regressions', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  for (const fixture of ['nested-shared-post.html', 'nested-comment.html', 'nested-link-card.html']) {
    it(`keeps ${fixture} to one top-level classification unit`, () => {
      const markup = loadFixture(fixture);
      expect(markup).not.toContain('facebook.com');
      expect(markup).not.toContain('USER_REAL');
      mountFixture(markup);

      const detections = new FacebookDOMAdapter().scan(document);
      const topLevel = detections.filter((item) => item.classification === 'TOP_LEVEL_FEED_UNIT');
      const nested = detections.filter((item) => item.classification === 'NESTED_CONTENT');

      expect(topLevel).toHaveLength(1);
      expect(nested).toHaveLength(1);
    });
  }
});
