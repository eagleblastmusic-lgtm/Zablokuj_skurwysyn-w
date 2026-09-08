import type { FeedCandidate, FeedSignals } from './DetectionTypes';

const ANCHOR_SELECTOR = '[aria-posinset], [role="article"]';
const MIN_CANDIDATE_CONFIDENCE = 0.2;

export class FeedLocator {
  locate(root: ParentNode = document): FeedCandidate[] {
    const nodes = this.collectCandidateNodes(root);

    return [...nodes]
      .map((node) => this.toCandidate(node))
      .filter((candidate) => candidate.confidence >= MIN_CANDIDATE_CONFIDENCE);
  }

  private collectCandidateNodes(root: ParentNode): Set<HTMLElement> {
    const nodes = new Set<HTMLElement>();

    if (root instanceof HTMLElement && root.matches(ANCHOR_SELECTOR)) {
      nodes.add(root);
    }

    for (const node of root.querySelectorAll<HTMLElement>(ANCHOR_SELECTOR)) {
      nodes.add(node);
    }

    for (const feed of root.querySelectorAll<HTMLElement>('[role="feed"]')) {
      for (const child of feed.children) {
        if (!(child instanceof HTMLElement)) continue;

        const hasStructuralAnchor = child.matches(ANCHOR_SELECTOR) || child.querySelector(ANCHOR_SELECTOR) !== null;
        if (!hasStructuralAnchor) {
          nodes.add(child);
        }
      }
    }

    return nodes;
  }

  private toCandidate(node: HTMLElement): FeedCandidate {
    const signals: FeedSignals = {
      ariaPosInSet: this.hasPositiveAriaPosition(node),
      roleArticle: node.getAttribute('role') === 'article',
      insideFeed: node.closest('[role="feed"]') !== null,
      insideMain: node.closest('[role="main"]') !== null,
      repeatedSiblingStructure: this.hasRepeatedSiblingStructure(node),
      actionStructure: node.querySelector('[role="button"], button') !== null,
      temporalOrPermalinkStructure: this.hasTemporalOrPermalinkStructure(node)
    };

    return {
      node,
      confidence: this.score(signals),
      signals
    };
  }

  private score(signals: FeedSignals): number {
    let score = 0;

    if (signals.ariaPosInSet) score += 0.28;
    if (signals.roleArticle) score += 0.22;
    if (signals.insideFeed) score += 0.18;
    if (signals.insideMain) score += 0.12;
    if (signals.repeatedSiblingStructure) score += 0.08;
    if (signals.actionStructure) score += 0.05;
    if (signals.temporalOrPermalinkStructure) score += 0.07;

    return Math.min(1, score);
  }

  private hasPositiveAriaPosition(node: HTMLElement): boolean {
    const value = node.getAttribute('aria-posinset');
    if (value === null) return false;

    const position = Number.parseInt(value, 10);
    return Number.isFinite(position) && position > 0;
  }

  private hasRepeatedSiblingStructure(node: HTMLElement): boolean {
    const parent = node.parentElement;
    if (parent === null) return false;

    const role = node.getAttribute('role');
    const hasPosition = node.hasAttribute('aria-posinset');
    let structurallySimilar = 0;

    for (const sibling of parent.children) {
      if (!(sibling instanceof HTMLElement)) continue;
      if (sibling.tagName !== node.tagName) continue;
      if (sibling.getAttribute('role') !== role) continue;
      if (sibling.hasAttribute('aria-posinset') !== hasPosition) continue;
      structurallySimilar += 1;
    }

    return structurallySimilar >= 2;
  }

  private hasTemporalOrPermalinkStructure(node: HTMLElement): boolean {
    return (
      node.querySelector('time') !== null ||
      node.querySelector('a[href*="/posts/"]') !== null ||
      node.querySelector('a[href*="/permalink/"]') !== null ||
      node.querySelector('a[href*="/videos/"]') !== null
    );
  }
}
