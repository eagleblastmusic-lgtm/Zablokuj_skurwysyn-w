# M0 Privacy Review

Status: **PASS FOR PRE-LIVE M0**

Audited checkpoint: `887a69a1a029f1628f1fb44456759b65694bd4b2`
Branch: `m0/final-audit`

## Privacy contract

M0 is local-only. The probe may inspect the already rendered Facebook DOM in RAM for structural detection, but exported diagnostics must not persist or transmit private Facebook content.

## Findings

| Question | Result | Conclusion |
| --- | --- | --- |
| Raw post text persisted? | NO | Runtime uses text transiently for fingerprint change detection, but exported structural features contain no raw text. |
| Content-derived text hash exported? | NO | Fixed during M0-19: the text-derived hash is now transient and contributes only to the in-memory fingerprint ID calculation; `StructuralFeatureVector` no longer exposes `textHash`. |
| Author name persisted? | NO | No author field exists in the diagnostic schema. |
| Post/profile URL persisted? | NO | No post/profile URL field exists in the diagnostic schema. SPA route fingerprint is not added to the diagnostic report. |
| Images persisted? | NO | Diagnostic schema contains no image payload. Sanitized fixtures remove source attributes and keep only redaction markers. |
| Facebook content sent externally? | NO | Reviewed runtime has no telemetry/backend/network submission path. Export is a local file download. |
| DOM nodes persisted in ground truth? | NO | Ground-truth samples copy detector decisions and export-safe structural values; they do not retain DOM nodes. |
| Full DOM captured automatically? | NO | M0 diagnostics are aggregate/structural. Real fixture capture is not automatic and sanitized output is required before repository use. |
| Credentials/cookies/tokens accessed? | NO | No corresponding APIs/permissions/code paths exist in M0. |

## Privacy finding fixed during M0-19

`NodeFingerprint` previously exposed a 32-bit `textHash` inside `StructuralFeatureVector`. Because ground-truth samples export that vector, the hash could become persistent diagnostic data derived from Facebook text. Even though it was not raw text, this contradicted the project's rule that content fingerprints are short-lived and local.

The implementation was changed so that:

- normalized text is read only transiently in RAM,
- a transient content hash can still affect `fingerprint.id` so recycling/content changes remain detectable,
- the exported structural feature vector contains no text hash,
- regression tests assert that `textHash` is absent from exported ground-truth data.

## Sanitized fixture boundary

Before a real DOM fragment may enter the public repository, sanitizer output is required. Current hardening:

- visible text replaced,
- URL identifiers removed/redacted while optionally retaining detector-relevant route shape,
- media source attributes removed,
- arbitrary/nonessential attribute values replaced,
- comments removed,
- inline handlers/styles/srcdoc removed,
- active or hidden-content elements such as script/template/iframe/object/embed removed.

The repository's current fixtures are synthetic; none claims to be raw content captured from a private Facebook account.

## Live validation still required

The source-level privacy design passes M0-19, but the first real diagnostic export must still be spot-checked to confirm that no unforeseen Facebook-specific value appears in the serialized report. This is a live qualification step, not evidence of a current known leak.

Required live check:

1. Run the probe on the logged-in Facebook account.
2. Export the generated diagnostic JSON.
3. Before sharing, verify it contains metrics/structural values only.
4. Confirm absence of post text, names, real URLs, images, cookies, tokens or other account-specific content.

## M0-19 conclusion

No known privacy blocker remains for the controlled live probe. Final M0 privacy qualification remains contingent on inspection of the real exported report.
