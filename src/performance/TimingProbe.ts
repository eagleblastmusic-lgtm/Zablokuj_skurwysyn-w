export type TimingStage =
  | 'mutationCallbackMs'
  | 'candidateDiscoveryMs'
  | 'detectorMs'
  | 'fingerprintMs'
  | 'endToEndMs'
  | 'batchSize';

export interface QuantileSummary {
  readonly samples: number;
  readonly p50: number | null;
  readonly p95: number | null;
  readonly p99: number | null;
}

export type TimingReport = Readonly<Record<TimingStage, QuantileSummary>>;

const MAX_SAMPLES_PER_STAGE = 10_000;

export class TimingProbe {
  private readonly samples = new Map<TimingStage, number[]>();

  record(stage: TimingStage, value: number): void {
    if (!Number.isFinite(value) || value < 0) return;
    const values = this.samples.get(stage) ?? [];
    if (values.length >= MAX_SAMPLES_PER_STAGE) return;
    values.push(value);
    this.samples.set(stage, values);
  }

  report(): TimingReport {
    return {
      mutationCallbackMs: this.summary('mutationCallbackMs'),
      candidateDiscoveryMs: this.summary('candidateDiscoveryMs'),
      detectorMs: this.summary('detectorMs'),
      fingerprintMs: this.summary('fingerprintMs'),
      endToEndMs: this.summary('endToEndMs'),
      batchSize: this.summary('batchSize')
    };
  }

  private summary(stage: TimingStage): QuantileSummary {
    const values = this.samples.get(stage) ?? [];
    return {
      samples: values.length,
      p50: this.quantile(values, 0.5),
      p95: this.quantile(values, 0.95),
      p99: this.quantile(values, 0.99)
    };
  }

  private quantile(values: readonly number[], percentile: number): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(percentile * sorted.length) - 1));
    return sorted[index] ?? null;
  }
}
