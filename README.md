# Zablokuj_skurwysyn-w

M0 Technical Probe for a Manifest V3 Chrome extension that will eventually filter political content on Facebook.

## M0 scope

M0 investigates only Facebook DOM feasibility:

- locating the active feed region,
- detecting single top-level feed units,
- rejecting nested content,
- observing dynamic rendering and SPA navigation,
- measuring privacy-safe detection timing.

M0 does **not** implement political classification, remote AI, backend services, OCR, vision, speech recognition, or telemetry.

## Baseline principles

- Manifest V3 foundation.
- Facebook-only host scope.
- Minimal permissions.
- No remote code.
- No external transmission of Facebook content.
- No persistent storage of raw post text, author names, permalinks, or images.

## Development commands

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Repository layout

```text
.github/workflows/ci.yml
src/
tests/
docs/
reports/
```

## Status

Current development checkpoint: **M0-01 Repository bootstrap**.
The MV3 manifest and Facebook content-script packaging are intentionally deferred to **M0-02**.
