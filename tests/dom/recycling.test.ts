// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { NodeFingerprint } from '../../src/facebook/NodeFingerprint';
import { RecyclingProbe } from '../../src/facebook/RecyclingProbe';

function createCandidate(text: string): HTMLElement {
  const article = document.createElement('div');
  article.setAttribute('role', 'article');
  article.setAttribute('aria-posinset', '1');
  const span = document.createElement('span');
  span.textContent = text;
  article.append(span);
  return article;
}

describe('node fingerprint and recycling instrumentation', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('changes the semantic fingerprint when the same node changes content', () => {
    const fingerprinter = new NodeFingerprint();
    const node = createCandidate('TEXT_A');
    const first = fingerprinter.fingerprint(node);

    node.querySelector('span')!.textContent = 'TEXT_B';
    const second = fingerprinter.fingerprint(node);

    expect(first.id).not.toBe(second.id);
    expect(first.features.textHash).not.toBe(second.features.textHash);
  });

  it('records reuse, removal, and return without retaining enumerable node collections', () => {
    const fingerprinter = new NodeFingerprint();
    const probe = new RecyclingProbe();
    const node = createCandidate('TEXT_A');

    const created = probe.observe(node, fingerprinter.fingerprint(node), 1);
    expect(created.map((event) => event.type)).toEqual(['node-created']);

    node.querySelector('span')!.textContent = 'TEXT_B';
    const changed = probe.observe(node, fingerprinter.fingerprint(node), 2);
    expect(changed.map((event) => event.type)).toEqual(['fingerprint-changed', 'node-reused']);

    expect(probe.markRemoved(node, 3)?.type).toBe('node-removed');
    const returned = probe.observe(node, fingerprinter.fingerprint(node), 4);
    expect(returned.map((event) => event.type)).toContain('node-returned');
  });
});
