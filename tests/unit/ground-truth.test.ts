import { describe, expect, it } from 'vitest';
import { GroundTruthCollector } from '../../src/diagnostics/GroundTruthCollector';
import type { GroundTruthTarget } from '../../src/diagnostics/DiagnosticSchema';

const features = {
  tagName: 'DIV',
  role: 'article',
  hasAriaPosInSet: true,
  childElementCount: 3,
  buttonCount: 1,
  linkCount: 1,
  mediaCount: 0,
  nestedArticleCount: 0,
  textLengthBucket: 2,
  textHash: 'deadbeef'
} as const;

function target(detectorDecision: GroundTruthTarget['detectorDecision']): GroundTruthTarget {
  return {
    detectorDecision,
    detectorConfidence: 0.9,
    structuralFeatures: features
  };
}

describe('GroundTruthCollector', () => {
  it('stores only decisions and structural features and computes precision/recall', () => {
    const collector = new GroundTruthCollector();
    collector.record(target('TOP_LEVEL_FEED_UNIT'), 'THIS_IS_A_POST');
    collector.record(target('TOP_LEVEL_FEED_UNIT'), 'NOT_A_POST');
    collector.record(target('UNKNOWN'), 'THIS_IS_A_POST');

    const report = collector.report();
    expect(report.metrics).toEqual({
      samples: 3,
      truePositive: 1,
      falsePositive: 1,
      falseNegative: 1,
      precision: 0.5,
      recall: 0.5
    });
    expect(JSON.stringify(report)).not.toContain('node');
    expect(JSON.stringify(report)).not.toContain('author');
    expect(JSON.stringify(report)).not.toContain('postUrl');
    expect(report.samples[0]?.structuralFeatures.textHash).toBe('deadbeef');
  });
});
