import type { FeedCandidate, FeedUnitDetection } from './DetectionTypes';

const STRUCTURAL_ANCHOR_SELECTOR = '[aria-posinset], [role="article"]';

export class FeedUnitDetector {
  detect(candidate: FeedCandidate): FeedUnitDetection {
    const penalties: string[] = [];
    let penaltyScore = 0;

    if (this.hasStructuralCandidateAncestor(candidate.node)) {
      penalties.push('nested-structural-candidate');
      penaltyScore += 0.85;
    }

    if (!candidate.signals.insideFeed && !candidate.signals.insideMain) {
      penalties.push('outside-feed-and-main');
      penaltyScore += 0.25;
    }

    if (candidate.node.closest('[role="dialog"], [role="menu"]') !== null) {
      penalties.push('interactive-overlay-context');
      penaltyScore += 0.35;
    }

    const positiveScore = candidate.confidence;
    const adjustedScore = Math.max(0, Math.min(1, positiveScore - penaltyScore));

    if (penalties.includes('nested-structural-candidate')) {
      return {
        candidate,
        classification: 'NESTED_CONTENT',
        confidence: Math.max(0.8, Math.min(1, penaltyScore)),
        positiveScore,
        penaltyScore,
        penalties
      };
    }

    if (
      adjustedScore >= 0.55 &&
      (candidate.signals.insideFeed || candidate.signals.insideMain) &&
      (candidate.signals.ariaPosInSet || candidate.signals.roleArticle)
    ) {
      return {
        candidate,
        classification: 'TOP_LEVEL_FEED_UNIT',
        confidence: adjustedScore,
        positiveScore,
        penaltyScore,
        penalties
      };
    }

    return {
      candidate,
      classification: 'UNKNOWN',
      confidence: adjustedScore,
      positiveScore,
      penaltyScore,
      penalties
    };
  }

  private hasStructuralCandidateAncestor(node: HTMLElement): boolean {
    return node.parentElement?.closest(STRUCTURAL_ANCHOR_SELECTOR) !== null;
  }
}
