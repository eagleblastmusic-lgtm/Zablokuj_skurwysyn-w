export interface FeedSignals {
  readonly ariaPosInSet: boolean;
  readonly roleArticle: boolean;
  readonly insideFeed: boolean;
  readonly insideMain: boolean;
  readonly repeatedSiblingStructure: boolean;
  readonly actionStructure: boolean;
  readonly temporalOrPermalinkStructure: boolean;
}

export interface FeedCandidate {
  readonly node: HTMLElement;
  readonly confidence: number;
  readonly signals: FeedSignals;
}

export type FeedUnitClass = 'TOP_LEVEL_FEED_UNIT' | 'NESTED_CONTENT' | 'UNKNOWN';

export interface FeedUnitDetection {
  readonly candidate: FeedCandidate;
  readonly classification: FeedUnitClass;
  readonly confidence: number;
  readonly positiveScore: number;
  readonly penaltyScore: number;
  readonly penalties: readonly string[];
}
