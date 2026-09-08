import type { FeedUnitClass } from '../facebook/DetectionTypes';
import type { StructuralFeatureVector } from '../facebook/NodeFingerprint';
import type { FacebookPageContext } from '../facebook/SpaNavigationObserver';

export type RecyclingStatus = 'OBSERVED' | 'NOT_OBSERVED' | 'UNVERIFIED';
export type HumanDecision = 'THIS_IS_A_POST' | 'NOT_A_POST' | 'NESTED';

export interface GroundTruthTarget {
  readonly detectorDecision: FeedUnitClass;
  readonly detectorConfidence: number;
  readonly structuralFeatures: StructuralFeatureVector;
}

export interface GroundTruthSample extends GroundTruthTarget {
  readonly humanDecision: HumanDecision;
}

export interface GroundTruthMetrics {
  readonly samples: number;
  readonly truePositive: number;
  readonly falsePositive: number;
  readonly falseNegative: number;
  readonly precision: number | null;
  readonly recall: number | null;
}

export interface GroundTruthReport {
  readonly samples: readonly GroundTruthSample[];
  readonly metrics: GroundTruthMetrics;
}

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
  readonly groundTruth?: GroundTruthReport;
}
