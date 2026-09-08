import type {
  GroundTruthMetrics,
  GroundTruthReport,
  GroundTruthSample,
  GroundTruthTarget,
  HumanDecision
} from './DiagnosticSchema';

const MAX_GROUND_TRUTH_SAMPLES = 5_000;

export class GroundTruthCollector {
  private readonly samples: GroundTruthSample[] = [];

  record(target: GroundTruthTarget, humanDecision: HumanDecision): void {
    if (this.samples.length >= MAX_GROUND_TRUTH_SAMPLES) return;

    this.samples.push({
      detectorDecision: target.detectorDecision,
      detectorConfidence: target.detectorConfidence,
      structuralFeatures: { ...target.structuralFeatures },
      humanDecision
    });
  }

  report(): GroundTruthReport {
    return {
      samples: this.samples.map((sample) => ({
        ...sample,
        structuralFeatures: { ...sample.structuralFeatures }
      })),
      metrics: this.metrics()
    };
  }

  private metrics(): GroundTruthMetrics {
    let truePositive = 0;
    let falsePositive = 0;
    let falseNegative = 0;

    for (const sample of this.samples) {
      const detectorPositive = sample.detectorDecision === 'TOP_LEVEL_FEED_UNIT';
      const humanPositive = sample.humanDecision === 'THIS_IS_A_POST';

      if (detectorPositive && humanPositive) truePositive += 1;
      if (detectorPositive && !humanPositive) falsePositive += 1;
      if (!detectorPositive && humanPositive) falseNegative += 1;
    }

    const precisionDenominator = truePositive + falsePositive;
    const recallDenominator = truePositive + falseNegative;

    return {
      samples: this.samples.length,
      truePositive,
      falsePositive,
      falseNegative,
      precision: precisionDenominator === 0 ? null : truePositive / precisionDenominator,
      recall: recallDenominator === 0 ? null : truePositive / recallDenominator
    };
  }
}
