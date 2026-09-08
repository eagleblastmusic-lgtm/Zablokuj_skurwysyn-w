# Facebook DOM Model — M0

M0 treats Facebook DOM structure as an unstable implementation detail rather than a selector contract.

## Candidate discovery

`FeedLocator` combines structural signals including `aria-posinset`, `role="article"`, feed/main ancestry, repeated sibling shapes, action controls, and time/permalink-like structure. No individual signal is treated as sufficient proof.

## Unit classification

`FeedUnitDetector` returns one of:

- `TOP_LEVEL_FEED_UNIT`,
- `NESTED_CONTENT`,
- `UNKNOWN`.

Nested structural candidates are rejected so shared posts, comments, and card-like subtrees do not automatically become additional classification units.

## Dynamic DOM

`MutationPipeline` scans only changed local subtrees, batches work to animation frames, and tracks processed nodes in weak collections. A semantic fingerprint change causes the same `HTMLElement` to be processed again.

## Recycling

`RecyclingProbe` can record node creation, removal, return, fingerprint change, and reuse. Whether Facebook actually recycles feed-unit nodes remains `UNVERIFIED` until a real long-scroll session is measured.

## SPA navigation

`SpaNavigationObserver` detects route changes without page-world code injection. On navigation the active mutation pipeline is disconnected and attached again to the current document. Raw URLs are not emitted into diagnostics.
