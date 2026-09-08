# M0 Security Review

Status: **PASS FOR PRE-LIVE M0**

Audited checkpoint: `887a69a1a029f1628f1fb44456759b65694bd4b2`
Branch: `m0/final-audit`

This review covers the source, manifest, build path, diagnostic UI, DOM pipeline, pre-paint instrumentation, sanitizer and GitHub-native qualification available before the real logged-in Facebook test.

## Findings

| Control | Status | Evidence / conclusion |
| --- | --- | --- |
| Manifest V3 | PASS | `manifest_version: 3`. |
| Host scope | PASS | Content script matches only `https://www.facebook.com/*`. |
| Extension permissions | PASS | `permissions` is empty. |
| Execution world | PASS | Content script declares `world: ISOLATED`. |
| Early injection | PASS | `run_at: document_start`. |
| Remote runtime code | PASS | No remote JS/WASM is referenced by the manifest or runtime module graph reviewed in M0. |
| Runtime dependencies | PASS | `package.json` has no production/runtime dependencies; listed packages are development tooling. |
| Dynamic code execution | PASS | Reviewed M0 runtime does not use `eval`, `new Function`, remote script injection or executable strings. |
| Unsafe Facebook HTML injection | PASS | Debug UI is built with DOM APIs and `textContent`; Facebook content is not copied into `innerHTML`. |
| Network transmission | PASS | Diagnostic export uses a local `Blob` + object URL download. No application network client/backend exists in reviewed M0 runtime. |
| DOM reference lifetime | PASS STRUCTURALLY | Processed/recycling state is based on `WeakMap`; observer/UI cleanup paths exist. Final leak gate still requires the live long-session test. |
| Pre-paint handling | PASS STRUCTURALLY | Strategies modify only scoped visibility/display and extension-created placeholders and release their state. Live paint effectiveness remains unvalidated. |
| Fixture sanitizer | PASS | Active/executable elements are removed; handlers/styles/srcdoc are removed; media sources and nonessential values are redacted. |
| Synthetic browser qualification | PASS | GitHub Actions quality lane and synthetic Chromium E2E passed for the audited checkpoint. |

## Security finding fixed during M0-18

The fixture sanitizer originally redacted common text/attributes but did not remove every active or hidden-content HTML surface. It was hardened before this review was marked PASS.

The sanitizer now removes `script`, `style`, `iframe`, `object`, `embed`, `base`, `link`, `meta` and `template`, strips `srcdoc`, inline handlers and inline style, removes media source attributes, and redacts nonessential attribute values. Only detector-required structural values such as `role` and `aria-posinset` are intentionally preserved.

## Non-blocking supply-chain observations

These do not block the M0 live probe, because the built extension currently has no external runtime dependency, but they should be hardened before a Chrome Web Store release candidate:

1. GitHub Actions currently reference moving major tags (`actions/checkout@v4`, `actions/setup-node@v4`) rather than immutable action commit SHAs.
2. Dependency installation currently uses `npm install`; the audited tree does not contain a lockfile, so development/CI dependency resolution can drift over time.
3. Current runner logs warn that the referenced v4 actions target an older Node action runtime and are being forced onto Node 24 by GitHub's runner compatibility behavior.

Recommended pre-release action: introduce a committed lockfile + deterministic install (`npm ci`) and pin/upgrade third-party Actions to reviewed immutable SHAs.

## Not validated here

- Behavior against a real logged-in Facebook DOM.
- DOM-01 / DOM-02 accuracy targets.
- FLASH-01 on real paints.
- MEMORY-01 under the required live long-scroll session.
- Chrome Web Store final package/review compliance, which is a later release gate.

## M0-18 conclusion

No static or synthetic security blocker remains for proceeding to the privacy-safe live Facebook probe.
