import type { FeedCandidate, FeedUnitDetection } from './DetectionTypes';
import { FeedLocator } from './FeedLocator';
import { FeedUnitDetector } from './FeedUnitDetector';

export interface AdapterTiming {
  readonly candidateDiscoveryMs: number;
  readonly detectorMs: number;
}

export interface TimedScanResult {
  readonly detections: FeedUnitDetection[];
  readonly timing: AdapterTiming;
}

export class FacebookDOMAdapter {
  constructor(
    private readonly feedLocator = new FeedLocator(),
    private readonly feedUnitDetector = new FeedUnitDetector()
  ) {}

  locateCandidates(root: ParentNode = document): FeedCandidate[] {
    return this.feedLocator.locate(root);
  }

  scan(root: ParentNode = document): FeedUnitDetection[] {
    return this.scanTimed(root).detections;
  }

  scanTimed(root: ParentNode = document, now: () => number = () => performance.now()): TimedScanResult {
    const discoveryStarted = now();
    const candidates = this.feedLocator.locate(root);
    const discoveryEnded = now();
    const detections = candidates.map((candidate) => this.feedUnitDetector.detect(candidate));
    const detectorEnded = now();

    return {
      detections,
      timing: {
        candidateDiscoveryMs: Math.max(0, discoveryEnded - discoveryStarted),
        detectorMs: Math.max(0, detectorEnded - discoveryEnded)
      }
    };
  }
}
