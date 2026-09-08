import type { PipelineObservation } from '../content/observer';
import type { NodeLifecycleEvent } from '../facebook/RecyclingProbe';
import type { FacebookPageContext } from '../facebook/SpaNavigationObserver';
import type { GroundTruthReport, M0DiagnosticReport, RecyclingStatus } from './DiagnosticSchema';

const MAX_TIMING_SAMPLES = 10_000;

export class DiagnosticCollector {
  private pageContext: FacebookPageContext = 'unknown';
  private candidates = 0;
  private accepted = 0;
  private uncertain = 0;
  private nestedRejected = 0;
  private nodeCreated = 0;
  private nodeRemoved = 0;
  private nodeReturned = 0;
  private nodeReuseDetected = 0;
  private fingerprintChanges = 0;
  private longSessionCompleted = false;
  private readonly timingSamples: number[] = [];

  constructor(private readonly probeVersion: string) {}

  setPageContext(context: FacebookPageContext): void {
    this.pageContext = context;
  }

  recordObservation(observation: PipelineObservation): void {
    this.candidates += 1;

    switch (observation.detection.classification) {
      case 'TOP_LEVEL_FEED_UNIT':
        this.accepted += 1;
        break;
      case 'NESTED_CONTENT':
        this.nestedRejected += 1;
        break;
      case 'UNKNOWN':
        this.uncertain += 1;
        break;
    }

    if (this.timingSamples.length < MAX_TIMING_SAMPLES) {
      this.timingSamples.push(observation.batchLatencyMs);
    }
  }

  recordLifecycle(event: NodeLifecycleEvent): void {
    switch (event.type) {
      case 'node-created':
        this.nodeCreated += 1;
        break;
      case 'node-removed':
        this.nodeRemoved += 1;
        break;
      case 'node-returned':
        this.nodeReturned += 1;
        break;
      case 'node-reused':
        this.nodeReuseDetected += 1;
        break;
      case 'fingerprint-changed':
        this.fingerprintChanges += 1;
        break;
    }
  }

  markLongSessionComplete(): void {
    this.longSessionCompleted = true;
  }

  report(groundTruth?: GroundTruthReport): M0DiagnosticReport {
    const recyclingStatus: RecyclingStatus =
      this.nodeReuseDetected > 0 ? 'OBSERVED' : this.longSessionCompleted ? 'NOT_OBSERVED' : 'UNVERIFIED';

    return {
      probeVersion: this.probeVersion,
      pageContext: this.pageContext,
      feedUnitsObserved: this.accepted,
      candidates: this.candidates,
      accepted: this.accepted,
      uncertain: this.uncertain,
      nestedRejected: this.nestedRejected,
      nodeCreated: this.nodeCreated,
      nodeRemoved: this.nodeRemoved,
      nodeReturned: this.nodeReturned,
      nodeReuseDetected: this.nodeReuseDetected,
      fingerprintChanges: this.fingerprintChanges,
      batchSamples: this.timingSamples.length,
      medianDetectionMs: this.quantile(0.5),
      p95DetectionMs: this.quantile(0.95),
      p99DetectionMs: this.quantile(0.99),
      recyclingStatus,
      ...(groundTruth === undefined ? {} : { groundTruth })
    };
  }

  private quantile(percentile: number): number | null {
    if (this.timingSamples.length === 0) return null;

    const sorted = [...this.timingSamples].sort((left, right) => left - right);
    const index = Math.min(sorted.length - 1, Math.ceil(percentile * sorted.length) - 1);
    return sorted[Math.max(0, index)] ?? null;
  }
}
