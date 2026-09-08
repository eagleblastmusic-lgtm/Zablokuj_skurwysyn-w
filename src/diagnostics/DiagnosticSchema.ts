import type { FacebookPageContext } from '../facebook/SpaNavigationObserver';

export type RecyclingStatus = 'OBSERVED' | 'NOT_OBSERVED' | 'UNVERIFIED';

export interface M0DiagnosticReport {
  readonly probeVersion: string;
  readonly pageContext: FacebookPageContext;
  readonly feedUnitsObserved: number;
  readonly candidates: number;
  readonly accepted: number;
  readonly uncertain: number;
  readonly nestedRejected: number;
  readonly nodeCreated: number;
  readonly nodeRemoved: number;
  readonly nodeReturned: number;
  readonly nodeReuseDetected: number;
  readonly fingerprintChanges: number;
  readonly batchSamples: number;
  readonly medianDetectionMs: number | null;
  readonly p95DetectionMs: number | null;
  readonly p99DetectionMs: number | null;
  readonly recyclingStatus: RecyclingStatus;
}
