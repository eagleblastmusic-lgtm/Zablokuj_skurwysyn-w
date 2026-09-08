import type { PrePaintSample, PrePaintStrategy } from './PrePaintExperiment';
import type { QuantileSummary } from './TimingProbe';

export interface PrePaintStrategyReport {
  readonly samples: number;
  readonly insertionToDetectionMs: QuantileSummary;
  readonly insertionToDecisionMs: QuantileSummary;
  readonly decisionToNextFrameMs: QuantileSummary;
}

export type PrePaintReport = Readonly<Record<PrePaintStrategy, PrePaintStrategyReport>>;

const STRATEGIES: readonly PrePaintStrategy[] = ['NO_GUARD', 'SCOPED_GUARD', 'TEMPORARY_PLACEHOLDER'];

export class PaintProbe {
  private readonly samples = new Map<PrePaintStrategy, PrePaintSample[]>();

  record(sample: PrePaintSample): void {
    const values = this.samples.get(sample.strategy) ?? [];
    if (values.length >= 10_000) return;
    values.push(sample);
    this.samples.set(sample.strategy, values);
  }

  report(): PrePaintReport {
    return Object.fromEntries(STRATEGIES.map((strategy) => [strategy, this.strategyReport(strategy)])) as PrePaintReport;
  }

  private strategyReport(strategy: PrePaintStrategy): PrePaintStrategyReport {
    const samples = this.samples.get(strategy) ?? [];
    return {
      samples: samples.length,
      insertionToDetectionMs: this.summary(samples.flatMap((sample) => sample.insertionToDetectionMs === null ? [] : [sample.insertionToDetectionMs])),
      insertionToDecisionMs: this.summary(samples.map((sample) => sample.insertionToDecisionMs)),
      decisionToNextFrameMs: this.summary(samples.map((sample) => sample.decisionToNextFrameMs))
    };
  }

  private summary(values: readonly number[]): QuantileSummary {
    const sorted = [...values].sort((left, right) => left - right);
    return {
      samples: sorted.length,
      p50: this.quantile(sorted, 0.5),
      p95: this.quantile(sorted, 0.95),
      p99: this.quantile(sorted, 0.99)
    };
  }

  private quantile(sorted: readonly number[], percentile: number): number | null {
    if (sorted.length === 0) return null;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentile * sorted.length) - 1));
    return sorted[index] ?? null;
  }
}
