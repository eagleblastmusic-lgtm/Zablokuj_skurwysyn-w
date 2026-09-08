// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { FacebookDOMAdapter } from '../../src/facebook/FacebookDOMAdapter';

function createPost(position: number): HTMLElement {
  const article = document.createElement('div');
  article.setAttribute('role', 'article');
  article.setAttribute('aria-posinset', String(position));

  const time = document.createElement('time');
  article.append(time);

  const permalink = document.createElement('a');
  permalink.setAttribute('href', `/posts/SANITIZED_${position}`);
  article.append(permalink);

  const action = document.createElement('button');
  action.setAttribute('role', 'button');
  article.append(action);

  return article;
}

describe('Facebook DOM detection', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('uses multiple structural signals for top-level feed units', () => {
    const main = document.createElement('main');
    main.setAttribute('role', 'main');
    const feed = document.createElement('div');
    feed.setAttribute('role', 'feed');
    const first = createPost(1);
    const second = createPost(2);
    feed.append(first, second);
    main.append(feed);
    document.body.append(main);

    const detections = new FacebookDOMAdapter().scan(document);
    const firstDetection = detections.find((item) => item.candidate.node === first);

    expect(firstDetection?.candidate.signals.ariaPosInSet).toBe(true);
    expect(firstDetection?.candidate.signals.roleArticle).toBe(true);
    expect(firstDetection?.candidate.signals.insideFeed).toBe(true);
    expect(firstDetection?.candidate.signals.insideMain).toBe(true);
    expect(firstDetection?.classification).toBe('TOP_LEVEL_FEED_UNIT');
    expect(firstDetection?.confidence).toBeGreaterThanOrEqual(0.55);
  });

  it('rejects a structurally nested article as a separate top-level unit', () => {
    const main = document.createElement('main');
    main.setAttribute('role', 'main');
    const feed = document.createElement('div');
    feed.setAttribute('role', 'feed');
    const outer = createPost(1);
    const nested = createPost(99);
    outer.append(nested);
    feed.append(outer, createPost(2));
    main.append(feed);
    document.body.append(main);

    const detections = new FacebookDOMAdapter().scan(document);
    const outerDetection = detections.find((item) => item.candidate.node === outer);
    const nestedDetection = detections.find((item) => item.candidate.node === nested);

    expect(outerDetection?.classification).toBe('TOP_LEVEL_FEED_UNIT');
    expect(nestedDetection?.classification).toBe('NESTED_CONTENT');
    expect(nestedDetection?.penalties).toContain('nested-structural-candidate');
  });
});
