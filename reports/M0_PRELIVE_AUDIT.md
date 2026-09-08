# M0 Pre-Live Audit

Status: **WAITING FOR LIVE VALIDATION**

Source checkpoint audited: `887a69a1a029f1628f1fb44456759b65694bd4b2`
Branch: `m0/final-audit`

This document is deliberately a **pre-live** audit. It does not issue the final M0 `GO`, `FIX` or `NO-GO` decision because the required evidence from a real logged-in Facebook session does not yet exist.

## GitHub-native qualification

For checkpoint `887a69a1a029f1628f1fb44456759b65694bd4b2`, GitHub Actions run `34291521218` completed successfully:

- install: PASS,
- lint: PASS,
- typecheck: PASS,
- unit + DOM tests: PASS,
- build: PASS,
- extension bundle build: PASS,
- Chromium installation: PASS,
- synthetic browser E2E: PASS.

## M0 implementation status

| Area | Status before live test |
| --- | --- |
| Manifest V3 / isolated Facebook-only content script | PASS |
| Multi-signal feed location | PASS STRUCTURALLY / LIVE UNVERIFIED |
| FeedUnitDetector | PASS STRUCTURALLY / LIVE UNVERIFIED |
| Nested rejection | PASS SYNTHETIC / LIVE UNVERIFIED |
| Mutation batching / infinite-scroll pipeline | PASS SYNTHETIC / LIVE UNVERIFIED |
| Node fingerprinting / recycling instrumentation | PASS SYNTHETIC / LIVE UNVERIFIED |
| SPA navigation | PASS SYNTHETIC / LIVE UNVERIFIED |
| Debug overlay | PASS SYNTHETIC |
| Privacy-safe diagnostics | PASS SOURCE/SYNTHETIC / LIVE EXPORT CHECK REQUIRED |
| Manual ground truth | PASS SYNTHETIC / LIVE DATA REQUIRED |
| Three pre-paint strategies | PASS STRUCTURALLY / LIVE MEASUREMENT REQUIRED |
| Performance p50/p95/p99 instrumentation | PASS |
| Memory instrumentation | PASS STRUCTURALLY / LONG LIVE SESSION REQUIRED |
| Sanitized fixture workflow | PASS |
| Automated unit/DOM tests | PASS |
| Synthetic Chromium E2E | PASS |
| M0-18 security review | PASS FOR PRE-LIVE |
| M0-19 privacy review | PASS FOR PRE-LIVE |

## Gate status

### DOM-01 — top-level detection ≥99%

**WAITING FOR LIVE VALIDATION**

Synthetic tests cannot establish the required accuracy against the personalized production Facebook DOM.

### DOM-02 — nested false positives <0.5%

**WAITING FOR LIVE VALIDATION**

Requires manual labels from real feed units and nested content.

### DOM-03 — changed semantic fingerprint triggers reanalysis

**PASS SYNTHETIC**

Regression tests confirm that content changes alter the transient fingerprint ID and the pipeline can reprocess the same DOM node.

### DOM-04 — SPA navigation without extension reload

**PASS SYNTHETIC / LIVE VALIDATION REQUIRED**

Synthetic route tests exist; production Facebook navigation still needs observation.

### PERF-01 — no noticeable scroll regression

**WAITING FOR LIVE VALIDATION**

Instrumentation exists and synthetic execution is qualified; real feed measurements are required.

### FLASH-01 — pre-paint target

**WAITING FOR LIVE VALIDATION**

All three strategies are implemented, but a production paint measurement is mandatory.

### MEMORY-01 — long-session leak gate

**WAITING FOR LIVE VALIDATION**

Heap/cleanup instrumentation exists, but the required long real session has not run.

### PRIVACY-01 — no private Facebook content externally transmitted

**PASS BY SOURCE DESIGN / LIVE EXPORT SPOT-CHECK REQUIRED**

No external transmission path exists in the reviewed runtime. The first real exported report must still be inspected for unforeseen account-specific fields before being shared.

### PERMISSION-01 — no unnecessary permissions

**PASS**

The current manifest declares no extension permissions and injects only into `https://www.facebook.com/*`.

## Findings resolved before live test

1. TypeScript CI failure in `Sanitizer` was corrected and fully requalified.
2. A content-derived `textHash` was removed from exportable structural features while preserving transient recycling detection.
3. Sanitized fixture handling was hardened against active/hidden executable HTML and arbitrary attribute-value leakage.

## Non-blocking pre-release hardening

The following are not blockers for the M0 live probe but should be resolved before a Chrome Web Store release candidate:

- deterministic dependency lockfile + `npm ci`,
- pin/upgrade GitHub Actions instead of relying on moving major tags,
- final Chrome Web Store policy/package review,
- final dependency/license inventory.

## Required live protocol

The next evidence-producing step is a controlled real Facebook session:

1. Build/load the current extension checkpoint.
2. Open logged-in Facebook Home.
3. Enable M0 Probe debug mode.
4. Exercise at minimum Home feed, Groups, a Page surface, Reels and return-to-Home SPA navigation.
5. Scroll enough real units to produce meaningful manual ground-truth samples.
6. Exercise each pre-paint strategy.
7. Complete the long-session memory run.
8. Mark the long session complete.
9. Export `m0-diagnostic-report.json`.
10. Inspect the JSON for privacy before sharing it for final analysis.

Do not upload raw feed HTML, cookies, tokens, screenshots of private content, or unsanitized DOM fixtures.

## Decision boundary

Current decision: **WAITING FOR LIVE VALIDATION**.

The final M0 audit may issue `GO`, `FIX` or `NO-GO` only after the live diagnostic evidence is reviewed against DOM-01, DOM-02, DOM-04, PERF-01, FLASH-01, MEMORY-01 and the live privacy spot-check.
