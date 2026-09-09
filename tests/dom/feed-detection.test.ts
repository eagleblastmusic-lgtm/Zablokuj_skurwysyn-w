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

  it('accepts the live repeated role=article pattern inside main even without role=feed', () => {
    const main = document.createElement('main');
    main.setAttribute('role', 'main');
    const first = document.createElement('div');
    first.setAttribute('role', 'article');
    const second = document.createElement('div');
    second.setAttribute('role', 'article');
    main.append(first, second);
    document.body.append(main);

    const detection = new FacebookDOMAdapter()
      .scan(document)
      .find((item) => item.candidate.node === first);

    expect(detection?.candidate.signals.roleArticle).toBe(true);
    expect(detection?.candidate.signals.insideMain).toBe(true);
    expect(detection?.candidate.signals.insideFeed).toBe(false);
    expect(detection?.candidate.signals.repeatedSiblingStructure).toBe(true);
    expect(detection?.confidence).toBeCloseTo(0.42, 2);
    expect(detection?.classification).toBe('TOP_LEVEL_FEED_UNIT');
  });

  it('accepts the live aria-position plus action pattern inside main', () => {
    const main = document.createElement('main');
    main.setAttribute('role', 'main');
    const unit = document.createElement('div');
    unit.setAttribute('aria-posinset', '1');
    const action = document.createElement('button');
    unit.append(action);
    main.append(unit);
    document.body.append(main);

    const detection = new FacebookDOMAdapter()
      .scan(document)
      .find((item) => item.candidate.node === unit);

    expect(detection?.candidate.signals.ariaPosInSet).toBe(true);
    expect(detection?.candidate.signals.insideMain).toBe(true);
    expect(detection?.candidate.signals.actionStructure).toBe(true);
    expect(detection?.confidence).toBeCloseTo(0.45, 2);
    expect(detection?.classification).toBe('TOP_LEVEL_FEED_UNIT');
  });

  it('keeps similar anchors outside main and feed as unknown', () => {
    const wrapper = document.createElement('section');
    const first = document.createElement('div');
    first.setAttribute('role', 'article');
    const second = document.createElement('div');
    second.setAttribute('role', 'article');
    wrapper.append(first, second);
    document.body.append(wrapper);

    const detection = new FacebookDOMAdapter()
      .scan(document)
      .find((item) => item.candidate.node === first);

    expect(detection?.candidate.signals.repeatedSiblingStructure).toBe(true);
    expect(detection?.candidate.signals.insideMain).toBe(false);
    expect(detection?.candidate.signals.insideFeed).toBe(false);
    expect(detection?.classification).toBe('UNKNOWN');
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
