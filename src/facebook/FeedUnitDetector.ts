import type { FeedCandidate, FeedUnitDetection } from './DetectionTypes';

const STRUCTURAL_ANCHOR_SELECTOR = '[aria-posinset], [role="article"]';
const DEFAULT_TOP_LEVEL_THRESHOLD = 0.55;

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

    if (this.isTopLevelCandidate(candidate, adjustedScore)) {
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

  private isTopLevelCandidate(candidate: FeedCandidate, adjustedScore: number): boolean {
    const signals = candidate.signals;
    const hasStructuralAnchor = signals.ariaPosInSet || signals.roleArticle;
    const insidePrimarySurface = signals.insideFeed || signals.insideMain;

    if (!hasStructuralAnchor || !insidePrimarySurface) return false;
    if (adjustedScore >= DEFAULT_TOP_LEVEL_THRESHOLD) return true;

    // Live Facebook M0 observations (2026-09-09) show two recurring top-level
    // structures where role="feed" is absent and the aggregate score is 0.42-0.45.
    // Keep these as explicit conjunctions rather than globally lowering the threshold.
    const repeatedArticleInMain =
      signals.insideMain && signals.roleArticle && signals.repeatedSiblingStructure;
    const positionedActionUnitInMain =
      signals.insideMain && signals.ariaPosInSet && signals.actionStructure;

    return repeatedArticleInMain || positionedActionUnitInMain;
  }

  private hasStructuralCandidateAncestor(node: HTMLElement): boolean {
    return node.parentElement?.closest(STRUCTURAL_ANCHOR_SELECTOR) !== null;
  }
}
