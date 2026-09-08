import type { FeedCandidate, FeedUnitDetection } from './DetectionTypes';
import { FeedLocator } from './FeedLocator';
import { FeedUnitDetector } from './FeedUnitDetector';

export class FacebookDOMAdapter {
  constructor(
    private readonly feedLocator = new FeedLocator(),
    private readonly feedUnitDetector = new FeedUnitDetector()
  ) {}

  locateCandidates(root: ParentNode = document): FeedCandidate[] {
    return this.feedLocator.locate(root);
  }

  scan(root: ParentNode = document): FeedUnitDetection[] {
    return this.locateCandidates(root).map((candidate) => this.feedUnitDetector.detect(candidate));
  }
}
