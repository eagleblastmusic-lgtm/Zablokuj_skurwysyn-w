// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PipelineObservation } from '../../src/content/observer';
import { DiagnosticCollector } from '../../src/diagnostics/DiagnosticCollector';
import { DiagnosticExporter } from '../../src/diagnostics/DiagnosticExporter';
import { FacebookDOMAdapter } from '../../src/facebook/FacebookDOMAdapter';
import { NodeFingerprint } from '../../src/facebook/NodeFingerprint';
import { DebugOverlay } from '../../src/ui/DebugOverlay';

function buildObservation(): PipelineObservation {
  const main = document.createElement('main');
  main.setAttribute('role', 'main');
  const feed = document.createElement('section');
  feed.setAttribute('role', 'feed');
  const article = document.createElement('div');
  article.setAttribute('role', 'article');
  article.setAttribute('aria-posinset', '1');

  const time = document.createElement('time');
  const button = document.createElement('button');
  button.setAttribute('role', 'button');
  const secret = document.createElement('span');
  secret.textContent = 'PRIVATE_POST_TEXT_SHOULD_NEVER_EXPORT';
  article.append(time, button, secret);
  feed.append(article);
  main.append(feed);
  document.body.append(main);

  const detection = new FacebookDOMAdapter()
    .scan(document)
    .find((item) => item.candidate.node === article);
  if (detection === undefined) throw new Error('Expected synthetic top-level detection.');

  return {
    detection,
    fingerprint: new NodeFingerprint().fingerprint(article),
    lifecycleEvents: [],
    batchLatencyMs: 3.5
  };
}

describe('privacy-safe diagnostics and debug overlay', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('exports aggregate diagnostics without Facebook content fields', () => {
    const collector = new DiagnosticCollector('0.0.1');
    collector.setPageContext('home');
    collector.recordObservation(buildObservation());
    const serialized = new DiagnosticExporter().serialize(collector.report());

    expect(serialized).toContain('"accepted": 1');
    expect(serialized).not.toContain('PRIVATE_POST_TEXT_SHOULD_NEVER_EXPORT');
    expect(serialized).not.toContain('author');
    expect(serialized).not.toContain('postUrl');
    expect(serialized).not.toContain('images');
  });

  it('renders only structural metadata and can be disabled', () => {
    const overlay = new DebugOverlay({ onExport: vi.fn() });
    overlay.mount();
    const observation = buildObservation();
    overlay.renderObservation(observation);

    const host = document.querySelector<HTMLElement>('[data-m0-probe-host="true"]');
    const debugText = host?.shadowRoot?.textContent ?? '';
    expect(debugText).toContain('TOP_LEVEL_FEED_UNIT');
    expect(debugText).toContain(observation.fingerprint.id);
    expect(debugText).not.toContain('PRIVATE_POST_TEXT_SHOULD_NEVER_EXPORT');

    overlay.setEnabled(false);
    overlay.setEnabled(true);
    overlay.destroy();
  });
});
