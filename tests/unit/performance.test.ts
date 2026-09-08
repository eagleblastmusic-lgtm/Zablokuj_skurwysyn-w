// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryProbe } from '../../src/performance/MemoryProbe';
import { PaintProbe } from '../../src/performance/PaintProbe';
import { PrePaintExperiment } from '../../src/performance/PrePaintExperiment';
import { TimingProbe } from '../../src/performance/TimingProbe';

describe('M0 performance and pre-paint instrumentation', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('summarizes p50/p95/p99 instead of only averages', () => {
    const probe = new TimingProbe();
    for (const value of [1, 2, 3, 10]) probe.record('detectorMs', value);
    const summary = probe.report().detectorMs;

    expect(summary.samples).toBe(4);
    expect(summary.p50).toBe(2);
    expect(summary.p95).toBe(10);
    expect(summary.p99).toBe(10);
  });

  it('applies and releases a temporary placeholder only on the candidate node', () => {
    let clock = 0;
    const paintProbe = new PaintProbe();
    const experiment = new PrePaintExperiment({
      now: () => ++clock,
      scheduleFrame: (callback) => {
        callback(clock);
        return 1;
      },
      onSample: (sample) => paintProbe.record(sample)
    });
    experiment.setStrategy('TEMPORARY_PLACEHOLDER');

    const article = document.createElement('div');
    article.setAttribute('role', 'article');
    article.textContent = 'TEXT_A';
    document.body.append(article);

    experiment.prepareAddedSubtree(article);
    expect(article.style.display).toBe('none');
    expect(document.querySelector('[data-m0-prepaint-placeholder="true"]')).not.toBeNull();
    expect(experiment.activeGuardCount()).toBe(1);

    experiment.markDetected(article);
    experiment.decisionReady(article);

    expect(article.style.display).toBe('');
    expect(document.querySelector('[data-m0-prepaint-placeholder="true"]')).toBeNull();
    expect(experiment.activeGuardCount()).toBe(0);
    expect(paintProbe.report().TEMPORARY_PLACEHOLDER.samples).toBe(1);
  });

  it('reports observer cleanup balance without retaining DOM nodes', () => {
    const memory = new MemoryProbe();
    memory.markObserverStarted();
    expect(memory.report().cleanupBalanced).toBe(true);
    memory.markObserverStopped();

    const report = memory.report();
    expect(report.observerActive).toBe(false);
    expect(report.observerStarts).toBe(1);
    expect(report.observerStops).toBe(1);
    expect(report.cleanupBalanced).toBe(true);
  });
});
