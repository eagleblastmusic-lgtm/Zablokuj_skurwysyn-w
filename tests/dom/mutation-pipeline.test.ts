// @vitest-environment jsdom

import { setTimeout as delay } from 'node:timers/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import { MutationPipeline, type PipelineObservation } from '../../src/content/observer';

function createPost(position: number, text: string): HTMLElement {
  const article = document.createElement('div');
  article.setAttribute('role', 'article');
  article.setAttribute('aria-posinset', String(position));

  const time = document.createElement('time');
  article.append(time);

  const button = document.createElement('button');
  button.setAttribute('role', 'button');
  article.append(button);

  const span = document.createElement('span');
  span.textContent = text;
  article.append(span);
  return article;
}

describe('MutationPipeline', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('processes changed subtrees and re-analyzes a reused node after fingerprint change', async () => {
    const main = document.createElement('main');
    main.setAttribute('role', 'main');
    const feed = document.createElement('section');
    feed.setAttribute('role', 'feed');
    main.append(feed);
    document.body.append(main);

    const observations: PipelineObservation[] = [];
    let clock = 0;
    const pipeline = new MutationPipeline(undefined, undefined, undefined, {
      onObservation: (observation) => observations.push(observation),
      scheduleFrame: (callback) => {
        callback(clock);
        return 1;
      },
      now: () => {
        clock += 1;
        return clock;
      }
    });

    pipeline.start(document.documentElement);
    observations.length = 0;

    const post = createPost(1, 'TEXT_A');
    feed.append(post);
    await delay(0);

    expect(observations).toHaveLength(1);
    expect(observations[0]?.detection.classification).toBe('TOP_LEVEL_FEED_UNIT');
    const firstFingerprint = observations[0]?.fingerprint.id;

    post.querySelector('span')!.textContent = 'TEXT_B';
    await delay(0);

    expect(observations).toHaveLength(2);
    expect(observations[1]?.fingerprint.id).not.toBe(firstFingerprint);
    expect(observations[1]?.lifecycleEvents.map((event) => event.type)).toContain('fingerprint-changed');

    pipeline.stop();
  });
});
